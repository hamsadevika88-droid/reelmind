'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, X, Play, Download, Film, Zap, Palette, Clock, ChevronDown, LayoutDashboard, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import Link from 'next/link'

const COLOR_GRADES = [
  { id: 'cinematic', label: 'Cinematic', desc: 'Dark curves + vignette', color: '#7c3aed' },
  { id: 'warm',      label: 'Warm',      desc: 'Golden tones',           color: '#f59e0b' },
  { id: 'cool',      label: 'Cool',      desc: 'Blue tones',             color: '#3b82f6' },
  { id: 'vibrant',   label: 'Vibrant',   desc: 'High saturation',        color: '#10b981' },
  { id: 'moody',     label: 'Moody',     desc: 'Dark + vignette',        color: '#6b7280' },
  { id: 'golden',    label: 'Golden',    desc: 'Warm golden hour',       color: '#d97706' },
  { id: 'dramatic',  label: 'Dramatic',  desc: 'High contrast',          color: '#ef4444' },
  { id: 'fresh',     label: 'Fresh',     desc: 'Bright & clean',         color: '#06b6d4' },
]

const EFFECTS = [
  { id: 'zoom_in',   label: 'Zoom In',    icon: '🔍' },
  { id: 'zoom_out',  label: 'Zoom Out',   icon: '🔎' },
  { id: 'pan_left',  label: 'Pan Left',   icon: '⬅️' },
  { id: 'pan_right', label: 'Pan Right',  icon: '➡️' },
  { id: 'tilt_up',   label: 'Tilt Up',    icon: '⬆️' },
  { id: 'tilt_down', label: 'Tilt Down',  icon: '⬇️' },
  { id: 'none',      label: 'Static',     icon: '⏹️' },
]

const MUSIC_GENRES = ['Pop', 'Hip-hop', 'Electronic', 'Cinematic', 'Acoustic', 'Lo-fi', 'Bollywood', 'Jazz']

interface UploadedClip {
  file: File
  preview: string
  name: string
  size: string
  effect: string
}

async function pollJob(jobId: string, onProgress: (p: number) => void): Promise<{ video_url?: string; thumbnail_url?: string; error?: string }> {
  for (let i = 0; i < 120; i++) {
    await new Promise(r => setTimeout(r, 3000))
    try {
      const res = await fetch(`/api/cinematic-edit?jobId=${jobId}`)
      const data = await res.json()
      if (data.progress) onProgress(data.progress)
      if (data.status === 'completed') return { video_url: data.video_url, thumbnail_url: data.thumbnail_url }
      if (data.status === 'failed') return { error: data.error || 'Generation failed' }
    } catch { /* keep polling */ }
  }
  return { error: 'Timed out after 6 minutes' }
}

