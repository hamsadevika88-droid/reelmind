"""
Cinematic Video Editor — Windows Compatible
Takes raw user videos, applies professional cinematic effects:
- Zoom in / zoom out / pan left / pan right / tilt
- Color grading (cinematic, warm, cool, vibrant, moody, golden, dramatic)
- Crossfade transitions between clips
- PIL text overlays (title, CTA)
- Intro title card
- Background music mixing
- Platform optimization (9:16 vertical)
"""

import os
import shutil
import subprocess
from typing import List, Optional


def run_ffmpeg(cmd: List[str], timeout: int = 300) -> bool:
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        if result.returncode != 0:
            print(f"FFmpeg error: {result.stderr[-600:]}")
            return False
        return True
    except Exception as e:
        print(f"FFmpeg exception: {e}")
        return False


def get_video_duration(path: str) -> float:
    try:
        result = subprocess.run([
            "ffprobe", "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1", path
        ], capture_output=True, text=True, timeout=10)
        return float(result.stdout.strip())
    except Exception:
        return 5.0


def get_video_info(path: str) -> dict:
    try:
        result = subprocess.run([
            "ffprobe", "-v", "error", "-select_streams", "v:0",
            "-show_entries", "stream=width,height",
            "-of", "csv=p=0", path
        ], capture_output=True, text=True, timeout=10)
        parts = result.stdout.strip().split(",")
        return {"width": int(parts[0]), "height": int(parts[1]),
                "duration": get_video_duration(path)}
    except Exception:
        return {"width": 1080, "height": 1920, "duration": 5.0}


COLOR_GRADES = {
    "cinematic": "curves=r='0/0.05 0.5/0.5 1/0.95':g='0/0.05 0.5/0.5 1/0.95':b='0/0.1 0.5/0.5 1/0.9',vignette=PI/4",
    "warm":      "curves=r='0/0 0.5/0.6 1/1':g='0/0 0.5/0.5 1/0.9':b='0/0 0.5/0.4 1/0.8'",
    "cool":      "curves=r='0/0 0.5/0.4 1/0.8':g='0/0 0.5/0.5 1/0.9':b='0/0 0.5/0.6 1/1'",
    "vibrant":   "eq=saturation=1.5:contrast=1.1:brightness=0.02",
    "moody":     "curves=r='0/0.05 0.5/0.45 1/0.9':g='0/0.05 0.5/0.45 1/0.85':b='0/0.1 0.5/0.5 1/0.95',vignette=PI/3",
    "golden":    "curves=r='0/0 0.5/0.65 1/1':g='0/0 0.5/0.55 1/0.95':b='0/0 0.5/0.35 1/0.7'",
    "dramatic":  "eq=saturation=1.3:contrast=1.3:brightness=-0.05,vignette=PI/3",
    "fresh":     "eq=saturation=1.2:contrast=1.05:brightness=0.05",
}

ZOOM_FILTERS = {
    "zoom_in":   "scale={W2}:{H2},crop={W}:{H}:x='({W2}-{W})/2*(t/{D})':y='({H2}-{H})/2*(t/{D})',setsar=1",
    "zoom_out":  "scale={W2}:{H2},crop={W}:{H}:x='({W2}-{W})/2*(1-t/{D})':y='({H2}-{H})/2*(1-t/{D})',setsar=1",
    "pan_left":  "scale={W2}:{H},crop={W}:{H}:x='({W2}-{W})*(t/{D})':y=0,setsar=1",
    "pan_right": "scale={W2}:{H},crop={W}:{H}:x='({W2}-{W})*(1-t/{D})':y=0,setsar=1",
    "tilt_up":   "scale={W}:{H2},crop={W}:{H}:x=0:y='({H2}-{H})*(t/{D})',setsar=1",
    "tilt_down": "scale={W}:{H2},crop={W}:{H}:x=0:y='({H2}-{H})*(1-t/{D})',setsar=1",
    "none":      "scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},setsar=1",
}


