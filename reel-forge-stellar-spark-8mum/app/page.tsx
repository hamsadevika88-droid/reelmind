'use client'

import React, { useState, useCallback, useRef } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Cpu, CheckCircle, Zap, Star, Crown, LayoutDashboard } from 'lucide-react'
import type { ProductionResult } from './sections/outputTypes'
import Link from 'next/link'

import Header from './sections/Header'
import InputZone from './sections/InputZone'
import LoadingState from './sections/LoadingState'
import OutputZone from './sections/OutputZone'

// ── Sample data for preview ──
const SAMPLE_DATA: ProductionResult = {
  production_status: 'Completed',
  content_type_used: 'Product Demo',
  platform_optimization: 'Instagram Reels (9:16)',
  trend_summary:
    '## Current Trends\n- **Short-form vertical video** dominates engagement\n- Authentic storytelling with emotional hooks outperform polished ads\n- UGC style increases trust by 42%\n- Bold text overlays with fast cuts drive 3x more shares',
  selected_persona: { name: 'Mindful Millennial Maya', emotional_tone: 'Aspirational & warm' },
  winning_script: {
    hook: 'Stop scrolling. This changed everything about my morning routine.',
    body: 'I used to spend $200/month on coffee runs. Then I discovered AromaBrew.\n\nBarista-quality lattes in 30 seconds. No pods, no waste, just pure flavor.',
    cta: 'Tap the link to get 40% off your first AromaBrew.',
    composite_score: 92,
    creative_angle: 'Morning ritual transformation',
    language: 'English',
    background_music_genre: 'Upbeat Pop',
    audio_mood: 'Energetic & Aspirational',
  },
  all_script_scores: [
    { script_number: 1, composite_score: 92 },
    { script_number: 2, composite_score: 85 },
    { script_number: 3, composite_score: 78 },
  ],
  ad_strategy: {
    product_analysis: {
      category: 'Kitchen Appliances',
      price_segment: 'Premium ($150-300)',
      target_demographic: 'Health-conscious millennials 25-35',
      unique_selling_points: '30-second brew time, smart temperature, no pods, zero waste',
    },
    ad_type_rankings: [
      { ad_type: 'Product Demo', probability_score: 92, reasoning: 'Visual product with clear USP' },
      { ad_type: 'UGC Testimonial', probability_score: 85, reasoning: 'Authentic morning routine' },
      { ad_type: 'Before/After', probability_score: 74, reasoning: 'Coffee run vs home brew' },
    ],
    recommended_format: { format: 'Vertical Reel', duration_seconds: 20, aspect_ratio: '9:16', platform: 'Instagram Reels' },
    creative_brief: { mood: 'Warm & Aspirational', color_palette: 'Warm golds, rich browns', pacing: 'Medium with punchy cuts', music_style: 'Modern pop, upbeat', hook_strategy: 'Pattern interrupt', target_emotion: 'Desire & FOMO' },
    competitive_insights: 'Competitors focus on features; emotional lifestyle positioning is underutilized.',
  },
  cmo_evaluation: {
    verdict: 'APPROVE',
    overall_score: 88,
    dimension_scores: { hook_strength: 9, emotional_impact: 8, brand_alignment: 9, cta_effectiveness: 8, viral_potential: 9, audience_resonance: 9, pacing_flow: 8, uniqueness: 7, brand_safety: 10, conversion_potential: 8 },
    detailed_feedback: 'Strong hook with pattern interrupt. Body copy communicates value prop with specificity.',
    improvement_suggestions: '- Add a visual proof point\n- Include social proof element',
    performance_projections: { estimated_cpm: '$8-12', estimated_cpc: '$0.45-0.75', estimated_conversion_rate: '3.2-4.8%', estimated_engagement_rate: '6.5-9.2%' },
    ab_test_variations: { hook_variation: 'I threw away my Nespresso after trying this.', cta_variation: 'Your morning upgrade is one tap away.' },
    compliance_check: { brand_safe: true, legal_compliant: true, cultural_sensitive: true, issues_found: 'None' },
  },
  audio_direction: {
    background_music: { genre: 'Pop', sub_genre: 'Lo-fi Pop', bpm: 120, mood: 'Warm & Uplifting', energy_level: 'Medium-High', key_instruments: 'Acoustic guitar, light synth pads' },
    sound_effects: [
      { scene: 'Hook', effect_name: 'Notification ping', timing: '0s', intensity: 'Subtle' },
      { scene: 'CTA', effect_name: 'Cash register', timing: '15s', intensity: 'Prominent' },
    ],
    voice_design: { voice_type: 'Conversational', gender: 'Female', age_range: '25-30', speaking_style: 'Friendly & authentic', language: 'English' },
    audio_mixing: { voice_level_db: -6, music_level_db: -18, sfx_level_db: -12, ducking_strategy: 'Auto-duck music during voiceover' },
    audio_recommendation: 'Warm lo-fi pop with acoustic guitar. Voice should feel like a friend sharing a secret.',
  },
  voice_script: {
    version_a: {
      style: 'Conversational Storyteller',
      full_script: 'Stop scrolling. [PAUSE] This changed EVERYTHING about my morning routine. I used to blow two hundred bucks a month on coffee runs. Then I found AromaBrew. [BEAT] Barista-quality lattes. Thirty seconds. No pods, no waste. Tap the link. Forty percent off.',
      word_count: 52,
      estimated_duration_seconds: 18,
      scene_markers: [
        { scene: 'Hook', line: 'Stop scrolling...', timing: '0-3s', emotion: 'Urgent' },
        { scene: 'Problem', line: 'I used to blow two hundred bucks...', timing: '3-6s', emotion: 'Relatable' },
        { scene: 'Solution', line: 'Then I found AromaBrew...', timing: '6-12s', emotion: 'Excited' },
        { scene: 'CTA', line: 'Tap the link. Forty percent off...', timing: '12-18s', emotion: 'Confident' },
      ],
    },
    language: 'English',
    recommended_version: 'A',
  },
  avatar_direction: {
    shot_list: [
      { scene_number: 1, scene_type: 'Hook', duration_seconds: 3, camera_angle: 'Close-up', camera_movement: 'Slow push-in', lighting: 'Warm golden', background: 'Modern kitchen', visual_description: 'Direct eye contact with knowing expression', stock_video_keywords: ['morning routine', 'kitchen', 'lifestyle'], text_overlay: 'Stop scrolling.', text_position: 'center', transition: 'cut', color_grade: 'warm' },
      { scene_number: 2, scene_type: 'Problem', duration_seconds: 4, camera_angle: 'Over-shoulder', camera_movement: 'Static', lighting: 'Cool fluorescent', background: 'Coffee shop queue', visual_description: 'Long queue, frustrated expression', stock_video_keywords: ['coffee shop queue', 'waiting', 'frustrated'], text_overlay: '$200/month on coffee', text_position: 'bottom', transition: 'cut', color_grade: 'cool' },
      { scene_number: 3, scene_type: 'Solution', duration_seconds: 6, camera_angle: 'Hero shot', camera_movement: 'Zoom out', lighting: 'Warm studio', background: 'Marble countertop', visual_description: 'Product revealed with steam rising', stock_video_keywords: ['coffee maker', 'espresso machine', 'kitchen appliance'], text_overlay: '30 seconds. Perfect.', text_position: 'bottom', transition: 'dissolve', color_grade: 'vibrant' },
      { scene_number: 4, scene_type: 'Social Proof', duration_seconds: 4, camera_angle: 'Medium shot', camera_movement: 'Handheld', lighting: 'Natural', background: 'Home kitchen', visual_description: 'Happy person enjoying coffee', stock_video_keywords: ['happy person coffee', 'morning coffee', 'satisfied customer'], text_overlay: 'Join 50,000+ coffee lovers', text_position: 'center', transition: 'cut', color_grade: 'warm' },
      { scene_number: 5, scene_type: 'CTA', duration_seconds: 3, camera_angle: 'Close-up product', camera_movement: 'Slow push', lighting: 'Dramatic', background: 'Brand color', visual_description: 'Product with offer text', stock_video_keywords: ['coffee product', 'offer', 'deal'], text_overlay: '40% OFF — Tap Now', text_position: 'center', transition: 'fade', color_grade: 'bold' },
    ],
    overall_visual_style: 'Warm lifestyle cinematic',
    color_palette: ['#1a0533', '#f4c542', '#00695c'],
    font_style: 'Bold sans-serif',
    text_animation: 'slide-in',
  },
  viral_score: 88,
  emotional_tone: 'Aspirational',
  production_metadata: {
    total_processing_time: '47 seconds',
    agents_used: ['AdStrategy', 'TrendSync', 'BuyerMind', 'ScriptWriter', 'CMOEvaluator', 'AudioDirector', 'VoiceScript', 'AvatarDirector', 'VideoRenderer'],
    pipeline_steps_completed: 9,
    script_language: 'English',
  },
}

