"""
Smart Cinematic Editor
Full pipeline:
1. Remove background noise from each clip
2. Apply cinematic effects (zoom/pan) per scene
3. Burn subtitles
4. Crossfade transitions
5. Add intro title card
6. Mix voiceover + background music
7. Final optimization
"""

import os
import shutil
import subprocess
import random
from typing import List, Optional, Dict
from PIL import Image, ImageDraw, ImageFont
import textwrap


def run_ffmpeg(cmd, timeout=300):
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        if r.returncode != 0:
            print(f"FFmpeg error: {r.stderr[-500:]}")
            return False
        return True
    except Exception as e:
        print(f"FFmpeg exception: {e}")
        return False


def get_duration(path: str) -> float:
    try:
        r = subprocess.run([
            "ffprobe", "-v", "error", "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1", path
        ], capture_output=True, text=True, timeout=10)
        return float(r.stdout.strip())
    except Exception:
        return 5.0


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

RANDOM_EFFECTS = ["zoom_in", "zoom_out", "pan_left", "pan_right", "tilt_up", "tilt_down"]


def remove_noise(input_path: str, output_path: str) -> bool:
    """Remove background noise using FFmpeg afftdn filter."""
    cmd = [
        "ffmpeg", "-y", "-i", input_path,
        "-af", "afftdn=nf=-25,highpass=f=80,loudnorm=I=-16:TP=-1.5:LRA=11",
        "-c:v", "copy", "-c:a", "aac", "-b:a", "128k",
        output_path,
    ]
    if run_ffmpeg(cmd):
        return True
    # Fallback: just normalize
    cmd2 = [
        "ffmpeg", "-y", "-i", input_path,
        "-af", "loudnorm=I=-16:TP=-1.5:LRA=11",
        "-c:v", "copy", "-c:a", "aac", output_path,
    ]
    if run_ffmpeg(cmd2):
        return True
    shutil.copy(input_path, output_path)
    return True


def apply_effect_and_grade(
    input_path: str, output_path: str,
    effect: str, color_grade: str,
    duration: float, width: int = 1080, height: int = 1920,
) -> bool:
    grade = COLOR_GRADES.get(color_grade, COLOR_GRADES["cinematic"])
    W, H, W2, H2, D = width, height, width*2, height*2, max(0.1, duration)

    zoom_vf = ZOOM_FILTERS.get(effect, ZOOM_FILTERS["none"]).format(W=W, H=H, W2=W2, H2=H2, D=D)
    vf = f"{zoom_vf},{grade}"

    cmd = [
        "ffmpeg", "-y", "-i", input_path, "-t", str(duration),
        "-vf", vf, "-c:v", "libx264", "-preset", "fast", "-crf", "20",
        "-pix_fmt", "yuv420p", "-r", "30", "-an", output_path,
    ]
    if run_ffmpeg(cmd):
        return True

    # Fallback: simple scale + grade
    vf2 = f"scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},setsar=1,{grade}"
    cmd[cmd.index(vf)] = vf2
    if run_ffmpeg(cmd):
        return True

    # Last resort
    cmd3 = [
        "ffmpeg", "-y", "-i", input_path, "-t", str(duration),
        "-vf", f"scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},setsar=1",
        "-c:v", "libx264", "-preset", "fast", "-crf", "22",
        "-pix_fmt", "yuv420p", "-r", "30", "-an", output_path,
    ]
    run_ffmpeg(cmd3)
    return os.path.exists(output_path) and os.path.getsize(output_path) > 0