def apply_cinematic_effect(
    input_path: str, output_path: str,
    effect: str, color_grade: str,
    duration: float, width: int = 1080, height: int = 1920,
) -> bool:
    grade = COLOR_GRADES.get(color_grade, COLOR_GRADES["cinematic"])
    W, H = width, height
    W2, H2 = width * 2, height * 2
    D = max(0.1, duration)

    zoom_template = ZOOM_FILTERS.get(effect, ZOOM_FILTERS["none"])
    zoom_vf = zoom_template.format(W=W, H=H, W2=W2, H2=H2, D=D)
    vf = f"{zoom_vf},{grade}"

    cmd = [
        "ffmpeg", "-y", "-i", input_path,
        "-t", str(duration),
        "-vf", vf,
        "-c:v", "libx264", "-preset", "fast", "-crf", "20",
        "-pix_fmt", "yuv420p", "-r", "30", "-an",
        output_path,
    ]
    if run_ffmpeg(cmd):
        return True

    # Fallback: simple scale + grade
    vf_simple = f"scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},setsar=1,{grade}"
    cmd[cmd.index(vf)] = vf_simple
    if run_ffmpeg(cmd):
        return True

    # Last resort: just scale
    cmd_bare = [
        "ffmpeg", "-y", "-i", input_path, "-t", str(duration),
        "-vf", f"scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},setsar=1",
        "-c:v", "libx264", "-preset", "fast", "-crf", "22",
        "-pix_fmt", "yuv420p", "-r", "30", "-an", output_path,
    ]
    run_ffmpeg(cmd_bare)
    return os.path.exists(output_path) and os.path.getsize(output_path) > 0


