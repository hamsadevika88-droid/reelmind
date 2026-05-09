/**
 * /api/agent — ReelForge AI Agent Route
 *
 * Replaces Lyzr completely.
 * Routes to our own CrewAI agent server (Python/FastAPI).
 *
 * Two modes (POST):
 *   1. Submit:  body has { message, product_name, product_description, ... }
 *              → submits job to CrewAI server, returns { task_id }
 *   2. Poll:    body has { task_id }
 *              → polls CrewAI server for job status/result
 */

import { NextRequest, NextResponse } from 'next/server'

const AGENT_SERVER_URL = process.env.AGENT_SERVER_URL || 'http://localhost:8000'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // ── Poll mode ──
    if (body.task_id) {
      return pollJob(body.task_id)
    }

    // ── Submit mode ──
    return submitJob(body)
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Server error'
    return NextResponse.json(
      { success: false, response: { status: 'error', result: {}, message: msg }, error: msg },
      { status: 500 }
    )
  }
}

/**
 * Parse the user message to extract structured fields.
 * The frontend sends a natural language message — we parse it here.
 */
function parseMessage(message: string, body: any): Record<string, any> {
  return {
    product_name: body.product_name || extractField(message, 'product') || 'Product',
    product_description: body.product_description || message,
    content_type: body.content_type || 'Product Demo',
    platform: body.platform || 'Instagram Reels',
    language: body.language || 'English',
    duration_seconds: body.duration_seconds || 20,
  }
}

function extractField(text: string, field: string): string {
  const patterns: Record<string, RegExp> = {
    product: /(?:product|item|selling)[\s:]+([^\n,]+)/i,
  }
  const match = text.match(patterns[field])
  return match ? match[1].trim() : ''
}

async function submitJob(body: any) {
  const payload = parseMessage(body.message || '', body)

  const res = await fetch(`${AGENT_SERVER_URL}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const text = await res.text()
    return NextResponse.json(
      { success: false, response: { status: 'error', result: {}, message: `Agent server error: ${res.status}` }, error: text },
      { status: res.status }
    )
  }

  const data = await res.json()
  return NextResponse.json({ task_id: data.job_id, status: 'pending' })
}

async function pollJob(task_id: string) {
  const res = await fetch(`${AGENT_SERVER_URL}/status/${task_id}`)

  if (!res.ok) {
    return NextResponse.json(
      { success: false, status: 'failed', error: `Poll failed: ${res.status}` },
      { status: res.status }
    )
  }

  const data = await res.json()

  if (data.status === 'pending' || data.status === 'running') {
    return NextResponse.json({ status: 'processing', progress: data.progress || 0 })
  }

  if (data.status === 'failed') {
    return NextResponse.json(
      { success: false, status: 'failed', response: { status: 'error', result: {}, message: data.error || 'Pipeline failed' }, error: data.error },
      { status: 500 }
    )
  }

  // Completed
  const result = data.result || {}

  return NextResponse.json({
    success: true,
    status: 'completed',
    response: {
      status: 'success',
      result,
      message: `Ad generated successfully for ${result.production_metadata?.language || 'your product'}`,
      metadata: {
        agent_name: 'ReelForge CrewAI Pipeline',
        timestamp: new Date().toISOString(),
        agents_used: result.production_metadata?.agents_used || [],
        pipeline_steps: result.production_metadata?.pipeline_steps_completed || 9,
      },
    },
    timestamp: new Date().toISOString(),
  })
}
