'use client'

import { useState } from 'react'
import { Download, RefreshCw, ChevronDown, ChevronUp, Zap, Smile, Award, Clock, Cpu, CheckCircle, Film, Play, Music, Headphones, Globe, Volume2, BarChart2, Camera, Mic, Shield, Eye, Star, Check, X, AlertTriangle, Code } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import type { ProductionResult } from './outputTypes'

interface OutputZoneProps {
  data: ProductionResult
  onRegenerate: () => void
}

function renderMarkdown(text: any) {
  if (!text) return null
  // Safely convert anything to string
  const str = typeof text === 'string' ? text : JSON.stringify(text, null, 2)
  return (
    <div className="space-y-2">
      {str.split('\n').map((line, i) => {
        if (line.startsWith('### ')) return <h4 key={i} className="font-semibold text-sm mt-3 mb-1 text-slate-200">{line.slice(4)}</h4>
        if (line.startsWith('## ')) return <h3 key={i} className="font-semibold text-base mt-3 mb-1 text-slate-100">{line.slice(3)}</h3>
        if (line.startsWith('# ')) return <h2 key={i} className="font-bold text-lg mt-4 mb-2 text-slate-50">{line.slice(2)}</h2>
        if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-4 list-disc text-sm text-slate-300">{formatInline(line.slice(2))}</li>
        if (/^\d+\.\s/.test(line)) return <li key={i} className="ml-4 list-decimal text-sm text-slate-300">{formatInline(line.replace(/^\d+\.\s/, ''))}</li>
        if (!line.trim()) return <div key={i} className="h-1" />
        return <p key={i} className="text-sm text-slate-300">{formatInline(line)}</p>
      })}
    </div>
  )
}

function formatInline(text: any) {
  const str = typeof text === 'string' ? text : String(text ?? '')
  const parts = str.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return str
  return parts.map((part, i) => i % 2 === 1 ? <strong key={i} className="font-semibold text-slate-100">{part}</strong> : part)
}

function ScoreBar({ label, score, max = 10 }: { label: string; score: any; max?: number }) {
  const safeScore = typeof score === 'number' ? score : parseFloat(score) || 0
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-slate-400 w-28 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 transition-all duration-700" style={{ width: `${(safeScore / max) * 100}%` }} />
      </div>
      <span className="text-xs font-semibold text-slate-200 w-8 text-right">{safeScore}/{max}</span>
    </div>
  )
}

function CollapsibleCard({ title, icon: Icon, isOpen, onToggle, badges, children }: { title: string; icon: React.ComponentType<{ className?: string }>; isOpen: boolean; onToggle: () => void; badges?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card className="rounded-2xl border-white/[0.06] bg-slate-900/80 backdrop-blur-xl shadow-2xl">
      <button onClick={onToggle} className="w-full flex items-center justify-between p-4 cursor-pointer">
        <div className="flex items-center gap-2 flex-wrap">
          <Icon className="h-5 w-5 text-violet-400" />
          <span className="text-sm font-semibold text-slate-100">{title}</span>
          {badges}
        </div>
        {isOpen ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
      </button>
      {isOpen && <CardContent className="pt-0 space-y-5">{children}</CardContent>}
    </Card>
  )
}

function DataCell({ label, value }: { label: string; value?: any }) {
  if (value === null || value === undefined || value === '') return null
  const display = typeof value === 'object' ? JSON.stringify(value) : String(value)
  return (
    <div className="rounded-lg bg-slate-800/60 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">{label}</p>
      <p className="text-sm font-medium text-slate-200">{display}</p>
    </div>
  )
}

async function pollRenderJob(jobId: string, maxAttempts = 60): Promise<{ success: boolean; video_url?: string; error?: string }> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(resolve => setTimeout(resolve, 3000))
    try {
      const res = await fetch(`/api/heyframes/status?jobId=${jobId}`)
      const data = await res.json()
      if (data.status === 'complete' && data.video_url) {
        return { success: true, video_url: data.video_url }
      }
      if (data.status === 'failed') {
        return { success: false, error: data.error || 'Rendering failed' }
      }
    } catch {
      // network error, keep trying
    }
  }
  return { success: false, error: 'Rendering timed out' }
}

