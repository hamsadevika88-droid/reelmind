'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Upload, X, Play, Download, Film, Zap, Palette, Clock,
  LayoutDashboard, ArrowLeft, Sparkles, User, Store, RefreshCw,
  CheckCircle, Music, Volume2, Type, Wand2, ChevronDown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────

type VideoType = 'shop' | 'product' | 'bike' | 'food' | 'travel' | 'fitness' | 'fashion' | 'other'
type ColorGrade = 'cinematic' | 'warm' | 'cool' | 'vibrant' | 'moody' | 'golden' | 'dramatic' | 'fresh'
type Effect = 'zoom_in' | 'zoom_out' | 'pan_left' | 'pan_right' | 'tilt_up' | 'tilt_down' | 'none'
type MusicGenre = 'Cinematic' | 'Pop' | 'Hip-hop' | 'Electronic' | 'Bollywood' | 'Acoustic' | 'Lo-fi' | 'Jazz'

interface ClipFile {
  file: File
  preview: string
  effect: Effect
  duration: number
}

interface ScriptScene {
  clip_index: number
  narration: string
  overlay_text: string
  duration: number
}

interface GeneratedScript {
  title: string
  scenes: ScriptScene[]
  cta: string
  raw?: string
}

interface UserInfo {
  userName: string
  brandName: string
  videoType: VideoType
  language: string
  userPrompt: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const COLOR_GRADES: { value: ColorGrade; label: string; preview: string }[] = [
  { value: 'cinematic', label: 'Cinematic', preview: 'from-slate-700 to-slate-900' },
  { value: 'warm',      label: 'Warm',      preview: 'from-amber-600 to-orange-800' },
  { value: 'cool',      label: 'Cool',      preview: 'from-blue-600 to-cyan-800' },
  { value: 'vibrant',   label: 'Vibrant',   preview: 'from-pink-500 to-purple-700' },
  { value: 'moody',     label: 'Moody',     preview: 'from-slate-800 to-indigo-950' },
  { value: 'golden',    label: 'Golden',    preview: 'from-yellow-500 to-amber-700' },
  { value: 'dramatic',  label: 'Dramatic',  preview: 'from-rose-700 to-slate-900' },
  { value: 'fresh',     label: 'Fresh',     preview: 'from-emerald-500 to-teal-700' },
]

const EFFECTS: Effect[] = ['zoom_in', 'zoom_out', 'pan_left', 'pan_right', 'tilt_up', 'tilt_down', 'none']

const MUSIC_GENRES: MusicGenre[] = ['Cinematic', 'Pop', 'Hip-hop', 'Electronic', 'Bollywood', 'Acoustic', 'Lo-fi', 'Jazz']

const VIDEO_TYPES: { value: VideoType; label: string }[] = [
  { value: 'shop',    label: 'Shop / Store' },
  { value: 'product', label: 'Product' },
  { value: 'bike',    label: 'Bike / Vehicle' },
  { value: 'food',    label: 'Food & Beverage' },
  { value: 'travel',  label: 'Travel' },
  { value: 'fitness', label: 'Fitness' },
  { value: 'fashion', label: 'Fashion' },
  { value: 'other',   label: 'Other' },
]

const LANGUAGES = [
  'English', 'Hindi', 'Spanish', 'French', 'German', 'Portuguese',
  'Arabic', 'Japanese', 'Korean', 'Chinese', 'Tamil', 'Telugu',
]

const STEPS = [
  { id: 1, label: 'Upload',     icon: Upload },
  { id: 2, label: 'Script',     icon: Sparkles },
  { id: 3, label: 'Customize',  icon: Palette },
  { id: 4, label: 'Result',     icon: Play },
]
