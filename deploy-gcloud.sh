#!/bin/bash
# ============================================================
# ReelForge AI — Google Cloud Deployment Script
# Project: bolofyofficial
# ============================================================

set -e

PROJECT_ID="bolofyofficial"
REGION="us-central1"
GEMINI_API_KEY="AIzaSyDB1QPnAIS4kY0Z2-pF6cow1hLYHClE6Gg"
PEXELS_API_KEY="GEsNoIUG32Nw513LYA2F18mM3lbQ1ONiWQmzd1Rlo1OPa8HBTdWjmZTo"
ELEVENLABS_API_KEY="sk_108473985b123c76ab1b2402c7583d3a6088efd76a99f837"
HEYGEN_API_KEY="${HEYGEN_API_KEY:-}"
PIXABAY_API_KEY="${PIXABAY_API_KEY:-}"
BUCKET_NAME="bolofyofficial-reelforge-videos"

echo "================================================"
echo "  ReelForge AI — Deploying to Google Cloud"
echo "  Project: $PROJECT_ID"
echo "  Region:  $REGION"
echo "================================================"

# Set project
gcloud config set project "$PROJECT_ID"

# Enable required APIs
echo ""
echo "Step 1: Enabling Google Cloud APIs..."
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  containerregistry.googleapis.com \
  texttospeech.googleapis.com \
  storage.googleapis.com \
  --quiet

echo "APIs enabled."

# Create GCS bucket for videos
echo ""
echo "Step 2: Creating Cloud Storage bucket..."
gsutil mb -p "$PROJECT_ID" -l "$REGION" "gs://$BUCKET_NAME" 2>/dev/null || echo "Bucket already exists — skipping."
gsutil iam ch allUsers:objectViewer "gs://$BUCKET_NAME" 2>/dev/null || true
echo "Bucket ready: gs://$BUCKET_NAME"

# Build and deploy Agent Server
echo ""
echo "Step 3: Building Agent Server (CrewAI + Gemini)..."
gcloud builds submit ./agent-server \
  --tag "gcr.io/$PROJECT_ID/reelforge-agent-server" \
  --quiet

echo "Deploying Agent Server to Cloud Run..."
gcloud run deploy reelforge-agent-server \
  --image "gcr.io/$PROJECT_ID/reelforge-agent-server" \
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

AGENT_SERVER_URL=$(gcloud run services describe reelforge-agent-server \
  --platform managed --region "$REGION" --format 'value(status.url)')
echo "Agent Server: $AGENT_SERVER_URL"

# Build and deploy Video Pipeline
echo ""
echo "Step 4: Building Video Pipeline (FFmpeg + TTS + Pexels)..."
gcloud builds submit ./video-pipeline \
  --tag "gcr.io/$PROJECT_ID/reelforge-video-pipeline" \
  --quiet

echo "Deploying Video Pipeline to Cloud Run..."
gcloud run deploy reelforge-video-pipeline \
  --image "gcr.io/$PROJECT_ID/reelforge-video-pipeline" \
  --platform managed \
  --region "$REGION" \
  --port 8001 \
  --memory 8Gi \
  --cpu 4 \
  --timeout 600 \
  --concurrency 3 \
  --min-instances 0 \
  --max-instances 5 \
  --set-env-vars "PEXELS_API_KEY=$PEXELS_API_KEY,ELEVENLABS_API_KEY=$ELEVENLABS_API_KEY,GCS_BUCKET_NAME=$BUCKET_NAME,HEYGEN_API_KEY=$HEYGEN_API_KEY,PIXABAY_API_KEY=$PIXABAY_API_KEY" \
  --allow-unauthenticated \
  --quiet

VIDEO_PIPELINE_URL=$(gcloud run services describe reelforge-video-pipeline \
  --platform managed --region "$REGION" --format 'value(status.url)')
echo "Video Pipeline: $VIDEO_PIPELINE_URL"

# Build and deploy Frontend
echo ""
echo "Step 5: Building Frontend (Next.js)..."
gcloud builds submit ./reel-forge-stellar-spark-8mum \
  --tag "gcr.io/$PROJECT_ID/reelforge-frontend" \
  --quiet

echo "Deploying Frontend to Cloud Run..."
gcloud run deploy reelforge-frontend \
  --image "gcr.io/$PROJECT_ID/reelforge-frontend" \
  --platform managed \
  --region "$REGION" \
  --port 3333 \
  --memory 2Gi \
  --cpu 2 \
  --timeout 60 \
  --concurrency 100 \
  --min-instances 1 \
  --max-instances 20 \
  --set-env-vars "AGENT_SERVER_URL=$AGENT_SERVER_URL,VIDEO_PIPELINE_URL=$VIDEO_PIPELINE_URL,NODE_ENV=production" \
  --allow-unauthenticated \
  --quiet

FRONTEND_URL=$(gcloud run services describe reelforge-frontend \
  --platform managed --region "$REGION" --format 'value(status.url)')

echo ""
echo "================================================"
echo "  DEPLOYMENT COMPLETE!"
echo "================================================"
echo ""
echo "  Your App URL:   $FRONTEND_URL"
echo "  Agent Server:   $AGENT_SERVER_URL"
echo "  Video Pipeline: $VIDEO_PIPELINE_URL"
echo ""
echo "  Open: $FRONTEND_URL"
echo "================================================"
