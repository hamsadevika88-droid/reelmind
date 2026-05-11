'use client'

import { Film, Zap, Clapperboard } from 'lucide-react'
import Link from 'next/link'

interface HeaderProps {
  showSample: boolean
  onToggleSample: (val: boolean) => void
}

export default function Header({ showSample, onToggleSample }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-slate-950/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 shadow-lg shadow-violet-500/25">
            <Film className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">ReelMind</h1>
            <p className="text-[11px] text-slate-400">Cinematic AI Ads That Convert</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1.5">
            <Zap className="h-3 w-3 text-violet-400" />
            <span className="text-[10px] font-medium text-violet-300">9-Agent Pipeline</span>
            <span className="text-[10px] text-slate-500">|</span>
            <span className="text-[10px] font-medium text-cyan-400">12 Content Types</span>
            <span className="text-[10px] text-slate-500">|</span>
            <span className="text-[10px] font-medium text-amber-400">CMO Quality Gate</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/cinematic">
              <button className="flex items-center gap-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1.5 hover:bg-cyan-500/20 transition-colors cursor-pointer">
                <Clapperboard className="h-3 w-3 text-cyan-400" />
                <span className="text-[10px] font-medium text-cyan-300 hidden sm:inline">Cinematic Editor</span>
              </button>
            </Link>
            <label htmlFor="sample-toggle" className="text-sm font-medium text-slate-400 cursor-pointer">Sample</label>
            <button
              id="sample-toggle"
              role="switch"
              aria-checked={showSample}
              onClick={() => onToggleSample(!showSample)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${showSample ? 'bg-violet-600' : 'bg-slate-700'}`}
            >
              <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${showSample ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
