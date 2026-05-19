"""
Cinematic Script Pipeline — Gemini powered
Analyzes uploaded videos and generates complete cinematic script.
"""

import os
import json
import re
from typing import List, Dict
import google.generativeai as genai


def init_gemini(api_key: str):
    genai.configure(api_key=api_key)
    return genai.GenerativeModel("gemini-1.5-pro")


def analyze_and_generate_script(
    video_filenames: List[str],
    user_name: str,
    brand_name: str,
    business_type: str,
    target_audience: str,
    user_prompt: str,
    language: str,
    platform: str,
    api_key: str,
) -> Dict:
    model = init_gemini(api_key)

    videos_text = "\n".join([
        f"Video {i+1} (filename: {fn})" for i, fn in enumerate(video_filenames)
    ])

    prompt = f"""
You are a professional cinematic video director and scriptwriter.

A user uploaded {len(video_filenames)} raw videos for their {business_type}.

UPLOADED VIDEOS:
{videos_text}

USER DETAILS:
- Name: {user_name}
- Brand: {brand_name}
- Business Type: {business_type}
- Target Audience: {target_audience}
- Platform: {platform}
- Language: {language}
- Special Request: {user_prompt or "None"}

YOUR TASK:
1. Determine the BEST cinematic scene order based on filenames and business type
   - Shop/Store: exterior → interior → products → team → CTA
   - Product: hero shot → features → lifestyle → testimonial → CTA
   - Person/Brand: intro → story → value → proof → CTA
   - Food/Restaurant: ambiance → food prep → plating → eating → CTA
2. Write subtitles for each scene (max 8 words, punchy)
3. Write voiceover for each scene in {language}
4. Recommend cinematic effect per scene
5. Suggest music

Return ONLY valid JSON with this structure:
{{
    "video_title": "compelling title",
    "video_concept": "one sentence cinematic concept",
    "scenes": [
        {{
            "video_index": 0,
            "scene_type": "Intro",
            "duration_seconds": 5,
            "effect": "zoom_in",
            "subtitle": "Short punchy text in {language}",
            "subtitle_position": "bottom",
            "color_grade": "cinematic",
            "voiceover_line": "Narrator line in {language}",
            "transition": "fade"
        }}
    ],
    "full_voiceover_script": "Complete script in {language} with [PAUSE] markers",
    "music_mood": "Upbeat",
    "music_genre": "Cinematic",
    "intro_title": "{brand_name}",
    "intro_subtitle": "tagline here",
    "cta_text": "CTA in {language}",
    "hashtags": ["#tag1", "#tag2"],
    "estimated_duration_seconds": 30,
    "director_notes": "brief vision note"
}}

RULES:
- scene_type options: Intro, Exterior, Interior, Product, Team, Lifestyle, Testimonial, CTA
- effect options: zoom_in, zoom_out, pan_left, pan_right, tilt_up, tilt_down, none
- color_grade options: cinematic, warm, cool, vibrant, moody, golden, dramatic, fresh
- subtitle max 8 words
- If language is Hindi/Tamil/Telugu/Kannada etc — write subtitle and voiceover in that language script
- Make it feel like a professional brand film
"""

    response = model.generate_content(prompt)
    text = response.text

    for pattern in [r"```json\s*([\s\S]*?)\s*```", r"```\s*([\s\S]*?)\s*```", r"\{[\s\S]*\}"]:
        match = re.search(pattern, text)
        if match:
            try:
                candidate = match.group(1) if "```" in pattern else match.group(0)
                return json.loads(candidate)
            except Exception:
                continue

    return {"error": "Parse failed", "raw": text[:500]}


def update_script(existing: Dict, update_prompt: str, user_name: str,
                  brand_name: str, language: str, api_key: str) -> Dict:
    model = init_gemini(api_key)
    prompt = f"""
Existing cinematic script:
{json.dumps(existing, indent=2)}

User ({user_name}, {brand_name}) wants this change:
"{update_prompt}"

Update the script. Keep same JSON structure. Language: {language}.
Return ONLY the updated JSON.
"""
    response = model.generate_content(prompt)
    text = response.text
    for pattern in [r"```json\s*([\s\S]*?)\s*```", r"```\s*([\s\S]*?)\s*```", r"\{[\s\S]*\}"]:
        match = re.search(pattern, text)
        if match:
            try:
                candidate = match.group(1) if "```" in pattern else match.group(0)
                return json.loads(candidate)
            except Exception:
                continue
    return existing
