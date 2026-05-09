# ReelMind AI — Setup Guide for Developers

## Project Structure

```
reelmind/
├── agent-server/          → Python FastAPI — 9 AI Agents (port 8000)
├── video-pipeline/        → Python FastAPI — Video Generation (port 8001)
├── reel-forge-stellar-spark-8mum/  → Next.js Frontend (port 3333)
├── docker-compose.yml     → Run all 3 together
└── deploy-gcloud.sh       → Deploy to Google Cloud Run
```

---

## Prerequisites

- Python 3.11
- Node.js 18+
- FFmpeg (must be in PATH)
- Git

---

## Step 1 — API Keys Needed

Create a `.env` file in the root:

```env
# Required
GEMINI_API_KEY=AIzaSyDB1QPnAIS4kY0Z2-pF6cow1hLYHClE6Gg

# Required for stock video
PEXELS_API_KEY=GEsNoIUG32Nw513LYA2F18mM3lbQ1ONiWQmzd1Rlo1OPa8HBTdWjmZTo

# Required for Pro tier voice
ELEVENLABS_API_KEY=sk_108473985b123c76ab1b2402c7583d3a6088efd76a99f837

# Optional — Enterprise tier only
HEYGEN_API_KEY=

# Optional — background music
PIXABAY_API_KEY=
```

Also create `agent-server/.env`:
```env
GEMINI_API_KEY=AIzaSyDB1QPnAIS4kY0Z2-pF6cow1hLYHClE6Gg
```

Also create `video-pipeline/.env`:
```env
PEXELS_API_KEY=GEsNoIUG32Nw513LYA2F18mM3lbQ1ONiWQmzd1Rlo1OPa8HBTdWjmZTo
ELEVENLABS_API_KEY=sk_108473985b123c76ab1b2402c7583d3a6088efd76a99f837
HEYGEN_API_KEY=
PIXABAY_API_KEY=
```

Also create `reel-forge-stellar-spark-8mum/.env.local`:
```env
AGENT_SERVER_URL=http://localhost:8000
VIDEO_PIPELINE_URL=http://localhost:8001
```

---

## Step 2 — Install Dependencies

### Agent Server
```bash
cd agent-server
pip install -r requirements.txt
```

### Video Pipeline
```bash
cd video-pipeline
pip install -r requirements.txt
pip install gtts  # free TTS fallback
```

### Frontend
```bash
cd reel-forge-stellar-spark-8mum
npm install
```

---

## Step 3 — Run All 3 Services

Open 3 terminals:

**Terminal 1 — Agent Server (port 8000):**
```bash
cd agent-server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2 — Video Pipeline (port 8001):**
```bash
cd video-pipeline
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

**Terminal 3 — Frontend (port 3333):**
```bash
cd reel-forge-stellar-spark-8mum
npm run dev
```

Open: **http://localhost:3333**

---

## Step 4 — Test It Works

Check health endpoints:
- http://localhost:8000/health → Agent server
- http://localhost:8001/health → Video pipeline
- http://localhost:3333 → Frontend

---

## How It Works

```
User enters: Product Name + Description
                    ↓
POST /api/agent → agent-server:8000/generate
                    ↓
9 CrewAI agents run sequentially (Gemini 1.5 Pro)
  Agent 1: AdStrategy
  Agent 2: TrendSync
  Agent 3: BuyerMind
  Agent 4: ScriptWriter
  Agent 5: CMOEvaluator
  Agent 6: AudioDirector
  Agent 7: VoiceScript
  Agent 8: AvatarDirector
  Agent 9: VideoRenderer
                    ↓
Frontend polls /api/agent?task_id=xxx every 3s
                    ↓
On completion → POST /api/video-generate → video-pipeline:8001/generate
                    ↓
Video pipeline:
  1. ElevenLabs/gTTS → voiceover.mp3
  2. Pexels API → 5 stock video clips
  3. Pixabay → background music
  4. FFmpeg → assemble 9:16 MP4
                    ↓
Final MP4 served at /video/{filename}
```

---

## Docker (Alternative)

```bash
docker-compose --env-file .env up --build
```

---

## Deploy to Google Cloud

```bash
gcloud auth login
gcloud config set project bolofyofficial
chmod +x deploy-gcloud.sh
./deploy-gcloud.sh
```

---

## Known Issues & Fixes

### ElevenLabs 402 Error
Free tier quota exceeded. gTTS is used as automatic fallback.
Fix: Upgrade ElevenLabs plan or wait for quota reset.

### FFmpeg font errors on Windows
Fontconfig warnings are harmless — text overlays use PIL instead.

### Video is empty (0 bytes)
Check video-pipeline logs. Usually means FFmpeg failed on a clip.
Fix: Already handled — falls back to gradient background per scene.

---

## Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React 18, TypeScript, Tailwind, shadcn/ui |
| Agent Server | Python 3.11, FastAPI, CrewAI, Gemini 1.5 Pro |
| Video Pipeline | Python 3.11, FastAPI, FFmpeg, ElevenLabs, Pexels |
| Free Voice | gTTS (Google) |
| Pro Voice | ElevenLabs eleven_multilingual_v2 |
| Enterprise Avatar | HeyGen v2 API |
| Stock Video | Pexels API |
| Music | Pixabay Music API |
| Deployment | Docker, Google Cloud Run |
