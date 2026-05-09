from crewai import Task


def create_ad_strategy_task(agent, product_name, product_description, platform, language):
    return Task(
        description=f"""
        Analyze this product and create a comprehensive ad strategy.

        Product Name: {product_name}
        Product Description: {product_description}
        Target Platform: {platform}
        Language: {language}

        Deliver a JSON response with:
        {{
            "product_analysis": {{
                "category": "product category",
                "price_segment": "budget/mid/premium",
                "target_demographic": "who buys this",
                "unique_selling_points": "key USPs"
            }},
            "ad_type_rankings": [
                {{"ad_type": "Product Demo", "probability_score": 92, "reasoning": "why"}},
                {{"ad_type": "UGC Testimonial", "probability_score": 85, "reasoning": "why"}},
                {{"ad_type": "Before/After", "probability_score": 74, "reasoning": "why"}}
            ],
            "recommended_format": {{
                "format": "Vertical Reel",
                "duration_seconds": 20,
                "aspect_ratio": "9:16",
                "platform": "{platform}"
            }},
            "creative_brief": {{
                "mood": "tone of the ad",
                "color_palette": "colors to use",
                "pacing": "fast/medium/slow",
                "music_style": "music genre",
                "hook_strategy": "how to open",
                "target_emotion": "emotion to trigger"
            }},
            "competitive_insights": "what competitors miss"
        }}
        """,
        agent=agent,
        expected_output="JSON with complete ad strategy including product analysis, ad type rankings, recommended format, creative brief, and competitive insights",
    )


def create_trendsync_task(agent, product_name, platform, language):
    return Task(
        description=f"""
        Research current viral trends for this product category on {platform}.

        Product: {product_name}
        Platform: {platform}
        Language: {language}

        Deliver a JSON response with:
        {{
            "trend_summary": "markdown summary of current trends",
            "viral_hooks": ["hook 1", "hook 2", "hook 3"],
            "trending_formats": ["format 1", "format 2"],
            "trending_sounds": ["sound style 1", "sound style 2"],
            "hashtag_strategy": ["#tag1", "#tag2", "#tag3"],
            "competitor_gaps": "what competitors are missing",
            "viral_potential_factors": ["factor 1", "factor 2"]
        }}
        """,
        agent=agent,
        expected_output="JSON with trend summary, viral hooks, trending formats, sounds, hashtags, and competitor gaps",
    )


def create_buyermind_task(agent, product_name, product_description, language):
    return Task(
        description=f"""
        Create detailed buyer personas for this product.

        Product: {product_name}
        Description: {product_description}
        Language/Region: {language}

        Deliver a JSON response with:
        {{
            "primary_persona": {{
                "name": "persona name",
                "age_range": "25-35",
                "emotional_tone": "aspirational & warm",
                "pain_points": ["pain 1", "pain 2"],
                "desires": ["desire 1", "desire 2"],
                "buying_triggers": ["trigger 1", "trigger 2"],
                "objections": ["objection 1", "objection 2"],
                "cultural_context": "regional/cultural notes"
            }},
            "secondary_persona": {{
                "name": "persona name",
                "age_range": "35-50",
                "emotional_tone": "practical & value-driven",
                "pain_points": ["pain 1"],
                "desires": ["desire 1"],
                "buying_triggers": ["trigger 1"],
                "objections": ["objection 1"],
                "cultural_context": "regional/cultural notes"
            }},
            "messaging_strategy": "how to speak to these personas"
        }}
        """,
        agent=agent,
        expected_output="JSON with primary and secondary buyer personas including pain points, desires, triggers, and messaging strategy",
    )


