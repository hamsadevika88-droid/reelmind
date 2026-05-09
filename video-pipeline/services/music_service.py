"""
Background Music Service
Uses free Pixabay music API + local fallback tracks.
"""

import os
import httpx
from typing import Optional

PIXABAY_API_KEY = os.getenv("PIXABAY_API_KEY", "")

# Genre to Pixabay search term mapping
GENRE_SEARCH_MAP = {
    "Pop": "upbeat pop",
    "Lo-fi Pop": "lofi chill",
    "Hip-hop": "hip hop beat",
    "Electronic": "electronic upbeat",
    "Cinematic": "cinematic inspiring",
    "Bollywood": "indian upbeat",
    "Classical Indian": "indian classical",
    "Jazz": "jazz upbeat",
    "Acoustic": "acoustic guitar",
    "Corporate": "corporate upbeat",
    "Motivational": "motivational inspiring",
    "Chill": "chill relaxing",
}


async def fetch_pixabay_music(genre: str, mood: str) -> Optional[str]:
    """Fetch background music from Pixabay (free)."""
    if not PIXABAY_API_KEY:
        return None

    search_term = GENRE_SEARCH_MAP.get(genre, "upbeat commercial")
    url = "https://pixabay.com/api/music/"

    params = {
        "key": PIXABAY_API_KEY,
        "q": search_term,
        "per_page": 5,
    }

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            hits = data.get("hits", [])
            if hits:
                return hits[0].get("audio", {}).get("url")
    except Exception as e:
        print(f"Pixabay music fetch error: {e}")

    return None


async def download_music(url: str, output_path: str) -> bool:
    """Download music track to local path."""
    try:
        async with httpx.AsyncClient(timeout=30, follow_redirects=True) as client:
            response = await client.get(url)
            response.raise_for_status()
            with open(output_path, "wb") as f:
                f.write(response.content)
            return True
    except Exception as e:
        print(f"Music download error: {e}")
        return False


async def get_background_music(
    genre: str,
    mood: str,
    output_path: str,
) -> Optional[str]:
    """
    Get background music track.
    Returns local file path or None.
    """
    music_url = await fetch_pixabay_music(genre, mood)

    if music_url:
        success = await download_music(music_url, output_path)
        if success:
            return output_path

    print("No music fetched — video will be generated without background music")
    return None
