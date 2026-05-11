"""
ReelForge AI — Video Pipeline
Supports 3 tiers: free / pro / enterprise
Windows-compatible version
"""

import os
import uuid
import shutil
import asyncio
from typing import Optional

from fastapi import FastAPI, HTTPException, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="ReelForge AI — Video Pipeline",
    description="3-tier video generation: Free / Pro / Enterprise",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

job_store: dict = {}

# Windows-compatible temp paths
WORK_DIR = os.path.join(os.environ.get("TEMP", "/tmp"), "reelforge")
OUTPUT_DIR = os.path.join(os.environ.get("TEMP", "/tmp"), "reelforge", "outputs")
os.makedirs(OUTPUT_DIR, exist_ok=True)


# ── Models ──

class VideoGenerationRequest(BaseModel):
    job_id: str = ""
    tier: str = "free"
    language: str = "English"
    voice_script: dict = {}
    avatar_direction: dict = {}
    audio_direction: dict = {}
    winning_script: dict = {}
    color_palette: list = []
    duration_seconds: int = 20
    platform: str = "instagram_reels"
    product_name: str = ""
    watermark: bool = True


class VideoJobStatus(BaseModel):
    job_id: str
    status: str
    video_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    error: Optional[str] = None
    progress: int = 0
    tier: str = "free"


# ── Helpers ──

def update_job(job_id: str, **kwargs):
    if job_id in job_store:
        job_store[job_id].update(kwargs)


def get_scenes(request: VideoGenerationRequest) -> list:
    scenes = request.avatar_direction.get("shot_list", [])
    if scenes and isinstance(scenes, list) and len(scenes) > 0:
        return scenes

    hook = str(request.winning_script.get("hook", "") or "")
    body = str(request.winning_script.get("body", "") or "")
    cta  = str(request.winning_script.get("cta",  "") or "")
    prod = request.product_name or "Product"

    return [
        {"scene_number": 1, "scene_type": "Hook",         "duration_seconds": 3,
         "stock_video_keywords": ["lifestyle", "people", "morning"],
         "text_overlay": hook[:50], "text_position": "center",
         "color_grade": "warm"},
        {"scene_number": 2, "scene_type": "Problem",      "duration_seconds": 4,
         "stock_video_keywords": ["problem", "frustrated", "daily life"],
         "text_overlay": "", "text_position": "bottom",
         "color_grade": "cool"},
        {"scene_number": 3, "scene_type": "Solution",     "duration_seconds": 6,
         "stock_video_keywords": [prod, "product", "solution"],
         "text_overlay": body[:50], "text_position": "bottom",
         "color_grade": "vibrant"},
        {"scene_number": 4, "scene_type": "Social Proof", "duration_seconds": 4,
         "stock_video_keywords": ["happy customer", "smile", "success"],
         "text_overlay": "", "text_position": "center",
         "color_grade": "warm"},
        {"scene_number": 5, "scene_type": "CTA",          "duration_seconds": 3,
         "stock_video_keywords": ["buy now", "offer", "deal"],
         "text_overlay": cta[:50] or "Get Yours Now", "text_position": "center",
         "color_grade": "bold"},
    ]


def get_voice_text(request: VideoGenerationRequest) -> str:
    voice_data = request.voice_script
    if voice_data:
        version_a = voice_data.get("version_a", {})
        if isinstance(version_a, dict):
            text = version_a.get("full_script", "")
            if text:
                return str(text)

    ws = request.winning_script
    parts = [
        str(ws.get("hook", "") or ""),
        str(ws.get("body", "") or ""),
        str(ws.get("cta",  "") or ""),
    ]
    return " ".join(p for p in parts if p).strip()


# ── Core pipeline (shared by free + pro) ──

