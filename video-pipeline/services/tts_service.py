"""
Text-to-Speech Service
Primary:  ElevenLabs (you have the API key — best quality)
Fallback: gTTS (free, no credentials needed, works offline)
Optional: Google Cloud TTS (needs service account)
"""

import os
import re
import httpx

ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "")

# ElevenLabs multilingual voice map
ELEVENLABS_VOICE_MAP = {
    "English":    "21m00Tcm4TlvDq8ikWAM",   # Rachel
    "Hindi":      "AZnzlk1XvdvUeBnXmlld",   # Domi
    "Tamil":      "EXAVITQu4vr4xnSDxMaL",   # Bella
    "Telugu":     "EXAVITQu4vr4xnSDxMaL",
    "Kannada":    "EXAVITQu4vr4xnSDxMaL",
    "Malayalam":  "EXAVITQu4vr4xnSDxMaL",
    "Bengali":    "AZnzlk1XvdvUeBnXmlld",
    "Marathi":    "AZnzlk1XvdvUeBnXmlld",
    "Gujarati":   "AZnzlk1XvdvUeBnXmlld",
    "Punjabi":    "AZnzlk1XvdvUeBnXmlld",
    "Spanish":    "VR6AewLTigWG4xSOukaG",
    "French":     "MF3mGyEYCl7XYWbV9V6O",
    "Arabic":     "21m00Tcm4TlvDq8ikWAM",
    "Portuguese": "VR6AewLTigWG4xSOukaG",
    "German":     "pNInz6obpgDQGcFmaJgB",
    "Italian":    "pNInz6obpgDQGcFmaJgB",
    "Japanese":   "21m00Tcm4TlvDq8ikWAM",
    "Korean":     "21m00Tcm4TlvDq8ikWAM",
    "Chinese":    "21m00Tcm4TlvDq8ikWAM",
}

# gTTS language codes (free fallback)
GTTS_LANG_MAP = {
    "English": "en", "Hindi": "hi", "Tamil": "ta", "Telugu": "te",
    "Kannada": "kn", "Malayalam": "ml", "Bengali": "bn", "Marathi": "mr",
    "Gujarati": "gu", "Punjabi": "pa", "Spanish": "es", "French": "fr",
    "Arabic": "ar", "Portuguese": "pt", "German": "de", "Italian": "it",
    "Japanese": "ja", "Korean": "ko", "Chinese": "zh", "Russian": "ru",
    "Turkish": "tr", "Dutch": "nl", "Indonesian": "id", "Vietnamese": "vi",
    "Thai": "th", "Urdu": "ur", "Nepali": "ne", "Swahili": "sw",
}


def clean_script(script: str) -> str:
    """Remove stage directions and markers from script."""
    text = re.sub(r"\[.*?\]", "", script)
    text = re.sub(r"\(.*?\)", "", text)
    text = re.sub(r"\*+", "", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


async def generate_voiceover_elevenlabs(
    script: str,
    language: str,
    output_path: str,
    voice_id: str = None,
) -> str:
    """Generate voiceover using ElevenLabs multilingual v2."""
    if not ELEVENLABS_API_KEY:
        raise ValueError("ELEVENLABS_API_KEY not set")

    selected_voice = voice_id or ELEVENLABS_VOICE_MAP.get(language, "21m00Tcm4TlvDq8ikWAM")
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{selected_voice}"

    headers = {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY,
    }

    payload = {
        "text": script[:2500],  # ElevenLabs free tier limit
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.75,
            "style": 0.4,
            "use_speaker_boost": True,
        },
    }

    async with httpx.AsyncClient(timeout=60) as client:
        response = await client.post(url, headers=headers, json=payload)
        response.raise_for_status()
        with open(output_path, "wb") as f:
            f.write(response.content)

    return output_path


def generate_voiceover_gtts(script: str, language: str, output_path: str) -> str:
    """Generate voiceover using gTTS (free, no API key needed)."""
    try:
        from gtts import gTTS
    except ImportError:
        import subprocess, sys
        subprocess.run(
            [sys.executable, "-m", "pip", "install", "gtts", "-q"],
            capture_output=True
        )
        from gtts import gTTS

    lang_code = GTTS_LANG_MAP.get(language, "en")
    tts = gTTS(text=script[:3000], lang=lang_code, slow=False)
    tts.save(output_path)
    return output_path


async def generate_voiceover(
    script: str,
    language: str,
    output_path: str,
    tier: str = "free",
    voice_id: str = None,
) -> str:
    """
    Generate voiceover.
    - pro/enterprise: ElevenLabs (best quality)
    - free: ElevenLabs if key available, else gTTS
    """
    clean = clean_script(script)
    if not clean:
        clean = script[:500]

    # Always try ElevenLabs first if key is available
    if ELEVENLABS_API_KEY:
        try:
            return await generate_voiceover_elevenlabs(clean, language, output_path, voice_id)
        except Exception as e:
            print(f"ElevenLabs failed ({e}), falling back to gTTS")

    # Fallback: gTTS (completely free, no credentials)
    try:
        return generate_voiceover_gtts(clean, language, output_path)
    except Exception as e:
        print(f"gTTS also failed: {e}")
        raise RuntimeError(f"All TTS methods failed for language={language}")
