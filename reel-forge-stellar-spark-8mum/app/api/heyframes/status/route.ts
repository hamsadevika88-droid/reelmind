import { NextRequest, NextResponse } from 'next/server'
import { getJob } from '../route'

export async function GET(req: NextRequest) {
  const jobId = req.nextUrl.searchParams.get('jobId')

  if (!jobId) {
    return NextResponse.json({ success: false, error: 'jobId is required' }, { status: 400 })
  }

  const job = getJob(jobId)

  if (!job) {
    return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 })
  }

  return NextResponse.json({
    success: true,
    jobId: job.id,
    status: job.status,
    video_url: job.video_url || null,
    fileName: job.fileName || null,
    hasAudio: job.hasAudio,
    renderType: job.renderType,
    error: job.error || null,
  })
}
