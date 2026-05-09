'use client'

import { useEffect, useState } from 'react'
import { BarChart2, Search, Users, Pencil, Shield, Music, Mic, Camera, Code, CheckCircle } from 'lucide-react'

const STAGES = [
  { label: 'Analyzing ad strategy & probability...', icon: BarChart2 },
  { label: 'Researching viral trends...', icon: Search },
  { label: 'Building buyer personas...', icon: Users },
  { label: 'Writing cinematic scripts...', icon: Pencil },
  { label: 'CMO quality gate review...', icon: Shield },
  { label: 'Designing audio landscape...', icon: Music },
  { label: 'Creating voiceover scripts...', icon: Mic },
  { label: 'Directing avatar & storyboard...', icon: Camera },
  { label: 'Composing HTML visuals...', icon: Code },
]

const FUN_FACTS = [
  'Video ads increase purchase intent by 97%',
  'The first 3 seconds decide if someone watches your ad',
  'Emotional hooks drive 2x more engagement than rational ones',
  'Vertical video gets 58% more engagement than landscape',
  'AI-generated ads can match human creative quality at 10x speed',
  'Sound design contributes 40% to ad memorability',
]

interface LoadingStateProps {
  renderingVideo?: boolean
}

export default function LoadingState({ renderingVideo }: LoadingStateProps) {
  const [activeStage, setActiveStage] = useState(0)
  const [factIndex, setFactIndex] = useState(0)

  useEffect(() => {
    const timers = [
      setTimeout(() => setActiveStage(1), 3000),
      setTimeout(() => setActiveStage(2), 7000),
      setTimeout(() => setActiveStage(3), 12000),
      setTimeout(() => setActiveStage(4), 18000),
      setTimeout(() => setActiveStage(5), 24000),
      setTimeout(() => setActiveStage(6), 30000),
      setTimeout(() => setActiveStage(7), 36000),
      setTimeout(() => setActiveStage(8), 42000),
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  useEffect(() => {
    if (renderingVideo) setActiveStage(8)
  }, [renderingVideo])

  useEffect(() => {
    const interval = setInterval(() => {
      setFactIndex((prev) => (prev + 1) % FUN_FACTS.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const progress = Math.round(((activeStage + 1) / STAGES.length) * 100)

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-slate-900/80 backdrop-blur-xl p-8 shadow-2xl">
      <div className="text-center mb-6">
        <h3 className="text-lg font-bold text-slate-100 mb-2">Producing Your Cinematic Ad</h3>
        <div className="flex items-center justify-center gap-3">
          <div className="flex-1 max-w-xs h-2 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 transition-all duration-700" style={{ width: `${progress}%` }} />
          </div>
          <span className="text-sm font-bold text-violet-400">{progress}%</span>
        </div>
      </div>

      <div className="flex flex-col gap-0.5">
        {STAGES.map((stage, idx) => {
          const Icon = stage.icon
          const isActive = idx === activeStage
          const isDone = idx < activeStage
          return (
            <div key={idx} className="flex items-center gap-4">
              <div className="flex flex-col items-center">
                <div className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all duration-500 ${isDone ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400' : isActive ? 'border-violet-500 bg-violet-500/20 text-violet-400 animate-pulse shadow-lg shadow-violet-500/20' : 'border-slate-700 bg-slate-800 text-slate-600'}`}>
                  {isDone ? <CheckCircle className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </div>
                {idx < STAGES.length - 1 && (
                  <div className={`w-0.5 h-4 transition-colors duration-500 ${isDone ? 'bg-emerald-500/50' : 'bg-slate-700'}`} />
                )}
              </div>
              <span className={`text-sm font-medium transition-colors duration-300 ${isDone ? 'text-emerald-400' : isActive ? 'text-slate-100' : 'text-slate-600'}`}>
                {stage.label}
              </span>
            </div>
          )
        })}
      </div>

      <div className="mt-6 rounded-xl bg-slate-800/50 border border-white/[0.06] p-4 text-center">
        <p className="text-xs text-slate-500 mb-1">Did you know?</p>
        <p className="text-sm text-slate-300 transition-all duration-500">{FUN_FACTS[factIndex]}</p>
      </div>

      <p className="text-xs text-slate-500 text-center mt-4">
        {renderingVideo
          ? 'Rendering your video with Heyframes. This may take 30-60 seconds...'
          : 'Our 9-agent pipeline is orchestrating your cinematic ad. This may take 1-2 minutes.'}
      </p>
    </div>
  )
}
