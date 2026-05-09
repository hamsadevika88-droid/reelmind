# ReelMind AI 🎬

> AI-powered cinematic video ad generator. Competes with GetKoro, AdCreative.ai, HeyGen.
> No Lyzr dependency — runs 100% on your own cloud or locally.

[![License: MIT](https://img.shields.io/badge/License-MIT-violet.svg)](https://opensource.org/licenses/MIT)
[![Python 3.11](https://img.shields.io/badge/Python-3.11-blue.svg)](https://python.org)
[![Next.js 14](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org)
[![Gemini 1.5 Pro](https://img.shields.io/badge/AI-Gemini%201.5%20Pro-orange.svg)](https://ai.google.dev)

---

## What is ReelMind?

ReelMind takes a product name + description and autonomously generates a complete, production-ready short-form video ad (9:16 vertical) optimized for Instagram Reels, TikTok, YouTube Shorts, and more.

It uses a **9-agent AI pipeline** powered by Gemini 1.5 Pro to handle everything from ad strategy to final video assembly — no human creative work needed.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     REELMIND PLATFORM                        │
│                                                              │
│  ┌──────────────────┐   ┌──────────────────┐               │
│  │  Next.js Frontend │──▶│  Agent Server     │               │
│  │  (Port 3333)      │   │  CrewAI + Gemini  │               │
│  │  React + shadcn   │   │  (Port 8000)      │               │
│  └──────────────────┘   └────────┬─────────┘               │
│                                   │                          │
│                          ┌────────▼─────────┐               │
│                          │  Video Pipeline   │               │
│                          │  FFmpeg + APIs    │               │
│                          │  (Port 8001)      │               │
│                          └────────┬─────────┘               │
│                                   │                          │
│                    ┌──────────────▼──────────────┐          │
│                    │  Output: 1080x1920 MP4 Reel  │          │
│                    └─────────────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

---

## Services

| Service | Tech Stack | Purpose | Port |
|---------|-----------|---------|------|
| `reel-forge-stellar-spark-8mum/` | Next.js 14, React 18, TypeScript, Tailwind, shadcn/ui | Frontend UI + API routes | 3333 |
| `agent-server/` | Python 3.11, FastAPI, CrewAI, Gemini 1.5 Pro | 9-agent AI pipeline | 8000 |
| `video-pipeline/` | Python 3.11, FastAPI, FFmpeg, ElevenLabs, Pexels | Video generation | 8001 |

---

## The 9-Agent AI Pipeline

Every ad generation runs through 9 specialized AI agents powered by **Gemini 1.5 Pro**:

```
Input: Product Name + Description
         ↓
┌─────────────────────────────────────────────────────┐
│  Agent 1: AdStrategy Analyst                         │
│  → Analyzes product, ranks ad types by probability  │
│  → Recommends format, platform, creative direction  │
├─────────────────────────────────────────────────────┤
│  Agent 2: TrendSync Researcher                       │
│  → Researches current viral trends                  │
│  → Identifies trending hooks, formats, sounds       │
├─────────────────────────────────────────────────────┤
│  Agent 3: BuyerMind Persona Specialist               │
│  → Creates detailed buyer personas                  │
│  → Identifies pain points, desires, triggers        │
│  → Adapts for regional/cultural context             │
├─────────────────────────────────────────────────────┤
│  Agent 4: Script Writer                              │
│  → Writes 3 high-converting scripts                 │
│  → Scores each script (composite score)             │
│  → Selects winning script                           │
│  → Supports 30+ languages natively                  │
├─────────────────────────────────────────────────────┤
│  Agent 5: CMO Evaluator                              │
│  → Scores script on 10 dimensions (0-10 each)       │
│  → Hook Strength, Emotional Impact, Brand Alignment │
│  → CTA Effectiveness, Viral Potential, etc.         │
│  → Provides A/B test variations                     │
├─────────────────────────────────────────────────────┤
│  Agent 6: Audio Director                             │
│  → Designs complete audio landscape                 │
│  → Music genre, BPM, mood, instruments              │
│  → Sound effects per scene with timing              │
│  → Voice design specifications                      │
├─────────────────────────────────────────────────────┤
│  Agent 7: Voice Script Specialist                    │
│  → Creates 2 voiceover versions (A & B)             │
│  → Scene markers with timing + emotion cues         │
│  → Pronunciation guide for regional languages       │
├─────────────────────────────────────────────────────┤
│  Agent 8: Avatar Director                            │
│  → 5-scene visual storyboard                        │
│  → Camera angles, movements, lighting               │
│  → Stock video search keywords per scene            │
│  → Text overlay content + positioning               │
├─────────────────────────────────────────────────────┤
│  Agent 9: Video Renderer                             │
│  → Compiles all outputs into production package     │
│  → Final JSON with all metadata                     │
└─────────────────────────────────────────────────────┘
         ↓
Output: Complete Production Package (JSON)
```

**Agent Pipeline Stats:**
- Total agents: 9
- LLM: Gemini 1.5 Pro
- Framework: CrewAI (sequential process)
- Avg pipeline time: 2-4 minutes
- Cost per run: ~$0.03 (Gemini API)

---

## Video Generation — 3 Tiers

### 🆓 FREE TIER

**How it works:**
```
Winning Script
      ↓
gTTS (Google Text-to-Speech) → voiceover.mp3
      ↓
Pexels API → 5 stock video clips (one per scene)
      ↓
Pixabay API → background music track
      ↓
FFmpeg Assembly:
  - Scale/crop each clip to 1080x1920 (9:16)
  - Add PIL text overlays per scene
  - Concatenate 5 scenes
  - Mix voiceover + background music
  - Add fade in/out
  - Optimize for platform (Instagram/TikTok/YouTube)
      ↓
Final MP4 (1080x1920, ~1-3 MB)
```

**Models & APIs used:**
| Component | Model/Service | Cost |
|-----------|--------------|------|
| AI Agents | Gemini 1.5 Pro | ~$0.03/run |
| Voice | gTTS (Google) | Free |
| Stock Video | Pexels API | Free |
| Music | Pixabay Music API | Free |
| Assembly | FFmpeg (self-hosted) | Free |

**Total cost per video: ~$0.03**
**Total time: 3-5 minutes**
**Output quality: Good — real stock footage + AI voice**

---

### ⭐ PRO TIER

**How it works:**
```
Winning Script
      ↓
ElevenLabs eleven_multilingual_v2 → HD voiceover.mp3
(Realistic AI voice, 30+ languages, natural prosody)
      ↓
Pexels API → 5 HD stock video clips
      ↓
Pixabay API → background music
      ↓
FFmpeg Assembly:
  - Scale/crop to 1080x1920
  - PIL text overlays
  - Concatenate scenes
  - Mix audio (voice + music with ducking)
  - Cinematic color grading (curves filter)
  - CTA overlay with brand color
  - Progress bar animation
  - Platform optimization (H.264, AAC, faststart)
      ↓
Final MP4 (1080x1920, ~3-5 MB, cinematic grade)
```

**Models & APIs used:**
| Component | Model/Service | Cost |
|-----------|--------------|------|
| AI Agents | Gemini 1.5 Pro | ~$0.03/run |
| Voice | ElevenLabs eleven_multilingual_v2 | ~$0.03/run |
| Stock Video | Pexels API HD | Free |
| Music | Pixabay Music API | Free |
| Color Grade | FFmpeg curves filter | Free |
| Assembly | FFmpeg (self-hosted) | Free |

**Total cost per video: ~$0.06**
**Total time: 4-6 minutes**
**Output quality: Great — HD stock + premium AI voice + cinematic grade**

---

### 👑 ENTERPRISE TIER

**How it works:**
```
Winning Script
      ↓
ElevenLabs eleven_multilingual_v2 → HD voiceover.mp3
      ↓
HeyGen v2 API:
  - AI Avatar selected by language/region
  - Avatar lip-syncs to voiceover
  - 1080x1920 vertical format
  - 3-5 minute render time on HeyGen servers
      ↓
Background music mixed in (Pixabay)
      ↓
FFmpeg Post-processing:
  - Cinematic color grading
  - CTA overlay with brand color
  - Progress bar
  - Platform optimization
  - No watermark
      ↓
Final MP4 (1080x1920, ~10-20 MB, AI avatar)
```

**Models & APIs used:**
| Component | Model/Service | Cost |
|-----------|--------------|------|
| AI Agents | Gemini 1.5 Pro | ~$0.03/run |
| Voice | ElevenLabs eleven_multilingual_v2 | ~$0.03/run |
| AI Avatar | HeyGen v2 API | ~$0.50/run |
| Music | Pixabay Music API | Free |
| Post-processing | FFmpeg (self-hosted) | Free |

**Total cost per video: ~$0.56**
**Total time: 7-11 minutes**
**Output quality: Best — real AI avatar lip-syncing to voice**

---

## Tier Comparison

| Feature | Free | Pro | Enterprise |
|---------|------|-----|------------|
| AI Agents | Gemini 1.5 Pro ✅ | Gemini 1.5 Pro ✅ | Gemini 1.5 Pro ✅ |
| Voice | gTTS | ElevenLabs v2 | ElevenLabs v2 |
| Video Source | Pexels stock | Pexels HD | HeyGen AI Avatar |
| Color Grade | ❌ | Cinematic ✅ | Cinematic ✅ |
| CTA Overlay | ❌ | ✅ | ✅ |
| Progress Bar | ❌ | ✅ | ✅ |
| Watermark | Yes | Yes | No |
| Resolution | 1080x1920 | 1080x1920 | 1080x1920 |
| Languages | 30+ | 30+ | 30+ |
| Cost/video | ~$0.03 | ~$0.06 | ~$0.56 |
| Gen time | 3-5 min | 4-6 min | 7-11 min |
| File size | 1-3 MB | 3-5 MB | 10-20 MB |

---

## Supported Languages (30+)

```
Indian Languages:
Hindi, Tamil, Telugu, Kannada, Malayalam, Bengali,
Marathi, Gujarati, Punjabi, Odia, Assamese, Urdu, Nepali

Global Languages:
English, Spanish, French, German, Italian, Portuguese,
Arabic, Chinese, Japanese, Korean, Russian, Turkish,
Dutch, Indonesian, Vietnamese, Thai, Swahili
```

---

## Supported Platforms & Formats

| Platform | Aspect Ratio | Resolution | Duration |
|----------|-------------|------------|---------|
| Instagram Reels | 9:16 | 1080x1920 | 15-30s |
| TikTok | 9:16 | 1080x1920 | 15-30s |
| YouTube Shorts | 9:16 | 1080x1920 | 15-60s |
| Facebook Reels | 9:16 | 1080x1920 | 15-30s |
| Snapchat Spotlight | 9:16 | 1080x1920 | 15-60s |

---

## Content Types (12)

```
UGC Testimonial    Product Demo       Fashion Reel
Jewellery Showcase Hook + Demo        App Demo
Testimonial        Unboxing           Before/After
Tutorial           Lifestyle          Service Explainer
```

---

## Tech Stack

### Frontend
- **Framework:** Next.js 14.2 (App Router)
- **Language:** TypeScript 5.6
- **Styling:** Tailwind CSS 3.4 + shadcn/ui (53 components)
- **Icons:** lucide-react
- **State:** React hooks (useState, useCallback, useRef)

### Agent Server
- **Runtime:** Python 3.11
- **API Framework:** FastAPI 0.111
- **Agent Framework:** CrewAI 0.51
- **LLM:** Gemini 1.5 Pro via langchain-google-genai
- **Process:** Sequential (9 agents in order)
- **Job Queue:** In-memory async (ThreadPoolExecutor)

### Video Pipeline
- **Runtime:** Python 3.11
- **API Framework:** FastAPI 0.111
- **Video Assembly:** FFmpeg (subprocess)
- **Image Processing:** Pillow (PIL)
- **TTS Free:** gTTS (Google Text-to-Speech)
- **TTS Pro:** ElevenLabs eleven_multilingual_v2
- **Stock Video:** Pexels API
- **Music:** Pixabay Music API
- **Avatar:** HeyGen v2 API (Enterprise)

---

## Project Structure

```
reelmind/
├── agent-server/                    # Python FastAPI — 9 AI Agents
│   ├── agents/
│   │   ├── ad_strategy.py           # Agent 1: Ad Strategy Analyst
│   │   ├── trendsync.py             # Agent 2: Viral Trend Researcher
│   │   ├── buyermind.py             # Agent 3: Buyer Persona Specialist
│   │   ├── scriptwriter.py          # Agent 4: Script Writer
│   │   ├── cmo_evaluator.py         # Agent 5: CMO Evaluator
│   │   ├── audio_director.py        # Agent 6: Audio Director
│   │   ├── voice_script.py          # Agent 7: Voice Script Specialist
│   │   ├── avatar_director.py       # Agent 8: Visual Director
│   │   └── video_renderer.py        # Agent 9: Production Coordinator
│   ├── tasks/
│   │   └── pipeline_tasks.py        # Task definitions for all 9 agents
│   ├── pipeline/
│   │   └── crew_pipeline.py         # CrewAI orchestration
│   ├── main.py                      # FastAPI server (port 8000)
│   ├── requirements.txt
│   └── Dockerfile
│
├── video-pipeline/                  # Python FastAPI — Video Generation
│   ├── services/
│   │   ├── tts_service.py           # ElevenLabs + gTTS voiceover
│   │   ├── stock_video_service.py   # Pexels API stock clips
│   │   ├── music_service.py         # Pixabay background music
│   │   ├── ffmpeg_assembler.py      # Core video assembly (Windows-safe)
│   │   ├── text_overlay_service.py  # PIL text overlays + progress bar
│   │   ├── video_enhancer.py        # Color grading, optimization, thumbnails
│   │   └── heygen_service.py        # HeyGen AI Avatar (Enterprise)
│   ├── main.py                      # FastAPI server (port 8001)
│   ├── requirements.txt
│   └── Dockerfile
│
├── reel-forge-stellar-spark-8mum/   # Next.js Frontend
│   ├── app/
│   │   ├── page.tsx                 # Main generator page
│   │   ├── dashboard/page.tsx       # Video library dashboard
│   │   ├── layout.tsx               # Root layout
│   │   └── api/
│   │       ├── agent/route.ts       # Proxy → agent server
│   │       └── video-generate/      # Proxy → video pipeline
│   ├── app/sections/
│   │   ├── Header.tsx               # Top navigation
│   │   ├── InputZone.tsx            # Product input form
│   │   ├── OutputZone.tsx           # Results display
│   │   ├── LoadingState.tsx         # Generation progress
│   │   └── outputTypes.ts           # TypeScript interfaces
│   ├── components/ui/               # 53 shadcn/ui components
│   ├── lib/                         # Utilities
│   ├── package.json
│   └── Dockerfile
│
├── docker-compose.yml               # Run all 3 services together
├── deploy-gcloud.sh                 # Deploy to Google Cloud Run
├── .env                             # API keys (gitignored)
└── README.md                        # This file
```

---

## Quick Start (Local)

### Prerequisites
- Python 3.11
- Node.js 18+
- FFmpeg installed and in PATH
- API keys (see below)

### 1. Get API Keys

| Key | Where | Cost |
|-----|-------|------|
| Gemini API | https://aistudio.google.com | Free |
| Pexels API | https://www.pexels.com/api/ | Free |
| ElevenLabs | https://elevenlabs.io | Free tier |
| HeyGen | https://heygen.com | Paid (Enterprise only) |
| Pixabay | https://pixabay.com/api/docs/ | Free |

### 2. Setup Environment

```bash
# Clone the repo
git clone https://github.com/hamsadevika88-droid/reelmind.git
cd reelmind

# Copy and fill in your API keys
cp .env.example .env
```

Edit `.env`:
```env
GEMINI_API_KEY=your-gemini-key
PEXELS_API_KEY=your-pexels-key
ELEVENLABS_API_KEY=your-elevenlabs-key
HEYGEN_API_KEY=your-heygen-key (optional, enterprise only)
PIXABAY_API_KEY=your-pixabay-key (optional)
```

### 3. Run with Docker Compose (Recommended)

```bash
docker-compose --env-file .env up --build
```

Open http://localhost:3333

### 4. Run Manually

**Terminal 1 — Agent Server:**
```bash
cd agent-server
pip install -r requirements.txt
uvicorn main:app --port 8000 --reload
```

**Terminal 2 — Video Pipeline:**
```bash
cd video-pipeline
pip install -r requirements.txt
pip install gtts  # free TTS fallback
uvicorn main:app --port 8001 --reload
```

**Terminal 3 — Frontend:**
```bash
cd reel-forge-stellar-spark-8mum
npm install
npm run dev
# Opens at http://localhost:3333
```

---

## Deploy to Google Cloud

```bash
# Install gcloud CLI: https://cloud.google.com/sdk/docs/install
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Deploy all 3 services to Cloud Run
chmod +x deploy-gcloud.sh
./deploy-gcloud.sh
```

You'll get 3 public URLs automatically — no domain needed.

---

## API Reference

### Agent Server (port 8000)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check + Gemini status |
| `/generate` | POST | Submit ad generation job |
| `/status/{job_id}` | GET | Poll job status |
| `/languages` | GET | List 30+ supported languages |
| `/platforms` | GET | List supported platforms |
| `/content-types` | GET | List 12 content types |

### Video Pipeline (port 8001)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check + FFmpeg/API status |
| `/generate` | POST | Start video generation |
| `/status/{job_id}` | GET | Poll video status + progress % |
| `/video/{filename}` | GET | Stream/download final MP4 |
| `/thumbnail/{filename}` | GET | Get video thumbnail |
| `/cleanup/{job_id}` | DELETE | Remove job + files |

---

## Cost at Scale

| Tier | 100 videos/mo | 500 videos/mo | 1000 videos/mo |
|------|--------------|--------------|----------------|
| Free | ~$3 | ~$15 | ~$30 |
| Pro | ~$6 | ~$30 | ~$60 |
| Enterprise | ~$56 | ~$280 | ~$560 |

Cloud Run hosting: ~$20-50/month (covered by GCP startup credits)

---

## vs Competitors

| Feature | ReelMind | GetKoro | AdCreative.ai | HeyGen |
|---------|----------|---------|---------------|--------|
| Regional languages | 30+ ✅ | ~5 | ~10 | ~10 |
| AI agents | 9 specialized ✅ | 1 generic | 1 generic | 1 generic |
| Cost/video | $0.03-0.56 ✅ | ~$2-5 | ~$3-8 | ~$1-3 |
| Self-hosted | ✅ Yes | ❌ No | ❌ No | ❌ No |
| Open source | ✅ Yes | ❌ No | ❌ No | ❌ No |
| Free tier | ✅ Yes | ❌ No | ❌ No | Limited |
| Indian languages | 12 ✅ | ❌ | ❌ | Limited |

---

## Environment Variables

| Variable | Required | Service | Description |
|----------|----------|---------|-------------|
| `GEMINI_API_KEY` | ✅ | Agent Server | Gemini 1.5 Pro API key |
| `PEXELS_API_KEY` | ✅ | Video Pipeline | Pexels stock video API |
| `ELEVENLABS_API_KEY` | ✅ | Video Pipeline | ElevenLabs TTS (Pro/Enterprise) |
| `HEYGEN_API_KEY` | ❌ | Video Pipeline | HeyGen avatar (Enterprise only) |
| `PIXABAY_API_KEY` | ❌ | Video Pipeline | Background music |
| `AGENT_SERVER_URL` | ✅ | Frontend | URL of agent server |
| `VIDEO_PIPELINE_URL` | ✅ | Frontend | URL of video pipeline |
| `GCP_PROJECT_ID` | ❌ | Deploy | Google Cloud project ID |

---

## License

MIT License — free to use, modify, and deploy commercially.

---

## Built With

- [CrewAI](https://crewai.com) — Multi-agent AI framework
- [Gemini 1.5 Pro](https://ai.google.dev) — LLM for all 9 agents
- [ElevenLabs](https://elevenlabs.io) — Multilingual AI voice
- [Pexels](https://pexels.com) — Free stock video
- [FFmpeg](https://ffmpeg.org) — Video assembly
- [Next.js](https://nextjs.org) — Frontend framework
- [FastAPI](https://fastapi.tiangolo.com) — Python API server
- [HeyGen](https://heygen.com) — AI avatar (Enterprise)
