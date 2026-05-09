"""
ReelForge AI — Agent Server
Pure Gemini API. No CrewAI. No dependency conflicts.
"""

import os
import uuid
import asyncio
from typing import Optional
from concurrent.futures import ThreadPoolExecutor

from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="ReelForge AI — Agent Server", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

job_store: dict = {}
executor = ThreadPoolExecutor(max_workers=3)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")


class GenerateAdRequest(BaseModel):
    product_name: str = ""
    product_description: str = ""
    content_type: str = "Product Demo"
    platform: str = "Instagram Reels"
    language: str = "English"
    duration_seconds: int = 20
    message: str = ""


class JobStatus(BaseModel):
    job_id: str
    status: str
    result: Optional[dict] = None
    error: Optional[str] = None
    progress: int = 0


def run_pipeline_sync(job_id: str, req: dict):
    try:
        job_store[job_id]["status"] = "running"
        job_store[job_id]["progress"] = 10

        from pipeline.gemini_pipeline import run_pipeline

        result = run_pipeline(
            product_name=req["product_name"],
            product_description=req["product_description"],
            content_type=req["content_type"],
            platform=req["platform"],
            language=req["language"],
            duration_seconds=req["duration_seconds"],
            gemini_api_key=GEMINI_API_KEY,
        )

        job_store[job_id]["status"] = "completed"
        job_store[job_id]["result"] = result
        job_store[job_id]["progress"] = 100

    except Exception as e:
        print(f"Pipeline error [{job_id}]: {e}")
        job_store[job_id]["status"] = "failed"
        job_store[job_id]["error"] = str(e)
        job_store[job_id]["progress"] = 0


@app.get("/")
def root():
    return {"service": "ReelForge AI Agent Server", "version": "2.0.0", "status": "running"}


@app.get("/health")
def health():
    return {
        "status": "ok",
        "gemini_configured": bool(GEMINI_API_KEY),
        "active_jobs": len([j for j in job_store.values() if j["status"] == "running"]),
    }


@app.post("/generate", response_model=JobStatus)
async def generate(request: GenerateAdRequest, background_tasks: BackgroundTasks):
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not set in .env")

    # Use message as description fallback
    desc = request.product_description or request.message
    name = request.product_name or desc.split(" ")[:3]
    if isinstance(name, list):
        name = " ".join(name)

    job_id = str(uuid.uuid4())
    job_store[job_id] = {"job_id": job_id, "status": "pending", "result": None, "error": None, "progress": 0}

    loop = asyncio.get_event_loop()
    loop.run_in_executor(executor, run_pipeline_sync, job_id, {
        "product_name": name,
        "product_description": desc,
        "content_type": request.content_type,
        "platform": request.platform,
        "language": request.language,
        "duration_seconds": request.duration_seconds,
    })

    return JobStatus(job_id=job_id, status="pending", progress=0)


@app.get("/status/{job_id}", response_model=JobStatus)
def get_status(job_id: str):
    if job_id not in job_store:
        raise HTTPException(status_code=404, detail="Job not found")
    j = job_store[job_id]
    return JobStatus(job_id=job_id, status=j["status"], result=j.get("result"),
                     error=j.get("error"), progress=j.get("progress", 0))