def create_scriptwriter_task(agent, product_name, product_description, content_type, language, duration_seconds):
    return Task(
        description=f"""
        Write 3 high-converting ad scripts for this product.

        Product: {product_name}
        Description: {product_description}
        Content Type: {content_type}
        Language: {language}
        Duration: {duration_seconds} seconds

        IMPORTANT: Write ALL scripts in {language} language. If it's a regional language like
        Hindi, Tamil, Telugu, Kannada, Malayalam, Bengali etc — write the actual script text
        in that language script/characters.

        Deliver a JSON response with:
        {{
            "scripts": [
                {{
                    "script_number": 1,
                    "hook": "opening line in {language}",
                    "body": "main content in {language}",
                    "cta": "call to action in {language}",
                    "composite_score": 92,
                    "creative_angle": "angle name",
                    "word_count": 65,
                    "estimated_duration_seconds": {duration_seconds}
                }},
                {{
                    "script_number": 2,
                    "hook": "opening line in {language}",
                    "body": "main content in {language}",
                    "cta": "call to action in {language}",
                    "composite_score": 85,
                    "creative_angle": "angle name",
                    "word_count": 60,
                    "estimated_duration_seconds": {duration_seconds}
                }},
                {{
                    "script_number": 3,
                    "hook": "opening line in {language}",
                    "body": "main content in {language}",
                    "cta": "call to action in {language}",
                    "composite_score": 78,
                    "creative_angle": "angle name",
                    "word_count": 55,
                    "estimated_duration_seconds": {duration_seconds}
                }}
            ],
            "winning_script": {{
                "script_number": 1,
                "hook": "best hook in {language}",
                "body": "best body in {language}",
                "cta": "best cta in {language}",
                "composite_score": 92,
                "creative_angle": "angle",
                "language": "{language}",
                "background_music_genre": "genre",
                "audio_mood": "mood"
            }},
            "all_script_scores": [
                {{"script_number": 1, "composite_score": 92}},
                {{"script_number": 2, "composite_score": 85}},
                {{"script_number": 3, "composite_score": 78}}
            ]
        }}
        """,
        agent=agent,
        expected_output=f"JSON with 3 ad scripts in {language}, winning script selection, and all script scores",
    )


def create_cmo_evaluator_task(agent, product_name, language):
    return Task(
        description=f"""
        Evaluate the winning ad script for {product_name} in {language}.

        Score it across 10 dimensions (each out of 10):
        1. Hook Strength
        2. Emotional Impact
        3. Brand Alignment
        4. CTA Effectiveness
        5. Viral Potential
        6. Audience Resonance
        7. Pacing & Flow
        8. Uniqueness
        9. Brand Safety
        10. Conversion Potential

        Deliver a JSON response with:
        {{
            "verdict": "APPROVE or REVISE",
            "overall_score": 88,
            "dimension_scores": {{
                "hook_strength": 9,
                "emotional_impact": 8,
                "brand_alignment": 9,
                "cta_effectiveness": 8,
                "viral_potential": 9,
                "audience_resonance": 9,
                "pacing_flow": 8,
                "uniqueness": 7,
                "brand_safety": 10,
                "conversion_potential": 8
            }},
            "detailed_feedback": "specific feedback on the script",
            "improvement_suggestions": "bullet points of improvements",
            "ab_test_variations": {{
                "hook_variation": "alternative hook",
                "cta_variation": "alternative CTA"
            }},
            "performance_projections": {{
                "estimated_cpm": "$8-12",
                "estimated_cpc": "$0.45-0.75",
                "estimated_conversion_rate": "3.2-4.8%",
                "estimated_engagement_rate": "6.5-9.2%"
            }},
            "compliance_check": {{
                "brand_safe": true,
                "legal_compliant": true,
                "cultural_sensitive": true,
                "issues_found": "None"
            }}
        }}
        """,
        agent=agent,
        expected_output="JSON with CMO evaluation including scores, feedback, projections, and compliance check",
    )