def add_text_overlay_pil(
    input_path: str, text: str, position: str, output_path: str,
    font_size: int = 72, width: int = 1080, height: int = 1920,
) -> bool:
    if not text or not text.strip():
        shutil.copy(input_path, output_path)
        return True

    overlay_path = output_path.replace(".mp4", "_ov.png")
    try:
        from PIL import Image, ImageDraw, ImageFont
        import textwrap

        img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)

        font = None
        for fp in ["C:/Windows/Fonts/arialbd.ttf", "C:/Windows/Fonts/arial.ttf",
                   "C:/Windows/Fonts/calibrib.ttf", "C:/Windows/Fonts/verdanab.ttf"]:
            if os.path.exists(fp):
                try:
                    font = ImageFont.truetype(fp, font_size)
                    break
                except Exception:
                    continue
        if font is None:
            font = ImageFont.load_default()

        lines = textwrap.wrap(text, width=20)
        if not lines:
            shutil.copy(input_path, output_path)
            return True

        lh = font_size + 12
        total_h = len(lines) * lh
        max_w = max(int(draw.textlength(l, font=font)) for l in lines)
        pad = 28

        y0 = {"top": 80, "center": (height - total_h) // 2}.get(position, height - total_h - 130)
        x0 = (width - max_w) // 2

        draw.rectangle([x0 - pad, y0 - pad, x0 + max_w + pad, y0 + total_h + pad], fill=(0, 0, 0, 160))
        for i, line in enumerate(lines):
            lw = int(draw.textlength(line, font=font))
            draw.text(((width - lw) // 2, y0 + i * lh), line, font=font, fill=(255, 255, 255, 255))

        img.save(overlay_path, "PNG")
        cmd = [
            "ffmpeg", "-y", "-i", input_path, "-i", overlay_path,
            "-filter_complex", "[0:v][1:v]overlay=0:0",
            "-c:v", "libx264", "-preset", "fast", "-crf", "20",
            "-pix_fmt", "yuv420p", "-c:a", "copy", output_path,
        ]
        if not run_ffmpeg(cmd):
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


def add_fade_transition(clip1: str, clip2: str, output_path: str, fade_d: float = 0.4) -> bool:
    try:
        dur1 = get_video_duration(clip1)
        offset = max(0.1, dur1 - fade_d)
        cmd = [
            "ffmpeg", "-y", "-i", clip1, "-i", clip2,
            "-filter_complex",
            f"[0:v]fade=t=out:st={offset}:d={fade_d}[v0];"
            f"[1:v]fade=t=in:st=0:d={fade_d}[v1];"
            f"[v0][v1]concat=n=2:v=1:a=0[outv]",
            "-map", "[outv]",
            "-c:v", "libx264", "-preset", "fast", "-crf", "20", "-pix_fmt", "yuv420p",
            output_path,
        ]
        if run_ffmpeg(cmd):
            return True
    except Exception as e:
        print(f"Fade transition error: {e}")

    # Fallback: simple concat
    lst = output_path + "_list.txt"
    with open(lst, "w") as f:
        f.write(f"file '{clip1.replace(chr(92), '/')}'\n")
        f.write(f"file '{clip2.replace(chr(92), '/')}'\n")
    cmd2 = ["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", lst,
            "-c:v", "libx264", "-preset", "fast", "-crf", "20", "-pix_fmt", "yuv420p", output_path]
    success = run_ffmpeg(cmd2)
    try:
        os.remove(lst)
    except Exception:
        pass
    return success


def add_intro_title(
    input_path: str, title: str, subtitle: str, output_path: str,
    duration: float = 2.5, width: int = 1080, height: int = 1920,
) -> bool:
    from PIL import Image, ImageDraw, ImageFont
    import textwrap

    title_img = output_path.replace(".mp4", "_ti.png")
    title_vid = output_path.replace(".mp4", "_tv.mp4")

    try:
        img = Image.new("RGB", (width, height))
        draw = ImageDraw.Draw(img)
        for y in range(height):
            r = int(10 + 30 * y / height)
            g = int(10 + 10 * y / height)
            b = int(20 + 40 * y / height)
            draw.line([(0, y), (width, y)], fill=(r, g, b))

        tf, sf = None, None
        for fp in ["C:/Windows/Fonts/arialbd.ttf", "C:/Windows/Fonts/calibrib.ttf",
                   "C:/Windows/Fonts/verdanab.ttf", "C:/Windows/Fonts/arial.ttf"]:
            if os.path.exists(fp):
                try:
                    if tf is None:
                        tf = ImageFont.truetype(fp, 96)
                    if sf is None:
                        sf = ImageFont.truetype(fp, 52)
                    if tf and sf:
                        break
                except Exception:
                    continue
        if tf is None:
            tf = ImageFont.load_default()
        if sf is None:
            sf = ImageFont.load_default()

        tlines = textwrap.wrap(title, width=16)
        th = 108
        total_th = len(tlines) * th
        y_t = height // 2 - total_th // 2 - 40
        for i, line in enumerate(tlines):
            tw = int(draw.textlength(line, font=tf))
            draw.text(((width - tw) // 2, y_t + i * th), line, font=tf, fill=(255, 255, 255))

        if subtitle:
            slines = textwrap.wrap(subtitle, width=28)
            y_s = y_t + total_th + 30
            for i, line in enumerate(slines):
                sw = int(draw.textlength(line, font=sf))
                draw.text(((width - sw) // 2, y_s + i * 64), line, font=sf, fill=(200, 200, 220))

        img.save(title_img, "PNG")

        cmd = [
            "ffmpeg", "-y", "-loop", "1", "-i", title_img, "-t", str(duration),
            "-vf", f"fade=t=in:st=0:d=0.4,fade=t=out:st={duration-0.4}:d=0.4",
            "-c:v", "libx264", "-preset", "fast", "-crf", "20",
            "-pix_fmt", "yuv420p", "-r", "30", title_vid,
        ]
        if not run_ffmpeg(cmd):
            return False

        lst = output_path + "_intro_list.txt"
        with open(lst, "w") as f:
            f.write(f"file '{title_vid.replace(chr(92), '/')}'\n")
            f.write(f"file '{input_path.replace(chr(92), '/')}'\n")
        cmd2 = ["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", lst,
                "-c:v", "libx264", "-preset", "fast", "-crf", "20",
                "-pix_fmt", "yuv420p", output_path]
        success = run_ffmpeg(cmd2)
        try:
            os.remove(lst)
        except Exception:
            pass
        return success
    except Exception as e:
        print(f"Intro title error: {e}")
        shutil.copy(input_path, output_path)
        return True
    finally:
        for p in [title_img, title_vid]:
            try:
                os.remove(p)
            except Exception:
                pass


def mix_music(
    video_path: str, music_path: Optional[str], voiceover_path: Optional[str],
    output_path: str, music_volume: float = 0.2,
) -> bool:
    if not music_path and not voiceover_path:
        shutil.copy(video_path, output_path)
        return True

    has_vo = voiceover_path and os.path.exists(voiceover_path)
    has_mu = music_path and os.path.exists(music_path)

    if has_vo and has_mu:
        cmd = [
            "ffmpeg", "-y", "-i", video_path, "-i", voiceover_path, "-i", music_path,
            "-filter_complex",
            f"[1:a]volume=1.0[v];[2:a]volume={music_volume}[m];[v][m]amix=inputs=2:duration=first[aout]",
            "-map", "0:v:0", "-map", "[aout]",
            "-c:v", "copy", "-c:a", "aac", "-shortest", output_path,
        ]
    elif has_vo:
        cmd = ["ffmpeg", "-y", "-i", video_path, "-i", voiceover_path,
               "-map", "0:v:0", "-map", "1:a:0",
               "-c:v", "copy", "-c:a", "aac", "-shortest", output_path]
    else:
        cmd = [
            "ffmpeg", "-y", "-i", video_path, "-i", music_path,
            "-filter_complex", f"[1:a]volume={music_volume}[m];[m]apad[aout]",
            "-map", "0:v:0", "-map", "[aout]",
            "-c:v", "copy", "-c:a", "aac", "-shortest", output_path,
        ]

    if not run_ffmpeg(cmd):
        shutil.copy(video_path, output_path)
    return True


async def create_cinematic_reel(
    video_paths: List[str],
    work_dir: str,
    output_path: str,
    title: str = "",
    subtitle: str = "",
    cta_text: str = "",
    color_grade: str = "cinematic",
    effects: List[str] = None,
    music_path: Optional[str] = None,
    voiceover_path: Optional[str] = None,
    clip_duration: float = 5.0,
    width: int = 1080,
    height: int = 1920,
    add_intro: bool = True,
) -> bool:
    os.makedirs(work_dir, exist_ok=True)

    default_effects = ["zoom_in", "zoom_out", "pan_left", "pan_right", "tilt_up", "tilt_down", "none"]
    if not effects:
        effects = default_effects

    processed = []

    for i, vpath in enumerate(video_paths):
        if not os.path.exists(vpath):
            print(f"Clip {i+1} not found: {vpath}")
            continue

        info = get_video_info(vpath)
        dur = min(clip_duration, info["duration"])
        effect = effects[i % len(effects)]
        print(f"Clip {i+1}/{len(video_paths)}: effect={effect} dur={dur:.1f}s")

        effect_out = os.path.join(work_dir, f"effect_{i}.mp4")
        apply_cinematic_effect(vpath, effect_out, effect, color_grade, dur, width, height)

        if not os.path.exists(effect_out) or os.path.getsize(effect_out) == 0:
            print(f"Clip {i+1} failed, skipping")
            continue

        # Text overlay
        text = ""
        pos = "bottom"
        if i == len(video_paths) - 1 and cta_text:
            text = cta_text
            pos = "center"

        text_out = os.path.join(work_dir, f"text_{i}.mp4")
        add_text_overlay_pil(effect_out, text, pos, text_out, width=width, height=height)
        final = text_out if (os.path.exists(text_out) and os.path.getsize(text_out) > 0) else effect_out
        processed.append(final)

    if not processed:
        return False

    # Crossfade transitions
    if len(processed) == 1:
        combined = processed[0]
    else:
        current = processed[0]
        for i in range(1, len(processed)):
            trans_out = os.path.join(work_dir, f"trans_{i}.mp4")
            add_fade_transition(current, processed[i], trans_out)
            current = trans_out if (os.path.exists(trans_out) and os.path.getsize(trans_out) > 0) else processed[i]
        combined = current

    # Intro title
    if add_intro and title:
        intro_out = os.path.join(work_dir, "with_intro.mp4")
        add_intro_title(combined, title, subtitle, intro_out, width=width, height=height)
        if os.path.exists(intro_out) and os.path.getsize(intro_out) > 0:
            combined = intro_out

    # Mix audio
    audio_out = os.path.join(work_dir, "with_audio.mp4")
    mix_music(combined, music_path, voiceover_path, audio_out)
    if os.path.exists(audio_out) and os.path.getsize(audio_out) > 0:
        combined = audio_out

    # Final fade + optimize
    total_dur = get_video_duration(combined)
    fd = min(0.5, total_dur * 0.05)
    fo = max(0, total_dur - fd)

    cmd = [
        "ffmpeg", "-y", "-i", combined,
        "-vf", f"fade=t=in:st=0:d={fd},fade=t=out:st={fo}:d={fd}",
        "-c:v", "libx264", "-preset", "fast", "-crf", "20",
        "-pix_fmt", "yuv420p", "-movflags", "+faststart",
        "-c:a", "aac", "-b:a", "128k",
        output_path,
    ]
    if not run_ffmpeg(cmd):
        shutil.copy(combined, output_path)

    return os.path.exists(output_path) and os.path.getsize(output_path) > 0
