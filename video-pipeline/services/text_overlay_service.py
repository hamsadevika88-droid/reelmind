"""
Advanced Text Overlay Service
Adds professional animated text overlays to videos using FFmpeg.
Supports multilingual text, custom fonts, animations.
"""

import os
import subprocess
from typing import List, Optional
from PIL import Image, ImageDraw, ImageFont
import textwrap


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


def create_text_image(
    text: str,
    width: int,
    height: int,
    font_size: int = 72,
    font_color: tuple = (255, 255, 255),
    bg_color: tuple = (0, 0, 0, 160),
    padding: int = 30,
) -> Image.Image:
    """Create a transparent PNG with text for overlay."""
    img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Try to load a font, fallback to default
    font = None
    font_paths = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "C:/Windows/Fonts/arial.ttf",
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
    wrapped = textwrap.fill(text, width=max(10, width // (font_size // 2)))
    lines = wrapped.split("\n")

    # Calculate text block size
    line_heights = []
    line_widths = []
    for line in lines:
        bbox = draw.textbbox((0, 0), line, font=font)
        line_widths.append(bbox[2] - bbox[0])
        line_heights.append(bbox[3] - bbox[1])

    total_height = sum(line_heights) + (len(lines) - 1) * 10
    max_width = max(line_widths) if line_widths else 0

    # Draw background box
    x_start = (width - max_width) // 2 - padding
    y_start = height - total_height - 120 - padding
    x_end = (width + max_width) // 2 + padding
    y_end = height - 120 + padding

    draw.rectangle([x_start, y_start, x_end, y_end], fill=bg_color)

    # Draw text
    y = y_start + padding
    for line, lw, lh in zip(lines, line_widths, line_heights):
        x = (width - lw) // 2
        draw.text((x, y), line, font=font, fill=font_color)
        y += lh + 10

    return img


def add_text_overlay_pil(
    input_video: str,
    text: str,
    output_path: str,
    position: str = "bottom",
    font_size: int = 64,
    duration: float = None,
    width: int = 1080,
    height: int = 1920,
) -> bool:
    """Add text overlay using PIL-generated PNG + FFmpeg overlay filter."""
    if not text or not text.strip():
        import shutil
        shutil.copy(input_video, output_path)
        return True

    overlay_path = output_path.replace(".mp4", "_overlay.png")

    try:
        img = create_text_image(
            text=text,
            width=width,
            height=height,
            font_size=font_size,
        )
        img.save(overlay_path, "PNG")

        # Position mapping
        if position == "top":
            overlay_pos = "0:50"
        elif position == "center":
            overlay_pos = "0:(H-h)/2"
        else:  # bottom
            overlay_pos = "0:H-h-80"

        cmd = [
            "ffmpeg", "-y",
            "-i", input_video,
            "-i", overlay_path,
            "-filter_complex", f"[0:v][1:v]overlay={overlay_pos}",
            "-c:v", "libx264",
            "-pix_fmt", "yuv420p",
            "-c:a", "copy",
            output_path,
        ]
        success = run_ffmpeg(cmd)
        return success
    finally:
        try:
            os.remove(overlay_path)
        except Exception:
            pass


def add_animated_title(
    input_video: str,
    title: str,
    subtitle: str,
    output_path: str,
    width: int = 1080,
    height: int = 1920,
) -> bool:
    """Add animated title + subtitle with fade-in effect."""
    if not title:
        import shutil
        shutil.copy(input_video, output_path)
        return True

    safe_title = title.replace("'", "\\'").replace(":", "\\:").replace("\\", "\\\\")[:50]
    safe_subtitle = subtitle.replace("'", "\\'").replace(":", "\\:").replace("\\", "\\\\")[:80] if subtitle else ""

    filters = []

    # Title — large, centered, fade in
    filters.append(
        f"drawtext=text='{safe_title}'"
        f":fontsize=80:fontcolor=white"
        f":x=(w-text_w)/2:y=(h-text_h)/2-60"
        f":box=1:boxcolor=black@0.5:boxborderw=20"
        f":alpha='if(lt(t,0.5),t/0.5,1)'"
        f":font=DejaVu-Sans-Bold"
    )

    # Subtitle — smaller, below title
    if safe_subtitle:
        filters.append(
            f"drawtext=text='{safe_subtitle}'"
            f":fontsize=42:fontcolor=white@0.85"
            f":x=(w-text_w)/2:y=(h-text_h)/2+60"
            f":box=1:boxcolor=black@0.3:boxborderw=15"
            f":alpha='if(lt(t,0.8),t/0.8,1)'"
            f":font=DejaVu-Sans"
        )

    vf = ",".join(filters)

    cmd = [
        "ffmpeg", "-y",
        "-i", input_video,
        "-vf", vf,
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-c:a", "copy",
        output_path,
    ]
    return run_ffmpeg(cmd)


def add_cta_overlay(
    input_video: str,
    cta_text: str,
    output_path: str,
    brand_color: str = "#e94560",
    width: int = 1080,
    height: int = 1920,
) -> bool:
    """Add a prominent CTA button overlay at the bottom."""
    if not cta_text:
        import shutil
        shutil.copy(input_video, output_path)
        return True

    safe_cta = cta_text.replace("'", "\\'").replace(":", "\\:").replace("\\", "\\\\")[:60]

    # Parse brand color to RGB
    try:
        r = int(brand_color[1:3], 16)
        g = int(brand_color[3:5], 16)
        b = int(brand_color[5:7], 16)
        box_color = f"#{r:02x}{g:02x}{b:02x}@0.9"
    except Exception:
        box_color = "red@0.9"

    vf = (
        f"drawtext=text='{safe_cta}'"
        f":fontsize=56:fontcolor=white:font=DejaVu-Sans-Bold"
        f":x=(w-text_w)/2:y=h-text_h-80"
        f":box=1:boxcolor={box_color}:boxborderw=30"
        f":alpha='if(lt(t,0.3),t/0.3,1)'"
    )

    cmd = [
        "ffmpeg", "-y",
        "-i", input_video,
        "-vf", vf,
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-c:a", "copy",
        output_path,
    ]
    return run_ffmpeg(cmd)


def add_watermark(
    input_video: str,
    watermark_text: str,
    output_path: str,
) -> bool:
    """Add a subtle watermark to the video."""
    safe_text = watermark_text.replace("'", "\\'")
    vf = (
        f"drawtext=text='{safe_text}'"
        f":fontsize=28:fontcolor=white@0.4"
        f":x=w-text_w-30:y=30"
        f":font=DejaVu-Sans"
    )
    cmd = [
        "ffmpeg", "-y",
        "-i", input_video,
        "-vf", vf,
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-c:a", "copy",
        output_path,
    ]
    return run_ffmpeg(cmd)


def add_progress_bar(
    input_video: str,
    output_path: str,
    color: str = "#7c3aed",
    height_px: int = 8,
) -> bool:
    """Add a progress bar at the top of the video."""
    import shutil
    # Use drawbox instead of drawtext — no font needed
    cmd = [
        "ffmpeg", "-y",
        "-i", input_video,
        "-vf", f"drawbox=x=0:y=0:w='iw*t/duration':h={height_px}:color=0x{color.lstrip('#')}@0.9:t=fill",
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "23",
        "-pix_fmt", "yuv420p",
        "-c:a", "copy",
        output_path,
    ]
    if not run_ffmpeg(cmd):
        shutil.copy(input_video, output_path)
    return True