def burn_subtitle(
    input_path: str, text: str, position: str, output_path: str,
    font_size: int = 68, width: int = 1080, height: int = 1920,
) -> bool:
    if not text or not text.strip():
        shutil.copy(input_path, output_path)
        return True

    overlay_path = output_path.replace(".mp4", "_sub.png")
    try:
        img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)

        font = None
        for fp in ["C:/Windows/Fonts/arialbd.ttf", "C:/Windows/Fonts/calibrib.ttf",
                   "C:/Windows/Fonts/verdanab.ttf", "C:/Windows/Fonts/arial.ttf"]:
            if os.path.exists(fp):
                try:
                    font = ImageFont.truetype(fp, font_size)
                    break
                except Exception:
                    continue
        if font is None:
            font = ImageFont.load_default()

        lines = textwrap.wrap(text, width=22)
        if not lines:
            shutil.copy(input_path, output_path)
            return True

        lh = font_size + 10
        total_h = len(lines) * lh
        max_w = max(int(draw.textlength(l, font=font)) for l in lines)

        y0 = {"top": 80, "center": (height - total_h) // 2}.get(position, height - total_h - 100)

        # Cinematic style: full-width dark bar
        draw.rectangle([0, y0 - 18, width, y0 + total_h + 18], fill=(0, 0, 0, 175))
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
        print(f"Subtitle error: {e}")
        shutil.copy(input_path, output_path)
        return True
    finally:
        try:
            os.remove(overlay_path)
        except Exception:
            pass


def add_fade_transition(clip1: str, clip2: str, output_path: str, fade_d: float = 0.4) -> bool:
    try:
        dur1 = get_duration(clip1)
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


def create_intro_card(
    title: str, subtitle: str, output_path: str,
    duration: float = 2.5, width: int = 1080, height: int = 1920,
) -> bool:
    from PIL import Image, ImageDraw, ImageFont
    import textwrap

    img_path = output_path.replace(".mp4", "_intro.png")
    try:
        img = Image.new("RGB", (width, height))
        draw = ImageDraw.Draw(img)
        for y in range(height):
            r = int(8 + 25 * y / height)
            g = int(8 + 8 * y / height)
            b = int(18 + 35 * y / height)
            draw.line([(0, y), (width, y)], fill=(r, g, b))

        tf, sf = None, None
        for fp in ["C:/Windows/Fonts/arialbd.ttf", "C:/Windows/Fonts/calibrib.ttf",
                   "C:/Windows/Fonts/verdanab.ttf", "C:/Windows/Fonts/arial.ttf"]:
            if os.path.exists(fp):
                try:
                    if tf is None: tf = ImageFont.truetype(fp, 96)
                    if sf is None: sf = ImageFont.truetype(fp, 52)
                    if tf and sf: break
                except Exception:
                    continue
        if tf is None: tf = ImageFont.load_default()
        if sf is None: sf = ImageFont.load_default()

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

        img.save(img_path, "PNG")

        cmd = [
            "ffmpeg", "-y", "-loop", "1", "-i", img_path, "-t", str(duration),
            "-vf", f"fade=t=in:st=0:d=0.4,fade=t=out:st={duration-0.4}:d=0.4",
            "-c:v", "libx264", "-preset", "fast", "-crf", "20",
            "-pix_fmt", "yuv420p", "-r", "30", output_path,
        ]
        return run_ffmpeg(cmd)
    except Exception as e:
        print(f"Intro card error: {e}")
        return False
    finally:
        try:
            os.remove(img_path)
        except Exception:
            pass


def mix_audio(
    video_path: str, voiceover_path: Optional[str], music_path: Optional[str],
    output_path: str, voice_vol: float = 1.0, music_vol: float = 0.18,
) -> bool:
    has_vo = voiceover_path and os.path.exists(voiceover_path)
    has_mu = music_path and os.path.exists(music_path)

    if not has_vo and not has_mu:
        shutil.copy(video_path, output_path)
        return True

    if has_vo and has_mu:
        cmd = [
            "ffmpeg", "-y", "-i", video_path, "-i", voiceover_path, "-i", music_path,
            "-filter_complex",
            f"[1:a]volume={voice_vol}[v];[2:a]volume={music_vol}[m];[v][m]amix=inputs=2:duration=first[aout]",
            "-map", "0:v:0", "-map", "[aout]",
            "-c:v", "copy", "-c:a", "aac", "-b:a", "128k", "-shortest", output_path,
        ]
    elif has_vo:
        cmd = ["ffmpeg", "-y", "-i", video_path, "-i", voiceover_path,
               "-map", "0:v:0", "-map", "1:a:0",
               "-c:v", "copy", "-c:a", "aac", "-shortest", output_path]
    else:
        cmd = [
            "ffmpeg", "-y", "-i", video_path, "-i", music_path,
            "-filter_complex", f"[1:a]volume={music_vol}[m];[m]apad[aout]",
            "-map", "0:v:0", "-map", "[aout]",
            "-c:v", "copy", "-c:a", "aac", "-shortest", output_path,
        ]

    if not run_ffmpeg(cmd):
        shutil.copy(video_path, output_path)
    return True


async def create_smart_cinematic_reel(
    video_paths: List[str],
    scenes: List[Dict],
    work_dir: str,
    output_path: str,
    intro_title: str = "",
    intro_subtitle: str = "",
    voiceover_path: Optional[str] = None,
    music_path: Optional[str] = None,
    width: int = 1080,
    height: int = 1920,
    remove_noise: bool = True,
) -> bool:
    """
    Full smart cinematic pipeline:
    1. Remove background noise from each clip
    2. Apply cinematic effect + color grade
    3. Burn subtitles
    4. Crossfade transitions
    5. Intro title card
    6. Mix audio
    7. Final fade + optimize
    """
    os.makedirs(work_dir, exist_ok=True)
    processed = []

    for i, scene in enumerate(scenes):
        video_index = scene.get("video_index", i)
        if video_index >= len(video_paths):
            video_index = i % len(video_paths)

        vpath = video_paths[video_index]
        if not os.path.exists(vpath):
            print(f"Scene {i+1}: video not found {vpath}")
            continue

        duration = float(scene.get("duration_seconds", 5))
        effect = scene.get("effect", "") or random.choice(RANDOM_EFFECTS)
        color_grade = scene.get("color_grade", "cinematic")
        subtitle = str(scene.get("subtitle", "") or "")
        sub_pos = scene.get("subtitle_position", "bottom")

        print(f"Scene {i+1}: effect={effect} grade={color_grade} subtitle='{subtitle[:30]}'")

        # Step 1: Remove noise
        if remove_noise:
            noise_out = os.path.join(work_dir, f"noise_{i}.mp4")
            remove_noise_fn(vpath, noise_out)
            src = noise_out if (os.path.exists(noise_out) and os.path.getsize(noise_out) > 0) else vpath
        else:
            src = vpath

        # Step 2: Apply cinematic effect + color grade
        effect_out = os.path.join(work_dir, f"effect_{i}.mp4")
        apply_effect_and_grade(src, effect_out, effect, color_grade, duration, width, height)
        if not os.path.exists(effect_out) or os.path.getsize(effect_out) == 0:
            print(f"Scene {i+1} effect failed, skipping")
            continue

        # Step 3: Burn subtitle
        sub_out = os.path.join(work_dir, f"sub_{i}.mp4")
        burn_subtitle(effect_out, subtitle, sub_pos, sub_out, width=width, height=height)
        final_clip = sub_out if (os.path.exists(sub_out) and os.path.getsize(sub_out) > 0) else effect_out
        processed.append(final_clip)

    if not processed:
        return False

    # Step 4: Crossfade transitions
    if len(processed) == 1:
        combined = processed[0]
    else:
        current = processed[0]
        for i in range(1, len(processed)):
            trans_out = os.path.join(work_dir, f"trans_{i}.mp4")
            add_fade_transition(current, processed[i], trans_out)
            current = trans_out if (os.path.exists(trans_out) and os.path.getsize(trans_out) > 0) else processed[i]
        combined = current

    # Step 5: Intro title card
    if intro_title:
        intro_vid = os.path.join(work_dir, "intro.mp4")
        if create_intro_card(intro_title, intro_subtitle, intro_vid, width=width, height=height):
            lst = os.path.join(work_dir, "intro_list.txt")
            with open(lst, "w") as f:
                f.write(f"file '{intro_vid.replace(chr(92), '/')}'\n")
                f.write(f"file '{combined.replace(chr(92), '/')}'\n")
            with_intro = os.path.join(work_dir, "with_intro.mp4")
            cmd = ["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", lst,
                   "-c:v", "libx264", "-preset", "fast", "-crf", "20", "-pix_fmt", "yuv420p", with_intro]
            if run_ffmpeg(cmd) and os.path.exists(with_intro) and os.path.getsize(with_intro) > 0:
                combined = with_intro
            try:
                os.remove(lst)
            except Exception:
                pass

    # Step 6: Mix audio
    audio_out = os.path.join(work_dir, "with_audio.mp4")
    mix_audio(combined, voiceover_path, music_path, audio_out)
    if os.path.exists(audio_out) and os.path.getsize(audio_out) > 0:
        combined = audio_out

    # Step 7: Final fade + optimize
    total_dur = get_duration(combined)
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


# Alias to avoid name conflict with the function parameter
def remove_noise_fn(input_path: str, output_path: str) -> bool:
    return remove_noise(input_path, output_path)
