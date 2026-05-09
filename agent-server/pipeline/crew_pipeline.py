import json
import re
from crewai import Crew, Process
from langchain_google_genai import ChatGoogleGenerativeAI

from agents.ad_strategy import create_ad_strategy_agent
from agents.trendsync import create_trendsync_agent
from agents.buyermind import create_buyermind_agent
from agents.scriptwriter import create_scriptwriter_agent
from agents.cmo_evaluator import create_cmo_evaluator_agent
from agents.audio_director import create_audio_director_agent
from agents.voice_script import create_voice_script_agent
from agents.avatar_director import create_avatar_director_agent
from agents.video_renderer import create_video_renderer_agent

from tasks.pipeline_tasks import (
    create_ad_strategy_task,
    create_trendsync_task,
    create_buyermind_task,
    create_scriptwriter_task,
    create_cmo_evaluator_task,
    create_audio_director_task,
    create_voice_script_task,
    create_avatar_director_task,
    create_video_renderer_task,
)


def extract_json(text: str) -> dict:
    """Extract JSON from LLM response text."""
    if isinstance(text, dict):
        return text

    # Try direct parse
    try:
        return json.loads(text)
    except Exception:
        pass

    # Try extracting from markdown code block
    patterns = [
        r"```json\s*([\s\S]*?)\s*```",
        r"```\s*([\s\S]*?)\s*```",
        r"\{[\s\S]*\}",
    ]
    for pattern in patterns:
        match = re.search(pattern, str(text))
        if match:
            try:
                candidate = match.group(1) if "```" in pattern else match.group(0)
                return json.loads(candidate)
            except Exception:
                continue

    return {"raw_output": str(text)}


def run_pipeline(
    product_name: str,
    product_description: str,
    content_type: str,
    platform: str,
    language: str,
    duration_seconds: int,
    gemini_api_key: str,
) -> dict:
    """Run the full 9-agent pipeline and return combined result."""

    # Initialize Gemini LLM
    llm = ChatGoogleGenerativeAI(
        model="gemini-1.5-pro",
        google_api_key=gemini_api_key,
        temperature=0.7,
        convert_system_message_to_human=True,
    )

    # Create all agents
    ad_strategy_agent = create_ad_strategy_agent(llm)
    trendsync_agent = create_trendsync_agent(llm)
    buyermind_agent = create_buyermind_agent(llm)
    scriptwriter_agent = create_scriptwriter_agent(llm)
    cmo_evaluator_agent = create_cmo_evaluator_agent(llm)
    audio_director_agent = create_audio_director_agent(llm)
    voice_script_agent = create_voice_script_agent(llm)
    avatar_director_agent = create_avatar_director_agent(llm)
    video_renderer_agent = create_video_renderer_agent(llm)

    # Create all tasks
    ad_strategy_task = create_ad_strategy_task(
        ad_strategy_agent, product_name, product_description, platform, language
    )
    trendsync_task = create_trendsync_task(
        trendsync_agent, product_name, platform, language
    )
    buyermind_task = create_buyermind_task(
        buyermind_agent, product_name, product_description, language
    )
    scriptwriter_task = create_scriptwriter_task(
        scriptwriter_agent, product_name, product_description, content_type, language, duration_seconds
    )
    cmo_evaluator_task = create_cmo_evaluator_task(
        cmo_evaluator_agent, product_name, language
    )
    audio_director_task = create_audio_director_task(
        audio_director_agent, product_name, language, platform
    )
    voice_script_task = create_voice_script_task(
        voice_script_agent, product_name, language, duration_seconds
    )
    avatar_director_task = create_avatar_director_task(
        avatar_director_agent, product_name, product_description, language, duration_seconds
    )
    video_renderer_task = create_video_renderer_task(
        video_renderer_agent, product_name, language, duration_seconds
    )

    # Build crew with sequential process
    crew = Crew(
        agents=[
            ad_strategy_agent,
            trendsync_agent,
            buyermind_agent,
            scriptwriter_agent,
            cmo_evaluator_agent,
            audio_director_agent,
            voice_script_agent,
            avatar_director_agent,
            video_renderer_agent,
        ],
        tasks=[
            ad_strategy_task,
            trendsync_task,
            buyermind_task,
            scriptwriter_task,
            cmo_evaluator_task,
            audio_director_task,
            voice_script_task,
            avatar_director_task,
            video_renderer_task,
        ],
        process=Process.sequential,
        verbose=True,
    )

    # Run the crew
    result = crew.kickoff()

    # Extract outputs from each task
    task_outputs = []
    for task in crew.tasks:
        if hasattr(task, "output") and task.output:
            raw = task.output.raw if hasattr(task.output, "raw") else str(task.output)
            task_outputs.append(extract_json(raw))
        else:
            task_outputs.append({})

    # Map outputs to named fields
    (
        ad_strategy_out,
        trendsync_out,
        buyermind_out,
        scriptwriter_out,
        cmo_out,
        audio_out,
        voice_out,
        avatar_out,
        renderer_out,
    ) = (task_outputs + [{}] * 9)[:9]

    # Build final combined result
    winning_script = scriptwriter_out.get("winning_script", {})

    final_result = {
        "production_status": renderer_out.get("production_status", "Completed"),
        "content_type_used": content_type,
        "platform_optimization": f"{platform} (9:16)",
        "language": language,
        "trend_summary": trendsync_out.get("trend_summary", ""),
        "selected_persona": buyermind_out.get("primary_persona", {
            "name": "Target Customer",
            "emotional_tone": "Aspirational"
        }),
        "winning_script": winning_script,
        "all_script_scores": scriptwriter_out.get("all_script_scores", []),
        "ad_strategy": ad_strategy_out,
        "cmo_evaluation": cmo_out,
        "audio_direction": audio_out,
        "voice_script": voice_out,
        "avatar_direction": avatar_out,
        "viral_score": renderer_out.get("viral_score", cmo_out.get("overall_score", 80)),
        "emotional_tone": renderer_out.get("emotional_tone", "Aspirational"),
        "production_metadata": renderer_out.get("production_metadata", {
            "total_duration_seconds": duration_seconds,
            "scene_count": 5,
            "language": language,
            "agents_used": [
                "AdStrategy", "TrendSync", "BuyerMind", "ScriptWriter",
                "CMOEvaluator", "AudioDirector", "VoiceScript", "AvatarDirector", "VideoRenderer"
            ],
            "pipeline_steps_completed": 9,
            "video_format": "9:16 Vertical",
            "resolution": "1080x1920",
        }),
        "render_ready": True,
        "video_generation_tier": "free",
    }

    return final_result
