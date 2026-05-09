'use client'

import { useState, useEffect } from 'react'
import { Film, Zap, Download, Trash2, Clock, CheckCircle, XCircle, Play, BarChart2, Globe, Star, Crown, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'

interface VideoJob {
  id: string
  product_name: string
  language: string
  platform: string
  tier: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  video_url?: string
  thumbnail_url?: string
  created_at: string
  duration_seconds?: number
}

const TIER_CONFIG = {
  free: {
    label: 'Free',
    color: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    icon: Zap,
    features: ['Google TTS Voice', 'Pexels Stock Video', 'Basic Text Overlays', '720p Output'],
  },
  pro: {
    label: 'Pro',
    color: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    icon: Star,
    features: ['ElevenLabs AI Voice', 'HD Stock Video', 'Cinematic Color Grade', 'CTA Overlay', '1080p Output'],
  },
  enterprise: {
    label: 'Enterprise',
    color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    icon: Crown,
    features: ['HeyGen AI Avatar', 'ElevenLabs Voice', 'Cinematic Grade', 'No Watermark', '4K Output'],
  },
}

function TierBadge({ tier }: { tier: string }) {
  const config = TIER_CONFIG[tier as keyof typeof TIER_CONFIG] || TIER_CONFIG.free
  const Icon = config.icon
  return (
    <Badge className={`rounded-full text-xs ${config.color}`}>
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; icon: React.ReactNode }> = {
    completed: { color: 'bg-emerald-500/10 text-emerald-400', icon: <CheckCircle className="h-3 w-3 mr-1" /> },
    failed: { color: 'bg-rose-500/10 text-rose-400', icon: <XCircle className="h-3 w-3 mr-1" /> },
    running: { color: 'bg-violet-500/10 text-violet-400', icon: <Zap className="h-3 w-3 mr-1 animate-pulse" /> },
    pending: { color: 'bg-slate-500/10 text-slate-400', icon: <Clock className="h-3 w-3 mr-1" /> },
  }
  const s = map[status] || map.pending
  return (
    <Badge className={`rounded-full text-xs ${s.color}`}>
      {s.icon}{status}
    </Badge>
  )
}

export default function DashboardPage() {
  const [jobs, setJobs] = useState<VideoJob[]>([])
  const [activeTab, setActiveTab] = useState('videos')
  const [stats, setStats] = useState({ total: 0, completed: 0, languages: 0, thisWeek: 0 })

  // Load jobs from localStorage (Phase 2 — will be DB in Phase 3)
  useEffect(() => {
    try {
      const stored = localStorage.getItem('reelforge_jobs')
      if (stored) {
        const parsed = JSON.parse(stored) as VideoJob[]
        setJobs(parsed)
        setStats({
          total: parsed.length,
          completed: parsed.filter(j => j.status === 'completed').length,
          languages: new Set(parsed.map(j => j.language)).size,
          thisWeek: parsed.filter(j => {
            const d = new Date(j.created_at)
            const now = new Date()
            return (now.getTime() - d.getTime()) < 7 * 24 * 60 * 60 * 1000
          }).length,
        })
      }
    } catch { /* ignore */ }
  }, [])

  const handleDelete = (id: string) => {
    const updated = jobs.filter(j => j.id !== id)
    setJobs(updated)
    localStorage.setItem('reelforge_jobs', JSON.stringify(updated))
  }

  const handleDownload = (videoUrl: string, productName: string) => {
    const a = document.createElement('a')
    a.href = videoUrl
    a.download = `${productName.replace(/\s+/g, '_')}_reel.mp4`
    a.click()
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-slate-950/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 shadow-lg">
              <Film className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                ReelForge AI
              </h1>
              <p className="text-[11px] text-slate-400">Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button className="rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white hover:opacity-90">
                <Zap className="h-4 w-4 mr-2" /> Create New Ad
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Ads', value: stats.total, icon: Film, color: 'text-violet-400' },
            { label: 'Completed', value: stats.completed, icon: CheckCircle, color: 'text-emerald-400' },
            { label: 'Languages', value: stats.languages, icon: Globe, color: 'text-cyan-400' },
            { label: 'This Week', value: stats.thisWeek, icon: BarChart2, color: 'text-amber-400' },
          ].map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.label} className="rounded-2xl border-white/[0.06] bg-slate-900/80">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-slate-500">{stat.label}</p>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                  <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Tier Comparison */}
        <div>
          <h2 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-400" /> Choose Your Tier
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Object.entries(TIER_CONFIG).map(([tier, config]) => {
              const Icon = config.icon
              return (
                <Card key={tier} className={`rounded-2xl border-white/[0.06] bg-slate-900/80 ${tier === 'pro' ? 'ring-2 ring-violet-500/50' : ''}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Icon className={`h-5 w-5 ${tier === 'free' ? 'text-slate-400' : tier === 'pro' ? 'text-violet-400' : 'text-amber-400'}`} />
                        {config.label}
                      </CardTitle>
                      {tier === 'pro' && <Badge className="rounded-full bg-violet-500/20 text-violet-300 text-xs">Popular</Badge>}
                      {tier === 'enterprise' && <Badge className="rounded-full bg-amber-500/20 text-amber-300 text-xs">Best Quality</Badge>}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {config.features.map((f) => (
                      <div key={f} className="flex items-center gap-2">
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        <span className="text-xs text-slate-300">{f}</span>
                      </div>
                    ))}
                    <Link href={`/?tier=${tier}`}>
                      <Button className={`w-full mt-3 rounded-xl text-sm ${tier === 'enterprise' ? 'bg-gradient-to-r from-amber-500 to-orange-500' : tier === 'pro' ? 'bg-gradient-to-r from-violet-600 to-cyan-500' : 'bg-slate-700 hover:bg-slate-600'} text-white`}>
                        Generate with {config.label}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Video Library */}
        <div>
          <h2 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
            <Film className="h-5 w-5 text-violet-400" /> Your Video Library
          </h2>

          {jobs.length === 0 ? (
            <Card className="rounded-2xl border-white/[0.06] bg-slate-900/80">
              <CardContent className="p-12 text-center">
                <Film className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 mb-2">No videos yet</p>
                <p className="text-sm text-slate-500 mb-6">Generate your first AI video ad to see it here</p>
                <Link href="/">
                  <Button className="rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white">
                    <Zap className="h-4 w-4 mr-2" /> Create First Ad
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {jobs.map((job) => (
                <Card key={job.id} className="rounded-2xl border-white/[0.06] bg-slate-900/80 overflow-hidden">
                  {/* Thumbnail */}
                  <div className="relative aspect-[9/16] max-h-48 bg-slate-800 overflow-hidden">
                    {job.thumbnail_url ? (
                      <img src={job.thumbnail_url} alt={job.product_name} className="w-full h-full object-cover" />
                    ) : job.video_url ? (
                      <video src={job.video_url} className="w-full h-full object-cover" muted />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Film className="h-8 w-8 text-slate-600" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 flex gap-1">
                      <TierBadge tier={job.tier} />
                    </div>
                    <div className="absolute top-2 left-2">
                      <StatusBadge status={job.status} />
                    </div>
                  </div>

                  <CardContent className="p-4 space-y-3">
                    <div>
                      <p className="font-semibold text-slate-100 truncate">{job.product_name || 'Untitled'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="rounded-full text-[10px] border-slate-700 text-slate-400">
                          <Globe className="h-2.5 w-2.5 mr-1" />{job.language}
                        </Badge>
                        <Badge variant="outline" className="rounded-full text-[10px] border-slate-700 text-slate-400">
                          {job.platform?.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-500">
                      {new Date(job.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>

                    <div className="flex gap-2">
                      {job.video_url && job.status === 'completed' && (
                        <Button
                          size="sm"
                          onClick={() => handleDownload(job.video_url!, job.product_name)}
                          className="flex-1 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs"
                        >
                          <Download className="h-3 w-3 mr-1" /> Download
                        </Button>
                      )}
                      {job.video_url && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(job.video_url, '_blank')}
                          className="rounded-lg border-slate-700 text-slate-300 text-xs"
                        >
                          <Play className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(job.id)}
                        className="rounded-lg border-rose-500/20 text-rose-400 hover:bg-rose-500/10 text-xs"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