const AGENTS = [
  { name: 'AdStrategy', role: 'Analyzes ad probability & strategy' },
  { name: 'TrendSync', role: 'Researches viral trends' },
  { name: 'BuyerMind', role: 'Builds buyer personas' },
  { name: 'ScriptWriter', role: 'Writes & scores scripts' },
  { name: 'CMO Evaluator', role: 'Quality gate evaluation' },
  { name: 'AudioDirector', role: 'Designs audio landscape' },
  { name: 'VoiceScript', role: 'Creates voiceover scripts' },
  { name: 'AvatarDirector', role: 'Directs visual storyboard' },
  { name: 'VideoRenderer', role: 'Compiles final production package' },
]

// ── Sanitize result — convert any non-string text fields to strings ──
function sanitizeProductionResult(data: any): any {
  if (!data || typeof data !== 'object') return data ?? {}

  const sanitize = (val: any): any => {
    if (val === null || val === undefined) return val
    if (typeof val === 'string') return val
    if (typeof val === 'number' || typeof val === 'boolean') return val
    if (Array.isArray(val)) return val.map(sanitize)
    if (typeof val === 'object') {
      const out: any = {}
      for (const k of Object.keys(val)) {
        out[k] = sanitize(val[k])
      }
      return out
    }
    return String(val)
  }

  return sanitize(data)
}