def create_audio_director_task(agent, product_name, language, platform):
    return Task(
        description=f"""
        Design the complete audio landscape for the {product_name} ad.

        Language/Region: {language}
        Platform: {platform}

        Make music culturally appropriate — e.g., Bollywood-inspired for Hindi,
        Carnatic-influenced for Tamil/Telugu, etc.

        Deliver a JSON response with:
        {{
            "background_music": {{
                "genre": "Pop",
                "sub_genre": "Lo-fi Pop",
                "bpm": 120,
                "mood": "Warm & Uplifting",
                "energy_level": "Medium-High",
                "key_instruments": "acoustic guitar, synth",
                "cultural_style": "regional music style if applicable",
                "mubert_tags": ["upbeat", "commercial", "positive"]
            }},
            "sound_effects": [
                {{"scene": "Hook", "effect_name": "Notification ping", "timing": "0s", "intensity": "Subtle"}},
                {{"scene": "Product reveal", "effect_name": "Whoosh", "timing": "4s", "intensity": "Medium"}},
                {{"scene": "CTA", "effect_name": "Cash register", "timing": "15s", "intensity": "Prominent"}}
            ],
            "voice_design": {{
                "voice_type": "Conversational",
                "gender": "Female",
                "age_range": "25-30",
                "accent": "Regional accent matching {language}",
                "speaking_style": "Friendly & authentic",
                "emotion": "Excited but genuine",
                "words_per_minute": 150,
                "language": "{language}",
                "elevenlabs_voice_id": "recommended voice id or style"
            }},
            "audio_mixing": {{
                "voice_level_db": -6,
                "music_level_db": -18,
                "sfx_level_db": -12,
                "ducking_strategy": "Auto-duck music during voiceover"
            }},
            "audio_recommendation": "overall audio direction note"
        }}
        """,
        agent=agent,
        expected_output="JSON with complete audio direction including music specs, sound effects, voice design, and mixing levels",
    )


def create_voice_script_task(agent, product_name, language, duration_seconds):
    return Task(
        description=f"""
        Create two voiceover script versions for the {product_name} ad.

        Language: {language}
        Duration: {duration_seconds} seconds

        Write the actual voiceover text in {language}. Include:
        - Scene markers with timing
        - Emotion directions
        - Pause markers [PAUSE], [BEAT]
        - Emphasis markers in CAPS
        - Pronunciation guide for difficult words

        Deliver a JSON response with:
        {{
            "version_a": {{
                "style": "Conversational Storyteller",
                "full_script": "complete script in {language} with markers",
                "word_count": 65,
                "estimated_duration_seconds": {duration_seconds},
                "scene_markers": [
                    {{"scene": "Hook", "line": "opening line", "timing": "0-3s", "emotion": "Urgent"}},
                    {{"scene": "Problem", "line": "problem line", "timing": "3-6s", "emotion": "Relatable"}},
                    {{"scene": "Solution", "line": "solution line", "timing": "6-12s", "emotion": "Excited"}},
                    {{"scene": "CTA", "line": "cta line", "timing": "12-{duration_seconds}s", "emotion": "Confident"}}
                ]
            }},
            "version_b": {{
                "style": "Energetic Presenter",
                "full_script": "complete script in {language} with markers",
                "word_count": 58,
                "estimated_duration_seconds": {duration_seconds},
                "scene_markers": [
                    {{"scene": "Hook", "line": "opening line", "timing": "0-2s", "emotion": "Bold"}},
                    {{"scene": "Value Prop", "line": "value line", "timing": "2-7s", "emotion": "Curious"}},
                    {{"scene": "Product", "line": "product line", "timing": "7-13s", "emotion": "Proud"}},
                    {{"scene": "CTA", "line": "cta line", "timing": "13-{duration_seconds}s", "emotion": "Urgent"}}
                ]
            }},
            "pronunciation_guide": "guide for difficult words in {language}",
            "language": "{language}",
            "recommended_version": "A"
        }}
        """,
        agent=agent,
        expected_output=f"JSON with two voiceover script versions in {language} with scene markers and pronunciation guide",
    )


