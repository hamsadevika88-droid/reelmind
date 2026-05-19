'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, X, Play, Download, Film, Zap, Sparkles, ArrowLeft, Send, RefreshCw, CheckCircle, User, Building, Globe, Music } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import Link from 'next/link'

const BUSINESS_TYPES = ['Shop/Store','Restaurant/Cafe','Product','Personal Brand','Real Estate','Salon/Spa','Gym/Fitness','Hotel','Fashion','Tech/App','Healthcare','Education']
const LANGUAGES = ['English','Hindi','Tamil','Telugu','Kannada','Malayalam','Bengali','Marathi','Gujarati','Punjabi','Spanish','French','Arabic','Portuguese','German','Japanese','Korean','Chinese']
const MUSIC_GENRES = ['Cinematic','Pop','Hip-hop','Electronic','Acoustic','Lo-fi','Bollywood','Jazz','Motivational','Dramatic']

interface UploadedClip { file: File; preview: string; name: string; size: string }
interface ScriptScene { video_index: number; scene_type: string; duration_seconds: number; effect: string; subtitle: string; voiceover_line: string; color_grade: string }
interface GeneratedScript { video_title?: string; video_concept?: string; scenes?: ScriptScene[]; full_voiceover_script?: string; music_mood?: string; music_genre?: string; intro_title?: string; intro_subtitle?: string; cta_text?: string; hashtags?: string[]; director_notes?: string }

async function pollJob(jobId: string, onProgress: (p: number, script?: GeneratedScript) => void): Promise<{ video_url?: string; thumbnail_url?: string; script?: GeneratedScript; error?: string }> {
  for (let i = 0; i < 120; i++) {
    await new Promise(r => setTimeout(r, 3000))
    try {
      const res = await fetch(`/api/smart-cinematic?jobId=${jobId}`)
      const data = await res.json()
      if (data.progress) onProgress(data.progress, data.script)
      if (data.status === 'completed') return { video_url: data.video_url, thumbnail_url: data.thumbnail_url, script: data.script }
      if (data.status === 'failed') return { error: data.error || 'Generation failed' }
    } catch { /* keep polling */ }
  }
  return { error: 'Timed out' }
}

