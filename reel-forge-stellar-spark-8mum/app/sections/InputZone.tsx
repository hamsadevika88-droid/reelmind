'use client'

import React, { useRef, useState, useCallback } from 'react'
import { User, Box, Zap, Smartphone, MessageCircle, Package, ArrowRight, BookOpen, Star, Briefcase, Upload, X, Globe, ChevronDown, Shirt, Diamond } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const CONTENT_TYPES = [
  { id: 'ugc_testimonial', label: 'UGC Testimonial', icon: User, tip: 'AI avatar delivers authentic testimonial' },
  { id: 'product_demo', label: 'Product Demo', icon: Box, tip: 'Cinematic product showcase' },
  { id: 'fashion_reel', label: 'Fashion Reel', icon: Shirt, tip: 'AI model wears your garment' },
  { id: 'jewellery_showcase', label: 'Jewellery Showcase', icon: Diamond, tip: 'Cinematic sparkle & orbits' },
  { id: 'hook_demo', label: 'Hook + Demo', icon: Zap, tip: 'Catchy hook + product walkthrough' },
  { id: 'app_demo', label: 'App Demo', icon: Smartphone, tip: 'AI actor shows your app' },
  { id: 'testimonial', label: 'Testimonial', icon: MessageCircle, tip: 'Social proof with results' },
  { id: 'unboxing', label: 'Unboxing', icon: Package, tip: 'Build anticipation & reveal' },
  { id: 'before_after', label: 'Before/After', icon: ArrowRight, tip: 'Dramatic transformation' },
  { id: 'tutorial', label: 'Tutorial', icon: BookOpen, tip: 'Step-by-step with product' },
  { id: 'lifestyle', label: 'Lifestyle', icon: Star, tip: 'Aspirational daily routine' },
  { id: 'service_explainer', label: 'Service Explainer', icon: Briefcase, tip: 'Professional service video' },
] as const

const PLATFORMS = [
  { id: 'instagram_reels', label: 'Instagram Reels', ratio: '9:16' },
  { id: 'youtube_shorts', label: 'YouTube Shorts', ratio: '9:16' },
  { id: 'tiktok', label: 'TikTok', ratio: '9:16' },
  { id: 'facebook_ads', label: 'Facebook Ads', ratio: '4:5' },
  { id: 'meta_ads', label: 'Meta Ads', ratio: '1:1' },
] as const

const LANGUAGES = [
  'English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam',
  'Marathi', 'Bengali', 'Gujarati', 'Punjabi', 'Urdu',
  'Spanish', 'French', 'German', 'Japanese', 'Korean',
  'Portuguese', 'Arabic', 'Chinese', 'Indonesian', 'Thai', 'Vietnamese',
] as const

interface InputZoneProps {
  description: string
  onDescriptionChange: (val: string) => void
  contentType: string
  onContentTypeChange: (val: string) => void
  platform: string
  onPlatformChange: (val: string) => void
  file: File | null
  onFileChange: (f: File | null) => void
  urlInput: string
  onUrlChange: (val: string) => void
  onGenerate: () => void
  loading: boolean
  showSample: boolean
  selectedLanguage: string
  onLanguageChange: (val: string) => void
}