def create_avatar_director_task(agent, product_name, product_description, language, duration_seconds):
    return Task(
        description=f"""
        Create a detailed visual storyboard for the {product_name} ad.

        Product: {product_name}
        Description: {product_description}
        Language/Region: {language}
        Duration: {duration_seconds} seconds
        Format: 9:16 vertical (1080x1920)

        For each scene provide stock video search keywords that will find relevant footage.

        Deliver a JSON response with:
        {{
            "shot_list": [
                {{
                    "scene_number": 1,
                    "scene_type": "Hook",
                    "duration_seconds": 3,
                    "camera_angle": "Close-up",
                    "camera_movement": "Slow zoom in",
                    "lighting": "Warm natural light",
                    "background": "Clean minimal",
                    "visual_description": "detailed description",
                    "stock_video_keywords": ["keyword1", "keyword2", "keyword3"],
                    "text_overlay": "text to show on screen",
                    "text_position": "top/center/bottom",
                    "transition": "fade/cut/wipe",
                    "color_grade": "warm/cool/vibrant"
                }},
                {{
                    "scene_number": 2,
                    "scene_type": "Problem",
                    "duration_seconds": 4,
                    "camera_angle": "Medium shot",
                    "camera_movement": "Static",
                    "lighting": "Natural daylight",
                    "background": "Home/office setting",
                    "visual_description": "detailed description",
                    "stock_video_keywords": ["keyword1", "keyword2"],
                    "text_overlay": "problem statement",
                    "text_position": "center",
                    "transition": "cut",
                    "color_grade": "slightly desaturated"
                }},
                {{
                    "scene_number": 3,
                    "scene_type": "Solution/Product",
                    "duration_seconds": 6,
                    "camera_angle": "Product shot",
                    "camera_movement": "Orbit",
                    "lighting": "Studio lighting",
                    "background": "Clean white/gradient",
                    "visual_description": "product hero shot",
                    "stock_video_keywords": ["product demo", "lifestyle"],
                    "text_overlay": "key benefit",
                    "text_position": "bottom",
                    "transition": "wipe",
                    "color_grade": "vibrant and warm"
                }},
                {{
                    "scene_number": 4,
                    "scene_type": "Social Proof",
                    "duration_seconds": 4,
                    "camera_angle": "Medium close-up",
                    "camera_movement": "Handheld",
                    "lighting": "Natural",
                    "background": "Real environment",
                    "visual_description": "happy customer using product",
                    "stock_video_keywords": ["happy customer", "lifestyle"],
                    "text_overlay": "testimonial or stat",
                    "text_position": "center",
                    "transition": "cut",
                    "color_grade": "warm and inviting"
                }},
                {{
                    "scene_number": 5,
                    "scene_type": "CTA",
                    "duration_seconds": 3,
                    "camera_angle": "Close-up product",
                    "camera_movement": "Slow push in",
                    "lighting": "Dramatic",
                    "background": "Brand color",
                    "visual_description": "product with offer text",
                    "stock_video_keywords": ["buy now", "offer", "deal"],
                    "text_overlay": "CTA with offer",
                    "text_position": "center",
                    "transition": "fade out",
                    "color_grade": "bold and high contrast"
                }}
            ],
            "overall_visual_style": "cinematic/ugc/minimal/bold",
            "color_palette": ["#hex1", "#hex2", "#hex3"],
            "font_style": "bold sans-serif/elegant serif/playful",
            "text_animation": "slide-in/fade/pop",
            "b_roll_keywords": ["general b-roll keyword 1", "general b-roll keyword 2"]
        }}
        """,
        agent=agent,
        expected_output="JSON with complete 5-scene storyboard including stock video keywords, text overlays, and visual direction",
    )


def create_video_renderer_task(agent, product_name, language, duration_seconds):
    return Task(
        description=f"""
        Compile all outputs from the previous agents into a final video production package
        for {product_name} in {language}.

        Combine the ad strategy, script, audio direction, voice script, and storyboard
        into a single comprehensive production JSON.

        Deliver a JSON response with:
        {{
            "production_status": "Completed",
            "content_type_used": "content type from strategy",
            "platform_optimization": "platform name (aspect ratio)",
            "selected_persona": {{
                "name": "persona name",
                "emotional_tone": "tone"
            }},
            "viral_score": 88,
            "emotional_tone": "Aspirational & Energetic",
            "production_metadata": {{
                "total_duration_seconds": {duration_seconds},
                "scene_count": 5,
                "language": "{language}",
                "agents_used": ["AdStrategy", "TrendSync", "BuyerMind", "ScriptWriter", "CMOEvaluator", "AudioDirector", "VoiceScript", "AvatarDirector", "VideoRenderer"],
                "pipeline_steps_completed": 9,
                "video_format": "9:16 Vertical",
                "resolution": "1080x1920"
            }},
            "render_ready": true,
            "video_generation_tier": "free"
        }}
        """,
        agent=agent,
        expected_output="JSON with final production package including all metadata and render-ready flag",
    )
