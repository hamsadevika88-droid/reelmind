import { NextRequest, NextResponse } from 'next/server'
import { readFile, stat } from 'fs/promises'
import path from 'path'

const RENDERS_DIR = '/app/Heyframes/renders'

export async function GET(
  _req: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const { filename } = params

    // Sanitize filename to prevent path traversal
    const safeName = path.basename(filename)
    if (!safeName || safeName.includes('..') || !safeName.endsWith('.mp4')) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 })
    }

    const filePath = path.join(RENDERS_DIR, safeName)

    // Check file exists
    try {
      await stat(filePath)
    } catch {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    const fileBuffer = await readFile(filePath)

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Length': fileBuffer.length.toString(),
        'Content-Disposition': `attachment; filename="${safeName}"`,
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    console.error('Video serve error:', error)
    return NextResponse.json(
      { error: 'Failed to serve video' },
      { status: 500 }
    )
  }
}
