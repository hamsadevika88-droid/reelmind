#!/bin/bash
# ============================================================
# ReelMind AI — Google Cloud Run Deployment Script
# Project: bolofyofficial
# Run: bash deploy-gcloud.sh
# ============================================================

set -e

PROJECT_ID="bolofyofficial"
REGION="us-central1"
GEMINI_API_KEY="AIzaSyDB1QPnAIS4kY0Z2-pF6cow1hLYHClE6Gg"
PEXELS_API_KEY="GEsNoIUG32Nw513LYA2F18mM3lbQ1ONiWQmzd1Rlo1OPa8HBTdWjmZTo"
ELEVENLABS_API_KEY="sk_108473985b123c76ab1b2402c7583d3a6088efd76a99f837"
BUCKET_NAME="bolofyofficial-reelforge-videos"

echo ""
echo "================================================"
echo "  ReelMind AI — Deploying to Google Cloud Run"
echo "  Project : $PROJECT_ID"
echo "  Region  : $REGION"
echo "================================================"
echo ""

# ── Set project ──
gcloud config set project "$PROJECT_ID"

# ── Enable APIs ──
echo "Step 1/6 — Enabling Google Cloud APIs..."
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  containerregistry.googleapis.com \
  texttospeech.googleapis.com \
  storage.googleapis.com \
  --quiet
echo "✓ APIs enabled"

# ── Cloud Storage bucket ──
echo ""
echo "Step 2/6 — Creating Cloud Storage bucket..."
gsutil mb -p "$PROJECT_ID" -l "$REGION" "gs://$BUCKET_NAME" 2>/dev/null || echo "  Bucket already exists — skipping"
gsutil iam ch allUsers:objectViewer "gs://$BUCKET_NAME" 2>/dev/null || true
echo "✓ Bucket ready: gs://$BUCKET_NAME"

# ── Deploy Agent Server ──
echo ""
echo "Step 3/6 — Building & deploying Agent Server (CrewAI + Gemini)..."
gcloud builds submit ./agent-server \
  --tag "gcr.io/$PROJECT_ID/reelmind-agent-server" \
  --quiet

gcloud run deploy reelmind-agent-server \
  --image "gcr.io/$PROJECT_ID/reelmind-agent-server" \
  --platform managed \
  --region "$REGION" \
  --port 8000 \
  --memory 4Gi \
  --cpu 2 \
  --timeout 600 \
  --concurrency 5 \
  --min-instances 0 \
  --max-instances 10 \
  --set-env-vars "GEMINI_API_KEY=$GEMINI_API_KEY" \
  --allow-unauthenticated \
  --quiet

AGENT_URL=$(gcloud run services describe reelmind-agent-server \
  --platform managed --region "$REGION" --format 'value(status.url)')
echo "✓ Agent Server live: $AGENT_URL"

# ── Deploy Video Pipeline ──
echo ""
echo "Step 4/6 — Building & deploying Video Pipeline (FFmpeg + ElevenLabs + Pexels)..."
gcloud builds submit ./video-pipeline \
  --tag "gcr.io/$PROJECT_ID/reelmind-video-pipeline" \
  --quiet

gcloud run deploy reelmind-video-pipeline \
  --image "gcr.io/$PROJECT_ID/reelmind-video-pipeline" \
  --platform managed \
  --region "$REGION" \
  --port 8001 \
  --memory 8Gi \
  --cpu 4 \
  --timeout 600 \
  --concurrency 3 \
  --min-instances 0 \
  --max-instances 5 \
  --set-env-vars "PEXELS_API_KEY=$PEXELS_API_KEY,ELEVENLABS_API_KEY=$ELEVENLABS_API_KEY,GCS_BUCKET_NAME=$BUCKET_NAME,GEMINI_API_KEY=$GEMINI_API_KEY" \
  --allow-unauthenticated \
  --quiet

VIDEO_URL=$(gcloud run services describe reelmind-video-pipeline \
  --platform managed --region "$REGION" --format 'value(status.url)')
echo "✓ Video Pipeline live: $VIDEO_URL"

# ── Deploy Frontend ──
echo ""
echo "Step 5/6 — Building & deploying Frontend (Next.js)..."
gcloud builds submit ./reel-forge-stellar-spark-8mum \
  --tag "gcr.io/$PROJECT_ID/reelmind-frontend" \
  --quiet

gcloud run deploy reelmind-frontend \
  --image "gcr.io/$PROJECT_ID/reelmind-frontend" \
  --platform managed \
  --region "$REGION" \
  --port 3333 \
  --memory 2Gi \
  --cpu 2 \
  --timeout 60 \
  --concurrency 100 \
  --min-instances 1 \
  --max-instances 20 \
  --set-env-vars "AGENT_SERVER_URL=$AGENT_URL,VIDEO_PIPELINE_URL=$VIDEO_URL,NODE_ENV=production" \
  --allow-unauthenticated \
  --quiet

FRONTEND_URL=$(gcloud run services describe reelmind-frontend \
  --platform managed --region "$REGION" --format 'value(status.url)')

# ── Save URLs to file ──
echo ""
echo "Step 6/6 — Saving live URLs..."
cat > LIVE_URLS.txt << EOF
ReelMind AI — Live URLs
========================
Frontend (share this with clients):
$FRONTEND_URL

Agent Server:
$AGENT_URL

Video Pipeline:
$VIDEO_URL

Deployed: $(date)
Project: $PROJECT_ID
EOF

echo ""
echo "================================================"
echo "  DEPLOYMENT COMPLETE!"
echo "================================================"
echo ""
echo "  Share this with clients:"
echo "  $FRONTEND_URL"
echo ""
echo "  All pages:"
echo "  $FRONTEND_URL              — AI Ad Generator"
echo "  $FRONTEND_URL/cinematic    — Cinematic Editor"
echo "  $FRONTEND_URL/smart-cinematic — Smart AI Editor"
echo "  $FRONTEND_URL/dashboard    — Video Library"
echo ""
echo "  URLs saved to: LIVE_URLS.txt"
echo "================================================"
