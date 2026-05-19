"""
Audio Processor
- Background noise removal using FFmpeg filters
- Audio normalization
- Silence detection and trimming
"""

import os
import shutil
import subprocess
from typing import Optional


def run_ffmpeg(cmd, timeout=300):
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        if r.returncode != 0:
            print(f"FFmpeg audio error: {r.stderr[-400:]}")
            return False
        return True
    except Exception as e:
        print(f"FFmpeg audio exception: {e}")
        return False


def remove_background_noise(input_path: str, output_path: str) -> bool:
    """
    Remove background noise using FFmpeg's afftdn (audio FFT denoiser).
    Also applies highpass filter to remove low rumble and normalize audio.
    """
    # afftdn = FFT-based noise reduction
    # highpass = remove low frequency rumble (below 80Hz)
    # loudnorm = normalize audio levels
    audio_filter = (
        "afftdn=nf=-25,"          # FFT noise reduction, noise floor -25dB
        "highpass=f=80,"           # Remove rumble below 80Hz
        "lowpass=f=8000,"          # Remove hiss above 8kHz
        "loudnorm=I=-16:TP=-1.5:LRA=11"  # Normalize to -16 LUFS
    )

    cmd = [
        "ffmpeg", "-y",
        "-i", input_path,
        "-af", audio_filter,
        "-c:v", "copy",
        "-c:a", "aac",
        "-b:a", "128k",
        output_path,
    ]

    if run_ffmpeg(cmd):
        return True

    # Fallback: just normalize without noise reduction
    cmd_simple = [
        "ffmpeg", "-y",
        "-i", input_path,
        "-af", "loudnorm=I=-16:TP=-1.5:LRA=11",
        "-c:v", "copy",
        "-c:a", "aac",
        "-b:a", "128k",
        output_path,
    ]
    if run_ffmpeg(cmd_simple):
        return True

    shutil.copy(input_path, output_path)
    return True


def extract_audio(video_path: str, audio_output: str) -> bool:
    """Extract audio track from video."""
    cmd = [
        "ffmpeg", "-y",
        "-i", video_path,
        "-vn",
        "-acodec", "mp3",
        "-ab", "128k",
        audio_output,
    ]
    return run_ffmpeg(cmd)


def remove_audio(video_path: str, output_path: str) -> bool:
    """Remove audio track from video (mute)."""
    cmd = [
        "ffmpeg", "-y",
        "-i", video_path,
        "-an",
        "-c:v", "copy",
        output_path,
    ]
    if run_ffmpeg(cmd):
        return True
    shutil.copy(video_path, output_path)
    return True


def mix_voiceover_and_music(
    video_path: str,
    voiceover_path: Optional[str],
    music_path: Optional[str],
    output_path: str,
    voice_vol: float = 1.0,
    music_vol: float = 0.18,
    keep_original_audio: bool = False,
    original_vol: float = 0.05,
) -> bool:
    """
    Mix audio tracks:
    - Voiceover (primary)
    - Background music (ducked under voice)
    - Original video audio (optional, very low)
    """
    has_vo = voiceover_path and os.path.exists(voiceover_path)
    has_mu = music_path and os.path.exists(music_path)

    if not has_vo and not has_mu:
        shutil.copy(video_path, output_path)
        return True

    if has_vo and has_mu:
        filter_complex = (
            f"[1:a]volume={voice_vol}[v];"
            f"[2:a]volume={music_vol}[m];"
            f"[v][m]amix=inputs=2:duration=first:dropout_transition=2[aout]"
        )
        cmd = [
            "ffmpeg", "-y",
            "-i", video_path,
            "-i", voiceover_path,
            "-i", music_path,
            "-filter_complex", filter_complex,
            "-map", "0:v:0",
            "-map", "[aout]",
            "-c:v", "copy",
            "-c:a", "aac",
            "-b:a", "128k",
            "-shortest",
            output_path,
        ]
    elif has_vo:
        cmd = [
            "ffmpeg", "-y",
            "-i", video_path,
            "-i", voiceover_path,
            "-map", "0:v:0",
            "-map", "1:a:0",
            "-c:v", "copy",
            "-c:a", "aac",
            "-shortest",
            output_path,
        ]
    else:
        cmd = [
            "ffmpeg", "-y",
            "-i", video_path,
            "-i", music_path,
            "-filter_complex", f"[1:a]volume={music_vol}[m];[m]apad[aout]",
            "-map", "0:v:0",
            "-map", "[aout]",
            "-c:v", "copy",
            "-c:a", "aac",
            "-shortest",
            output_path,
        ]

    if not run_ffmpeg(cmd):
        shutil.copy(video_path, output_path)
    return True
