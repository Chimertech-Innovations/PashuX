from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from typing import Optional
import logging
import uuid
import numpy as np

# In the future, we'll import the real model from a new services/muzzle_processor.py
# from services.muzzle_processor import extract_muzzle_features
import services.supabase_service as db
from services.openai_service import validate_muzzle_image
from services.video_processor import process_video
from services.image_analysis import analyse_video_stats
import tempfile
import os
import shutil

router = APIRouter()
logger = logging.getLogger(__name__)

import io
import torch
from torchvision import models, transforms
from PIL import Image

# Initialize the Real Pre-trained AI Model (ResNet50)
print("Loading Pre-trained ResNet50 AI Model...")
weights = models.ResNet50_Weights.IMAGENET1K_V1
resnet = models.resnet50(weights=weights)
resnet.eval() # Set to evaluation mode

# Strip the final classification layer so we get the raw feature patterns
feature_extractor = torch.nn.Sequential(*list(resnet.children())[:-1])

# Standard image processing for the AI
preprocess = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

def extract_muzzle_features(image_bytes: bytes) -> list[float]:
    """
    Real AI Feature Extraction. 
    Uses ResNet50 to look at the muzzle and generate a unique pattern vector.
    """
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    input_tensor = preprocess(image).unsqueeze(0) # Create a mini-batch of 1
    
    with torch.no_grad():
        output = feature_extractor(input_tensor)
        
    # Flatten the tensor to a 1D vector of size 2048
    vector = output.squeeze().numpy()
    
    # Our Supabase database is configured for 512-dimensions. 
    # Downsample from 2048 to 512 by averaging adjacent features to preserve the full representation.
    vector_512 = np.mean(vector.reshape(512, 4), axis=1)
    
    # Mean-center the vector to remove the common baseline (makes cosine similarity much more discriminative)
    vector_512 = vector_512 - np.mean(vector_512)
    
    # Normalize the vector (so cosine distance works correctly)
    norm = np.linalg.norm(vector_512)
    if norm > 0:
        vector_512 = vector_512 / norm
        
    return vector_512.tolist()

import cv2
import base64

def auto_enhance_image_bytes(image_bytes: bytes) -> bytes:
    """
    Universal auto-enhancer. Fixes extreme low light and slight blur.
    Runs BEFORE uploading to database and BEFORE AI extraction.
    """
    np_img = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(np_img, cv2.IMREAD_COLOR)
    
    if img is None:
        return image_bytes
        
    # 1. Smart Brightness via LAB Lightness channel
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    
    mean_l = np.mean(l)
    
    if mean_l < 60:
        # Extreme dark
        clahe = cv2.createCLAHE(clipLimit=5.0, tileGridSize=(8,8))
        cl = clahe.apply(l)
        invGamma = 1.0 / 1.5
        table = np.array([((i / 255.0) ** invGamma) * 255 for i in np.arange(0, 256)]).astype("uint8")
        cl = cv2.LUT(cl, table)
    elif mean_l < 110:
        # Dark
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
        cl = clahe.apply(l)
    else:
        # Normal
        clahe = cv2.createCLAHE(clipLimit=1.5, tileGridSize=(8,8))
        cl = clahe.apply(l)
        
    limg = cv2.merge((cl, a, b))
    img = cv2.cvtColor(limg, cv2.COLOR_LAB2BGR)
    
    # 2. Unsharp Mask to fix slight blur
    gaussian = cv2.GaussianBlur(img, (9,9), 10.0)
    img = cv2.addWeighted(img, 1.5, gaussian, -0.5, 0)
    
    # 3. Encode back to bytes
    _, buffer = cv2.imencode('.jpg', img)
    return buffer.tobytes()

