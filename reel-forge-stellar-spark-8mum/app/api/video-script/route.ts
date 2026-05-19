/**
 * /api/video-script
 * Proxies to agent server for AI video script generation
 */

import { NextRequest, NextResponse } from 'next/server'

const AGENT_SERVER_URL = process.env.AGENT_SERVER_URL || 'http://localhost:8000'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const endpoint = body.refine ? 'refine-video-script' : 'generate-video-script'

    const res = await fetch(`${AGENT_SERVER_URL}/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json(
        { success: false, error: `Agent error: ${res.status} — ${text}` },
        { status: res.status }
      )
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Script generation failed'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