// ── Poll agent job ──
async function pollAgentJob(
  taskId: string,
  maxAttempts = 120,
  onProgress?: (p: number) => void
): Promise<{ success: boolean; result?: ProductionResult; error?: string }> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, 3000))
    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_id: taskId }),
      })
      const data = await res.json()

      if (data.progress && onProgress) onProgress(data.progress)

      if (data.status === 'processing' || data.status === 'pending') continue

      if (data.status === 'failed') {
        return { success: false, error: data.error || 'Pipeline failed' }
      }

      if (data.status === 'completed' && data.success) {
        const raw = data.response?.result
        // Sanitize — ensure all text fields are strings
        const result = sanitizeProductionResult(raw) as ProductionResult
        return { success: true, result }
      }
    } catch {
      // network hiccup — keep polling
    }
  }
  return { success: false, error: 'Generation timed out after 6 minutes. Please try again.' }
}

// ── Poll video generation job ──
async function pollVideoJob(
  jobId: string,
  maxAttempts = 80
): Promise<{ success: boolean; video_url?: string; error?: string }> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, 4000))
    try {
      const res = await fetch(`/api/video-generate?jobId=${jobId}`)
      const data = await res.json()
      if (data.status === 'completed' && data.video_url) {
        return { success: true, video_url: data.video_url }
      }
      if (data.status === 'failed') {
        return { success: false, error: data.error || 'Video generation failed' }
      }
    } catch {
      // keep polling
    }
  }
  return { success: false, error: 'Video rendering timed out' }
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-50">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-slate-400 mb-4 text-sm">{this.state.error}</p>
            <button
              onClick={() => this.setState({ hasError: false, error: '' })}
              className="px-4 py-2 bg-violet-600 text-white rounded-md text-sm cursor-pointer"
            >
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export default function Page() {
  const [showSample, setShowSample] = useState(false)
  const [description, setDescription] = useState('')
  const [productName, setProductName] = useState('')
  const [contentType, setContentType] = useState('product_demo')
  const [platform, setPlatform] = useState('instagram_reels')
  const [file, setFile] = useState<File | null>(null)
  const [urlInput, setUrlInput] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState('English')
  const [selectedTier, setSelectedTier] = useState<'free' | 'pro' | 'enterprise'>('free')
  const [loading, setLoading] = useState(false)
  const [renderingVideo, setRenderingVideo] = useState(false)
  const [result, setResult] = useState<ProductionResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [completedAgents, setCompletedAgents] = useState<string[]>([])
  const [activeAgent, setActiveAgent] = useState<string | null>(null)
  const abortRef = useRef(false)

  // Save job to dashboard history
  const saveJobToDashboard = (jobId: string, videoUrl?: string, thumbnailUrl?: string) => {
    try {
      const stored = localStorage.getItem('reelforge_jobs')
      const jobs = stored ? JSON.parse(stored) : []
      const newJob = {
        id: jobId,
        product_name: productName || description.split(' ').slice(0, 3).join(' '),
        language: selectedLanguage,
        platform,
        tier: selectedTier,
        status: videoUrl ? 'completed' : 'failed',
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl,
        created_at: new Date().toISOString(),
      }
      jobs.unshift(newJob)
      localStorage.setItem('reelforge_jobs', JSON.stringify(jobs.slice(0, 50)))
    } catch { /* ignore */ }
  }

  const displayData = showSample && !result ? SAMPLE_DATA : result

  const handleToggleSample = useCallback(
    (val: boolean) => {
      setShowSample(val)
      if (val && !description) {
        setProductName('AromaBrew')
        setDescription(
          'AromaBrew smart coffee maker. Makes barista-quality lattes in 30 seconds. No pods, no waste. Target: health-conscious millennials who love great coffee.'
        )
      }
    },
    [description]
  )

  const handleGenerate = useCallback(async () => {
    const desc = description.trim()
    if (!desc) return

    abortRef.current = false
    setLoading(true)
    setError(null)
    setResult(null)
    setCompletedAgents([])
    setActiveAgent('AdStrategy')

    try {
      const contentLabel = contentType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
      const platformLabel = platform.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

      // ── Step 1: Submit job to our CrewAI agent server ──
      const submitRes = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_name: productName || desc.split(' ').slice(0, 3).join(' '),
          product_description: desc,
          content_type: contentLabel,
          platform: platformLabel,
          language: selectedLanguage,
          duration_seconds: 20,
          message: desc,
        }),
      })

      if (!submitRes.ok) {
        const errData = await submitRes.json().catch(() => ({}))
        throw new Error(errData.error || `Agent server error: ${submitRes.status}`)
      }

      const submitData = await submitRes.json()
      const taskId = submitData.task_id

      if (!taskId) throw new Error('No task ID returned from agent server')

      // ── Step 2: Simulate agent progress while polling ──
      let agentIdx = 0
      const agentProgressInterval = setInterval(() => {
        if (agentIdx < AGENTS.length - 1) {
          setCompletedAgents(AGENTS.slice(0, agentIdx + 1).map((a) => a.name))
          agentIdx++
          setActiveAgent(AGENTS[agentIdx]?.name || null)
        }
      }, 18000) // advance every 18s (9 agents × 18s ≈ 2.7 min)

      // ── Step 3: Poll for completion ──
      const agentResult = await pollAgentJob(taskId)
      clearInterval(agentProgressInterval)

      if (abortRef.current) return

      if (!agentResult.success || !agentResult.result) {
        throw new Error(agentResult.error || 'Agent pipeline failed')
      }

      setCompletedAgents(AGENTS.map((a) => a.name))
      setActiveAgent(null)

      const productionResult = agentResult.result

      // ── Step 4: Generate real video ──
      setRenderingVideo(true)
      let finalVideoUrl: string | undefined
      let finalThumbUrl: string | undefined
      try {
        const videoRes = await fetch('/api/video-generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            job_id: taskId,
            tier: selectedTier,
            language: selectedLanguage,
            platform,
            product_name: productName,
            voice_script: productionResult.voice_script || {},
            avatar_direction: productionResult.avatar_direction || {},
            audio_direction: productionResult.audio_direction || {},
            winning_script: productionResult.winning_script || {},
            color_palette: productionResult.avatar_direction?.color_palette || [],
            duration_seconds: 20,
            watermark: selectedTier !== 'enterprise',
          }),
        })

        if (videoRes.ok) {
          const videoData = await videoRes.json()
          if (videoData.job_id) {
            const videoResult = await pollVideoJob(videoData.job_id)
            if (videoResult.success && videoResult.video_url) {
              if (!productionResult.video_result) productionResult.video_result = {} as any
              productionResult.video_result!.video_url = videoResult.video_url
              finalVideoUrl = videoResult.video_url
              finalThumbUrl = (videoResult as any).thumbnail_url
            }
          }
        }
      } catch (videoErr) {
        console.warn('Video generation failed (non-fatal):', videoErr)
      } finally {
        setRenderingVideo(false)
      }

      // Save to dashboard history
      saveJobToDashboard(taskId, finalVideoUrl, finalThumbUrl)

      setResult(productionResult)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unexpected error occurred.')
    } finally {
      setLoading(false)
      setActiveAgent(null)
    }
  }, [description, productName, contentType, platform, selectedLanguage])

  const handleRegenerate = useCallback(() => {
    abortRef.current = true
    setResult(null)
    setError(null)
    setCompletedAgents([])
    setActiveAgent(null)
  }, [])

  return (
    <ErrorBoundary>
      <div className="min-h-screen font-sans bg-slate-950">
        <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-violet-950/10 to-slate-950 pointer-events-none" />
        <div className="relative z-10">
          <Header showSample={showSample} onToggleSample={handleToggleSample} />

          <main className="mx-auto max-w-3xl px-4 py-8 space-y-8">

            {/* Dashboard Link */}
            <div className="flex justify-end">
              <Link href="/dashboard">
                <Button variant="outline" className="rounded-xl border-slate-700 text-slate-300 hover:border-violet-500/50 text-sm">
                  <LayoutDashboard className="h-4 w-4 mr-2" /> My Videos
                </Button>
              </Link>
            </div>

            {/* Tier Selector */}
            <div className="rounded-2xl border border-white/[0.06] bg-slate-900/80 backdrop-blur-xl p-5 shadow-xl">
              <p className="text-sm font-semibold text-slate-200 mb-3">Video Quality Tier</p>
              <div className="grid grid-cols-3 gap-3">
                {([
                  { id: 'free', label: 'Free', icon: Zap, desc: 'Google TTS + Stock Video', color: 'slate' },
                  { id: 'pro', label: 'Pro', icon: Star, desc: 'ElevenLabs + HD + Color Grade', color: 'violet' },
                  { id: 'enterprise', label: 'Enterprise', icon: Crown, desc: 'HeyGen AI Avatar', color: 'amber' },
                ] as const).map((t) => {
                  const Icon = t.icon
                  const isSelected = selectedTier === t.id
                  const colors: Record<string, string> = {
                    slate: isSelected ? 'border-slate-400 bg-slate-500/10' : 'border-white/[0.06]',
                    violet: isSelected ? 'border-violet-500 bg-violet-500/10 shadow-lg shadow-violet-500/10' : 'border-white/[0.06]',
                    amber: isSelected ? 'border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/10' : 'border-white/[0.06]',
                  }
                  const iconColors: Record<string, string> = {
                    slate: 'text-slate-400', violet: 'text-violet-400', amber: 'text-amber-400',
                  }
                  return (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTier(t.id)}
                      className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 transition-all duration-200 cursor-pointer ${colors[t.color]}`}
                    >
                      <Icon className={`h-5 w-5 ${iconColors[t.color]}`} />
                      <span className={`text-xs font-semibold ${isSelected ? 'text-slate-100' : 'text-slate-400'}`}>{t.label}</span>
                      <span className="text-[10px] text-slate-500 text-center leading-tight">{t.desc}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Product Name field */}
            <div className="rounded-2xl border border-white/[0.06] bg-slate-900/80 backdrop-blur-xl px-6 pt-5 pb-5 shadow-xl">
              <label className="text-sm font-semibold text-slate-200 block mb-2">Product Name</label>
              <input
                type="text"
                placeholder="e.g. AromaBrew, Nike Air Max, Zomato..."
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500"
              />
            </div>

            <InputZone
              description={description}
              onDescriptionChange={setDescription}
              contentType={contentType}
              onContentTypeChange={setContentType}
              platform={platform}
              onPlatformChange={setPlatform}
              file={file}
              onFileChange={setFile}
              urlInput={urlInput}
              onUrlChange={setUrlInput}
              onGenerate={handleGenerate}
              loading={loading}
              showSample={showSample}
              selectedLanguage={selectedLanguage}
              onLanguageChange={setSelectedLanguage}
            />

            {loading && <LoadingState renderingVideo={renderingVideo} />}

            {error && (
              <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 backdrop-blur-xl p-4">
                <p className="text-sm text-rose-400">{error}</p>
              </div>
            )}

            {!loading && displayData && (
              <OutputZone data={displayData} onRegenerate={handleRegenerate} />
            )}

            {!loading && !displayData && !error && (
              <div className="rounded-2xl border border-white/[0.06] bg-slate-900/80 backdrop-blur-xl p-12 text-center shadow-2xl">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-violet-500/10 mx-auto mb-4">
                  <Cpu className="h-8 w-8 text-violet-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-100 mb-2">Ready to Create</h3>
                <p className="text-sm text-slate-400 max-w-sm mx-auto">
                  Enter your product name and description, pick a content type and platform, then let our
                  9-agent AI pipeline generate a cinematic video ad with real voiceover and stock footage.
                </p>
              </div>
            )}

            {/* Agent Pipeline Status */}
            <div className="rounded-2xl border border-white/[0.06] bg-slate-900/80 backdrop-blur-xl p-4 shadow-lg">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                Agent Pipeline — Powered by Gemini 1.5 Pro
              </p>
              <div className="flex flex-wrap gap-2">
                {AGENTS.map((agent) => {
                  const isDone = completedAgents.includes(agent.name)
                  const isActive = activeAgent === agent.name
                  return (
                    <div key={agent.name} className="flex items-center gap-1.5" title={agent.role}>
                      <div
                        className={`h-2 w-2 rounded-full ${
                          isActive
                            ? 'bg-violet-500 animate-pulse shadow-lg shadow-violet-500/50'
                            : isDone
                            ? 'bg-emerald-500'
                            : 'bg-slate-700'
                        }`}
                      />
                      <span className="text-xs text-slate-500">{agent.name}</span>
                      {isActive && (
                        <Badge className="text-[10px] px-1.5 py-0 rounded-full bg-violet-500/10 text-violet-400 border-none">
                          Active
                        </Badge>
                      )}
                      {isDone && <CheckCircle className="h-3 w-3 text-emerald-500" />}
                    </div>
                  )
                })}
              </div>
            </div>
          </main>
        </div>
      </div>
    </ErrorBoundary>
  )
}