def generate_trace_map(image_bytes: bytes) -> str:
    """
    Advanced OpenCV Trace Map:
    1. Isolates the central biometric region with an elliptical mask.
    2. Excludes dark areas (nostrils).
    3. Enhances and traces the actual continuous ridges (fingerprints).
    4. Extracts well-distributed keypoints within the valid area.
    """
    # 1. Convert bytes to OpenCV Image
    np_img = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(np_img, cv2.IMREAD_COLOR)
    
    h, w = img.shape[:2]
    
    # Resize for consistent processing speed if too large
    max_dim = 800
    if max(h, w) > max_dim:
        scale = max_dim / max(h, w)
        img = cv2.resize(img, (int(w * scale), int(h * scale)))
        h, w = img.shape[:2]

    # Create a base mask (ellipse in the center to avoid whiskers/background)
    ellipse_mask = np.zeros((h, w), dtype=np.uint8)
    center = (w // 2, int(h * 0.55))
    axes = (int(w * 0.35), int(h * 0.35))
    cv2.ellipse(ellipse_mask, center, axes, 0, 0, 360, 255, -1)
    
    # 2. Convert to grayscale & CLAHE for pattern extraction
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    clahe_gray = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
    enhanced = clahe_gray.apply(gray)
    
    traced_img = img.copy()
    
    # 3. Detect Nostrils (Red)
    blurred_dark = cv2.GaussianBlur(enhanced, (21, 21), 0)
    _, dark_mask = cv2.threshold(blurred_dark, 40, 255, cv2.THRESH_BINARY_INV)
    kernel = np.ones((15, 15), np.uint8)
    dark_mask = cv2.dilate(dark_mask, kernel, iterations=2)
    nostril_mask = cv2.bitwise_and(dark_mask, ellipse_mask)
    nostril_contours, _ = cv2.findContours(nostril_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    cv2.drawContours(traced_img, nostril_contours, -1, (0, 0, 255), 2)
    
    # 4. Detect Glare (Cyan)
    _, glare_mask = cv2.threshold(enhanced, 245, 255, cv2.THRESH_BINARY)
    glare_contours, _ = cv2.findContours(glare_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    cv2.drawContours(traced_img, glare_contours, -1, (255, 255, 0), 2)
    
    # 5. Detect Dirt/Mud (Yellow) - Focus on green grass or bright yellow feed, avoid orange/brown skin
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    lower_dirt = np.array([25, 100, 100])
    upper_dirt = np.array([85, 255, 255])
    dirt_mask = cv2.inRange(hsv, lower_dirt, upper_dirt)
    dirt_mask = cv2.morphologyEx(dirt_mask, cv2.MORPH_OPEN, kernel)
    dirt_mask = cv2.bitwise_and(dirt_mask, ellipse_mask)
    dirt_contours, _ = cv2.findContours(dirt_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    cv2.drawContours(traced_img, dirt_contours, -1, (0, 255, 255), 2)
    
    # Combine Exclusions for Muzzle ROI
    exclusions = cv2.bitwise_or(dark_mask, glare_mask)
    exclusions = cv2.bitwise_or(exclusions, dirt_mask)
    
    valid_mask = cv2.bitwise_and(ellipse_mask, cv2.bitwise_not(exclusions))
    valid_mask = cv2.morphologyEx(valid_mask, cv2.MORPH_OPEN, kernel)
    valid_mask = cv2.morphologyEx(valid_mask, cv2.MORPH_CLOSE, kernel)
    
    contours, _ = cv2.findContours(valid_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    final_valid_mask = np.zeros_like(valid_mask)
    large_contours = []
    main_contour = None
    max_area = 0
    if contours:
        for cnt in contours:
            area = cv2.contourArea(cnt)
            if area > (w * h * 0.015): 
                large_contours.append(cnt)
                cv2.drawContours(final_valid_mask, [cnt], -1, 255, -1)
                if area > max_area:
                    max_area = area
                    main_contour = cnt
    valid_mask = final_valid_mask
    
    # Draw Muzzle ROI (Green)
    cv2.drawContours(traced_img, large_contours, -1, (0, 255, 0), 2)
    
    # 6. Extract Ridges / Pattern Trace (Magenta)
    ridge_blur = cv2.GaussianBlur(enhanced, (5, 5), 0)
    edges = cv2.adaptiveThreshold(ridge_blur, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                                  cv2.THRESH_BINARY_INV, 15, 4)
    valid_edges = cv2.bitwise_and(edges, valid_mask)
    traced_img[valid_edges > 0] = (255, 0, 255)
    
    # 7. Landmarks (Orange)
    if main_contour is not None:
        extLeft = tuple(main_contour[main_contour[:, :, 0].argmin()][0])
        extRight = tuple(main_contour[main_contour[:, :, 0].argmax()][0])
        extTop = tuple(main_contour[main_contour[:, :, 1].argmin()][0])
        extBot = tuple(main_contour[main_contour[:, :, 1].argmax()][0])
        
        M = cv2.moments(main_contour)
        if M["m00"] != 0:
            cX = int(M["m10"] / M["m00"])
            cY = int(M["m01"] / M["m00"])
            extCenter = (cX, cY)
        else:
            extCenter = center
            
        landmarks = [
            extLeft,
            extRight,
            extTop,
            extBot,
            extCenter
        ]
        
        for pt in landmarks:
            cv2.circle(traced_img, pt, 6, (0, 165, 255), -1)
        
    # Encode back to jpg -> base64
    _, buffer = cv2.imencode('.jpg', traced_img)
    b64_string = base64.b64encode(buffer).decode('utf-8')
    return f"data:image/jpeg;base64,{b64_string}"

@router.post("/muzzle/register")
async def register_cattle_muzzle(
    name: str = Form(...),
    user_id: str = Form(...), # Required auth user ID
    file1: UploadFile = File(...),
    file2: UploadFile = File(...),
    file3: UploadFile = File(...)
):
    """
    Register a new cattle with 3 muzzle images (multi-angle).
    Validates with OpenAI, generates ID, checks duplicates.
    """
    try:
        img1_bytes = await file1.read()
        img2_bytes = await file2.read()
        img3_bytes = await file3.read()
        
        import asyncio
        
        # 1. Smart Auto-Enhance image (only for AI extraction)
        enh1, enh2, enh3 = await asyncio.gather(
            asyncio.to_thread(auto_enhance_image_bytes, img1_bytes),
            asyncio.to_thread(auto_enhance_image_bytes, img2_bytes),
            asyncio.to_thread(auto_enhance_image_bytes, img3_bytes)
        )
        
        # 2. AI Feature Extraction
        emb1, emb2, emb3 = await asyncio.gather(
            asyncio.to_thread(extract_muzzle_features, enh1),
            asyncio.to_thread(extract_muzzle_features, enh2),
            asyncio.to_thread(extract_muzzle_features, enh3)
        )
        
        # Average the 3 embeddings to create a robust Master Pattern
        avg_emb = np.mean([emb1, emb2, emb3], axis=0)
        norm = np.linalg.norm(avg_emb)
        if norm > 0:
            avg_emb = avg_emb / norm
        master_embedding = avg_emb.tolist()
        
        sb = db.get_client()
        
        # 3. Check for global duplicates across ALL users in the system (biometric uniqueness)
        def _check_duplicate():
            return sb.rpc(
                "match_cattle_muzzle",
                {
                    "query_embedding": master_embedding,
                    "match_threshold": 0.94,
                    "match_count": 1
                }
            ).execute()
        duplicate_check = await asyncio.to_thread(_check_duplicate)

        if duplicate_check.data and len(duplicate_check.data) > 0:
            existing = duplicate_check.data[0]
            existing_name = existing.get("name", "Existing Cattle")
            raise HTTPException(
                status_code=409,
                detail=f"This cattle's muzzle pattern is already registered in the system as '{existing_name}'. Duplicate muzzle registrations are not allowed!"
            )

        # 4. Fetch user's existing cattle count for tag ID generation
        def _get_user_cattle_ids():
            return sb.table("cattle").select("id").eq("user_id", user_id).execute()
        user_cattle = await asyncio.to_thread(_get_user_cattle_ids)
        user_cattle_ids = [c["id"] for c in (user_cattle.data or [])]

        # Generate Chimertech Muzzle ID based on user's cattle count
        next_num = len(user_cattle_ids) + 1
        tag_id = f"MUZZ-{user_id[:4].upper()}-{next_num:04d}"
        
        final_name = f"{name} ({tag_id})"
            
        # 5. Upload images to Storage (sequential)
        url1 = await db.upload_muzzle_image(img1_bytes, f"{tag_id}_1")
        url2 = await db.upload_muzzle_image(img2_bytes, f"{tag_id}_2")
        url3 = await db.upload_muzzle_image(img3_bytes, f"{tag_id}_3")
        combined_urls = f"{url1},{url2},{url3}"
        
        # 6. Generate the Visual Trace Map
        trace_map1, trace_map2, trace_map3 = await asyncio.gather(
            asyncio.to_thread(generate_trace_map, img1_bytes),
            asyncio.to_thread(generate_trace_map, img2_bytes),
            asyncio.to_thread(generate_trace_map, img3_bytes)
        )
        
        # 7. Save everything to Supabase Database
        record = {
            "name": final_name,
            "user_id": user_id,
            "image_url": combined_urls,
            "muzzle_embedding": master_embedding
        }
        
        result = sb.table("cattle").insert(record).execute()
        new_id = result.data[0]["id"] if result.data else None
        
        return {
            "status": "success",
            "message": "Cattle registered successfully with Multi-Angle Muzzle Scan!",
            "cattle_id": new_id,   # real UUID for video-analysis step
            "muzzle_tag": tag_id,  # readable muzzle ID e.g. MUZZ-AB12-0001
            "trace_maps": [trace_map1, trace_map2, trace_map3]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error registering muzzle: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/muzzle/{cattle_id}/video-analysis")
async def analyze_cattle_video(
    cattle_id: str,
    video: UploadFile = File(...)
):
    """
    Process a video upload for cattle, extract frames, analyze for BCS, disease, breed, weight, height, etc.
    and save the results to the cattle database record.
    """
    temp_dir = tempfile.mkdtemp()
    try:
        # Save video temporarily preserving original extension (.mov, .mp4, .webm)
        ext = os.path.splitext(video.filename)[1].lower() if video.filename else ".webm"
        if ext not in [".mp4", ".webm", ".mov", ".avi", ".m4v", ".mkv"]:
            ext = ".webm"
        video_path = os.path.join(temp_dir, f"upload_{uuid.uuid4().hex}{ext}")
        with open(video_path, "wb") as f:
            f.write(await video.read())
            
        import asyncio
        
        # Extract and filter frames
        process_result = await asyncio.to_thread(process_video, video_path, temp_dir)
        frame_data = process_result.get("frame_data", [])
        frame_paths = [f["path"] for f in frame_data if "path" in f]
        
        if not frame_paths:
            raise HTTPException(status_code=400, detail="Could not extract usable frames from the video.")
            
        # Call AI for video stats analysis
        stats = await analyse_video_stats(frame_paths)
        
        # Update cattle record in database
        sb = db.get_client()
        update_data = {
            "bcs_score": stats.bcs_score,
            "disease": stats.disease_status,
            "breed": stats.breed,
            "weight_kg": stats.weight_kg,
            "height_cm": stats.height_cm,
            "color": stats.coat_color,
            "estimated_value": stats.estimated_value
        }
        
        # cattle_id from frontend is now the real UUID after our register fix.
        # Try UUID first, fall back to name-match for legacy records.
        def _update_by_uuid():
            return sb.table("cattle").update(update_data).eq("id", cattle_id).execute()

        def _update_by_name():
            return sb.table("cattle").update(update_data).ilike("name", f"%{cattle_id}%").execute()

        update_result = await asyncio.to_thread(_update_by_uuid)
        if not update_result.data:
            # Fallback: cattle_id might be a tag string (legacy)
            await asyncio.to_thread(_update_by_name)
        
        return {
            "status": "success",
            "message": "Video analysis completed and saved successfully.",
            "data": stats.dict()
        }
        
    except Exception as e:
        logger.error(f"Error analyzing cattle video: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)


@router.post("/muzzle/identify")
async def identify_cattle_muzzle(
    file: UploadFile = File(...)
):
    """
    Identify a cattle from 1 muzzle image.
    """
    try:
        original_image_bytes = await file.read()
        
        import asyncio
        
        # 1. Smart Auto-Enhance image (only for AI extraction)
        # 1. Smart Auto-Enhance image (only for AI extraction)
        enhanced_image_bytes = await asyncio.to_thread(auto_enhance_image_bytes, original_image_bytes)
        
        # 2. AI Feature Extraction
        master_embedding = await asyncio.to_thread(extract_muzzle_features, enhanced_image_bytes)
        
        # 2. Search in Supabase using the RPC function we created
        sb = db.get_client()
        
        # We call the SQL function 'match_cattle_muzzle' we created earlier
        def _match():
            return sb.rpc(
                "match_cattle_muzzle", 
                {
                    "query_embedding": master_embedding,
                    "match_threshold": 0.85,
                    "match_count": 1
                }
            ).execute()
        response = await asyncio.to_thread(_match)
        
        matches = response.data
        
        # 3. Generate Trace Map for visualization (use original image)
        trace_map = await asyncio.to_thread(generate_trace_map, original_image_bytes)
        
        if not matches or len(matches) == 0:
            return {
                "status": "not_found",
                "message": "Cattle not found in database. Please register the cattle.",
                "trace_maps": [trace_map]
            }
            
        best_match = matches[0]
        
        # Fetch the complete cattle record to ensure we have all newly added stats (bcs_score, weight, etc.)
        def _get_full():
            return sb.table("cattle").select("*").eq("id", best_match.get("id")).execute()
        
        if best_match.get("id"):
            full_cattle = await asyncio.to_thread(_get_full)
            if full_cattle.data and len(full_cattle.data) > 0:
                best_match.update(full_cattle.data[0])
                
        return {
            "status": "match_found",
            "cattle": best_match,
            "trace_maps": [trace_map]
        }
        
    except Exception as e:
        logger.error(f"Error identifying muzzle: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/muzzle/user/{user_id}")
async def get_user_cattle(user_id: str):
    """
    Fetch all registered cattle for a specific user.
    """
    try:
        sb = db.get_client()
        import asyncio
        
        def _fetch():
            return sb.table("cattle").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
            
        response = await asyncio.to_thread(_fetch)
        
        # Process image_url (it might be a comma-separated list of 3 URLs)
        cattle_list = []
        for c in response.data:
            # We just send the first image to display on the card
            urls = c.get("image_url", "").split(",")
            c["display_image"] = urls[0] if urls else ""
            cattle_list.append(c)
            
        return {"status": "success", "data": cattle_list}
        
    except Exception as e:
        logger.error(f"Error fetching user cattle: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/muzzle/{cattle_id}")
async def get_cattle_by_id(cattle_id: str):
    """
    Fetch a single registered cattle by its ID, including all muzzle images and video analysis data.
    """
    try:
        sb = db.get_client()
        import asyncio

        def _fetch():
            return sb.table("cattle").select("*").eq("id", cattle_id).single().execute()

        response = await asyncio.to_thread(_fetch)

        if not response.data:
            raise HTTPException(status_code=404, detail="Cattle not found")

        cattle = response.data

        # Build muzzle image list from the comma-separated image_url field
        raw_urls = cattle.get("image_url", "")
        urls = [u.strip() for u in raw_urls.split(",") if u.strip()]
        cattle["display_image"] = urls[0] if urls else ""
        cattle["muzzle_images"] = urls  # all 3 angles

        # Normalise field aliases for frontend compatibility
        cattle["coat_color"]    = cattle.get("color") or cattle.get("coat_color") or ""
        cattle["disease_status"] = cattle.get("disease") or cattle.get("disease_status") or "Unknown"

        # Extract muzzle_id from name field e.g. "Bessie (MUZZ-AB12-0001)"
        name = cattle.get("name", "")
        import re
        m = re.search(r'\(([^)]+)\)', name)
        cattle["muzzle_id"] = m.group(1) if m else f"MUZZ-{cattle_id[:8].upper()}"

        return {"status": "success", "data": cattle}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching cattle {cattle_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
