"""
FFmpeg Video Assembler — Windows Compatible
Assembles stock clips + voiceover + music + text overlays into final MP4.
Output: 1080x1920 (9:16) vertical reel.
"""

import os
import shutil
import subprocess
import textwrap
from typing import List, Optional
from PIL import Image, ImageDraw, ImageFont


def run_ffmpeg(cmd: List[str], timeout: int = 300) -> bool:
    """Run an FFmpeg command and return success status."""
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout,
        )
        if result.returncode != 0:
            print(f"FFmpeg error: {result.stderr[-800:]}")
            return False
        return True
    except subprocess.TimeoutExpired:
        print("FFmpeg timed out")
        return False
    except Exception as e:
        print(f"FFmpeg exception: {e}")
        return False


def create_color_background(
    color: str,
    duration: int,
    output_path: str,
    width: int = 1080,
    height: int = 1920,
) -> bool:
    """Create a solid color background video."""
    hex_color = color.lstrip("#")
    r, g, b = int(hex_color[0:2], 16), int(hex_color[2:4], 16), int(hex_color[4:6], 16)
    cmd = [
        "ffmpeg", "-y",
        "-f", "lavfi",
        "-i", f"color=c={r}/{g}/{b}:size={width}x{height}:rate=30",
        "-t", str(duration),
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "23",
        "-pix_fmt", "yuv420p",
        output_path,
    ]
    return run_ffmpeg(cmd)


def create_gradient_background(
    color1: str,
    color2: str,
    duration: int,
    output_path: str,
    width: int = 1080,
    height: int = 1920,
) -> bool:
    """Create a gradient background PNG then convert to video."""
    img = Image.new("RGB", (width, height))
    draw = ImageDraw.Draw(img)

    def hex_to_rgb(h):
        h = h.lstrip("#")
        return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

    try:
        c1 = hex_to_rgb(color1)
        c2 = hex_to_rgb(color2)
    except Exception:
        c1, c2 = (20, 20, 40), (60, 20, 80)

    for y in range(height):
        ratio = y / height
        r = int(c1[0] + (c2[0] - c1[0]) * ratio)
        g = int(c1[1] + (c2[1] - c1[1]) * ratio)
        b = int(c1[2] + (c2[2] - c1[2]) * ratio)
        draw.line([(0, y), (width, y)], fill=(r, g, b))

    bg_path = output_path.replace(".mp4", "_bg.png")
    img.save(bg_path)

    cmd = [
        "ffmpeg", "-y",
        "-loop", "1",
        "-i", bg_path,
        "-t", str(duration),
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "23",
        "-pix_fmt", "yuv420p",
        "-r", "30",
        output_path,
    ]
    success = run_ffmpeg(cmd)
    try:
        os.remove(bg_path)
    except Exception:
        pass
    return success


def prepare_scene_clip(
    input_path: Optional[str],
    duration: int,
    output_path: str,
    scene_color: str = "#1a1a2e",
    width: int = 1080,
    height: int = 1920,
) -> bool:
    """Scale/crop stock video to 9:16, or create gradient background."""
    if input_path and os.path.exists(input_path):
        cmd = [
            "ffmpeg", "-y",
            "-i", input_path,
            "-t", str(duration),
            "-vf", (
                f"scale={width}:{height}:force_original_aspect_ratio=increase,"
                f"crop={width}:{height},setsar=1"
            ),
            "-c:v", "libx264",
            "-preset", "fast",
            "-crf", "23",
            "-pix_fmt", "yuv420p",
            "-an",
            "-r", "30",
            output_path,
        ]
        if run_ffmpeg(cmd):
            return True

    return create_gradient_background(scene_color, "#0f0f23", duration, output_path, width, height)


