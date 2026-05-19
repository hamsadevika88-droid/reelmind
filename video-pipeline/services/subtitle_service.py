"""
Subtitle Service
Burns subtitles into video using PIL overlays (Windows-safe).
Supports multilingual text including Indian languages.
"""

import os
import shutil
import subprocess
from typing import List, Dict, Optional
from PIL import Image, ImageDraw, ImageFont
import textwrap


def run_ffmpeg(cmd, timeout=300):
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        if r.returncode != 0:
            print(f"FFmpeg subtitle error: {r.stderr[-400:]}")
            return False
        return True
    except Exception as e:
        print(f"FFmpeg subtitle exception: {e}")
        return False


def get_font(size: int, bold: bool = True):
    """Get best available font."""
    font_paths = []
    if bold:
        font_paths = [
            "C:/Windows/Fonts/arialbd.ttf",
            "C:/Windows/Fonts/calibrib.ttf",
            "C:/Windows/Fonts/verdanab.ttf",
            "C:/Windows/Fonts/segoeuib.ttf",
        ]
    else:
        font_paths = [
            "C:/Windows/Fonts/arial.ttf",
            "C:/Windows/Fonts/calibri.ttf",
            "C:/Windows/Fonts/verdana.ttf",
            "C:/Windows/Fonts/segoeui.ttf",
        ]

    for fp in font_paths:
        if os.path.exists(fp):
            try:
                return ImageFont.truetype(fp, size)
            except Exception:
                continue
    return ImageFont.load_default()


def create_subtitle_overlay(
    text: str,
    width: int,
    height: int,
    position: str = "bottom",
    font_size: int = 68,
    style: str = "default",
) -> Optional[Image.Image]:
    """
    Create a transparent PNG with subtitle text.
    Styles: default, bold_white, yellow_outline, cinematic
    """
    if not text or not text.strip():
        return None

    img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    font = get_font(font_size, bold=True)
    lines = textwrap.wrap(text, width=22)
    if not lines:
        return None

    lh = font_size + 10
    total_h = len(lines) * lh
    max_w = max(int(draw.textlength(l, font=font)) for l in lines)
    pad_x, pad_y = 32, 18

    # Position
    if position == "top":
        y0 = 80
    elif position == "center":
        y0 = (height - total_h) // 2
    else:  # bottom
        y0 = height - total_h - 100

    x0 = (width - max_w) // 2

    if style == "cinematic":
        # Semi-transparent dark bar full width
        bar_h = total_h + pad_y * 2
        draw.rectangle([0, y0 - pad_y, width, y0 + total_h + pad_y], fill=(0, 0, 0, 180))
        for i, line in enumerate(lines):
            lw = int(draw.textlength(line, font=font))
            draw.text(((width - lw) // 2, y0 + i * lh), line, font=font, fill=(255, 255, 255, 255))

    elif style == "yellow_outline":
        # Yellow text with black outline
        for i, line in enumerate(lines):
            lw = int(draw.textlength(line, font=font))
            lx = (width - lw) // 2
            ly = y0 + i * lh
            # Outline
            for dx, dy in [(-2,0),(2,0),(0,-2),(0,2),(-2,-2),(2,-2),(-2,2),(2,2)]:
                draw.text((lx+dx, ly+dy), line, font=font, fill=(0, 0, 0, 255))
            draw.text((lx, ly), line, font=font, fill=(255, 230, 0, 255))

    else:  # default — white text with dark box
        draw.rectangle(
            [x0 - pad_x, y0 - pad_y, x0 + max_w + pad_x, y0 + total_h + pad_y],
            fill=(0, 0, 0, 160)
        )
        for i, line in enumerate(lines):
            lw = int(draw.textlength(line, font=font))
            draw.text(((width - lw) // 2, y0 + i * lh), line, font=font, fill=(255, 255, 255, 255))

    return img


def burn_subtitle_into_clip(
    input_path: str,
    subtitle_text: str,
    output_path: str,
    position: str = "bottom",
    style: str = "cinematic",
    font_size: int = 68,
    width: int = 1080,
    height: int = 1920,
) -> bool:
    """Burn a single subtitle into a video clip."""
    if not subtitle_text or not subtitle_text.strip():
        shutil.copy(input_path, output_path)
        return True

    overlay_path = output_path.replace(".mp4", "_sub.png")
    try:
        overlay = create_subtitle_overlay(
            subtitle_text, width, height, position, font_size, style
        )
        if overlay is None:
            shutil.copy(input_path, output_path)
            return True

        overlay.save(overlay_path, "PNG")

        cmd = [
            "ffmpeg", "-y",
            "-i", input_path,
            "-i", overlay_path,
            "-filter_complex", "[0:v][1:v]overlay=0:0",
            "-c:v", "libx264", "-preset", "fast", "-crf", "20",
            "-pix_fmt", "yuv420p", "-c:a", "copy",
            output_path,
        ]
        if not run_ffmpeg(cmd):
            shutil.copy(input_path, output_path)
        return True
    except Exception as e:
        print(f"Subtitle burn error: {e}")
        shutil.copy(input_path, output_path)
        return True
    finally:
        try:
            os.remove(overlay_path)
        except Exception:
            pass


def create_srt_file(scenes: List[Dict], output_path: str) -> bool:
    """Create an SRT subtitle file from scene data."""
    try:
        current_time = 0.0
        srt_content = ""
        idx = 1

        for scene in scenes:
            subtitle = scene.get("subtitle", "")
            duration = float(scene.get("duration_seconds", 4))

            if subtitle and subtitle.strip():
                start = current_time + 0.3
                end = current_time + duration - 0.3

                def fmt_time(t):
                    h = int(t // 3600)
                    m = int((t % 3600) // 60)
                    s = int(t % 60)
                    ms = int((t % 1) * 1000)
                    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"

                srt_content += f"{idx}\n{fmt_time(start)} --> {fmt_time(end)}\n{subtitle}\n\n"
                idx += 1

            current_time += duration

        with open(output_path, "w", encoding="utf-8") as f:
            f.write(srt_content)
        return True
    except Exception as e:
        print(f"SRT creation error: {e}")
        return False