async def run_video_pipeline(job_id: str, request: VideoGenerationRequest, tier: str):
    """Shared pipeline for free and pro tiers."""
    from services.tts_service import generate_voiceover
    from services.stock_video_service import fetch_scene_clips
    from services.music_service import get_background_music
    from services.ffmpeg_assembler import assemble_video
    from services.video_enhancer import optimize_for_social, generate_thumbnail

    work_dir = os.path.join(WORK_DIR, job_id)
    os.makedirs(work_dir, exist_ok=True)

    try:
        scenes = get_scenes(request)
        voice_text = get_voice_text(request)

        print(f"Pipeline [{tier}]: {request.product_name} | {request.language} | {len(scenes)} scenes")
        update_job(job_id, progress=10)

        # ── Step 1: Voiceover ──
        voiceover_path = None
        if voice_text:
            vo_path = os.path.join(work_dir, "voiceover.mp3")
            try:
                await generate_voiceover(voice_text, request.language, vo_path, tier=tier)
                if os.path.exists(vo_path) and os.path.getsize(vo_path) > 0:
                    voiceover_path = vo_path
                    print(f"Voiceover OK: {os.path.getsize(vo_path)} bytes")
            except Exception as e:
                print(f"Voiceover failed (non-fatal): {e}")

        update_job(job_id, progress=25)

        # ── Step 2: Stock video clips ──
        clips_dir = os.path.join(work_dir, "clips")
        try:
            scene_clips = await fetch_scene_clips(scenes, clips_dir)
            fetched = sum(1 for c in scene_clips if c and os.path.exists(c))
            print(f"Clips fetched: {fetched}/{len(scenes)}")
        except Exception as e:
            print(f"Stock video fetch failed (non-fatal): {e}")
            scene_clips = [None] * len(scenes)

        update_job(job_id, progress=45)

        # ── Step 3: Background music ──
        music_path = None
        try:
            audio_data = request.audio_direction or {}
            bg = audio_data.get("background_music", {}) or {}
            genre = str(bg.get("genre", "Pop") or "Pop")
            mood  = str(bg.get("mood",  "Upbeat") or "Upbeat")
            music_out = os.path.join(work_dir, "music.mp3")
            music_path = await get_background_music(genre, mood, music_out)
            if music_path:
                print(f"Music OK: {os.path.getsize(music_path)} bytes")
        except Exception as e:
            print(f"Music fetch failed (non-fatal): {e}")

        update_job(job_id, progress=60)

        # ── Step 4: Assemble video ──
        raw_output = os.path.join(work_dir, "raw.mp4")
        success = await assemble_video(
            scenes=scenes,
            scene_clips=scene_clips,
            voiceover_path=voiceover_path,
            music_path=music_path,
            output_path=raw_output,
            work_dir=os.path.join(work_dir, "assembly"),
            color_palette=request.color_palette or ["#1a1a2e", "#16213e", "#0f3460"],
        )

        if not success or not os.path.exists(raw_output) or os.path.getsize(raw_output) == 0:
            raise RuntimeError("Video assembly produced empty file")

        print(f"Assembly OK: {os.path.getsize(raw_output)} bytes")
        update_job(job_id, progress=82)

        # ── Step 5: Optimize for platform ──
        platform = request.platform.replace("_", "").replace(" ", "").lower()
        final_filename = f"reelforge_{tier}_{job_id}.mp4"
        final_path = os.path.join(OUTPUT_DIR, final_filename)

        try:
            optimize_for_social(raw_output, final_path, platform)
        except Exception as e:
            print(f"Optimize failed (non-fatal): {e}")

        if not os.path.exists(final_path) or os.path.getsize(final_path) == 0:
            shutil.copy(raw_output, final_path)

        print(f"Final video: {os.path.getsize(final_path)} bytes → {final_path}")
        update_job(job_id, progress=93)

        # ── Step 6: Thumbnail ──
        thumb_filename = f"thumb_{job_id}.jpg"
        thumb_path = os.path.join(OUTPUT_DIR, thumb_filename)
        try:
            generate_thumbnail(final_path, thumb_path)
        except Exception as e:
            print(f"Thumbnail failed (non-fatal): {e}")

        update_job(
            job_id,
            status="completed",
            progress=100,
            video_url=f"/video/{final_filename}",
            thumbnail_url=f"/thumbnail/{thumb_filename}" if os.path.exists(thumb_path) else None,
        )
        print(f"Job {job_id} COMPLETED")

    except Exception as e:
        import traceback
        print(f"Pipeline error [{job_id}]: {e}")
        traceback.print_exc()
        update_job(job_id, status="failed", error=str(e))
    finally:
        try:
            shutil.rmtree(work_dir, ignore_errors=True)
        except Exception:
            pass