export default function CinematicPage() {
  const [clips, setClips] = useState<UploadedClip[]>([])
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [ctaText, setCtaText] = useState('')
  const [colorGrade, setColorGrade] = useState('cinematic')
  const [clipDuration, setClipDuration] = useState(5)
  const [addIntro, setAddIntro] = useState(true)
  const [musicGenre, setMusicGenre] = useState('Cinematic')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [thumbUrl, setThumbUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return
    const newClips: UploadedClip[] = []
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('video/')) return
      const preview = URL.createObjectURL(file)
      const sizeMB = (file.size / 1024 / 1024).toFixed(1)
      newClips.push({
        file,
        preview,
        name: file.name,
        size: `${sizeMB} MB`,
        effect: 'zoom_in',
      })
    })
    setClips(prev => [...prev, ...newClips].slice(0, 10))
  }, [])

  const removeClip = (index: number) => {
    setClips(prev => {
      URL.revokeObjectURL(prev[index].preview)
      return prev.filter((_, i) => i !== index)
    })
  }

  const updateEffect = (index: number, effect: string) => {
    setClips(prev => prev.map((c, i) => i === index ? { ...c, effect } : c))
  }

  const moveClip = (from: number, to: number) => {
    setClips(prev => {
      const arr = [...prev]
      const [item] = arr.splice(from, 1)
      arr.splice(to, 0, item)
      return arr
    })
  }

  const handleGenerate = async () => {
    if (clips.length === 0) return
    setLoading(true)
    setError(null)
    setVideoUrl(null)
    setThumbUrl(null)
    setProgress(5)

    try {
      const formData = new FormData()
      clips.forEach(clip => formData.append('files', clip.file))

      const effects = clips.map(c => c.effect)
      formData.append('title', title)
      formData.append('subtitle', subtitle)
      formData.append('cta_text', ctaText)
      formData.append('color_grade', colorGrade)
      formData.append('effects', JSON.stringify(effects))
      formData.append('clip_duration', String(clipDuration))
      formData.append('add_intro', String(addIntro))
      formData.append('music_genre', musicGenre)
      formData.append('platform', 'instagram_reels')

      const res = await fetch('/api/cinematic-edit', { method: 'POST', body: formData })
      const data = await res.json()

      if (!data.success || !data.job_id) {
        throw new Error(data.error || 'Failed to start generation')
      }

      setProgress(15)
      const result = await pollJob(data.job_id, setProgress)

      if (result.error) throw new Error(result.error)
      if (result.video_url) {
        setVideoUrl(result.video_url)
        setThumbUrl(result.thumbnail_url || null)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (!videoUrl) return
    const a = document.createElement('a')
    a.href = videoUrl
    a.download = `${title || 'cinematic_reel'}.mp4`
    a.click()
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-slate-950/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 shadow-lg">
              <Film className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                Cinematic Editor
              </h1>
              <p className="text-[11px] text-slate-400">Upload raw videos → get cinematic reel</p>
            </div>
          </div>
          <Link href="/dashboard">
            <Button variant="outline" className="rounded-xl border-slate-700 text-slate-300 text-sm">
              <LayoutDashboard className="h-4 w-4 mr-2" /> My Videos
            </Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 space-y-6">

        {/* Upload Zone */}
        <Card className="rounded-2xl border-white/[0.06] bg-slate-900/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Upload className="h-5 w-5 text-violet-400" />
              Upload Your Videos
              <Badge className="rounded-full bg-violet-500/10 text-violet-400 text-xs ml-auto">
                {clips.length}/10 clips
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 cursor-pointer transition-all ${
                dragOver ? 'border-violet-500 bg-violet-500/5' : 'border-slate-700 hover:border-violet-500/40'
              }`}
            >
              <Upload className="h-10 w-10 text-slate-500 mb-3" />
              <p className="text-sm font-medium text-slate-300">Drop your videos here or click to browse</p>
              <p className="text-xs text-slate-500 mt-1">MP4, MOV, AVI, WebM — up to 10 clips</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                multiple
                className="hidden"
                onChange={e => handleFiles(e.target.files)}
              />
            </div>

            {/* Clip list */}
            {clips.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Clips — drag to reorder, pick effect per clip
                </p>
                {clips.map((clip, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-slate-800/50 p-3">
                    {/* Thumbnail */}
                    <div className="relative w-16 h-28 rounded-lg overflow-hidden bg-slate-700 shrink-0">
                      <video src={clip.preview} className="w-full h-full object-cover" muted />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Play className="h-5 w-5 text-white/70" />
                      </div>
                      <div className="absolute top-1 left-1 bg-black/60 rounded text-[10px] text-white px-1">
                        {i + 1}
                      </div>
                    </div>

                    {/* Info + effect picker */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">{clip.name}</p>
                      <p className="text-xs text-slate-500 mb-2">{clip.size}</p>
                      {/* Effect selector */}
                      <div className="flex flex-wrap gap-1">
                        {EFFECTS.map(ef => (
                          <button
                            key={ef.id}
                            onClick={() => updateEffect(i, ef.id)}
                            className={`text-[10px] px-2 py-1 rounded-full border transition-all cursor-pointer ${
                              clip.effect === ef.id
                                ? 'border-violet-500 bg-violet-500/20 text-violet-300'
                                : 'border-slate-700 text-slate-500 hover:border-slate-500'
                            }`}
                          >
                            {ef.icon} {ef.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Move + remove */}
                    <div className="flex flex-col gap-1 shrink-0">
                      {i > 0 && (
                        <button onClick={() => moveClip(i, i - 1)}
                          className="text-slate-500 hover:text-slate-300 text-xs px-2 py-1 rounded border border-slate-700 hover:border-slate-500">
                          ↑
                        </button>
                      )}
                      {i < clips.length - 1 && (
                        <button onClick={() => moveClip(i, i + 1)}
                          className="text-slate-500 hover:text-slate-300 text-xs px-2 py-1 rounded border border-slate-700 hover:border-slate-500">
                          ↓
                        </button>
                      )}
                      <button onClick={() => removeClip(i)}
                        className="text-rose-400 hover:text-rose-300 p-1 rounded border border-rose-500/20 hover:border-rose-500/40">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Settings */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Text Settings */}
          <Card className="rounded-2xl border-white/[0.06] bg-slate-900/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="h-4 w-4 text-violet-400" /> Text & Branding
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Title (shown in intro)</label>
                <input
                  type="text"
                  placeholder="e.g. My New Bike 🏍️"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-violet-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Subtitle</label>
                <input
                  type="text"
                  placeholder="e.g. Royal Enfield Himalayan 450"
                  value={subtitle}
                  onChange={e => setSubtitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-violet-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">CTA Text (last clip)</label>
                <input
                  type="text"
                  placeholder="e.g. Follow for more rides 🔥"
                  value={ctaText}
                  onChange={e => setCtaText(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-violet-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs text-slate-400">Add intro title card</label>
                <button
                  onClick={() => setAddIntro(!addIntro)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${addIntro ? 'bg-violet-600' : 'bg-slate-700'}`}
                >
                  <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${addIntro ? 'translate-x-4' : 'translate-x-1'}`} />
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Visual Settings */}
          <Card className="rounded-2xl border-white/[0.06] bg-slate-900/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Palette className="h-4 w-4 text-violet-400" /> Visual Style
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Color grade */}
              <div>
                <label className="text-xs text-slate-400 mb-2 block">Color Grade</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {COLOR_GRADES.map(g => (
                    <button
                      key={g.id}
                      onClick={() => setColorGrade(g.id)}
                      title={g.desc}
                      className={`flex flex-col items-center gap-1 rounded-lg p-2 border transition-all cursor-pointer ${
                        colorGrade === g.id
                          ? 'border-violet-500 bg-violet-500/10'
                          : 'border-white/[0.06] hover:border-slate-600'
                      }`}
                    >
                      <div className="h-4 w-4 rounded-full" style={{ backgroundColor: g.color }} />
                      <span className="text-[9px] text-slate-400">{g.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Clip duration */}
              <div>
                <label className="text-xs text-slate-400 mb-1 block flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Clip Duration: {clipDuration}s per clip
                </label>
                <input
                  type="range" min={2} max={15} step={1}
                  value={clipDuration}
                  onChange={e => setClipDuration(Number(e.target.value))}
                  className="w-full accent-violet-500"
                />
                <div className="flex justify-between text-[10px] text-slate-600 mt-0.5">
                  <span>2s</span><span>15s</span>
                </div>
              </div>

              {/* Music genre */}
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Background Music</label>
                <div className="relative">
                  <select
                    value={musicGenre}
                    onChange={e => setMusicGenre(e.target.value)}
                    className="w-full appearance-none rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 pr-8 text-sm text-slate-200 focus:outline-none focus:border-violet-500 cursor-pointer"
                  >
                    {MUSIC_GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={loading || clips.length === 0}
          className="w-full h-14 rounded-xl text-base font-bold text-white bg-gradient-to-r from-violet-600 to-cyan-500 hover:opacity-90 shadow-xl shadow-violet-500/25 disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Film className="h-5 w-5 animate-spin" />
              Creating Cinematic Reel...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Film className="h-5 w-5" />
              Create Cinematic Reel ({clips.length} clip{clips.length !== 1 ? 's' : ''})
            </span>
          )}
        </Button>

        {/* Progress */}
        {loading && (
          <Card className="rounded-2xl border-white/[0.06] bg-slate-900/80">
            <CardContent className="p-6 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-200">Processing your clips...</p>
                <span className="text-sm font-bold text-violet-400">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-500">
                <span className={progress >= 20 ? 'text-emerald-400' : ''}>✓ Uploading clips</span>
                <span className={progress >= 40 ? 'text-emerald-400' : ''}>✓ Applying effects</span>
                <span className={progress >= 70 ? 'text-emerald-400' : ''}>✓ Adding transitions</span>
                <span className={progress >= 90 ? 'text-emerald-400' : ''}>✓ Mixing audio</span>
              </div>
              <p className="text-xs text-slate-500 text-center">
                ~{Math.ceil(clips.length * clipDuration / 10 + 30)} seconds estimated
              </p>
            </CardContent>
          </Card>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4">
            <p className="text-sm text-rose-400">{error}</p>
          </div>
        )}

        {/* Result */}
        {videoUrl && (
          <Card className="rounded-2xl border-white/[0.06] bg-slate-900/80 overflow-hidden">
            <CardHeader className="pb-0">
              <CardTitle className="text-base flex items-center gap-2">
                <Film className="h-5 w-5 text-emerald-400" />
                Your Cinematic Reel is Ready!
                <Badge className="rounded-full bg-emerald-500/10 text-emerald-400 ml-auto">✓ Complete</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {/* Video player */}
              <div className="flex justify-center">
                <div className="relative w-full max-w-[280px] rounded-2xl overflow-hidden bg-black shadow-2xl shadow-violet-500/10" style={{ aspectRatio: '9/16' }}>
                  <video
                    src={videoUrl}
                    controls
                    className="absolute inset-0 w-full h-full object-contain bg-black"
                    autoPlay
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  onClick={handleDownload}
                  className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-semibold"
                >
                  <Download className="h-4 w-4 mr-2" /> Download MP4
                </Button>
                <Button
                  onClick={() => { setVideoUrl(null); setClips([]); setProgress(0) }}
                  variant="outline"
                  className="rounded-xl border-slate-700 text-slate-300"
                >
                  New Reel
                </Button>
              </div>

              <p className="text-xs text-slate-500 text-center">
                1080×1920 · 9:16 vertical · Ready for Instagram Reels, TikTok & YouTube Shorts
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
