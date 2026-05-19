@echo off
REM ============================================================
REM ReelMind AI — Google Cloud Run Deployment (Windows)
REM Double-click this file after installing gcloud CLI
REM ============================================================

set PROJECT_ID=bolofyofficial
set REGION=us-central1
set GEMINI_API_KEY=AIzaSyDB1QPnAIS4kY0Z2-pF6cow1hLYHClE6Gg
set PEXELS_API_KEY=GEsNoIUG32Nw513LYA2F18mM3lbQ1ONiWQmzd1Rlo1OPa8HBTdWjmZTo
set ELEVENLABS_API_KEY=sk_108473985b123c76ab1b2402c7583d3a6088efd76a99f837
set BUCKET_NAME=bolofyofficial-reelforge-videos

echo.
echo ================================================
echo   ReelMind AI - Deploying to Google Cloud Run
echo   Project: %PROJECT_ID%
echo ================================================
echo.

REM Set project
gcloud config set project %PROJECT_ID%

REM Enable APIs
echo Step 1/6 - Enabling APIs...
gcloud services enable run.googleapis.com cloudbuild.googleapis.com containerregistry.googleapis.com texttospeech.googleapis.com storage.googleapis.com --quiet
echo Done.

REM Create bucket
echo.
echo Step 2/6 - Creating storage bucket...
gsutil mb -p %PROJECT_ID% -l %REGION% gs://%BUCKET_NAME% 2>nul
echo Done.

REM Deploy Agent Server
echo.
echo Step 3/6 - Deploying Agent Server...
gcloud builds submit ./agent-server --tag gcr.io/%PROJECT_ID%/reelmind-agent-server --quiet
gcloud run deploy reelmind-agent-server --image gcr.io/%PROJECT_ID%/reelmind-agent-server --platform managed --region %REGION% --port 8000 --memory 4Gi --cpu 2 --timeout 600 --concurrency 5 --min-instances 0 --max-instances 10 --set-env-vars GEMINI_API_KEY=%GEMINI_API_KEY% --allow-unauthenticated --quiet
for /f "tokens=*" %%i in ('gcloud run services describe reelmind-agent-server --platform managed --region %REGION% --format value(status.url)') do set AGENT_URL=%%i
echo Agent Server: %AGENT_URL%

REM Deploy Video Pipeline
echo.
echo Step 4/6 - Deploying Video Pipeline...
gcloud builds submit ./video-pipeline --tag gcr.io/%PROJECT_ID%/reelmind-video-pipeline --quiet
gcloud run deploy reelmind-video-pipeline --image gcr.io/%PROJECT_ID%/reelmind-video-pipeline --platform managed --region %REGION% --port 8001 --memory 8Gi --cpu 4 --timeout 600 --concurrency 3 --min-instances 0 --max-instances 5 --set-env-vars PEXELS_API_KEY=%PEXELS_API_KEY%,ELEVENLABS_API_KEY=%ELEVENLABS_API_KEY%,GCS_BUCKET_NAME=%BUCKET_NAME%,GEMINI_API_KEY=%GEMINI_API_KEY% --allow-unauthenticated --quiet
for /f "tokens=*" %%i in ('gcloud run services describe reelmind-video-pipeline --platform managed --region %REGION% --format value(status.url)') do set VIDEO_URL=%%i
echo Video Pipeline: %VIDEO_URL%

REM Deploy Frontend
echo.
echo Step 5/6 - Deploying Frontend...
gcloud builds submit ./reel-forge-stellar-spark-8mum --tag gcr.io/%PROJECT_ID%/reelmind-frontend --quiet
gcloud run deploy reelmind-frontend --image gcr.io/%PROJECT_ID%/reelmind-frontend --platform managed --region %REGION% --port 3333 --memory 2Gi --cpu 2 --timeout 60 --concurrency 100 --min-instances 1 --max-instances 20 --set-env-vars AGENT_SERVER_URL=%AGENT_URL%,VIDEO_PIPELINE_URL=%VIDEO_URL%,NODE_ENV=production --allow-unauthenticated --quiet
for /f "tokens=*" %%i in ('gcloud run services describe reelmind-frontend --platform managed --region %REGION% --format value(status.url)') do set FRONTEND_URL=%%i

REM Save URLs
echo.
echo Step 6/6 - Saving URLs...
echo ReelMind AI Live URLs > LIVE_URLS.txt
echo ======================== >> LIVE_URLS.txt
echo Frontend (share with clients): >> LIVE_URLS.txt
echo %FRONTEND_URL% >> LIVE_URLS.txt
echo. >> LIVE_URLS.txt
echo Agent Server: >> LIVE_URLS.txt
echo %AGENT_URL% >> LIVE_URLS.txt
echo. >> LIVE_URLS.txt
echo Video Pipeline: >> LIVE_URLS.txt
echo %VIDEO_URL% >> LIVE_URLS.txt

echo.
echo ================================================
echo   DEPLOYMENT COMPLETE!
echo ================================================
echo.
echo   Share this with clients:
echo   %FRONTEND_URL%
echo.
echo   URLs saved to LIVE_URLS.txt
echo ================================================
echo.
pause