# ── Routes ──

@app.get("/")
def root():
    return {
        "service": "ReelForge AI Video Pipeline",
        "version": "2.0.0",
        "tiers": ["free", "pro", "enterprise"],
    }


@app.get("/health")
def health():
    import subprocess
    try:
        r = subprocess.run(["ffmpeg", "-version"], capture_output=True, text=True, timeout=5)
        ffmpeg_ok = r.returncode == 0
    except Exception:
        ffmpeg_ok = False

    return {
        "status": "ok",
        "ffmpeg": ffmpeg_ok,
        "pexels": bool(os.getenv("PEXELS_API_KEY")),
        "elevenlabs": bool(os.getenv("ELEVENLABS_API_KEY")),
        "heygen": bool(os.getenv("HEYGEN_API_KEY")),
        "output_dir": OUTPUT_DIR,
    }


@app.post("/generate", response_model=VideoJobStatus)
async def generate_video(request: VideoGenerationRequest, background_tasks: BackgroundTasks):
    job_id = request.job_id or str(uuid.uuid4())

    job_store[job_id] = {
        "job_id": job_id,
        "status": "pending",
        "video_url": None,
        "thumbnail_url": None,
        "error": None,
        "progress": 0,
        "tier": request.tier,
    }

    # Enterprise falls back to pro pipeline for now (HeyGen optional)
    tier = request.tier if request.tier in ("free", "pro") else "pro"
    background_tasks.add_task(run_video_pipeline, job_id, request, tier)

    return VideoJobStatus(job_id=job_id, status="pending", progress=0, tier=request.tier)


@app.get("/status/{job_id}", response_model=VideoJobStatus)
def get_status(job_id: str):
    if job_id not in job_store:
        raise HTTPException(status_code=404, detail="Job not found")
    job = job_store[job_id]
    return VideoJobStatus(
        job_id=job_id,
        status=job["status"],
        video_url=job.get("video_url"),
        thumbnail_url=job.get("thumbnail_url"),
        error=job.get("error"),
        progress=job.get("progress", 0),
        tier=job.get("tier", "free"),
    )