def add_text_overlay_pil(
    input_path: str,
    text: str,
    position: str,
    output_path: str,
    width: int = 1080,
    height: int = 1920,
) -> bool:
    """
    Add text overlay using PIL to create a PNG, then overlay with FFmpeg.
    This avoids all fontconfig/drawtext issues on Windows.
    """
    if not text or not text.strip():
        shutil.copy(input_path, output_path)
        return True

    overlay_path = output_path.replace(".mp4", "_txt.png")

    try:
        # Create transparent overlay image
        img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)

        font_size = 64
        font = None
        font_paths = [
            "C:/Windows/Fonts/arialbd.ttf",
            "C:/Windows/Fonts/arial.ttf",
            "C:/Windows/Fonts/calibrib.ttf",
            "C:/Windows/Fonts/verdanab.ttf",
            "C:/Windows/Fonts/segoeui.ttf",
        ]
        for fp in font_paths:
            if os.path.exists(fp):
                try:
                    font = ImageFont.truetype(fp, font_size)
                    break
                except Exception:
                    continue
        if font is None:
            font = ImageFont.load_default()

        # Wrap text
        wrapped_lines = textwrap.wrap(text, width=24)
        if not wrapped_lines:
            shutil.copy(input_path, output_path)
            return True

        # Measure total text block
        line_h = font_size + 10
        total_h = len(wrapped_lines) * line_h
        max_w = max(draw.textlength(line, font=font) for line in wrapped_lines)
        pad = 24

        # Position
        if position == "top":
            y_start = 80
        elif position == "center":
            y_start = (height - total_h) // 2
        else:  # bottom
            y_start = height - total_h - 120

        x_start = (width - max_w) // 2

        # Draw background box
        draw.rectangle(
            [x_start - pad, y_start - pad, x_start + max_w + pad, y_start + total_h + pad],
            fill=(0, 0, 0, 160)
        )

        # Draw each line
        for i, line in enumerate(wrapped_lines):
            lw = draw.textlength(line, font=font)
            lx = (width - lw) // 2
            draw.text((lx, y_start + i * line_h), line, font=font, fill=(255, 255, 255, 255))

        img.save(overlay_path, "PNG")

        # Overlay PNG on video
        cmd = [
            "ffmpeg", "-y",
            "-i", input_path,
            "-i", overlay_path,
            "-filter_complex", "[0:v][1:v]overlay=0:0",
            "-c:v", "libx264",
            "-preset", "fast",
            "-crf", "23",
            "-pix_fmt", "yuv420p",
            "-c:a", "copy",
            output_path,
        ]
        success = run_ffmpeg(cmd)
        if not success:
            shutil.copy(input_path, output_path)
        return True

    except Exception as e:
        print(f"Text overlay error: {e}")
        shutil.copy(input_path, output_path)
        return True
    finally:
        try:
            os.remove(overlay_path)
        except Exception:
            pass


def concatenate_clips(
    clip_paths: List[str],
    output_path: str,
    concat_list_path: str,
) -> bool:
    """Concatenate multiple video clips into one."""
    # Filter only existing clips
    valid = [p for p in clip_paths if p and os.path.exists(p) and os.path.getsize(p) > 0]
    if not valid:
        return False

    with open(concat_list_path, "w", encoding="utf-8") as f:
        for clip in valid:
            f.write(f"file '{clip.replace(chr(92), '/')}'\n")

    cmd = [
        "ffmpeg", "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", concat_list_path,
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "23",
        "-pix_fmt", "yuv420p",
        output_path,
    ]
    return run_ffmpeg(cmd)


def mix_audio(
    video_path: str,
    voiceover_path: Optional[str],
    music_path: Optional[str],
    output_path: str,
    voice_volume: float = 1.0,
    music_volume: float = 0.15,
) -> bool:
    """Mix voiceover and background music with the video."""
    if not voiceover_path and not music_path:
        shutil.copy(video_path, output_path)
        return True

    if voiceover_path and os.path.exists(voiceover_path) and not music_path:
        cmd = [
            "ffmpeg", "-y",
            "-i", video_path,
            "-i", voiceover_path,
            "-c:v", "copy",
            "-c:a", "aac",
            "-map", "0:v:0",
            "-map", "1:a:0",
            "-shortest",
            output_path,
        ]
        return run_ffmpeg(cmd)

    if music_path and os.path.exists(music_path) and not voiceover_path:
        cmd = [
            "ffmpeg", "-y",
            "-i", video_path,
            "-i", music_path,
            "-filter_complex", f"[1:a]volume={music_volume}[m];[m]apad[aout]",
            "-map", "0:v:0",
            "-map", "[aout]",
            "-c:v", "copy",
            "-c:a", "aac",
            "-shortest",
            output_path,
        ]
        return run_ffmpeg(cmd)

    # Both voice + music
    if (voiceover_path and os.path.exists(voiceover_path) and
            music_path and os.path.exists(music_path)):
        filter_complex = (
            f"[1:a]volume={voice_volume}[v];"
            f"[2:a]volume={music_volume}[m];"
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
            "-shortest",
            output_path,
        ]
        return run_ffmpeg(cmd)

    shutil.copy(video_path, output_path)
    return True