export default function SmartCinematicPage() {
  const [step, setStep] = useState<'info'|'upload'|'generating'|'result'>('info')
  const [clips, setClips] = useState<UploadedClip[]>([])
  const [userName, setUserName] = useState('')
  const [brandName, setBrandName] = useState('')
  const [businessType, setBusinessType] = useState('Shop/Store')
  const [targetAudience, setTargetAudience] = useState('')
  const [userPrompt, setUserPrompt] = useState('')
  const [language, setLanguage] = useState('English')
  const [musicGenre, setMusicGenre] = useState('Cinematic')
  const [removeNoise, setRemoveNoise] = useState(true)
  const [addIntro, setAddIntro] = useState(true)
  const [clipDuration, setClipDuration] = useState(5)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressMsg, setProgressMsg] = useState('')
  const [videoUrl, setVideoUrl] = useState<string|null>(null)
  const [script, setScript] = useState<GeneratedScript|null>(null)
  const [updatePrompt, setUpdatePrompt] = useState('')
  const [jobId, setJobId] = useState<string|null>(null)
  const [error, setError] = useState<string|null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFiles = useCallback((files: FileList|null) => {
    if (!files) return
    const newClips: UploadedClip[] = []
    Array.from(files).forEach(f => {
      if (!f.type.startsWith('video/')) return
      newClips.push({ file: f, preview: URL.createObjectURL(f), name: f.name, size: `${(f.size/1024/1024).toFixed(1)} MB` })
    })
    setClips(prev => [...prev, ...newClips].slice(0, 10))
  }, [])

  const removeClip = (i: number) => setClips(prev => { URL.revokeObjectURL(prev[i].preview); return prev.filter((_,j)=>j!==i) })

  const handleGenerate = async () => {
    if (clips.length === 0) return
    setLoading(true); setError(null); setVideoUrl(null); setScript(null); setProgress(5)
    setProgressMsg('Uploading videos...'); setStep('generating')
    try {
      const fd = new FormData()
      clips.forEach(c => fd.append('files', c.file))
      fd.append('user_name', userName); fd.append('brand_name', brandName)
      fd.append('business_type', businessType); fd.append('target_audience', targetAudience)
      fd.append('user_prompt', userPrompt); fd.append('language', language)
      fd.append('music_genre', musicGenre); fd.append('remove_noise', String(removeNoise))
      fd.append('add_intro', String(addIntro)); fd.append('clip_duration', String(clipDuration))
      fd.append('platform', 'instagram_reels')

      const res = await fetch('/api/smart-cinematic', { method: 'POST', body: fd })
      const data = await res.json()
      if (!data.success || !data.job_id) throw new Error(data.error || 'Failed to start')
      setJobId(data.job_id); setProgress(15); setProgressMsg('Gemini is analyzing your videos...')

      const result = await pollJob(data.job_id, (p, s) => {
        setProgress(p)
        if (p < 25) setProgressMsg('Gemini analyzing videos & generating script...')
        else if (p < 40) setProgressMsg('Creating voiceover...')
        else if (p < 55) setProgressMsg('Fetching background music...')
        else if (p < 80) setProgressMsg('Applying cinematic effects & removing noise...')
        else setProgressMsg('Assembling final reel...')
        if (s) setScript(s)
      })

      if (result.error) throw new Error(result.error)
      if (result.video_url) { setVideoUrl(result.video_url); if (result.script) setScript(result.script) }
      setStep('result')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed'); setStep('upload')
    } finally { setLoading(false) }
  }

  const handleUpdateScript = async () => {
    if (!jobId || !updatePrompt.trim()) return
    try {
      const res = await fetch(`/api/smart-cinematic?jobId=${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ update_prompt: updatePrompt, user_name: userName, brand_name: brandName, language }),
      })
      const data = await res.json()
      if (data.success && data.script) { setScript(data.script); setUpdatePrompt('') }
    } catch (e) { console.error(e) }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-slate-950/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-slate-400 hover:text-slate-200"><ArrowLeft className="h-4 w-4" /></Link>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 shadow-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">Smart Cinematic</h1>
              <p className="text-[11px] text-slate-400">AI-powered • Gemini script • Auto subtitles • Noise removal</p>
            </div>
          </div>
          <div className="flex gap-2">
            {['info','upload','result'].map((s,i) => (
              <div key={s} className={`h-2 w-8 rounded-full transition-all ${step===s||(['generating','result'].includes(step)&&i<=2) ? 'bg-violet-500' : 'bg-slate-700'}`} />
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 space-y-6">

        {/* STEP 1 — User Info */}
        {step === 'info' && (
          <div className="space-y-5">
            <Card className="rounded-2xl border-white/[0.06] bg-slate-900/80">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-5 w-5 text-violet-400" /> Tell us about you
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Your Name *</label>
                    <input type="text" placeholder="e.g. Ravi Kumar" value={userName} onChange={e=>setUserName(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-violet-500" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Brand / Business Name *</label>
                    <input type="text" placeholder="e.g. Ravi's Bike Shop" value={brandName} onChange={e=>setBrandName(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-violet-500" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-2 block">Business Type *</label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {BUSINESS_TYPES.map(bt => (
                      <button key={bt} onClick={()=>setBusinessType(bt)}
                        className={`rounded-lg px-2 py-2 text-xs font-medium border transition-all cursor-pointer ${businessType===bt ? 'border-violet-500 bg-violet-500/10 text-violet-300' : 'border-slate-700 text-slate-400 hover:border-slate-500'}`}>
                        {bt}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Target Audience</label>
                  <input type="text" placeholder="e.g. Bike enthusiasts aged 20-35" value={targetAudience} onChange={e=>setTargetAudience(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-violet-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-white/[0.06] bg-slate-900/80">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-cyan-400" /> Your Vision (Optional)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Describe what you want (Gemini will follow this)</label>
                  <textarea rows={3} placeholder="e.g. Start with the shop exterior at sunset, show the bikes inside, end with me talking to camera. Make it feel premium and exciting."
                    value={userPrompt} onChange={e=>setUserPrompt(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-violet-500 resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block"><Globe className="h-3 w-3 inline mr-1" />Language</label>
                    <select value={language} onChange={e=>setLanguage(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500 cursor-pointer">
                      {LANGUAGES.map(l=><option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block"><Music className="h-3 w-3 inline mr-1" />Music Style</label>
                    <select value={musicGenre} onChange={e=>setMusicGenre(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500 cursor-pointer">
                      {MUSIC_GENRES.map(g=><option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800/30 px-3 py-2">
                    <span className="text-xs text-slate-300">Remove background noise</span>
                    <button onClick={()=>setRemoveNoise(!removeNoise)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${removeNoise?'bg-violet-600':'bg-slate-700'}`}>
                      <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${removeNoise?'translate-x-4':'translate-x-1'}`}/>
                    </button>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800/30 px-3 py-2">
                    <span className="text-xs text-slate-300">Add intro title card</span>
                    <button onClick={()=>setAddIntro(!addIntro)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${addIntro?'bg-violet-600':'bg-slate-700'}`}>
                      <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${addIntro?'translate-x-4':'translate-x-1'}`}/>
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Clip Duration: {clipDuration}s per clip</label>
                  <input type="range" min={2} max={12} step={1} value={clipDuration} onChange={e=>setClipDuration(Number(e.target.value))} className="w-full accent-violet-500" />
                </div>
              </CardContent>
            </Card>

            <Button onClick={()=>setStep('upload')} disabled={!userName||!brandName}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-bold disabled:opacity-50">
              Next — Upload Videos →
            </Button>
          </div>
        )}

        {/* STEP 2 — Upload */}
        {step === 'upload' && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
              <Sparkles className="h-5 w-5 text-violet-400 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-slate-200">Hi {userName}! Upload your {businessType} videos</p>
                <p className="text-xs text-slate-400 mt-0.5">Gemini will analyze them, determine the best order, write subtitles in {language}, and create a cinematic reel for {brandName}</p>
              </div>
            </div>

            <Card className="rounded-2xl border-white/[0.06] bg-slate-900/80">
              <CardContent className="p-5 space-y-4">
                <div
                  onDragOver={e=>{e.preventDefault();setDragOver(true)}}
                  onDragLeave={()=>setDragOver(false)}
                  onDrop={e=>{e.preventDefault();setDragOver(false);handleFiles(e.dataTransfer.files)}}
                  onClick={()=>fileRef.current?.click()}
                  className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 cursor-pointer transition-all ${dragOver?'border-violet-500 bg-violet-500/5':'border-slate-700 hover:border-violet-500/40'}`}>
                  <Upload className="h-10 w-10 text-slate-500 mb-3" />
                  <p className="text-sm font-medium text-slate-300">Drop your raw videos here</p>
                  <p className="text-xs text-slate-500 mt-1">MP4, MOV, AVI — up to 10 clips • Gemini will order them smartly</p>
                  <input ref={fileRef} type="file" accept="video/*" multiple className="hidden" onChange={e=>handleFiles(e.target.files)} />
                </div>

                {clips.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{clips.length} clips uploaded — Gemini will determine best order</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {clips.map((clip,i)=>(
                        <div key={i} className="relative rounded-xl overflow-hidden border border-white/[0.06] bg-slate-800">
                          <div className="relative" style={{aspectRatio:'9/16',maxHeight:'140px'}}>
                            <video src={clip.preview} className="w-full h-full object-cover" muted />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                              <Play className="h-6 w-6 text-white/70" />
                            </div>
                            <div className="absolute top-1 left-1 bg-black/60 rounded text-[10px] text-white px-1.5 py-0.5">#{i+1}</div>
                          </div>
                          <div className="p-2">
                            <p className="text-[10px] text-slate-300 truncate">{clip.name}</p>
                            <p className="text-[10px] text-slate-500">{clip.size}</p>
                          </div>
                          <button onClick={()=>removeClip(i)} className="absolute top-1 right-1 bg-rose-500/80 rounded-full p-0.5 hover:bg-rose-500">
                            <X className="h-3 w-3 text-white" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {error && <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4"><p className="text-sm text-rose-400">{error}</p></div>}

            <div className="flex gap-3">
              <Button onClick={()=>setStep('info')} variant="outline" className="rounded-xl border-slate-700 text-slate-300">← Back</Button>
              <Button onClick={handleGenerate} disabled={clips.length===0||loading}
                className="flex-1 h-12 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-bold disabled:opacity-50">
                <Sparkles className="h-5 w-5 mr-2" />
                Generate Smart Cinematic Reel ({clips.length} clips)
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3 — Generating */}
        {step === 'generating' && (
          <Card className="rounded-2xl border-white/[0.06] bg-slate-900/80">
            <CardContent className="p-8 space-y-6">
              <div className="text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-violet-500/10 mx-auto mb-4">
                  <Sparkles className="h-8 w-8 text-violet-400 animate-pulse" />
                </div>
                <h3 className="text-lg font-bold text-slate-100 mb-1">Creating Your Cinematic Reel</h3>
                <p className="text-sm text-slate-400">{progressMsg}</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Progress</span><span className="font-bold text-violet-400">{progress}%</span>
                </div>
                <Progress value={progress} className="h-3" />
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  {label:'Gemini analyzing videos', done: progress>=20},
                  {label:'Generating script & subtitles', done: progress>=25},
                  {label:'Creating voiceover', done: progress>=40},
                  {label:'Removing background noise', done: progress>=55},
                  {label:'Applying cinematic effects', done: progress>=70},
                  {label:'Adding transitions & music', done: progress>=85},
                  {label:'Burning subtitles', done: progress>=90},
                  {label:'Final optimization', done: progress>=100},
                ].map((item,i)=>(
                  <div key={i} className={`flex items-center gap-2 ${item.done?'text-emerald-400':'text-slate-600'}`}>
                    <CheckCircle className="h-3 w-3 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
              {script?.video_title && (
                <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
                  <p className="text-xs text-violet-400 font-semibold mb-1">✨ Gemini Generated Script</p>
                  <p className="text-sm font-bold text-slate-200">{script.video_title}</p>
                  {script.video_concept && <p className="text-xs text-slate-400 mt-1">{script.video_concept}</p>}
                  {script.director_notes && <p className="text-xs text-slate-500 mt-1 italic">"{script.director_notes}"</p>}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* STEP 4 — Result */}
        {step === 'result' && videoUrl && (
          <div className="space-y-5">
            {/* Video player */}
            <Card className="rounded-2xl border-white/[0.06] bg-slate-900/80 overflow-hidden">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-emerald-400" />
                  <h3 className="text-base font-bold text-slate-100">Your Cinematic Reel is Ready!</h3>
                  <Badge className="rounded-full bg-emerald-500/10 text-emerald-400 ml-auto">✓ Complete</Badge>
                </div>
                <div className="flex justify-center">
                  <div className="relative w-full max-w-[260px] rounded-2xl overflow-hidden bg-black shadow-2xl" style={{aspectRatio:'9/16'}}>
                    <video src={videoUrl} controls autoPlay className="absolute inset-0 w-full h-full object-contain bg-black" />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button onClick={()=>{const a=document.createElement('a');a.href=videoUrl;a.download=`${brandName||'cinematic'}_reel.mp4`;a.click()}}
                    className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-semibold">
                    <Download className="h-4 w-4 mr-2" /> Download MP4
                  </Button>
                  <Button onClick={()=>{setStep('upload');setVideoUrl(null);setClips([]);setProgress(0)}} variant="outline" className="rounded-xl border-slate-700 text-slate-300">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-slate-500 text-center">1080×1920 · 9:16 · Ready for Instagram Reels, TikTok & YouTube Shorts</p>
              </CardContent>
            </Card>

            {/* Script display */}
            {script && (
              <Card className="rounded-2xl border-white/[0.06] bg-slate-900/80">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-violet-400" /> Gemini Generated Script
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {script.video_title && <div className="rounded-lg bg-violet-500/5 border border-violet-500/10 p-3"><p className="text-xs text-violet-400 mb-1">Title</p><p className="text-sm font-bold text-slate-200">{script.video_title}</p></div>}
                  {script.full_voiceover_script && <div className="rounded-lg bg-slate-800/60 p-3"><p className="text-xs text-slate-400 mb-1">Voiceover Script</p><p className="text-sm text-slate-300 whitespace-pre-wrap">{script.full_voiceover_script}</p></div>}
                  {script.scenes && script.scenes.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-slate-400 mb-2">Scene Breakdown</p>
                      <div className="space-y-2">
                        {script.scenes.map((s,i)=>(
                          <div key={i} className="flex items-start gap-3 rounded-lg bg-slate-800/40 p-3">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-500/20 text-violet-400 text-xs font-bold shrink-0">{i+1}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge className="rounded-full bg-slate-700 text-slate-300 text-[10px]">{s.scene_type}</Badge>
                                <Badge className="rounded-full bg-cyan-500/10 text-cyan-400 text-[10px]">{s.effect}</Badge>
                                <Badge className="rounded-full bg-amber-500/10 text-amber-400 text-[10px]">{s.color_grade}</Badge>
                                <span className="text-[10px] text-slate-500">{s.duration_seconds}s</span>
                              </div>
                              {s.subtitle && <p className="text-xs text-slate-200 mt-1 font-medium">"{s.subtitle}"</p>}
                              {s.voiceover_line && <p className="text-xs text-slate-400 mt-0.5">{s.voiceover_line}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {script.hashtags && script.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {script.hashtags.map((h,i)=><Badge key={i} className="rounded-full bg-slate-700 text-slate-300 text-xs">{h}</Badge>)}
                    </div>
                  )}

                  {/* Update script prompt */}
                  <div className="border-t border-white/[0.06] pt-4">
                    <p className="text-xs text-slate-400 mb-2">Want to change something? Tell Gemini:</p>
                    <div className="flex gap-2">
                      <input type="text" placeholder="e.g. Make the subtitles more energetic, change music to Bollywood..."
                        value={updatePrompt} onChange={e=>setUpdatePrompt(e.target.value)}
                        onKeyDown={e=>e.key==='Enter'&&handleUpdateScript()}
                        className="flex-1 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-violet-500" />
                      <Button onClick={handleUpdateScript} disabled={!updatePrompt.trim()} size="sm" className="rounded-lg bg-violet-600 hover:bg-violet-700 text-white">
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