@app.get("/video/{filename}")
def serve_video(filename: str):
    filename = os.path.basename(filename)
    file_path = os.path.join(OUTPUT_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Video not found")
    return FileResponse(
        file_path,
        media_type="video/mp4",
        headers={
            "Content-Disposition": f"inline; filename={filename}",
            "Accept-Ranges": "bytes",
        },
    )


@app.get("/thumbnail/{filename}")
def serve_thumbnail(filename: str):
    filename = os.path.basename(filename)
    file_path = os.path.join(OUTPUT_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Thumbnail not found")
    return FileResponse(file_path, media_type="image/jpeg")



# ── CINEMATIC EDIT endpoint ──

class CinematicEditRequest(BaseModel):
    job_id: str = ""
    title: str = ""
    subtitle: str = ""
    cta_text: str = ""
    color_grade: str = "cinematic"   # cinematic|warm|cool|vibrant|moody|golden|dramatic|fresh
    effects: list = []               # zoom_in|zoom_out|pan_left|pan_right|tilt_up|tilt_down|none
    clip_duration: float = 5.0       # seconds per clip
    add_intro: bool = True
    platform: str = "instagram_reels"
    music_genre: str = "Pop"


async def run_cinematic_edit(job_id: str, video_paths: List[str], request: CinematicEditRequest):
    from services.cinematic_editor import create_cinematic_reel
    from services.music_service import get_background_music
    from services.video_enhancer import generate_thumbnail

    work_dir = os.path.join(WORK_DIR, f"cinematic_{job_id}")
    os.makedirs(work_dir, exist_ok=True)

    try:
        update_job(job_id, status="running", progress=10)

        # Fetch background music
        music_path = None
        try:
            music_out = os.path.join(work_dir, "music.mp3")
            music_path = await get_background_music(request.music_genre, "Upbeat", music_out)
        except Exception as e:
            print(f"Music fetch failed (non-fatal): {e}")

        update_job(job_id, progress=20)

        final_filename = f"cinematic_{job_id}.mp4"
        final_path = os.path.join(OUTPUT_DIR, final_filename)

        success = await create_cinematic_reel(
            video_paths=video_paths,
            work_dir=os.path.join(work_dir, "edit"),
            output_path=final_path,
            title=request.title,
            subtitle=request.subtitle,
            cta_text=request.cta_text,
            color_grade=request.color_grade,
            effects=request.effects or [],
            music_path=music_path,
            clip_duration=request.clip_duration,
            add_intro=request.add_intro,
        )

        if not success or not os.path.exists(final_path) or os.path.getsize(final_path) == 0:
            raise RuntimeError("Cinematic edit produced empty file")

        print(f"Cinematic edit done: {os.path.getsize(final_path)} bytes")

        thumb_filename = f"thumb_cinematic_{job_id}.jpg"
        thumb_path = os.path.join(OUTPUT_DIR, thumb_filename)
        try:
            generate_thumbnail(final_path, thumb_path)
        except Exception:
            pass

        update_job(job_id,
                   status="completed", progress=100,
                   video_url=f"/video/{final_filename}",
                   thumbnail_url=f"/thumbnail/{thumb_filename}" if os.path.exists(thumb_path) else None)

    except Exception as e:
        import traceback
        traceback.print_exc()
        update_job(job_id, status="failed", error=str(e))
    finally:
        try:
            shutil.rmtree(work_dir, ignore_errors=True)
        except Exception:
            pass


@app.post("/cinematic-edit")
async def cinematic_edit(
    background_tasks: BackgroundTasks,
    request: Request,
):
    """
    Upload multiple raw videos + settings → get cinematic reel.
    Accepts multipart/form-data with:
      - files: multiple video files
      - title, subtitle, cta_text, color_grade, effects (JSON array), clip_duration, add_intro, platform, music_genre
    """
    from fastapi import Request as FastAPIRequest
    form = await request.form()

    job_id = str(uuid.uuid4())

    # Save uploaded files
    upload_dir = os.path.join(WORK_DIR, f"uploads_{job_id}")
    os.makedirs(upload_dir, exist_ok=True)

    video_paths = []
    files = form.getlist("files")
    if not files:
        raise HTTPException(status_code=400, detail="No video files uploaded")

    for i, file in enumerate(files):
        if hasattr(file, "filename") and file.filename:
            ext = os.path.splitext(file.filename)[1] or ".mp4"
            save_path = os.path.join(upload_dir, f"clip_{i}{ext}")
            content = await file.read()
            with open(save_path, "wb") as f:
                f.write(content)
            if os.path.getsize(save_path) > 0:
                video_paths.append(save_path)

    if not video_paths:
        raise HTTPException(status_code=400, detail="No valid video files received")

    import json as _json
    effects_raw = form.get("effects", "[]")
    try:
        effects_list = _json.loads(effects_raw) if isinstance(effects_raw, str) else []
    except Exception:
        effects_list = []

    edit_request = CinematicEditRequest(
        job_id=job_id,
        title=str(form.get("title", "")),
        subtitle=str(form.get("subtitle", "")),
        cta_text=str(form.get("cta_text", "")),
        color_grade=str(form.get("color_grade", "cinematic")),
        effects=effects_list,
        clip_duration=float(form.get("clip_duration", 5.0)),
        add_intro=str(form.get("add_intro", "true")).lower() == "true",
        platform=str(form.get("platform", "instagram_reels")),
        music_genre=str(form.get("music_genre", "Pop")),
    )

    job_store[job_id] = {
        "job_id": job_id, "status": "pending",
        "video_url": None, "thumbnail_url": None,
        "error": None, "progress": 0, "tier": "cinematic",
    }

    background_tasks.add_task(run_cinematic_edit, job_id, video_paths, edit_request)

    return {"success": True, "job_id": job_id, "status": "pending",
            "clips_received": len(video_paths)}


@app.delete("/cleanup/{job_id}")
def cleanup_job(job_id: str):
    if job_id in job_store:
        job = job_store[job_id]
        for key in ["video_url", "thumbnail_url"]:
            url = job.get(key)
            if url:
                fpath = os.path.join(OUTPUT_DIR, url.split("/")[-1])
                try:
                    os.remove(fpath)
                except Exception:
                    pass
        del job_store[job_id]
        return {"success": True}
    raise HTTPException(status_code=404, detail="Job not found")