def add_fade_effects(input_path: str, output_path: str, duration: float) -> bool:
    """Add fade in/out."""
    fade_d = min(0.5, duration * 0.08)
    fade_out = max(0, duration - fade_d)
    cmd = [
        "ffmpeg", "-y",
        "-i", input_path,
        "-vf", f"fade=t=in:st=0:d={fade_d},fade=t=out:st={fade_out}:d={fade_d}",
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "23",
        "-pix_fmt", "yuv420p",
        "-c:a", "copy",
        output_path,
    ]
    if not run_ffmpeg(cmd):
        shutil.copy(input_path, output_path)
    return True


async def assemble_video(
    scenes: List[dict],
    scene_clips: List[Optional[str]],
    voiceover_path: Optional[str],
    music_path: Optional[str],
    output_path: str,
    work_dir: str,
    color_palette: List[str] = None,
) -> bool:
    """
    Full video assembly:
    1. Prepare each scene (scale/crop or gradient bg)
    2. Add text overlays via PIL (Windows-safe)
    3. Concatenate all scenes
    4. Mix audio
    5. Fade in/out
    """
    os.makedirs(work_dir, exist_ok=True)
    colors = color_palette or ["#1a1a2e", "#16213e", "#0f3460", "#533483", "#e94560"]
    prepared = []

    for i, (scene, clip_path) in enumerate(zip(scenes, scene_clips)):
        color = colors[i % len(colors)]
        duration = max(1, int(scene.get("duration_seconds", 4)))

        # Step 1: prepare base clip
        base = os.path.join(work_dir, f"base_{i}.mp4")
        if not prepare_scene_clip(clip_path, duration, base, color):
            create_gradient_background(color, "#0f0f23", duration, base)

        if not os.path.exists(base) or os.path.getsize(base) == 0:
            print(f"Scene {i+1} base clip failed, skipping")
            continue

        # Step 2: add text overlay (PIL-based, Windows-safe)
        text = str(scene.get("text_overlay", "") or "")
        position = str(scene.get("text_position", "bottom") or "bottom")
        text_out = os.path.join(work_dir, f"text_{i}.mp4")

        add_text_overlay_pil(base, text, position, text_out)

        final_clip = text_out if (os.path.exists(text_out) and os.path.getsize(text_out) > 0) else base
        prepared.append(final_clip)

    if not prepared:
        print("No clips prepared — aborting")
        return False

    # Step 3: concatenate
    concat_out = os.path.join(work_dir, "concat.mp4")
    concat_list = os.path.join(work_dir, "concat_list.txt")
    if not concatenate_clips(prepared, concat_out, concat_list):
        print("Concatenation failed")
        return False

    # Step 4: mix audio
    audio_out = os.path.join(work_dir, "audio.mp4")
    mix_audio(concat_out, voiceover_path, music_path, audio_out)
    if not os.path.exists(audio_out) or os.path.getsize(audio_out) == 0:
        shutil.copy(concat_out, audio_out)

    # Step 5: fade
    total_dur = sum(max(1, int(s.get("duration_seconds", 4))) for s in scenes)
    add_fade_effects(audio_out, output_path, total_dur)
    if not os.path.exists(output_path) or os.path.getsize(output_path) == 0:
        shutil.copy(audio_out, output_path)

    return os.path.exists(output_path) and os.path.getsize(output_path) > 0
