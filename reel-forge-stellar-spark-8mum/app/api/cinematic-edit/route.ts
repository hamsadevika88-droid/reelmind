/**
 * /api/cinematic-edit
 * Proxies multipart video upload to the video pipeline cinematic editor.
 */

import { NextRequest, NextResponse } from 'next/server'

const VIDEO_PIPELINE_URL = process.env.VIDEO_PIPELINE_URL || 'http://localhost:8001'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    const res = await fetch(`${VIDEO_PIPELINE_URL}/cinematic-edit`, {
      method: 'POST',
      body: formData,
    })

    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json(
        { success: false, error: `Pipeline error: ${res.status} — ${text}` },
        { status: res.status }
      )
    }

    const data = await res.json()
    return NextResponse.json({ success: true, ...data })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Cinematic edit failed'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const jobId = request.nextUrl.searchParams.get('jobId')
  if (!jobId) {
    return NextResponse.json({ success: false, error: 'jobId required' }, { status: 400 })
  }

  try {
    const res = await fetch(`${VIDEO_PIPELINE_URL}/status/${jobId}`)
    if (!res.ok) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 })
    }
    const data = await res.json()

    if (data.video_url && !data.video_url.startsWith('http')) {
      data.video_url = `${VIDEO_PIPELINE_URL}${data.video_url}`
    }
    if (data.thumbnail_url && !data.thumbnail_url.startsWith('http')) {
      data.thumbnail_url = `${VIDEO_PIPELINE_URL}${data.thumbnail_url}`
    }

    return NextResponse.json({ success: true, ...data })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Status check failed'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
