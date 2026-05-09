"""
Stock Video Service
Uses Pexels API (Free) to fetch relevant video clips per scene.
"""

import os
import httpx
import asyncio
from typing import List, Optional


PEXELS_API_KEY = os.getenv("PEXELS_API_KEY", "")
PEXELS_VIDEO_URL = "https://api.pexels.com/videos/search"


async def search_pexels_video(
    keywords: List[str],
    duration_seconds: int = 5,
    orientation: str = "portrait",
) -> Optional[str]:
    """
    Search Pexels for a video clip matching keywords.
    Returns the direct video URL or None.
    """
    if not PEXELS_API_KEY:
        print("PEXELS_API_KEY not set — skipping stock video fetch")
        return None

    query = " ".join(keywords[:3])  # Use top 3 keywords

    headers = {"Authorization": PEXELS_API_KEY}
    params = {
        "query": query,
        "orientation": orientation,  # portrait = 9:16
        "size": "medium",
        "per_page": 5,
    }

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.get(PEXELS_VIDEO_URL, headers=headers, params=params)
            response.raise_for_status()
            data = response.json()

            videos = data.get("videos", [])
            if not videos:
                # Try with fewer keywords
                params["query"] = keywords[0] if keywords else "lifestyle"
                response = await client.get(PEXELS_VIDEO_URL, headers=headers, params=params)
                data = response.json()
                videos = data.get("videos", [])

            if not videos:
                return None

            # Pick first video, prefer HD
            video = videos[0]
            video_files = video.get("video_files", [])

            # Sort by quality — prefer HD (1280x720 or higher)
            hd_files = [
                f for f in video_files
                if f.get("quality") in ("hd", "sd") and f.get("file_type") == "video/mp4"
            ]

            if hd_files:
                # Pick smallest HD file for faster download
                hd_files.sort(key=lambda x: x.get("width", 0))
                return hd_files[0].get("link")

            # Fallback to any mp4
            mp4_files = [f for f in video_files if f.get("file_type") == "video/mp4"]
            if mp4_files:
                return mp4_files[0].get("link")

    except Exception as e:
        print(f"Pexels search error for '{query}': {e}")

    return None


async def download_video_clip(url: str, output_path: str) -> bool:
    """Download a video clip from URL to local path."""
    try:
        async with httpx.AsyncClient(timeout=60, follow_redirects=True) as client:
            response = await client.get(url)
            response.raise_for_status()
            with open(output_path, "wb") as f:
                f.write(response.content)
            return True
    except Exception as e:
        print(f"Video download error: {e}")
        return False


async def fetch_scene_clips(
    scenes: List[dict],
    output_dir: str,
) -> List[Optional[str]]:
    """
    Fetch video clips for all scenes in parallel.
    Returns list of local file paths (or None if fetch failed).
    """
    os.makedirs(output_dir, exist_ok=True)

    async def fetch_one(scene: dict, index: int) -> Optional[str]:
        keywords = scene.get("stock_video_keywords", [])
        if not keywords:
            # Fallback keywords from scene type
            scene_type = scene.get("scene_type", "lifestyle")
            keywords = [scene_type, "people", "lifestyle"]

        video_url = await search_pexels_video(
            keywords=keywords,
            duration_seconds=scene.get("duration_seconds", 5),
            orientation="portrait",
        )

        if not video_url:
            print(f"No video found for scene {index + 1}, will use color background")
            return None

        output_path = os.path.join(output_dir, f"scene_{index + 1}.mp4")
        success = await download_video_clip(video_url, output_path)
        return output_path if success else None

    tasks = [fetch_one(scene, i) for i, scene in enumerate(scenes)]
    results = await asyncio.gather(*tasks)
    return list(results)
