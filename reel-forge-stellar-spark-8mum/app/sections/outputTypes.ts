export interface SlideData {
  title: string
  subtitle: string
  background: string
  accent: string
  durationInFrames: number
  transition: { type: string; direction?: string }
  sound_effect?: string
}

export interface AdStrategy {
  product_analysis?: {
    category?: string
    price_segment?: string
    target_demographic?: string
    unique_selling_points?: string
  }
  ad_type_rankings?: Array<{
    ad_type?: string
    probability_score?: number
    reasoning?: string
  }>
  recommended_format?: {
    format?: string
    duration_seconds?: number
    aspect_ratio?: string
    platform?: string
  }
  creative_brief?: Record<string, string>
  competitive_insights?: string
}

export interface CMOEvaluation {
  verdict?: string
  overall_score?: number
  dimension_scores?: {
    hook_strength?: number
    emotional_impact?: number
    brand_alignment?: number
    cta_effectiveness?: number
    viral_potential?: number
    audience_resonance?: number
    pacing_flow?: number
    uniqueness?: number
    brand_safety?: number
    conversion_potential?: number
  }
  detailed_feedback?: string
  improvement_suggestions?: string
  ab_test_variations?: {
    hook_variation?: string
    cta_variation?: string
  }
  performance_projections?: {
    estimated_cpm?: string
    estimated_cpc?: string
    estimated_conversion_rate?: string
    estimated_engagement_rate?: string
  }
  compliance_check?: {
    brand_safe?: boolean
    legal_compliant?: boolean
    cultural_sensitive?: boolean
    issues_found?: string
  }
}

export interface AudioDirection {
  background_music?: {
    genre?: string
    sub_genre?: string
    bpm?: number
    mood?: string
    energy_level?: string
    key_instruments?: string
  }
  sound_effects?: Array<{
    scene?: string
    effect_name?: string
    timing?: string
    intensity?: string
  }>
  voice_design?: Record<string, string | number>
  music_intensity_curve?: Array<{
    scene_label?: string
    intensity_level?: number
    description?: string
  }>
  audio_mixing?: {
    voice_level_db?: number
    music_level_db?: number
    sfx_level_db?: number
    ducking_strategy?: string
  }
  audio_recommendation?: string
}

export interface VoiceScript {
  version_a?: {
    style?: string
    full_script?: string
    word_count?: number
    estimated_duration_seconds?: number
    scene_markers?: Array<{
      scene?: string
      line?: string
      timing?: string
      emotion?: string
    }>
  }
  version_b?: {
    style?: string
    full_script?: string
    word_count?: number
    estimated_duration_seconds?: number
    scene_markers?: Array<{
      scene?: string
      line?: string
      timing?: string
      emotion?: string
    }>
  }
  pronunciation_guide?: string
  language?: string
  recommended_version?: string
}

export interface AvatarDirection {
  avatar_design?: Record<string, string>
  shot_list?: Array<{
    scene_number?: number
    scene_type?: string
    duration_seconds?: number
    camera_angle?: string
    camera_movement?: string
    lighting?: string
    background?: string
    visual_description?: string
    product_interaction?: string
    text_overlay?: string
    transition?: string
    cinematic_effect?: string
  }>
  color_grading?: string
  overall_visual_style?: string
  b_roll_descriptions?: Array<{
    shot_description?: string
    purpose?: string
    timing?: string
  }>
  text_style?: Record<string, string>
}

export interface ProductionResult {
  production_status?: string
  trend_summary?: string
  selected_persona?: { name?: string; emotional_tone?: string }
  winning_script?: {
    hook?: string
    body?: string
    cta?: string
    composite_score?: number
    creative_angle?: string
    language?: string
    background_music_genre?: string
    audio_mood?: string
    sound_effects?: string[]
  }
  all_script_scores?: Array<{ script_number?: number; composite_score?: number }>
  video_result?: {
    video_url?: string
    duration_seconds?: number
    style_applied?: string
    resolution?: string
    compositionId?: string
    slides?: SlideData[]
    html_code?: string
    creative_concept?: string
    scene_count?: number
    total_duration_seconds?: number
    video_style?: string
    background_music?: {
      genre?: string
      mood?: string
      tempo?: string
      recommended_track_style?: string
    }
    audio_transitions?: string
  }
  viral_score?: number
  emotional_tone?: string
  production_metadata?: {
    total_processing_time?: string
    agents_used?: string[]
    pipeline_steps_completed?: number
    script_language?: string
    audio_settings?: { music_genre?: string; audio_mood?: string }
  }
  content_type_used?: string
  platform_optimization?: string
  ad_strategy?: AdStrategy
  cmo_evaluation?: CMOEvaluation
  audio_direction?: AudioDirection
  voice_script?: VoiceScript
  avatar_direction?: AvatarDirection
}
