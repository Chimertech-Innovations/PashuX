"""
Video processing service.
Extracts frames from a cattle video, removes blurry/duplicate frames,
ranks by clarity, and returns the top N frame paths.
All temporary files are cleaned up after processing.
"""

import os
import shutil
import tempfile
import logging
from pathlib import Path
from typing import List, Tuple

import cv2
import numpy as np
import imagehash
from PIL import Image, ImageOps
from typing import Optional

try:
    from pillow_heif import register_heif_opener
    register_heif_opener()
except Exception:
    pass

logger = logging.getLogger(__name__)

BLUR_THRESHOLD: float = float(os.getenv("BLUR_THRESHOLD", "100.0"))
HASH_SIMILARITY_THRESHOLD: int = int(os.getenv("HASH_SIMILARITY_THRESHOLD", "10"))
TOP_FRAMES_COUNT: int = int(os.getenv("TOP_FRAMES_COUNT", "10"))


def load_image_array(image_path: str) -> Optional[np.ndarray]:
    """
    Universal image loader that handles standard JPEG/PNG/WEBP,
    Apple iPhone HEIC/HEIF, and portrait photos with EXIF orientation.
    Returns OpenCV BGR image array.
    """
    try:
        pil_img = Image.open(image_path)
        pil_img = ImageOps.exif_transpose(pil_img).convert("RGB")
        max_dim = 1600
        if max(pil_img.size) > max_dim:
            pil_img.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)
        return cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
    except Exception:
        try:
            return cv2.imread(image_path)
        except Exception:
            return None


def compute_blur_score(frame: np.ndarray) -> float:
    """Return Laplacian variance — higher means sharper."""
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    return float(cv2.Laplacian(gray, cv2.CV_64F).var())


def compute_image_fingerprints(img: np.ndarray) -> dict:
    """Compute multi-spectral fingerprints (pHash, dHash, & normalized thumbnail MAE) for strict dedup."""
    rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    pil_img = Image.fromarray(rgb)
    phash = imagehash.phash(pil_img)
    dhash = imagehash.dhash(pil_img)

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    thumb = cv2.resize(gray, (64, 64), interpolation=cv2.INTER_AREA).astype(np.float32) / 255.0

    return {
        "phash": phash,
        "dhash": dhash,
        "thumb": thumb,
    }


def is_near_duplicate(fp1: dict, fp2: dict) -> bool:
    """
    Check if two frame fingerprints are near-duplicates.
    Returns True if frames represent the same cattle pose or scene shot.
    """
    phash_diff = abs(fp1["phash"] - fp2["phash"])
    dhash_diff = abs(fp1["dhash"] - fp2["dhash"])
    mae = float(np.mean(np.abs(fp1["thumb"] - fp2["thumb"])))

    # Frame is duplicate if:
    # 1. pHash difference <= 16 (perceptual similarity)
    # 2. dHash difference <= 14 (structural edge similarity)
    # 3. Grayscale thumbnail MAE < 0.15 (visual layout similarity)
    return phash_diff <= 16 or dhash_diff <= 14 or mae < 0.15