export default function InputZone({
  description,
  onDescriptionChange,
  contentType,
  onContentTypeChange,
  platform,
  onPlatformChange,
  file,
  onFileChange,
  urlInput,
  onUrlChange,
  onGenerate,
  loading,
  showSample,
  selectedLanguage,
  onLanguageChange,
}: InputZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile) onFileChange(droppedFile)
  }, [onFileChange])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) onFileChange(selected)
  }, [onFileChange])

  const previewUrl = file ? URL.createObjectURL(file) : null
  const isVideo = file?.type?.startsWith('video')

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-slate-900/80 backdrop-blur-xl p-6 space-y-6 shadow-2xl">
      {/* Content Type Selector */}
      <div>
        <Label className="text-sm font-semibold mb-3 block text-slate-200">Content Type</Label>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
          {CONTENT_TYPES.map((ct) => {
            const Icon = ct.icon
            const isSelected = contentType === ct.id
            return (
              <button
                key={ct.id}
                onClick={() => onContentTypeChange(ct.id)}
                title={ct.tip}
                className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 transition-all duration-200 cursor-pointer ${isSelected ? 'border-violet-500 bg-violet-500/10 shadow-lg shadow-violet-500/10' : 'border-white/[0.06] hover:border-violet-500/30 bg-slate-800/50'}`}
              >
                <Icon className={`h-5 w-5 ${isSelected ? 'text-violet-400' : 'text-slate-400'}`} />
                <span className={`text-[10px] font-medium text-center leading-tight ${isSelected ? 'text-violet-300' : 'text-slate-400'}`}>{ct.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Platform Target */}
      <div>
        <Label className="text-sm font-semibold mb-3 block text-slate-200">Platform</Label>
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map((p) => {
            const isSelected = platform === p.id
            return (
              <button
                key={p.id}
                onClick={() => onPlatformChange(p.id)}
                className={`rounded-full px-4 py-2 text-xs font-medium transition-all duration-200 cursor-pointer ${isSelected ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/25' : 'bg-slate-800 text-slate-400 border border-white/[0.06] hover:border-violet-500/30'}`}
              >
                {p.label} <span className="text-[10px] opacity-70">({p.ratio})</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Reference Asset Upload */}
      <div>
        <Label className="text-sm font-semibold mb-2 block text-slate-200">Reference Asset</Label>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-colors duration-200 cursor-pointer ${dragOver ? 'border-violet-500 bg-violet-500/5' : 'border-slate-700 hover:border-violet-500/40 bg-slate-800/30'}`}
        >
          {file ? (
            <div className="flex flex-col items-center gap-2 w-full">
              {isVideo ? (
                <video src={previewUrl ?? undefined} className="max-h-24 rounded-lg" muted />
              ) : (
                <img src={previewUrl ?? undefined} alt="Preview" className="max-h-24 rounded-lg object-contain" />
              )}
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-300">{file.name}</span>
                <button onClick={(e) => { e.stopPropagation(); onFileChange(null) }} className="p-1 rounded-full hover:bg-slate-700 transition-colors">
                  <X className="h-4 w-4 text-slate-400" />
                </button>
              </div>
            </div>
          ) : (
            <>
              <Upload className="h-7 w-7 text-slate-500 mb-2" />
              <p className="text-sm font-medium text-slate-300">Drop your reference photo or video</p>
              <p className="text-xs text-slate-500 mt-1">.jpg, .png, .mp4, .webm</p>
            </>
          )}
          <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.mp4,.webm" className="hidden" onChange={handleFileSelect} />
        </div>
        <div className="mt-2">
          <Input
            placeholder="Or paste a URL to a reference image/video..."
            value={urlInput}
            onChange={(e) => onUrlChange(e.target.value)}
            className="rounded-xl border-slate-700 bg-slate-800/50 text-slate-200 placeholder:text-slate-500 focus:border-violet-500"
          />
        </div>
      </div>

      {/* Product Description */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-sm font-semibold text-slate-200">Product Description</Label>
          <span className="text-xs text-slate-500">{description.length}/500</span>
        </div>
        <Textarea
          placeholder={showSample ? '' : 'Describe your product, target audience, and what this ad should achieve...'}
          value={description}
          onChange={(e) => { if (e.target.value.length <= 500) onDescriptionChange(e.target.value) }}
          rows={4}
          className="rounded-xl border-slate-700 bg-slate-800/50 text-slate-200 placeholder:text-slate-500 resize-none focus:border-violet-500"
        />
      </div>

      {/* Language */}
      <div>
        <Label className="text-sm font-semibold mb-2 block text-slate-200">
          <span className="flex items-center gap-2"><Globe className="h-4 w-4 text-violet-400" /> Script Language</span>
        </Label>
        <div className="relative">
          <select
            value={selectedLanguage}
            onChange={(e) => onLanguageChange(e.target.value)}
            className="w-full appearance-none rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-2.5 pr-10 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 cursor-pointer"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        </div>
      </div>

      {/* Generate Button */}
      <div className="space-y-2">
        <Button
          onClick={onGenerate}
          disabled={loading || (!description.trim() && !showSample)}
          className="w-full h-14 rounded-xl text-base font-bold text-white bg-gradient-to-r from-violet-600 to-cyan-500 hover:opacity-90 transition-opacity shadow-xl shadow-violet-500/25 disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <span className="flex items-center gap-2"><Zap className="h-5 w-5 animate-spin" /> Generating Cinematic Ad...</span>
          ) : (
            <span className="flex items-center gap-2"><Zap className="h-5 w-5" /> Generate Cinematic Ad</span>
          )}
        </Button>
        <p className="text-center text-[11px] text-slate-500">Powered by 9 AI Agents -- AdStrategy, TrendSync, BuyerMind, ScriptWriter, CMO, Audio, Voice, Avatar, HTML Director</p>
      </div>
    </div>
  )
}
