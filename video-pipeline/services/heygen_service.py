"""
HeyGen Avatar Service — Enterprise Tier
Generates AI avatar videos that lip-sync to voiceover.
"""

import os
import httpx
import asyncio
from typing import Optional

HEYGEN_API_KEY = os.getenv("HEYGEN_API_KEY", "")
HEYGEN_BASE_URL = "https://api.heygen.com"

# Curated avatar IDs by region/language
AVATAR_MAP = {
    "English": "Angela-inblackskirt-20220820",
    "Hindi": "Deepika-insaree-20230101",
    "Tamil": "Priya-insaree-20230101",
    "Telugu": "Priya-insaree-20230101",
    "Kannada": "Priya-insaree-20230101",
    "Malayalam": "Priya-insaree-20230101",
    "Bengali": "Deepika-insaree-20230101",
    "Spanish": "Sofia-inblouse-20220820",
    "French": "Camille-inblouse-20220820",
    "Arabic": "Layla-inabaya-20230101",
    "Chinese": "Mei-incheongsam-20230101",
    "Japanese": "Yuki-inkimono-20230101",
    "Korean": "Jisoo-inhanbok-20230101",
    "German": "Anna-inblouse-20220820",
    "Portuguese": "Sofia-inblouse-20220820",
}

# Voice IDs for HeyGen TTS by language
HEYGEN_VOICE_MAP = {
    "English": "1bd001e7e50f421d891986aad5158bc8",
    "Hindi": "a6f3e9b2c1d4e5f6a7b8c9d0e1f2a3b4",
    "Tamil": "b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2",
    "Spanish": "c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3",
    "French": "d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4",
    "Arabic": "e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5",
    "Chinese": "f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6",
    "Japanese": "a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7",
    "Korean": "b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8",
    "German": "c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9",
    "Portuguese": "d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0",
}


async def generate_heygen_avatar_video(
    script: str,
    language: str,
    output_path: str,
    avatar_id: str = None,
    voice_id: str = None,
    aspect_ratio: str = "9:16",
) -> Optional[str]:
    """
    Generate an AI avatar video using HeyGen API.
    Returns local file path or None on failure.
    """
    if not HEYGEN_API_KEY:
        raise ValueError("HEYGEN_API_KEY not configured")

    selected_avatar = avatar_id or AVATAR_MAP.get(language, AVATAR_MAP["English"])
    selected_voice = voice_id or HEYGEN_VOICE_MAP.get(language, HEYGEN_VOICE_MAP["English"])

    headers = {
        "X-Api-Key": HEYGEN_API_KEY,
        "Content-Type": "application/json",
    }

    # Step 1: Create video generation task
    payload = {
        "video_inputs": [
            {
                "character": {
                    "type": "avatar",
                    "avatar_id": selected_avatar,
                    "avatar_style": "normal",
                },
                "voice": {
                    "type": "text",
                    "input_text": script,
                    "voice_id": selected_voice,
                    "speed": 1.0,
                },
                "background": {
                    "type": "color",
                    "value": "#1a1a2e",
                },
            }
        ],
        "dimension": {
            "width": 1080 if aspect_ratio == "9:16" else 1920,
            "height": 1920 if aspect_ratio == "9:16" else 1080,
        },
        "aspect_ratio": aspect_ratio,
    }

    async with httpx.AsyncClient(timeout=30) as client:
        create_res = await client.post(
            f"{HEYGEN_BASE_URL}/v2/video/generate",
            headers=headers,
            json=payload,
        )
        create_res.raise_for_status()
        create_data = create_res.json()

    video_id = create_data.get("data", {}).get("video_id")
    if not video_id:
        raise ValueError(f"HeyGen did not return video_id: {create_data}")

    # Step 2: Poll for completion (HeyGen takes 2-5 minutes)
    for attempt in range(60):
        await asyncio.sleep(10)
        async with httpx.AsyncClient(timeout=15) as client:
            status_res = await client.get(
                f"{HEYGEN_BASE_URL}/v1/video_status.get?video_id={video_id}",
                headers=headers,
            )
            status_data = status_res.json()

        status = status_data.get("data", {}).get("status", "")
        if status == "completed":
            video_url = status_data["data"].get("video_url")
            if video_url:
                # Download the video
                async with httpx.AsyncClient(timeout=120, follow_redirects=True) as client:
                    dl_res = await client.get(video_url)
                    dl_res.raise_for_status()
                    with open(output_path, "wb") as f:
                        f.write(dl_res.content)
                return output_path
        elif status == "failed":
            error = status_data.get("data", {}).get("error", "Unknown error")
            raise ValueError(f"HeyGen video generation failed: {error}")

    raise TimeoutError("HeyGen video generation timed out after 10 minutes")
