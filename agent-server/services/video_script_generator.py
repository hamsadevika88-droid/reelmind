"""
Video Script Generator
Uses Gemini to analyze uploaded video context and generate:
- Scene-by-scene script
- Subtitle lines with timing
- Effect recommendations per scene
- Music mood recommendation
- Opening scene recommendation
"""

import os
import json
import re
from typing import List, Dict, Optional


GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")


def extract_json(text: str) -> dict:
    """Extract JSON from LLM response."""
    if isinstance(text, dict):
        return text
    try:
        return json.loads(text)
    except Exception:
        pass
    for pattern in [r"```json\s*([\s\S]*?)\s*```", r"```\s*([\s\S]*?)\s*```", r"\{[\s\S]*\}"]:
        match = re.search(pattern, str(text))
        if match:
            try:
                candidate = match.group(1) if "```" in pattern else match.group(0)
                return json.loads(candidate)
            except Exception:
                continue
    return {}


async def generate_video_script(
    clip_count: int,
    clip_names: List[str],
    user_name: str,
    brand_name: str,
    video_type: str,
    user_prompt: str,
    language: str = "English",
    total_duration: float = 30.0,
) -> dict:
    """
    Generate a complete video script using Gemini based on:
    - Number and names of uploaded clips
    - User/brand info
    - Video type (shop, product, bike, food, etc.)
    - Custom user prompt/vision
    """
    import google.generativeai as genai

    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel("gemini-1.5-pro")

    clip_list = "\n".join([f"  Clip {i+1}: {name}" for i, name in enumerate(clip_names)])

    prompt = f"""You are a professional video director and scriptwriter.

A user has uploaded {clip_count} video clips to create a cinematic {video_type} video.

USER DETAILS:
- Name/Brand: {brand_name or user_name or "Not specified"}
- Video Type: {video_type}
- Language: {language}
- Total Duration: ~{total_duration} seconds
- User's Vision: {user_prompt or "Make it look professional and cinematic"}

UPLOADED CLIPS:
{clip_list}

Create a complete video production script. Think about:
1. Which clip should open the video (most impactful/establishing shot)
2. The narrative flow (hook → story → CTA)
3. What text/subtitle to show on each clip
4. What cinematic effect suits each clip
5. The overall mood and music style

Return ONLY valid JSON:
{{
  "video_title": "catchy title for the video",
  "opening_hook": "first line that grabs attention in {language}",
  "overall_mood": "energetic/calm/dramatic/inspiring/fun",
  "music_genre": "Pop/Hip-hop/Cinematic/Bollywood/Electronic/Acoustic",
  "music_mood": "upbeat/emotional/dramatic/chill",
  "color_grade": "cinematic/warm/vibrant/moody/golden/dramatic",
  "clip_order": [1, 2, 3],
  "scenes": [
    {{
      "clip_index": 0,
      "scene_type": "Opening/Hook/Story/Product/CTA",
      "duration_seconds": 5,
      "effect": "zoom_in/zoom_out/pan_left/pan_right/tilt_up/tilt_down/none",
      "subtitle_text": "text to show on screen in {language}",
      "subtitle_position": "top/center/bottom",
      "narration": "what the voiceover says for this scene in {language}",
      "description": "what this scene shows"
    }}
  ],
  "full_narration_script": "complete voiceover script in {language}",
  "subtitle_lines": [
    {{"text": "subtitle line in {language}", "start": 0.5, "end": 3.0}},
    {{"text": "next subtitle in {language}", "start": 3.5, "end": 6.0}}
  ],
  "cta_text": "call to action text in {language}",
  "hashtags": ["#tag1", "#tag2", "#tag3"],
  "caption": "social media caption in {language}"
}}"""

    try:
        response = model.generate_content(prompt)
        result = extract_json(response.text)
        if result:
            return result
    except Exception as e:
        print(f"Gemini script generation error: {e}")

    # Fallback script if Gemini fails
    return _fallback_script(clip_count, clip_names, brand_name, video_type, language, total_duration, user_prompt)


def _fallback_script(
    clip_count: int,
    clip_names: List[str],
    brand_name: str,
    video_type: str,
    language: str,
    total_duration: float,
    user_prompt: str,
) -> dict:
    """Fallback script when Gemini is unavailable."""
    effects = ["zoom_in", "pan_left", "zoom_out", "pan_right", "tilt_up", "zoom_in"]
    dur_per_clip = total_duration / max(clip_count, 1)

    scenes = []
    for i in range(clip_count):
        scene_types = ["Opening", "Story", "Story", "Product", "CTA"]
        scenes.append({
            "clip_index": i,
            "scene_type": scene_types[i % len(scene_types)],
            "duration_seconds": round(dur_per_clip, 1),
            "effect": effects[i % len(effects)],
            "subtitle_text": brand_name if i == 0 else "",
            "subtitle_position": "center" if i == 0 else "bottom",
            "narration": "",
            "description": f"Scene {i+1}",
        })

    return {
        "video_title": brand_name or video_type,
        "opening_hook": f"Welcome to {brand_name}" if brand_name else "Watch this",
        "overall_mood": "energetic",
        "music_genre": "Cinematic",
        "music_mood": "upbeat",
        "color_grade": "cinematic",
        "clip_order": list(range(clip_count)),
        "scenes": scenes,
        "full_narration_script": user_prompt or f"Discover {brand_name}",
        "subtitle_lines": [],
        "cta_text": "Follow for more",
        "hashtags": [],
        "caption": brand_name or video_type,
    }


async def refine_script_with_feedback(
    original_script: dict,
    user_feedback: str,
    language: str = "English",
) -> dict:
    """
    Refine an existing script based on user feedback.
    e.g. "Make it more dramatic", "Add more energy", "Change the opening"
    """
    import google.generativeai as genai

    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel("gemini-1.5-pro")

    prompt = f"""You are a video director. Here is an existing video script:

{json.dumps(original_script, indent=2)}

The user wants these changes: "{user_feedback}"

Update the script based on the feedback. Keep the same JSON structure.
Return ONLY the updated JSON."""

    try:
        response = model.generate_content(prompt)
        result = extract_json(response.text)
        if result:
            return result
    except Exception as e:
        print(f"Script refinement error: {e}")

    return original_script
