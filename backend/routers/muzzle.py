from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from typing import Optional
import asyncio
import datetime
import logging
import uuid
import re
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
from PIL import Image, ImageOps

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

try:
    # pyrefly: ignore [missing-import]
    from pillow_heif import register_heif_opener
    register_heif_opener()
except ImportError:
    pass

def load_image_bytes(image_bytes: bytes) -> Optional[np.ndarray]:
    """
    Universal image decoder that handles standard JPEG/PNG/WEBP as well as
    Apple iPhone HEIC/HEIF images seamlessly. Returns OpenCV BGR image array.
    Auto-transposes EXIF orientation for mobile camera photos.
    """
    try:
        pil_img = Image.open(io.BytesIO(image_bytes))
        pil_img = ImageOps.exif_transpose(pil_img).convert("RGB")
        return cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
    except Exception:
        try:
            np_img = np.frombuffer(image_bytes, np.uint8)
            return cv2.imdecode(np_img, cv2.IMREAD_COLOR)
        except Exception:
            return None

def extract_muzzle_features(image_bytes: bytes) -> list[float]:
    """
    Real AI Feature Extraction. 
    Uses ResNet50 to look at the muzzle and generate a unique pattern vector.
    """
    try:
        image = Image.open(io.BytesIO(image_bytes))
        image = ImageOps.exif_transpose(image).convert("RGB")
    except Exception:
        img_np = load_image_bytes(image_bytes)
        if img_np is None:
            raise ValueError("Could not decode image file.")
        image = Image.fromarray(cv2.cvtColor(img_np, cv2.COLOR_BGR2RGB))

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
    img = load_image_bytes(image_bytes)
    
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
    # 1. Convert bytes to OpenCV Image (supports Apple HEIC/HEIF)
    img = load_image_bytes(image_bytes)
    if img is None:
        return ""
    
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
    gender: Optional[str] = Form("Female"),
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
        
        # 0. OpenAI Vision Muzzle Validation (using OpenAI API key)
        val1, val2, val3 = await asyncio.gather(
            validate_muzzle_image(img1_bytes),
            validate_muzzle_image(img2_bytes),
            validate_muzzle_image(img3_bytes)
        )

        invalid_reasons = []
        if not val1.get("valid", True):
            invalid_reasons.append(f"Slot 1 (Straight-on): {val1.get('message', 'Not a valid cattle muzzle photo')}")
        if not val2.get("valid", True):
            invalid_reasons.append(f"Slot 2 (Slight Left): {val2.get('message', 'Not a valid cattle muzzle photo')}")
        if not val3.get("valid", True):
            invalid_reasons.append(f"Slot 3 (Slight Right): {val3.get('message', 'Not a valid cattle muzzle photo')}")

        if invalid_reasons:
            error_detail = " | ".join(invalid_reasons)
            logger.warning(f"Muzzle validation failed via OpenAI Vision: {error_detail}")
            raise HTTPException(
                status_code=400,
                detail=f"OpenAI Muzzle Validation Failed: {error_detail}. Please capture or upload clear, close-up photos of the cattle muzzle (snout)."
            )

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
            try:
                return sb.rpc(
                    "match_cattle_muzzle",
                    {
                        "query_embedding": master_embedding,
                        "match_threshold": 0.94,
                        "match_count": 1
                    }
                ).execute()
            except Exception as rpc_err:
                logger.warning(f"RPC match_cattle_muzzle failed during duplicate check: {rpc_err}")
                try:
                    res = sb.table("cattle").select("id, name, muzzle_embedding").execute()
                    if res.data:
                        q_vec = np.array(master_embedding)
                        for c in res.data:
                            emb = c.get("muzzle_embedding")
                            if emb and isinstance(emb, list):
                                db_vec = np.array(emb)
                                if len(db_vec) == len(q_vec):
                                    sim = np.dot(q_vec, db_vec) / (np.linalg.norm(q_vec) * np.linalg.norm(db_vec) + 1e-9)
                                    if sim >= 0.94:
                                        class DummyResp:
                                            data = [c]
                                        return DummyResp()
                except Exception as fb_err:
                    logger.warning(f"Python fallback duplicate check failed: {fb_err}")
                class EmptyResp:
                    data = []
                return EmptyResp()
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
        
        safe_gender = "Male" if gender and any(w in gender.lower() for w in ["male", "bull", "ox", "steer"]) else "Female"

        # 7. Save everything to Supabase Database
        record = {
            "name": final_name,
            "user_id": user_id,
            "gender": safe_gender,
            "sex": safe_gender,
            "image_url": combined_urls,
            "muzzle_embedding": master_embedding
        }
        
        def _do_insert():
            try:
                return sb.table("cattle").insert(record).execute()
            except Exception as ins_err:
                err_str = str(ins_err)
                if "PGRST204" in err_str or "Could not find" in err_str:
                    # Strip gender/sex if not present in remote schema cache
                    safe_rec = {k: v for k, v in record.items() if k not in ["gender", "sex"]}
                    return sb.table("cattle").insert(safe_rec).execute()
                raise ins_err

        result = await asyncio.to_thread(_do_insert)
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
            
        import datetime
        
        # Upload retest video to Supabase Storage (videos bucket)
        retest_video_url = await db.upload_video_to_storage(video_path, f"{cattle_id}_retest_{uuid.uuid4().hex[:6]}", ext)

        sb = db.get_client()

        # Fetch existing cattle record FIRST to lock immutable master traits (Breed, Gender, Coat Color)
        existing_cattle = None
        def _get_existing_cattle():
            return sb.table("cattle").select("*").eq("id", cattle_id).execute()
        existing_res = await asyncio.to_thread(_get_existing_cattle)
        if existing_res.data:
            existing_cattle = existing_res.data[0]

        reg_breed = existing_cattle.get("breed") if existing_cattle else None
        reg_gender = (existing_cattle.get("gender") or existing_cattle.get("sex")) if existing_cattle else None
        registered_color = (existing_cattle.get("color") or existing_cattle.get("coat_color")) if existing_cattle else None

        # Call AI for video stats analysis, passing registered expected_gender if available
        stats = await analyse_video_stats(frame_paths, expected_gender=reg_gender)

        coat_mismatch = False
        mismatch_warning = None

        if existing_cattle:
            # Lock breed permanently to registered master profile
            if reg_breed and str(reg_breed).strip():
                stats.breed = reg_breed.strip()

            # For gender: Allow AI video detection (Female, Male, or Unknown) to update profile
            if stats.gender in ["Female", "Male", "Unknown"]:
                logger.info(f"Cattle profile gender set to '{stats.gender}' from video analysis.")
            elif reg_gender and str(reg_gender).strip():
                stats.gender = reg_gender.strip()

            # Check Coat Color Match
            if registered_color and stats.coat_color:
                reg_words = set(re.findall(r'\w+', registered_color.lower()))
                new_words = set(re.findall(r'\w+', stats.coat_color.lower()))
                color_keywords = {"black", "brown", "white", "red", "grey", "gray", "yellow", "cream", "dun", "roan", "spotted"}
                reg_colors = reg_words.intersection(color_keywords)
                new_colors = new_words.intersection(color_keywords)

                if reg_colors and new_colors and not reg_colors.intersection(new_colors):
                    mismatch_warning = (
                        f"COAT COLOR MISMATCH: The registered cattle coat color is '{registered_color}', "
                        f"but the uploaded media shows '{stats.coat_color}'. The coat color does not match! Please upload files of the correct cattle."
                    )
                    logger.warning(mismatch_warning)
                    raise HTTPException(status_code=400, detail=mismatch_warning)

                # Lock coat_color to registered master color
                stats.coat_color = registered_color


        # Build weight and height range strings
        w_num = float(stats.weight_kg or 450.0)
        h_num = float(stats.height_cm or 135.0)
        w_range = getattr(stats, 'weight_range', None) or f"{int(round(w_num*0.93/5)*5)} - {int(round(w_num*1.07/5)*5)} kg"
        h_range = getattr(stats, 'height_range', None) or f"{int(round(h_num*0.96))} - {int(round(h_num*1.04))} cm"

        # Build test iteration record to persist test history in database
        existing_history = (existing_cattle.get("test_history") if existing_cattle else None) or []
        next_test_num = len(existing_history) + 1
        new_test_entry = {
            "test_number": next_test_num,
            "test_label": f"Test {next_test_num} (Weekly Retest)",
            "date": datetime.datetime.now().strftime("%d %b %Y"),
            "bcs_score": stats.bcs_score,
            "health_status": stats.disease_status,
            "cleanliness_score": getattr(stats, "cleanliness_score", 85),
            "weight_kg": stats.weight_kg,
            "weight_range": w_range,
            "height_cm": stats.height_cm,
            "height_range": h_range,
            "coat_color": stats.coat_color,
            "breed": stats.breed,
            "gender": stats.gender,
            "estimated_value": stats.estimated_value,
            "age_estimate": stats.age_estimate or "4 - 5 years",
            "udder_score": stats.udder_score,
            "teat_score": stats.teat_score,
            "observations": stats.observations,
            "video_url": retest_video_url or "",
        }
        updated_history = existing_history + [new_test_entry]

        # Update ALL AI-detected metrics into cattle profile DB (including age, weight/height ranges, cleanliness)
        update_data = {
            "bcs_score": stats.bcs_score,
            "disease": stats.disease_status,
            "disease_status": stats.disease_status,
            "cleanliness_score": getattr(stats, "cleanliness_score", 85),
            "breed": stats.breed,
            "gender": stats.gender,
            "sex": stats.gender,
            "weight_kg": stats.weight_kg,
            "height_cm": stats.height_cm,
            "color": stats.coat_color,
            "coat_color": stats.coat_color,
            "estimated_value": stats.estimated_value,
            "age_estimate": stats.age_estimate or "4 - 5 years",
            "weight_range": w_range,
            "height_range": h_range,
            "video_url": retest_video_url or (existing_cattle.get("video_url") if existing_cattle else ""),
            "test_history": updated_history,
            "udder_score": stats.udder_score if stats.udder_visible else None,
            "teat_score": stats.teat_score if stats.teat_visible else None,
        }

        STANDARD_CATTLE_COLUMNS = {
            "bcs_score", "disease", "disease_status", "cleanliness_score", "breed", "gender", "sex",
            "weight_kg", "weight_range", "height_cm", "height_range", "color", "coat_color",
            "estimated_value", "age_estimate", "video_url", "test_history", "udder_score", "teat_score"
        }
        
        def _do_update(data_dict):
            attempt_dict = dict(data_dict)
            max_retries = 10
            for _ in range(max_retries):
                try:
                    res = sb.table("cattle").update(attempt_dict).eq("id", cattle_id).execute()
                    if not res.data:
                        res = sb.table("cattle").update(attempt_dict).ilike("name", f"%{cattle_id}%").execute()
                    return res
                except Exception as update_err:
                    err_str = str(update_err)
                    if "PGRST204" in err_str or "Could not find" in err_str:
                        match = re.search(r"Could not find the '([^']+)' column", err_str)
                        if match:
                            missing_col = match.group(1)
                            if missing_col in attempt_dict:
                                logger.warning(f"Database column '{missing_col}' not in 'cattle' table. Retrying update without '{missing_col}'.")
                                attempt_dict.pop(missing_col, None)
                                continue
                    CORE_COLUMNS = {"bcs_score", "disease", "breed", "gender", "sex", "weight_kg", "height_cm", "color", "estimated_value", "video_url", "test_history"}
                    safe_dict = {k: v for k, v in attempt_dict.items() if k in CORE_COLUMNS}
                    if safe_dict != attempt_dict:
                        logger.warning(f"Schema mismatch retry using core columns: {list(safe_dict.keys())}.")
                        attempt_dict = safe_dict
                        continue
                    raise update_err

        await asyncio.to_thread(_do_update, update_data)

        # Build enriched response data including retake signals & coat color verification
        result_data = stats.dict()
        result_data["weight_range"] = w_range
        result_data["height_range"] = h_range
        result_data["age_estimate"] = stats.age_estimate or "4 - 5 years"
        result_data["retest_video_url"] = retest_video_url
        result_data["test_history"] = updated_history
        result_data["retake_required"] = len(stats.missing_parts) > 0
        result_data["retake_reason"] = (
            f"The following body parts were not clearly visible in the video: {', '.join(stats.missing_parts)}. "
            "Please re-record showing those areas clearly."
            if stats.missing_parts else None
        )
        result_data["coat_mismatch"] = coat_mismatch
        result_data["mismatch_warning"] = mismatch_warning
        
        return {
            "status": "success",
            "message": "Video analysis completed and saved successfully.",
            "data": result_data
        }
        
    except Exception as e:
        logger.error(f"Error analyzing cattle video: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)


@router.post("/muzzle/{cattle_id}/udder-analysis")
async def analyze_cattle_udder_photo(
    cattle_id: str,
    file: UploadFile = File(...)
):
    """
    Process an uploaded close-up photo of the udder & teats.
    Analyzes scores via OpenAI Vision, updates the cattle database record,
    sets gender to Female, and clears 'udder'/'teats' from missing_parts.
    """
    sb = db.get_client()
    import asyncio
    from services.openai_service import analyse_udder_image_bytes

    try:
        img_bytes = await file.read()
        res = await analyse_udder_image_bytes(img_bytes)

        u_score = res.get("udder_score", 4.0)
        t_score = res.get("teat_score", 4.0)

        # 1. Fetch existing cattle to update test_history if present
        def _get_record():
            return sb.table("cattle").select("*").eq("id", cattle_id).execute()

        rec = await asyncio.to_thread(_get_record)
        existing = rec.data[0] if rec.data else None

        update_dict = {
            "gender": "Female",
            "sex": "Female",
            "udder_score": u_score,
            "teat_score": t_score,
        }

        if existing and existing.get("test_history"):
            history = existing.get("test_history", [])
            if isinstance(history, list) and history:
                # Update latest test record
                history[-1]["gender"] = "Female"
                history[-1]["sex"] = "Female"
                history[-1]["udder_score"] = u_score
                history[-1]["teat_score"] = t_score
                update_dict["test_history"] = history

        def _do_update():
            return sb.table("cattle").update(update_dict).eq("id", cattle_id).execute()

        await asyncio.to_thread(_do_update)

        return {
            "status": "success",
            "message": "Udder photo analyzed successfully!",
            "data": {
                "gender": "Female",
                "udder_score": u_score,
                "teat_score": t_score,
                "udder_visible": True,
                "teat_visible": True,
                "missing_parts": [],
                "observations": res.get("observations", ["Udder & teats photo verified."])
            }
        }

    except Exception as e:
        logger.error(f"Error analyzing udder photo for cattle {cattle_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/muzzle/{cattle_id}/multi-angle-retest")
async def analyze_cattle_multi_angle_photos(
    cattle_id: str,
    right_img: Optional[UploadFile] = File(None),
    left_img: Optional[UploadFile] = File(None),
    back_img: Optional[UploadFile] = File(None),
    udder_img: Optional[UploadFile] = File(None),
    front_img: Optional[UploadFile] = File(None),
):
    """
    Process multi-angle cattle retest photos (Right side, Left side, Back side, Udder, Front).
    Verifies Coat Color Match against master profile. If mismatched, returns HTTP 400 error.
    Otherwise updates cattle database record and appends to test_history.
    """
    sb = db.get_client()
    import asyncio
    from services.openai_service import analyse_multi_angle_photos

    images_dict = {}
    if right_img:
        images_dict["right_side"] = await right_img.read()
    if left_img:
        images_dict["left_side"] = await left_img.read()
    if back_img:
        images_dict["back_side"] = await back_img.read()
    if udder_img:
        images_dict["udder"] = await udder_img.read()
    if front_img:
        images_dict["front"] = await front_img.read()

    if not images_dict:
        raise HTTPException(status_code=400, detail="Please upload at least one cattle photo (Right, Left, Back, Udder, or Front).")

    # Fetch existing master cattle profile
    def _get_existing():
        return sb.table("cattle").select("*").eq("id", cattle_id).execute()

    ex_res = await asyncio.to_thread(_get_existing)
    existing_cattle = ex_res.data[0] if ex_res.data else None
    reg_breed = existing_cattle.get("breed") if existing_cattle else None
    reg_gender = (existing_cattle.get("gender") or existing_cattle.get("sex")) if existing_cattle else None
    registered_color = (existing_cattle.get("color") or existing_cattle.get("coat_color")) if existing_cattle else None

    # Call AI Multi-Angle analysis
    stats = await analyse_multi_angle_photos(images_dict, expected_gender=reg_gender)

    if existing_cattle:
        if reg_breed and str(reg_breed).strip():
            stats.breed = reg_breed.strip()
        if reg_gender and str(reg_gender).strip():
            stats.gender = reg_gender.strip()

        # Strict Coat Color Verification
        if registered_color and stats.coat_color:
            reg_words = set(re.findall(r'\w+', registered_color.lower()))
            new_words = set(re.findall(r'\w+', stats.coat_color.lower()))
            color_keywords = {"black", "brown", "white", "red", "grey", "gray", "yellow", "cream", "dun", "roan", "spotted"}
            reg_colors = reg_words.intersection(color_keywords)
            new_colors = new_words.intersection(color_keywords)

            if reg_colors and new_colors and not reg_colors.intersection(new_colors):
                mismatch_warning = (
                    f"COAT COLOR MISMATCH: The registered cattle coat color is '{registered_color}', "
                    f"but the uploaded multi-angle photos show '{stats.coat_color}'. The coat color does not match! Please upload photos of the correct cattle."
                )
                logger.warning(mismatch_warning)
                raise HTTPException(status_code=400, detail=mismatch_warning)

            stats.coat_color = registered_color

    w_num = float(stats.weight_kg or 480.0)
    h_num = float(stats.height_cm or 136.0)
    w_range = getattr(stats, 'weight_range', None) or f"{int(round(w_num*0.93/5)*5)} - {int(round(w_num*1.07/5)*5)} kg"
    h_range = getattr(stats, 'height_range', None) or f"{int(round(h_num*0.96))} - {int(round(h_num*1.04))} cm"

    # Upload all captured multi-angle photos to Supabase Storage
    import uuid
    from services.supabase_service import upload_muzzle_image

    photo_urls = {}
    for angle_key, img_bytes in images_dict.items():
        try:
            filename = f"retest_{cattle_id}_{angle_key}_{uuid.uuid4().hex[:6]}.jpg"
            url = await upload_muzzle_image(img_bytes, filename)
            if url:
                photo_urls[angle_key] = url
        except Exception as e:
            logger.warning(f"Could not upload retest angle photo {angle_key} to storage: {e}")

    existing_history = (existing_cattle.get("test_history") if existing_cattle else None) or []
    next_test_num = len(existing_history) + 1
    new_test_entry = {
        "test_number": next_test_num,
        "test_label": f"Test {next_test_num} (5-Angle Retest)",
        "date": datetime.datetime.now().strftime("%d %b %Y"),
        "bcs_score": stats.bcs_score,
        "health_status": stats.disease_status,
        "cleanliness_score": stats.cleanliness_score,
        "weight_kg": stats.weight_kg,
        "weight_range": w_range,
        "height_cm": stats.height_cm,
        "height_range": h_range,
        "coat_color": stats.coat_color,
        "breed": stats.breed,
        "gender": stats.gender,
        "estimated_value": stats.estimated_value,
        "age_estimate": stats.age_estimate or "3 - 4 years",
        "udder_score": stats.udder_score,
        "teat_score": stats.teat_score,
        "observations": stats.observations,
        "retest_photos": photo_urls,
    }
    updated_history = existing_history + [new_test_entry]

    update_data = {
        "bcs_score": stats.bcs_score,
        "disease": stats.disease_status,
        "disease_status": stats.disease_status,
        "cleanliness_score": getattr(stats, "cleanliness_score", 85),
        "breed": stats.breed,
        "gender": stats.gender,
        "sex": stats.gender,
        "weight_kg": stats.weight_kg,
        "weight_range": w_range,
        "height_cm": stats.height_cm,
        "height_range": h_range,
        "color": stats.coat_color,
        "coat_color": stats.coat_color,
        "estimated_value": stats.estimated_value,
        "age_estimate": stats.age_estimate,
        "udder_score": stats.udder_score,
        "teat_score": stats.teat_score,
        "retest_photos": photo_urls,
        "test_history": updated_history,
    }

    STANDARD_CATTLE_COLUMNS = {
        "bcs_score", "disease", "disease_status", "cleanliness_score", "breed", "gender", "sex",
        "weight_kg", "weight_range", "height_cm", "height_range", "color",
        "coat_color", "estimated_value", "age_estimate", "udder_score", "teat_score", "retest_photos", "test_history"
    }

    def _do_update(data_dict):
        attempt_dict = dict(data_dict)
        max_retries = 10
        for _ in range(max_retries):
            try:
                res = sb.table("cattle").update(attempt_dict).eq("id", cattle_id).execute()
                if not res.data:
                    res = sb.table("cattle").update(attempt_dict).ilike("name", f"%{cattle_id}%").execute()
                return res
            except Exception as update_err:
                err_str = str(update_err)
                if "PGRST204" in err_str or "Could not find" in err_str:
                    match = re.search(r"Could not find the '([^']+)' column", err_str)
                    if match:
                        missing_col = match.group(1)
                        if missing_col in attempt_dict:
                            logger.warning(f"Database column '{missing_col}' not in 'cattle' table. Retrying update without '{missing_col}'.")
                            attempt_dict.pop(missing_col, None)
                            continue
                CORE_COLUMNS = {"bcs_score", "disease", "disease_status", "breed", "gender", "sex", "weight_kg", "height_cm", "color", "estimated_value", "test_history"}
                safe_dict = {k: v for k, v in attempt_dict.items() if k in CORE_COLUMNS}
                if safe_dict != attempt_dict:
                    logger.warning(f"Multi-angle schema mismatch retry using core columns: {list(safe_dict.keys())}.")
                    attempt_dict = safe_dict
                    continue
                raise update_err

    await asyncio.to_thread(_do_update, update_data)

    result_data = stats.dict()
    result_data["weight_range"] = w_range
    result_data["height_range"] = h_range
    result_data["test_history"] = updated_history
    result_data["retest_photos"] = photo_urls

    return {
        "status": "success",
        "message": "Multi-angle photo retest analysis completed and saved successfully.",
        "data": result_data
    }





@router.post("/muzzle/identify")
async def identify_cattle_muzzle(
    file: UploadFile = File(...)
):
    """
    Identify a cattle from 1 muzzle image.
    """
    try:
        original_image_bytes = await file.read()
        
        # 0. OpenAI Vision Muzzle Validation (using OpenAI API key)
        val = await validate_muzzle_image(original_image_bytes)
        if not val.get("valid", True):
            logger.warning(f"Single muzzle identify validation failed: {val.get('message')}")
            raise HTTPException(
                status_code=400,
                detail=f"OpenAI Muzzle Validation Failed: {val.get('message', 'Not a valid cattle muzzle photo')}. Please upload a clear, close-up photo of the cattle muzzle (snout)."
            )

        # 1. Smart Auto-Enhance image (only for AI extraction)
        enhanced_image_bytes = await asyncio.to_thread(auto_enhance_image_bytes, original_image_bytes)
        
        # 2. AI Feature Extraction
        master_embedding = await asyncio.to_thread(extract_muzzle_features, enhanced_image_bytes)
        
        # 2. Search in Supabase using the RPC function we created (with Python NumPy fallback)
        sb = db.get_client()
        
        def _match():
            try:
                return sb.rpc(
                    "match_cattle_muzzle", 
                    {
                        "query_embedding": master_embedding,
                        "match_threshold": 0.85,
                        "match_count": 1
                    }
                ).execute()
            except Exception as rpc_err:
                logger.warning(f"RPC match_cattle_muzzle failed during identify: {rpc_err}")
                try:
                    res = sb.table("cattle").select("id, name, user_id, gender, image_url, muzzle_embedding, bcs_score, breed, estimated_weight").execute()
                    if res.data:
                        best_sim = -1.0
                        best_c = None
                        q_vec = np.array(master_embedding)
                        for c in res.data:
                            emb = c.get("muzzle_embedding")
                            if emb and isinstance(emb, list):
                                db_vec = np.array(emb)
                                if len(db_vec) == len(q_vec):
                                    sim = np.dot(q_vec, db_vec) / (np.linalg.norm(q_vec) * np.linalg.norm(db_vec) + 1e-9)
                                    if sim > best_sim:
                                        best_sim = sim
                                        best_c = c
                        if best_c and best_sim >= 0.85:
                            best_c["similarity"] = float(best_sim)
                            class MatchResp:
                                data = [best_c]
                            return MatchResp()
                except Exception as fb_err:
                    logger.warning(f"Python fallback match failed: {fb_err}")
                class EmptyMatchResp:
                    data = []
                return EmptyMatchResp()
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
        
        # Ensure cleanliness_score is populated from top-level or test history
        if not cattle.get("cleanliness_score") and cattle.get("test_history"):
            last_entry = cattle["test_history"][-1]
            if isinstance(last_entry, dict) and last_entry.get("cleanliness_score"):
                cattle["cleanliness_score"] = last_entry.get("cleanliness_score")
        if not cattle.get("cleanliness_score"):
            cattle["cleanliness_score"] = 85

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


@router.post("/muzzle/{cattle_id}/update-gender")
async def update_cattle_gender(
    cattle_id: str,
    gender: str = Form(...)
):
    """
    Allow farmer/admin to correct cattle gender (Female vs Male).
    Updates gender, sex, and all historical test_history records for this cattle.
    """
    sb = db.get_client()
    import asyncio
    safe_gender = "Male" if any(w in gender.lower() for w in ["male", "bull", "ox", "steer"]) and "fe" not in gender.lower() else "Female"

    def _do_update():
        try:
            # 1. Fetch existing record to update test_history array
            res_get = sb.table("cattle").select("*").eq("id", cattle_id).execute()
            existing = res_get.data[0] if res_get.data else None
            
            update_fields = {
                "gender": safe_gender,
                "sex": safe_gender
            }

            if existing and existing.get("test_history"):
                history = existing.get("test_history", [])
                if isinstance(history, list):
                    for item in history:
                        if isinstance(item, dict):
                            item["gender"] = safe_gender
                            item["sex"] = safe_gender
                    update_fields["test_history"] = history

            res = sb.table("cattle").update(update_fields).eq("id", cattle_id).execute()
            if not res.data:
                res = sb.table("cattle").update(update_fields).ilike("name", f"%{cattle_id}%").execute()
            return res
        except Exception as err:
            err_str = str(err)
            if "PGRST204" in err_str or "Could not find" in err_str:
                logger.warning("Gender/test_history column mismatch. Updating base gender.")
                try:
                    return sb.table("cattle").update({"gender": safe_gender}).eq("id", cattle_id).execute()
                except Exception:
                    return None
            raise err

    try:
        await asyncio.to_thread(_do_update)
    except Exception as e:
        logger.warning(f"Error updating gender in DB: {e}")

    return {
        "status": "success",
        "message": f"Cattle gender updated successfully to '{safe_gender}'.",
        "gender": safe_gender
    }



@router.delete("/muzzle/{cattle_id}")
async def delete_cattle(cattle_id: str):
    """
    Delete a cattle profile permanently from the Supabase database.
    """
    sb = db.get_client()
    import asyncio

    def _do_delete():
        res = sb.table("cattle").delete().eq("id", cattle_id).execute()
        if not res.data:
            res = sb.table("cattle").delete().ilike("name", f"%{cattle_id}%").execute()
        return res

    try:
        await asyncio.to_thread(_do_delete)
        return {"status": "success", "message": "Cattle profile deleted successfully."}
    except Exception as e:
        logger.error(f"Error deleting cattle {cattle_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/muzzle/{cattle_id}")
async def edit_cattle_profile(
    cattle_id: str,
    name: Optional[str] = Form(None),
    breed: Optional[str] = Form(None),
    gender: Optional[str] = Form(None),
    coat_color: Optional[str] = Form(None),
    weight_kg: Optional[float] = Form(None),
    height_cm: Optional[float] = Form(None),
    estimated_value: Optional[str] = Form(None),
    disease_status: Optional[str] = Form(None),
):
    """
    Edit and update cattle profile fields directly in the Supabase database.
    """
    sb = db.get_client()
    import asyncio

    update_dict = {}
    if name is not None and name.strip():
        update_dict["name"] = name.strip()
    if breed is not None and breed.strip():
        update_dict["breed"] = breed.strip()
    if gender is not None and gender.strip():
        safe_g = "Male" if any(w in gender.lower() for w in ["male", "bull", "ox", "steer"]) else "Female"
        update_dict["gender"] = safe_g
        update_dict["sex"] = safe_g
    if coat_color is not None and coat_color.strip():
        update_dict["color"] = coat_color.strip()
    if weight_kg is not None:
        update_dict["weight_kg"] = weight_kg
    if height_cm is not None:
        update_dict["height_cm"] = height_cm
    if estimated_value is not None and estimated_value.strip():
        update_dict["estimated_value"] = estimated_value.strip()
    if disease_status is not None and disease_status.strip():
        update_dict["disease"] = disease_status.strip()

    if not update_dict:
        return {"status": "success", "message": "No changes provided."}

    STANDARD_COLS = {"name", "breed", "weight_kg", "height_cm", "color", "estimated_value", "disease"}

    def _do_update():
        try:
            res = sb.table("cattle").update(update_dict).eq("id", cattle_id).execute()
            if not res.data:
                res = sb.table("cattle").update(update_dict).ilike("name", f"%{cattle_id}%").execute()
            return res
        except Exception as err:
            err_str = str(err)
            if "PGRST204" in err_str or "Could not find" in err_str:
                safe_dict = {k: v for k, v in update_dict.items() if k in STANDARD_COLS}
                res = sb.table("cattle").update(safe_dict).eq("id", cattle_id).execute()
                if not res.data:
                    res = sb.table("cattle").update(safe_dict).ilike("name", f"%{cattle_id}%").execute()
                return res
            raise err

    try:
        await asyncio.to_thread(_do_update)
        return {
            "status": "success",
            "message": "Cattle profile updated successfully.",
            "updated_fields": update_dict
        }
    except Exception as e:
        logger.error(f"Error editing cattle profile {cattle_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