export default function OutputZone({ data, onRegenerate }: OutputZoneProps) {
  const [scriptOpen, setScriptOpen] = useState(false)
  const [strategyOpen, setStrategyOpen] = useState(false)
  const [cmoOpen, setCmoOpen] = useState(true)
  const [audioOpen, setAudioOpen] = useState(false)
  const [voiceOpen, setVoiceOpen] = useState(false)
  const [avatarOpen, setAvatarOpen] = useState(false)
  const [htmlOpen, setHtmlOpen] = useState(false)
  const [trendOpen, setTrendOpen] = useState(false)
  const [rendering, setRendering] = useState(false)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [renderError, setRenderError] = useState<string | null>(null)

  const existingVideoUrl = data?.video_result?.video_url
  const displayVideoUrl = videoUrl || existingVideoUrl
  const hasVideo = displayVideoUrl && displayVideoUrl !== 'sample string' && (displayVideoUrl.startsWith('http') || displayVideoUrl.startsWith('/api/'))
  const viralScore = data?.viral_score ?? 0
  const allScores = Array.isArray(data?.all_script_scores) ? data.all_script_scores : []
  const agentsUsed = Array.isArray(data?.production_metadata?.agents_used) ? data.production_metadata.agents_used : []
  const htmlCode = data?.video_result?.html_code
  const hasHtml = htmlCode && typeof htmlCode === 'string' && htmlCode.trim().length > 50
  const slides = Array.isArray(data?.video_result?.slides) ? data.video_result!.slides : []
  const hasSlides = slides.length > 0
  const hasRenderable = hasHtml || hasSlides

  const handleRenderVideo = async () => {
    if (!hasRenderable) return
    setRendering(true)
    setRenderError(null)
    try {
      const requestBody: Record<string, unknown> = {}
      if (hasHtml) {
        requestBody.html_code = htmlCode
        requestBody.total_duration_seconds = data?.video_result?.total_duration_seconds || 20
      } else {
        requestBody.slides = slides
        requestBody.compositionId = data?.video_result?.compositionId || 'ExplainerDeck'
      }
      const res = await fetch('/api/heyframes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) })
      const result = await res.json()
      if (result.success && result.jobId) {
        const pollResult = await pollRenderJob(result.jobId)
        if (pollResult.success && pollResult.video_url) {
          setVideoUrl(pollResult.video_url)
        } else {
          setRenderError(pollResult.error || 'Video rendering failed. Please try again.')
        }
      } else {
        setRenderError(result.error || 'Failed to start video rendering.')
      }
    } catch (err) {
      setRenderError(err instanceof Error ? err.message : 'Failed to connect to video rendering service.')
    } finally {
      setRendering(false)
    }
  }

  const adStrategy = data?.ad_strategy
  const cmoEval = data?.cmo_evaluation
  const audioDir = data?.audio_direction
  const voiceScript = data?.voice_script
  const avatarDir = data?.avatar_direction

  const viralColor = viralScore >= 80 ? 'text-emerald-400' : viralScore >= 60 ? 'text-amber-400' : 'text-rose-400'
  const viralRingColor = viralScore >= 80 ? 'from-emerald-500 to-cyan-500' : viralScore >= 60 ? 'from-amber-500 to-orange-500' : 'from-rose-500 to-pink-500'

  return (
    <div className="space-y-5">
      {/* Video Player & Score */}
      <div className="rounded-2xl border border-white/[0.06] bg-slate-900/80 backdrop-blur-xl overflow-hidden shadow-2xl">
        <div className="flex justify-center py-8 bg-gradient-to-br from-slate-900 via-violet-950/20 to-slate-900">
          <div className="relative w-full max-w-[320px] rounded-2xl overflow-hidden bg-black shadow-2xl shadow-violet-500/10" style={{ aspectRatio: '9/16' }}>
            {hasVideo ? (
              <video src={displayVideoUrl} controls className="absolute inset-0 w-full h-full object-contain bg-black rounded-2xl" />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl">
                <Zap className="h-12 w-12 text-violet-400 mb-3" />
                <p className="text-sm font-medium text-slate-200">{hasRenderable ? 'Ready to Render' : 'Video Generated'}</p>
                <p className="text-xs text-slate-500 mt-1 text-center px-4">
                  {data?.video_result?.creative_concept ? `Concept: ${data.video_result.creative_concept}` : data?.video_result?.video_style || data?.video_result?.style_applied || 'Processing complete'}
                  {data?.video_result?.total_duration_seconds ? ` | ${data.video_result.total_duration_seconds}s` : data?.video_result?.duration_seconds ? ` | ${data.video_result.duration_seconds}s` : ''}
                </p>
                <p className="text-xs text-slate-600 mt-1">1080 x 1920 (9:16)</p>
                {hasRenderable && !hasVideo && (
                  <Button onClick={handleRenderVideo} disabled={rendering} className="mt-4 rounded-xl text-white bg-gradient-to-r from-violet-600 to-cyan-500 hover:opacity-90 shadow-lg shadow-violet-500/25 cursor-pointer">
                    {rendering ? <span className="flex items-center gap-2"><Film className="h-4 w-4 animate-spin" /> Rendering...</span> : <span className="flex items-center gap-2"><Play className="h-4 w-4" /> Render MP4</span>}
                  </Button>
                )}
                {renderError && <p className="text-xs text-rose-400 mt-2 max-w-sm text-center px-4">{renderError}</p>}
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 p-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div className={`relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br ${viralRingColor} text-white shadow-lg`}>
              <span className="text-lg font-bold">{viralScore}</span>
              <span className="absolute -bottom-1 text-[10px] font-medium text-slate-500">/100</span>
            </div>
            <span className={`text-xs font-medium ${viralColor}`}>Viral Score</span>
          </div>
          {data?.emotional_tone && <Badge className="rounded-full bg-cyan-500/10 text-cyan-400 border-cyan-500/20 hover:bg-cyan-500/15"><Smile className="h-3 w-3 mr-1" />{data.emotional_tone}</Badge>}
          {data?.production_status && <Badge className="rounded-full bg-emerald-500/10 text-emerald-400 border-emerald-500/20"><CheckCircle className="h-3 w-3 mr-1" />{data.production_status}</Badge>}
          {cmoEval?.verdict && (
            <Badge className={`rounded-full ${cmoEval.verdict === 'PASS' || cmoEval.verdict === 'APPROVE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : cmoEval.verdict === 'REVISE' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
              {cmoEval.verdict === 'PASS' || cmoEval.verdict === 'APPROVE' ? <Check className="h-3 w-3 mr-1" /> : cmoEval.verdict === 'REJECT' ? <X className="h-3 w-3 mr-1" /> : <AlertTriangle className="h-3 w-3 mr-1" />}
              CMO: {cmoEval.verdict}
            </Badge>
          )}
          {data?.content_type_used && <Badge variant="outline" className="rounded-full border-violet-500/20 text-violet-400 text-xs">{data.content_type_used}</Badge>}
          {data?.platform_optimization && <Badge variant="outline" className="rounded-full border-cyan-500/20 text-cyan-400 text-xs">{data.platform_optimization}</Badge>}
        </div>
      </div>

      {/* Ad Strategy */}
      {adStrategy && (
        <CollapsibleCard title="Ad Strategy & Probability Analysis" icon={BarChart2} isOpen={strategyOpen} onToggle={() => setStrategyOpen(!strategyOpen)}>
          {adStrategy.product_analysis && (
            <div className="grid grid-cols-2 gap-3">
              <DataCell label="Category" value={adStrategy.product_analysis.category} />
              <DataCell label="Price Segment" value={adStrategy.product_analysis.price_segment} />
              {adStrategy.product_analysis.target_demographic && (<div className="col-span-2"><DataCell label="Target Demographic" value={adStrategy.product_analysis.target_demographic} /></div>)}
              {adStrategy.product_analysis.unique_selling_points && (<div className="col-span-2 rounded-lg bg-violet-500/5 border border-violet-500/10 p-3"><p className="text-[10px] font-semibold uppercase tracking-wider text-violet-400 mb-1">Unique Selling Points</p><p className="text-sm text-slate-300">{adStrategy.product_analysis.unique_selling_points}</p></div>)}
            </div>
          )}
          {Array.isArray(adStrategy.ad_type_rankings) && adStrategy.ad_type_rankings.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-violet-400 mb-3">Ad Type Probability Rankings</p>
              <div className="space-y-3">
                {adStrategy.ad_type_rankings.map((rank, idx) => (
                  <div key={idx} className="rounded-lg border border-white/[0.06] bg-slate-800/40 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-slate-200">{rank?.ad_type ?? ''}</span>
                      <Badge className={`rounded-full ${(rank?.probability_score ?? 0) >= 80 ? 'bg-emerald-500/10 text-emerald-400' : (rank?.probability_score ?? 0) >= 60 ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-700 text-slate-400'}`}>{rank?.probability_score ?? 0}%</Badge>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden mb-2">
                      <div className="h-full rounded-full bg-gradient-to-r from-violet-600 to-cyan-500" style={{ width: `${rank?.probability_score ?? 0}%` }} />
                    </div>
                    {rank?.reasoning && <p className="text-xs text-slate-400">{rank.reasoning}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
          {adStrategy.recommended_format && (
            <div className="rounded-lg bg-gradient-to-br from-violet-500/5 to-cyan-500/5 p-4 border border-violet-500/10">
              <p className="text-xs font-semibold uppercase tracking-wider text-violet-400 mb-2">Recommended Format</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <DataCell label="Format" value={adStrategy.recommended_format.format} />
                <DataCell label="Duration" value={adStrategy.recommended_format.duration_seconds ? `${adStrategy.recommended_format.duration_seconds}s` : undefined} />
                <DataCell label="Aspect" value={adStrategy.recommended_format.aspect_ratio} />
                <DataCell label="Platform" value={adStrategy.recommended_format.platform} />
              </div>
            </div>
          )}
          {adStrategy.creative_brief && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-violet-400 mb-2">Creative Brief</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(adStrategy.creative_brief).map(([key, val]) => val ? (
                  <div key={key} className="rounded-lg bg-slate-800/60 p-2.5"><p className="text-[10px] text-slate-500 capitalize">{key.replace(/_/g, ' ')}</p><p className="text-xs font-medium text-slate-300">{String(val)}</p></div>
                ) : null)}
              </div>
            </div>
          )}
          {adStrategy.competitive_insights && (
            <div className="rounded-lg bg-slate-800/60 p-3"><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Competitive Insights</p><div className="text-sm text-slate-300">{renderMarkdown(adStrategy.competitive_insights)}</div></div>
          )}
        </CollapsibleCard>
      )}

      {/* CMO Evaluation */}
      {cmoEval && (
        <CollapsibleCard title="CMO Evaluation" icon={Shield} isOpen={cmoOpen} onToggle={() => setCmoOpen(!cmoOpen)} badges={<>
          {cmoEval.overall_score != null && <Badge className="ml-2 rounded-full bg-violet-500/10 text-violet-400 border-violet-500/20">Score: {cmoEval.overall_score}/100</Badge>}
          {cmoEval.verdict && <Badge className={`ml-1 rounded-full ${cmoEval.verdict === 'PASS' || cmoEval.verdict === 'APPROVE' ? 'bg-emerald-500/10 text-emerald-400' : cmoEval.verdict === 'REVISE' ? 'bg-amber-500/10 text-amber-400' : 'bg-rose-500/10 text-rose-400'}`}>{cmoEval.verdict}</Badge>}
        </>}>
          {cmoEval.dimension_scores && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-violet-400 mb-2">10-Dimension Scoring</p>
              <ScoreBar label="Hook Strength" score={cmoEval.dimension_scores.hook_strength ?? 0} />
              <ScoreBar label="Emotional Impact" score={cmoEval.dimension_scores.emotional_impact ?? 0} />
              <ScoreBar label="Brand Alignment" score={cmoEval.dimension_scores.brand_alignment ?? 0} />
              <ScoreBar label="CTA Effectiveness" score={cmoEval.dimension_scores.cta_effectiveness ?? 0} />
              <ScoreBar label="Viral Potential" score={cmoEval.dimension_scores.viral_potential ?? 0} />
              <ScoreBar label="Audience Resonance" score={cmoEval.dimension_scores.audience_resonance ?? 0} />
              <ScoreBar label="Pacing & Flow" score={cmoEval.dimension_scores.pacing_flow ?? 0} />
              <ScoreBar label="Uniqueness" score={cmoEval.dimension_scores.uniqueness ?? 0} />
              <ScoreBar label="Brand Safety" score={cmoEval.dimension_scores.brand_safety ?? 0} />
              <ScoreBar label="Conversion" score={cmoEval.dimension_scores.conversion_potential ?? 0} />
            </div>
          )}
          {cmoEval.detailed_feedback && (
            <div className="rounded-lg bg-slate-800/60 p-3"><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Detailed Feedback</p><div>{renderMarkdown(cmoEval.detailed_feedback)}</div></div>
          )}
          {cmoEval.improvement_suggestions && (
            <div className="rounded-lg bg-amber-500/5 border border-amber-500/10 p-3"><p className="text-[10px] font-semibold uppercase tracking-wider text-amber-400 mb-1">Improvement Suggestions</p><div>{renderMarkdown(cmoEval.improvement_suggestions)}</div></div>
          )}
          {cmoEval.performance_projections && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-violet-400 mb-2">Performance Projections</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {cmoEval.performance_projections.estimated_cpm && <div className="rounded-lg bg-slate-800/60 p-2.5 text-center"><p className="text-[10px] text-slate-500">Est. CPM</p><p className="text-sm font-bold text-slate-200">{cmoEval.performance_projections.estimated_cpm}</p></div>}
                {cmoEval.performance_projections.estimated_cpc && <div className="rounded-lg bg-slate-800/60 p-2.5 text-center"><p className="text-[10px] text-slate-500">Est. CPC</p><p className="text-sm font-bold text-slate-200">{cmoEval.performance_projections.estimated_cpc}</p></div>}
                {cmoEval.performance_projections.estimated_conversion_rate && <div className="rounded-lg bg-slate-800/60 p-2.5 text-center"><p className="text-[10px] text-slate-500">Conv. Rate</p><p className="text-sm font-bold text-slate-200">{cmoEval.performance_projections.estimated_conversion_rate}</p></div>}
                {cmoEval.performance_projections.estimated_engagement_rate && <div className="rounded-lg bg-slate-800/60 p-2.5 text-center"><p className="text-[10px] text-slate-500">Engagement</p><p className="text-sm font-bold text-slate-200">{cmoEval.performance_projections.estimated_engagement_rate}</p></div>}
              </div>
            </div>
          )}
          {cmoEval.ab_test_variations && (cmoEval.ab_test_variations.hook_variation || cmoEval.ab_test_variations.cta_variation) && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-violet-400 mb-2">A/B Test Variations</p>
              {cmoEval.ab_test_variations.hook_variation && <div className="rounded-lg bg-violet-500/5 border border-violet-500/10 p-3 mb-2"><p className="text-[10px] text-violet-400 font-semibold mb-1">Alt. Hook</p><p className="text-sm text-slate-300">{cmoEval.ab_test_variations.hook_variation}</p></div>}
              {cmoEval.ab_test_variations.cta_variation && <div className="rounded-lg bg-cyan-500/5 border border-cyan-500/10 p-3"><p className="text-[10px] text-cyan-400 font-semibold mb-1">Alt. CTA</p><p className="text-sm text-slate-300">{cmoEval.ab_test_variations.cta_variation}</p></div>}
            </div>
          )}
          {cmoEval.compliance_check && (
            <div className="flex flex-wrap gap-2">
              <Badge className={`rounded-full ${cmoEval.compliance_check.brand_safe ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>{cmoEval.compliance_check.brand_safe ? <Check className="h-3 w-3 mr-1" /> : <X className="h-3 w-3 mr-1" />} Brand Safe</Badge>
              <Badge className={`rounded-full ${cmoEval.compliance_check.legal_compliant ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>{cmoEval.compliance_check.legal_compliant ? <Check className="h-3 w-3 mr-1" /> : <X className="h-3 w-3 mr-1" />} Legal</Badge>
              <Badge className={`rounded-full ${cmoEval.compliance_check.cultural_sensitive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>{cmoEval.compliance_check.cultural_sensitive ? <Check className="h-3 w-3 mr-1" /> : <X className="h-3 w-3 mr-1" />} Cultural</Badge>
              {cmoEval.compliance_check.issues_found && <p className="text-xs text-rose-400 w-full mt-1">{cmoEval.compliance_check.issues_found}</p>}
            </div>
          )}
        </CollapsibleCard>
      )}

      {/* Winning Script */}
      {data?.winning_script && (
        <CollapsibleCard title="Winning Script" icon={Award} isOpen={scriptOpen} onToggle={() => setScriptOpen(!scriptOpen)} badges={data.winning_script?.composite_score != null ? <Badge className="ml-2 rounded-full bg-violet-500/10 text-violet-400 border-violet-500/20">Score: {data.winning_script.composite_score}</Badge> : undefined}>
          {data.winning_script?.creative_angle && <p className="text-xs text-slate-400 italic">Angle: {data.winning_script.creative_angle}</p>}
          <div className="flex flex-wrap gap-2">
            {data.winning_script?.language && <Badge className="rounded-full bg-violet-500/10 text-violet-400 border-violet-500/20 text-xs"><Globe className="h-3 w-3 mr-1" />{data.winning_script.language}</Badge>}
            {data.winning_script?.background_music_genre && <Badge className="rounded-full bg-cyan-500/10 text-cyan-400 border-cyan-500/20 text-xs"><Music className="h-3 w-3 mr-1" />{data.winning_script.background_music_genre}</Badge>}
            {data.winning_script?.audio_mood && <Badge variant="outline" className="rounded-full border-slate-700 text-slate-400 text-xs"><Headphones className="h-3 w-3 mr-1" />{data.winning_script.audio_mood}</Badge>}
          </div>
          {data.winning_script?.hook && (<div><p className="text-xs font-semibold uppercase tracking-wider text-violet-400 mb-1">Hook</p><p className="text-sm text-slate-200 bg-gradient-to-r from-violet-500/10 to-transparent rounded-lg p-3 border-l-2 border-violet-500">{data.winning_script.hook}</p></div>)}
          {data.winning_script?.body && (<div><p className="text-xs font-semibold uppercase tracking-wider text-violet-400 mb-1">Body</p><div className="text-sm bg-slate-800/60 rounded-lg p-3">{renderMarkdown(data.winning_script.body)}</div></div>)}
          {data.winning_script?.cta && (<div><p className="text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-1">Call to Action</p><p className="text-sm font-medium text-cyan-300 bg-cyan-500/5 rounded-lg p-3 border-l-2 border-cyan-500">{data.winning_script.cta}</p></div>)}
        </CollapsibleCard>
      )}

      {/* Audio Direction */}
      {audioDir && (
        <CollapsibleCard title="Audio Direction & Sound Design" icon={Music} isOpen={audioOpen} onToggle={() => setAudioOpen(!audioOpen)}>
          {audioDir.background_music && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-violet-400 mb-2">Background Music</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <DataCell label="Genre" value={audioDir.background_music.genre} />
                <DataCell label="Sub-genre" value={audioDir.background_music.sub_genre} />
                <DataCell label="BPM" value={audioDir.background_music.bpm} />
                <DataCell label="Mood" value={audioDir.background_music.mood} />
                <DataCell label="Energy" value={audioDir.background_music.energy_level} />
                <DataCell label="Instruments" value={audioDir.background_music.key_instruments} />
              </div>
            </div>
          )}
          {audioDir.voice_design && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-violet-400 mb-2">Voice Design</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(audioDir.voice_design).map(([key, val]) => val ? (
                  <div key={key} className="rounded-lg bg-violet-500/5 border border-violet-500/10 p-2.5"><p className="text-[10px] text-slate-500 capitalize">{key.replace(/_/g, ' ')}</p><p className="text-xs font-medium text-slate-300">{String(val)}</p></div>
                ) : null)}
              </div>
            </div>
          )}
          {Array.isArray(audioDir.sound_effects) && audioDir.sound_effects.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-violet-400 mb-2">Sound Effects</p>
              <div className="space-y-2">
                {audioDir.sound_effects.map((sfx, idx) => (
                  <div key={idx} className="flex items-center gap-3 rounded-lg bg-slate-800/60 p-2.5">
                    <Volume2 className="h-4 w-4 text-violet-400 shrink-0" />
                    <div className="flex-1"><p className="text-xs font-medium text-slate-200">{sfx?.effect_name ?? ''}</p><p className="text-[10px] text-slate-500">{sfx?.scene ?? ''} | {sfx?.timing ?? ''} | {sfx?.intensity ?? ''}</p></div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {Array.isArray(audioDir.music_intensity_curve) && audioDir.music_intensity_curve.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-violet-400 mb-2">Music Intensity Curve</p>
              <div className="flex items-end gap-1 h-20">
                {audioDir.music_intensity_curve.map((point, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full rounded-t bg-gradient-to-t from-violet-600 to-cyan-500" style={{ height: `${((point?.intensity_level ?? 0) / 10) * 100}%` }} title={point?.description ?? ''} />
                    <span className="text-[8px] text-slate-500 truncate w-full text-center">{point?.scene_label ?? ''}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {audioDir.audio_mixing && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-violet-400 mb-2">Audio Mixing</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {audioDir.audio_mixing.voice_level_db != null && <div className="rounded-lg bg-slate-800/60 p-2.5 text-center"><p className="text-[10px] text-slate-500">Voice</p><p className="text-sm font-bold text-slate-200">{audioDir.audio_mixing.voice_level_db} dB</p></div>}
                {audioDir.audio_mixing.music_level_db != null && <div className="rounded-lg bg-slate-800/60 p-2.5 text-center"><p className="text-[10px] text-slate-500">Music</p><p className="text-sm font-bold text-slate-200">{audioDir.audio_mixing.music_level_db} dB</p></div>}
                {audioDir.audio_mixing.sfx_level_db != null && <div className="rounded-lg bg-slate-800/60 p-2.5 text-center"><p className="text-[10px] text-slate-500">SFX</p><p className="text-sm font-bold text-slate-200">{audioDir.audio_mixing.sfx_level_db} dB</p></div>}
                {audioDir.audio_mixing.ducking_strategy && <div className="rounded-lg bg-slate-800/60 p-2.5 text-center"><p className="text-[10px] text-slate-500">Ducking</p><p className="text-xs font-medium text-slate-300">{audioDir.audio_mixing.ducking_strategy}</p></div>}
              </div>
            </div>
          )}
          {audioDir.audio_recommendation && (
            <div className="rounded-lg bg-violet-500/5 border border-violet-500/10 p-3"><p className="text-[10px] font-semibold uppercase tracking-wider text-violet-400 mb-1">Recommendation</p><p className="text-sm text-slate-300">{audioDir.audio_recommendation}</p></div>
          )}
        </CollapsibleCard>
      )}

      {/* Voice Script */}
      {voiceScript && (
        <CollapsibleCard title="Voiceover Script" icon={Mic} isOpen={voiceOpen} onToggle={() => setVoiceOpen(!voiceOpen)} badges={<>
          {voiceScript.recommended_version && <Badge className="ml-2 rounded-full bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs">Best: {voiceScript.recommended_version}</Badge>}
          {voiceScript.language && <Badge variant="outline" className="ml-1 rounded-full border-slate-700 text-slate-400 text-xs"><Globe className="h-3 w-3 mr-1" />{voiceScript.language}</Badge>}
        </>}>
          {voiceScript.version_a && (
            <div className="rounded-lg border border-violet-500/20 p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-violet-400">Version A {voiceScript.version_a.style ? `- ${voiceScript.version_a.style}` : ''}</p>
                <div className="flex gap-2">
                  {voiceScript.version_a.word_count && <Badge variant="outline" className="rounded-full text-[10px] border-slate-700 text-slate-400">{voiceScript.version_a.word_count} words</Badge>}
                  {voiceScript.version_a.estimated_duration_seconds && <Badge variant="outline" className="rounded-full text-[10px] border-slate-700 text-slate-400">{voiceScript.version_a.estimated_duration_seconds}s</Badge>}
                </div>
              </div>
              {voiceScript.version_a.full_script && <div className="rounded-lg bg-slate-800/60 p-3 mb-3"><p className="text-sm text-slate-300 whitespace-pre-wrap">{voiceScript.version_a.full_script}</p></div>}
              {Array.isArray(voiceScript.version_a.scene_markers) && voiceScript.version_a.scene_markers.length > 0 && (
                <div className="space-y-1.5">
                  {voiceScript.version_a.scene_markers.map((marker, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs">
                      <Badge className="rounded-full bg-violet-500/10 text-violet-400 border-none text-[10px] shrink-0">{marker?.timing ?? ''}</Badge>
                      <span className="text-slate-500 italic">[{marker?.emotion ?? ''}]</span>
                      <span className="text-slate-300">{marker?.line ?? ''}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {voiceScript.version_b && (
            <div className="rounded-lg border border-cyan-500/20 p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">Version B {voiceScript.version_b.style ? `- ${voiceScript.version_b.style}` : ''}</p>
                <div className="flex gap-2">
                  {voiceScript.version_b.word_count && <Badge variant="outline" className="rounded-full text-[10px] border-slate-700 text-slate-400">{voiceScript.version_b.word_count} words</Badge>}
                  {voiceScript.version_b.estimated_duration_seconds && <Badge variant="outline" className="rounded-full text-[10px] border-slate-700 text-slate-400">{voiceScript.version_b.estimated_duration_seconds}s</Badge>}
                </div>
              </div>
              {voiceScript.version_b.full_script && <div className="rounded-lg bg-slate-800/60 p-3 mb-3"><p className="text-sm text-slate-300 whitespace-pre-wrap">{voiceScript.version_b.full_script}</p></div>}
              {Array.isArray(voiceScript.version_b.scene_markers) && voiceScript.version_b.scene_markers.length > 0 && (
                <div className="space-y-1.5">
                  {voiceScript.version_b.scene_markers.map((marker, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs">
                      <Badge className="rounded-full bg-cyan-500/10 text-cyan-400 border-none text-[10px] shrink-0">{marker?.timing ?? ''}</Badge>
                      <span className="text-slate-500 italic">[{marker?.emotion ?? ''}]</span>
                      <span className="text-slate-300">{marker?.line ?? ''}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {voiceScript.pronunciation_guide && <div className="rounded-lg bg-slate-800/60 p-3"><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Pronunciation Guide</p><p className="text-sm text-slate-300">{voiceScript.pronunciation_guide}</p></div>}
        </CollapsibleCard>
      )}

      {/* Avatar & Storyboard */}
      {avatarDir && (
        <CollapsibleCard title="Avatar & Visual Storyboard" icon={Camera} isOpen={avatarOpen} onToggle={() => setAvatarOpen(!avatarOpen)}>
          {avatarDir.avatar_design && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-violet-400 mb-2">Avatar Design</p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(avatarDir.avatar_design).map(([key, val]) => val ? (
                  <div key={key} className="rounded-lg bg-violet-500/5 border border-violet-500/10 p-2.5"><p className="text-[10px] text-slate-500 capitalize">{key.replace(/_/g, ' ')}</p><p className="text-xs font-medium text-slate-300">{String(val)}</p></div>
                ) : null)}
              </div>
            </div>
          )}
          {Array.isArray(avatarDir.shot_list) && avatarDir.shot_list.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-violet-400 mb-2">Shot-by-Shot Storyboard</p>
              <div className="space-y-3">
                {avatarDir.shot_list.map((shot, idx) => (
                  <div key={idx} className="rounded-lg border border-white/[0.06] bg-slate-800/40 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge className="rounded-full bg-violet-500/10 text-violet-400 border-none text-xs">Scene {shot?.scene_number ?? idx + 1}</Badge>
                        <Badge variant="outline" className="rounded-full text-[10px] border-slate-700 text-slate-400">{shot?.scene_type ?? ''}</Badge>
                      </div>
                      <span className="text-xs text-slate-500">{shot?.duration_seconds ?? 0}s</span>
                    </div>
                    {shot?.visual_description && <p className="text-sm text-slate-300 mb-2">{shot.visual_description}</p>}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[10px]">
                      {shot?.camera_angle && <div className="flex items-center gap-1 text-slate-500"><Camera className="h-3 w-3" /> {shot.camera_angle}</div>}
                      {shot?.camera_movement && <div className="flex items-center gap-1 text-slate-500"><Eye className="h-3 w-3" /> {shot.camera_movement}</div>}
                      {shot?.lighting && <div className="flex items-center gap-1 text-slate-500"><Star className="h-3 w-3" /> {shot.lighting}</div>}
                      {shot?.transition && <div className="flex items-center gap-1 text-slate-500"><Film className="h-3 w-3" /> {shot.transition}</div>}
                      {shot?.cinematic_effect && <div className="flex items-center gap-1 text-slate-500"><Zap className="h-3 w-3" /> {shot.cinematic_effect}</div>}
                    </div>
                    {shot?.product_interaction && <p className="text-[10px] text-violet-400 mt-1.5 italic">Product: {shot.product_interaction}</p>}
                    {shot?.text_overlay && <p className="text-[10px] text-cyan-400 mt-1">Text: &quot;{shot.text_overlay}&quot;</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <DataCell label="Visual Style" value={avatarDir.overall_visual_style} />
            <DataCell label="Color Grading" value={avatarDir.color_grading} />
          </div>
          {Array.isArray(avatarDir.b_roll_descriptions) && avatarDir.b_roll_descriptions.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-violet-400 mb-2">B-Roll Shots</p>
              <div className="flex flex-wrap gap-2">
                {avatarDir.b_roll_descriptions.map((broll, idx) => (
                  <div key={idx} className="rounded-lg bg-slate-800/60 p-2.5 flex-1 min-w-[200px]"><p className="text-xs font-medium text-slate-300">{broll?.shot_description ?? ''}</p><p className="text-[10px] text-slate-500">{broll?.purpose ?? ''} | {broll?.timing ?? ''}</p></div>
                ))}
              </div>
            </div>
          )}
          {avatarDir.text_style && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(avatarDir.text_style).map(([key, val]) => val ? (
                <div key={key} className="rounded-lg bg-slate-800/60 p-2.5"><p className="text-[10px] text-slate-500 capitalize">{key.replace(/_/g, ' ')}</p><p className="text-xs font-medium text-slate-300">{String(val)}</p></div>
              ) : null)}
            </div>
          )}
        </CollapsibleCard>
      )}

      {/* HTML Composition Preview */}
      {hasHtml && (
        <CollapsibleCard title="HTML Composition Preview" icon={Code} isOpen={htmlOpen} onToggle={() => setHtmlOpen(!htmlOpen)} badges={<>
          {data?.video_result?.creative_concept && <Badge className="ml-2 rounded-full bg-violet-500/10 text-violet-400 border-violet-500/20 text-xs">{data.video_result.creative_concept}</Badge>}
          {data?.video_result?.scene_count && <span className="text-[10px] text-slate-500 ml-2">{data.video_result.scene_count} scenes</span>}
          {data?.video_result?.total_duration_seconds && <span className="text-[10px] text-slate-500 ml-1">{data.video_result.total_duration_seconds}s</span>}
        </>}>
          <div className="rounded-xl border border-white/[0.06] overflow-hidden bg-black">
            <div className="flex justify-center p-2">
              <div style={{ width: '270px', height: '480px', position: 'relative' }}>
                <iframe
                  srcDoc={htmlCode ?? ''}
                  sandbox="allow-same-origin"
                  style={{ width: '1080px', height: '1920px', transform: 'scale(0.25)', transformOrigin: 'top left', border: 'none', borderRadius: '8px' }}
                  title="HTML Ad Preview"
                />
              </div>
            </div>
            <div className="p-2 bg-slate-800/50 border-t border-white/[0.06]">
              <p className="text-[10px] text-slate-500 text-center">Preview -- animations play in real-time. Final video rendered at 1080x1920.</p>
            </div>
          </div>
        </CollapsibleCard>
      )}

      {/* Trend Summary */}
      {data?.trend_summary && (
        <CollapsibleCard title="Trend Summary" icon={BarChart2} isOpen={trendOpen} onToggle={() => setTrendOpen(!trendOpen)}>
          {renderMarkdown(data.trend_summary)}
        </CollapsibleCard>
      )}

      {/* Selected Persona */}
      {data?.selected_persona?.name && (
        <Card className="rounded-2xl border-white/[0.06] bg-slate-900/80 backdrop-blur-xl shadow-2xl">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-slate-100">Selected Persona</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-500/10"><Smile className="h-5 w-5 text-violet-400" /></div>
              <div><p className="text-sm font-medium text-slate-200">{data.selected_persona.name}</p>{data.selected_persona?.emotional_tone && <p className="text-xs text-slate-400">Tone: {data.selected_persona.emotional_tone}</p>}</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Script Comparison */}
      {allScores.length > 0 && (
        <Card className="rounded-2xl border-white/[0.06] bg-slate-900/80 backdrop-blur-xl shadow-2xl">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-slate-100">Script Comparison</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {allScores.map((s, idx) => {
              const score = s?.composite_score ?? 0
              const maxScore = Math.max(...allScores.map(x => x?.composite_score ?? 0), 1)
              return (<div key={idx} className="flex items-center gap-3"><span className="text-xs font-medium text-slate-400 w-16">Script {s?.script_number ?? idx + 1}</span><div className="flex-1"><Progress value={(score / maxScore) * 100} className="h-2 rounded-full" /></div><span className="text-xs font-semibold text-slate-200 w-8 text-right">{score}</span></div>)
            })}
          </CardContent>
        </Card>
      )}

      {/* Production Metadata */}
      {data?.production_metadata && (
        <Card className="rounded-2xl border-white/[0.06] bg-slate-900/80 backdrop-blur-xl shadow-2xl">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-slate-100">Production Details</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {data.production_metadata?.total_processing_time && <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-slate-500" /><div><p className="text-xs text-slate-500">Processing Time</p><p className="text-sm font-medium text-slate-200">{data.production_metadata.total_processing_time}</p></div></div>}
              {data.production_metadata?.pipeline_steps_completed != null && <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-slate-500" /><div><p className="text-xs text-slate-500">Steps Completed</p><p className="text-sm font-medium text-slate-200">{data.production_metadata.pipeline_steps_completed}</p></div></div>}
              {agentsUsed.length > 0 && <div className="flex items-center gap-2"><Cpu className="h-4 w-4 text-slate-500" /><div><p className="text-xs text-slate-500">Agents Used</p><p className="text-sm font-medium text-slate-200">{agentsUsed.length}</p></div></div>}
            </div>
            {agentsUsed.length > 0 && <div className="flex flex-wrap gap-2 mt-3">{agentsUsed.map((a, i) => <Badge key={i} variant="outline" className="rounded-full text-xs border-slate-700 text-slate-400">{a}</Badge>)}</div>}
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        {hasVideo && (
          <Button onClick={async () => {
            try { const res = await fetch(displayVideoUrl!); const blob = await res.blob(); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `reelmind-cinematic-${Date.now()}.mp4`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url) } catch (err) { console.error('Download failed:', err) }
          }} className="flex-1 h-12 rounded-xl text-white bg-gradient-to-r from-violet-600 to-cyan-500 hover:opacity-90 shadow-xl shadow-violet-500/25 cursor-pointer"><Download className="h-4 w-4 mr-2" />Download Video</Button>
        )}
        {hasRenderable && !hasVideo && (
          <Button onClick={handleRenderVideo} disabled={rendering} className="flex-1 h-12 rounded-xl text-white bg-gradient-to-r from-violet-600 to-cyan-500 hover:opacity-90 shadow-xl shadow-violet-500/25 cursor-pointer">
            {rendering ? <span className="flex items-center gap-2"><Film className="h-4 w-4 animate-spin" /> Rendering...</span> : <span className="flex items-center gap-2"><Play className="h-4 w-4" /> Render Video</span>}
          </Button>
        )}
        <Button variant="outline" onClick={onRegenerate} className="flex-1 h-12 rounded-xl border-slate-700 text-slate-300 hover:bg-slate-800 cursor-pointer"><RefreshCw className="h-4 w-4 mr-2" />Regenerate</Button>
      </div>
    </div>
  )
}
