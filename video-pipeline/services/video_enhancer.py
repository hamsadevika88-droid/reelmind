"""
Video Enhancement Service — Pro & Enterprise Tier
Applies color grading, transitions, zoom effects, and quality improvements.
"""

import os
import subprocess
from typing import List, Optional


def run_ffmpeg(cmd: List[str], timeout: int = 300) -> bool:
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        if result.returncode != 0:
            print(f"FFmpeg error: {result.stderr[-500:]}")
            return False
        return True
    except Exception as e:
        print(f"FFmpeg exception: {e}")
        return False


COLOR_GRADES = {
    "warm": "curves=r='0/0 0.5/0.6 1/1':g='0/0 0.5/0.5 1/0.9':b='0/0 0.5/0.4 1/0.8'",
    "cool": "curves=r='0/0 0.5/0.4 1/0.8':g='0/0 0.5/0.5 1/0.9':b='0/0 0.5/0.6 1/1'",
    "vibrant": "eq=saturation=1.4:contrast=1.1:brightness=0.05",
    "cinematic": "curves=r='0/0.05 0.5/0.5 1/0.95':g='0/0.05 0.5/0.5 1/0.95':b='0/0.1 0.5/0.5 1/0.9',vignette=PI/4",
    "bold": "eq=saturation=1.6:contrast=1.2:brightness=0.0",
    "desaturated": "eq=saturation=0.6:contrast=1.05",
    "golden": "curves=r='0/0 0.5/0.6 1/1':g='0/0 0.5/0.55 1/0.95':b='0/0 0.5/0.35 1/0.7'",
    "moody": "curves=r='0/0.05 0.5/0.45 1/0.9':g='0/0.05 0.5/0.45 1/0.85':b='0/0.1 0.5/0.5 1/0.95',vignette=PI/3",
}


def apply_color_grade(
    input_path: str,
    output_path: str,
    grade: str = "warm",
) -> bool:
    """Apply color grading to a video."""
    filter_str = COLOR_GRADES.get(grade, COLOR_GRADES["warm"])
    cmd = [
        "ffmpeg", "-y",
        "-i", input_path,
        "-vf", filter_str,
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-c:a", "copy",
        output_path,
    ]
    return run_ffmpeg(cmd)


def apply_ken_burns(
    input_path: str,
    output_path: str,
    duration: float,
    zoom_direction: str = "in",
    width: int = 1080,
    height: int = 1920,
) -> bool:
    """Apply Ken Burns zoom effect to a static image or video."""
    if zoom_direction == "in":
        zoom_filter = (
            f"scale={width * 2}:{height * 2},"
            f"zoompan=z='min(zoom+0.0015,1.5)':d={int(duration * 30)}:"
            f"x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':"
            f"s={width}x{height}:fps=30"
        )
    else:
        zoom_filter = (
            f"scale={width * 2}:{height * 2},"
            f"zoompan=z='if(lte(zoom,1.0),1.5,max(1.0,zoom-0.0015))':d={int(duration * 30)}:"
            f"x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':"
            f"s={width}x{height}:fps=30"
        )

    cmd = [
        "ffmpeg", "-y",
        "-i", input_path,
        "-vf", zoom_filter,
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-t", str(duration),
        "-c:a", "copy",
        output_path,
    ]
    return run_ffmpeg(cmd)


def add_transition(
    clip1: str,
    clip2: str,
    output_path: str,
    transition_type: str = "fade",
    duration: float = 0.5,
) -> bool:
    """Add transition between two clips."""
    if transition_type == "fade":
        # Get duration of clip1
        probe_cmd = [
            "ffprobe", "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            clip1,
        ]
        try:
            result = subprocess.run(probe_cmd, capture_output=True, text=True, timeout=10)
            clip1_duration = float(result.stdout.strip())
        except Exception:
            clip1_duration = 4.0

        offset = max(0, clip1_duration - duration)

        cmd = [
            "ffmpeg", "-y",
            "-i", clip1,
            "-i", clip2,
            "-filter_complex",
            f"[0:v]fade=t=out:st={offset}:d={duration}[v0];"
            f"[1:v]fade=t=in:st=0:d={duration}[v1];"
            f"[v0][v1]concat=n=2:v=1:a=0[outv];"
            f"[0:a][1:a]concat=n=2:v=0:a=1[outa]",
            "-map", "[outv]",
            "-map", "[outa]",
            "-c:v", "libx264",
            "-pix_fmt", "yuv420p",
            "-c:a", "aac",
            output_path,
        ]
    else:
        # Simple cut
        cmd = [
            "ffmpeg", "-y",
            "-i", clip1,
            "-i", clip2,
            "-filter_complex",
            "[0:v][0:a][1:v][1:a]concat=n=2:v=1:a=1[outv][outa]",
            "-map", "[outv]",
            "-map", "[outa]",
            "-c:v", "libx264",
            "-pix_fmt", "yuv420p",
            "-c:a", "aac",
            output_path,
        ]

    return run_ffmpeg(cmd)


def upscale_video(
    input_path: str,
    output_path: str,
    target_width: int = 1080,
    target_height: int = 1920,
) -> bool:
    """Upscale video to target resolution."""
    cmd = [
        "ffmpeg", "-y",
        "-i", input_path,
        "-vf", f"scale={target_width}:{target_height}:flags=lanczos",
        "-c:v", "libx264",
        "-crf", "18",
        "-pix_fmt", "yuv420p",
        "-c:a", "copy",
        output_path,
    ]
    return run_ffmpeg(cmd)


def optimize_for_social(
    input_path: str,
    output_path: str,
    platform: str = "instagram",
) -> bool:
    """
    Optimize video for specific social media platform.
    Applies platform-specific encoding settings.
    """
    platform_settings = {
        "instagram": {"crf": "23", "maxrate": "3500k", "bufsize": "7000k"},
        "tiktok": {"crf": "23", "maxrate": "4000k", "bufsize": "8000k"},
        "youtube": {"crf": "20", "maxrate": "8000k", "bufsize": "16000k"},
        "facebook": {"crf": "23", "maxrate": "4000k", "bufsize": "8000k"},
    }

    settings = platform_settings.get(platform.lower(), platform_settings["instagram"])

    cmd = [
        "ffmpeg", "-y",
        "-i", input_path,
        "-c:v", "libx264",
        "-crf", settings["crf"],
        "-maxrate", settings["maxrate"],
        "-bufsize", settings["bufsize"],
        "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
        "-c:a", "aac",
        "-b:a", "128k",
        "-ar", "44100",
        output_path,
    ]
    return run_ffmpeg(cmd)


def generate_thumbnail(
    video_path: str,
    output_path: str,
    timestamp: float = 1.0,
) -> bool:
    """Extract a thumbnail from the video."""
    cmd = [
        "ffmpeg", "-y",
        "-i", video_path,
        "-ss", str(timestamp),
        "-vframes", "1",
        "-q:v", "2",
        output_path,
    ]
    return run_ffmpeg(cmd)