def extract_frames(video_path: str, output_dir: str) -> List[Tuple[str, float]]:
    """
    Extract one frame per second from the video.
    Supports WebM clips from browser MediaRecorder with unknown/negative frame count metadata.
    """
    # 1. Image fallback check: if this is a photo/snapshot image file
    img = load_image_array(video_path)
    if img is not None and img.size > 0:
        blur = compute_blur_score(img)
        frame_path = os.path.join(output_dir, "frame_0000.jpg")
        cv2.imwrite(frame_path, img, [cv2.IMWRITE_JPEG_QUALITY, 90])
        return [(frame_path, blur)]

    # 2. Video frame extraction
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError(f"Cannot open video file: {video_path}")

    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps <= 0 or fps > 120 or np.isnan(fps):
        fps = 30.0

    sample_interval = max(1, int(round(fps)))
    frames: List[Tuple[str, float]] = []
    frame_idx = 0
    second = 0

    while True:
        ret, frame = cap.read()
        if not ret or frame is None or frame.size == 0:
            break

        if frame_idx % sample_interval == 0:
            # Downscale high-resolution frames (e.g. 4K MOV/MP4 videos) to max 720px width/height to prevent OOM
            h, w = frame.shape[:2]
            max_dim = 720
            if max(h, w) > max_dim:
                scale = max_dim / max(h, w)
                new_w = max(1, int(w * scale))
                new_h = max(1, int(h * scale))
                frame = cv2.resize(frame, (new_w, new_h), interpolation=cv2.INTER_AREA)

            blur = compute_blur_score(frame)
            frame_path = os.path.join(output_dir, f"frame_{second:04d}.jpg")
            cv2.imwrite(frame_path, frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
            frames.append((frame_path, blur))
            second += 1

        frame_idx += 1
        # Extract 1 frame per second across full video (up to 30 seconds)
        if second >= 30:
            break

    cap.release()
    logger.info(f"Extracted {len(frames)} frames sequentially across full video (1 frame per second)")
    return frames



def remove_blurry_frames(
    frames: List[Tuple[str, float]],
    threshold: float = BLUR_THRESHOLD,
) -> List[Tuple[str, float]]:
    """
    Remove frames that fall below absolute threshold OR below 35% of max video clarity.
    """
    if not frames:
        return []

    max_clarity = max(s for _, s in frames)
    # Dynamic relative threshold: at least 35% of max clarity, and at least 120
    effective_threshold = max(threshold, max_clarity * 0.35)

    sharp = [(p, s) for p, s in frames if s >= effective_threshold]

    # Fallback if strict threshold removed everything
    if not sharp:
        sorted_all = sorted(frames, key=lambda x: x[1], reverse=True)
        sharp = sorted_all[:max(1, len(frames) // 3)]

    logger.info(f"Blur filter: kept {len(sharp)} sharp frame(s), removed {len(frames) - len(sharp)}")
    return sharp


def remove_duplicate_frames(
    frames: List[Tuple[str, float]],
) -> List[Tuple[str, float]]:
    """
    Remove near-duplicate frames using multi-spectral fingerprints (pHash, dHash, & MAE).
    Input frames must be pre-sorted by clarity descending so the sharpest
    representative of each unique pose/angle is preserved.
    """
    unique: List[Tuple[str, float]] = []
    seen_fingerprints: List[dict] = []

    for path, score in frames:
        img = cv2.imread(path)
        if img is None:
            continue

        fp = compute_image_fingerprints(img)
        is_dup = any(is_near_duplicate(fp, seen) for seen in seen_fingerprints)

        if not is_dup:
            unique.append((path, score))
            seen_fingerprints.append(fp)

    removed = len(frames) - len(unique)
    logger.info(f"Dedup filter: kept {len(unique)} unique frame(s), removed {removed} duplicate(s)")
    return unique


def select_top_frames(
    frames: List[Tuple[str, float]],
    top_n: int = TOP_FRAMES_COUNT,
) -> List[Tuple[str, float]]:
    """Rank clean unique frames by clarity (blur score) and return up to top N (1 to 10)."""
    ranked = sorted(frames, key=lambda x: x[1], reverse=True)
    selected = ranked[:top_n]
    logger.info(f"Selected {len(selected)} best clean frame(s) by clarity")
    return selected


def convert_to_mp4(input_path: str, output_path: str) -> str:
    """
    Automatically converts any input video (e.g. .mov, .avi, .webm) into a standard .mp4 video file
    using OpenCV transcoding while maintaining aspect ratio and downscaling to save memory.
    """
    if not os.path.exists(input_path):
        return input_path

    cap = cv2.VideoCapture(input_path)
    if not cap.isOpened():
        logger.warning(f"Could not open video file {input_path} for MP4 conversion.")
        return input_path

    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps <= 0 or fps > 120 or np.isnan(fps):
        fps = 30.0

    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    
    if width <= 0 or height <= 0:
        cap.release()
        return input_path

    if width > 1080:
        scale = 1080 / width
        width = 1080
        height = int(height * scale)

    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

    frames_written = 0
    while True:
        ret, frame = cap.read()
        if not ret or frame is None or frame.size == 0:
            break

        if frame.shape[1] != width or frame.shape[0] != height:
            frame = cv2.resize(frame, (width, height), interpolation=cv2.INTER_AREA)

        out.write(frame)
        frames_written += 1
        if frames_written > 1800:  # Cap max conversion to 60 seconds
            break

    cap.release()
    out.release()
    logger.info(f"Converted {input_path} to standard MP4 {output_path} ({frames_written} frames)")
    return output_path


def process_video(video_path: str, work_dir: str) -> dict:
    """
    Full sequential 1-FPS video analysis pipeline:
      1. Extract 1 frame per second sequentially across the full video duration (supports .mov, .mp4, .webm).
      2. Filter out pitch-black or corrupted frames while preserving the full timeline of the video.
      3. Maintain the chronological sequence so the AI evaluates every second from head to tail.
      4. Sample up to 20 evenly distributed frames if video exceeds 20 seconds.
    """
    frames_dir = os.path.join(work_dir, "frames")
    os.makedirs(frames_dir, exist_ok=True)

    # 1. Fast sequential 1-FPS frame extraction
    all_frames = extract_frames(video_path, frames_dir)
    if not all_frames:
        raise ValueError("Could not extract frames from the video. Please check the video file.")

    # 2. Filter out corrupted or completely black frames (mean pixel brightness >= 5)
    usable_frames: List[Tuple[str, float]] = []
    for path, blur in all_frames:
        if not os.path.exists(path) or os.path.getsize(path) < 1000:
            continue
        try:
            img = cv2.imread(path)
            if img is not None and img.size > 0:
                if np.mean(img) >= 5: # not pitch black
                    usable_frames.append((path, blur))
        except Exception:
            continue

    if not usable_frames:
        usable_frames = all_frames[:1]

    # 3. If video duration > 20 seconds, sample up to 20 frames uniformly across the full timeline
    max_frames_to_send = 20
    if len(usable_frames) > max_frames_to_send:
        step = len(usable_frames) / float(max_frames_to_send)
        selected_indices = [int(i * step) for i in range(max_frames_to_send)]
        top_frames = [usable_frames[idx] for idx in selected_indices if idx < len(usable_frames)]
    else:
        top_frames = usable_frames

    # Clean up unselected frames from disk
    selected_paths = {p for p, _ in top_frames}
    for path, _ in all_frames:
        if path not in selected_paths and os.path.exists(path):
            try:
                os.remove(path)
            except Exception as exc:
                logger.warning(f"Could not remove unselected frame {path}: {exc}")

    logger.info(f"Video processing complete: {len(top_frames)} sequential 1-FPS frames selected across full video")
    return {
        "frames_extracted": len(all_frames),
        "frames_after_blur_filter": len(usable_frames),
        "frames_after_dedup": len(usable_frames),
        "top_frames_selected": len(top_frames),
        "frame_data": [
            {"path": p, "clarity_score": round(s, 2), "frame_number": i + 1}
            for i, (p, s) in enumerate(top_frames)
        ],
    }




def process_image(image_path: str, work_dir: str) -> dict:
    """
    Process an uploaded single image/photo:
      1. Load image and compute blur score (Laplacian variance)
      2. Save clean image into work_dir/frames/frame_0001.jpg
      3. Return dictionary with frame data matching the video processing schema.
    """
    frames_dir = os.path.join(work_dir, "frames")
    os.makedirs(frames_dir, exist_ok=True)

    img = load_image_array(image_path)
    if img is None:
        raise ValueError(f"Could not read image file: {image_path}")

    blur_score = compute_blur_score(img)
    target_frame_path = os.path.join(frames_dir, "frame_0001.jpg")
    cv2.imwrite(target_frame_path, img, [cv2.IMWRITE_JPEG_QUALITY, 95])

    return {
        "frames_extracted": 1,
        "frames_after_blur_filter": 1,
        "frames_after_dedup": 1,
        "top_frames_selected": 1,
        "frame_data": [
            {"path": target_frame_path, "clarity_score": round(blur_score, 2), "frame_number": 1}
        ],
    }



def cleanup(path: str) -> None:
    """Delete a file or directory tree silently."""
    try:
        if os.path.isdir(path):
            shutil.rmtree(path)
        elif os.path.isfile(path):
            os.remove(path)
    except Exception as exc:
        logger.warning(f"Cleanup failed for {path}: {exc}")
