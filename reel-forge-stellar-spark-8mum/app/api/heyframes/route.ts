import { NextRequest, NextResponse } from 'next/server'

const HEYFRAMES_URL = process.env.HEYFRAMES_URL || 'http://localhost:3456'

const VALID_TRANSITIONS = ['fade', 'wipe'] as const
const VALID_DIRECTIONS = ['from-left', 'from-right', 'from-top', 'from-bottom'] as const

// --- In-memory job store ---
export interface RenderJob {
  id: string
  status: 'pending' | 'rendering' | 'complete' | 'failed'
  video_url?: string
  fileName?: string
  hasAudio: boolean
  renderType: 'html' | 'slides'
  error?: string
  createdAt: number
}

// Global job store (persists across requests within same process)
const jobStore = new Map<string, RenderJob>()

// Cleanup old jobs (older than 1 hour)
function cleanupOldJobs() {
  const ONE_HOUR = 60 * 60 * 1000
  const now = Date.now()
  for (const [id, job] of jobStore) {
    if (now - job.createdAt > ONE_HOUR) {
      jobStore.delete(id)
    }
  }
}

export function getJob(jobId: string): RenderJob | undefined {
  return jobStore.get(jobId)
}

// Async exec helper
function execAsync(command: string, options: Record<string, any> = {}): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const { exec } = require('child_process')
    exec(command, { ...options }, (error: any, stdout: string, stderr: string) => {
      if (error) {
        error.stdout = stdout
        error.stderr = stderr
        reject(error)
      } else {
        resolve({ stdout, stderr })
      }
    })
  })
}

function sanitizeSlide(slide: any, index: number) {
  const title = (typeof slide.title === 'string' && slide.title.trim()) || `Slide ${index + 1}`
  const subtitle = (typeof slide.subtitle === 'string' && slide.subtitle.trim()) || title
  const background = (typeof slide.background === 'string' && slide.background.trim()) || '#111111'
  const accent = (typeof slide.accent === 'string' && slide.accent.trim()) || '#f4c542'
  const durationInFrames = (typeof slide.durationInFrames === 'number' && slide.durationInFrames > 0)
    ? Math.round(slide.durationInFrames)
    : 120

  const result: any = { title, subtitle, background, accent, durationInFrames }

  if (slide.transition && typeof slide.transition === 'object') {
    const transType = VALID_TRANSITIONS.includes(slide.transition.type) ? slide.transition.type : 'fade'
    const transition: any = { type: transType, durationInFrames: 10 }
    if (transType === 'wipe' && VALID_DIRECTIONS.includes(slide.transition.direction)) {
      transition.direction = slide.transition.direction
    }
    result.transition = transition
  } else {
    result.transition = { type: index === 0 ? 'fade' : 'wipe', durationInFrames: 10 }
  }

  return result
}

function wrapHtmlForHyperframes(htmlContent: string, durationSeconds: number): string {
  const width = 1080
  const height = 1920

  if (htmlContent.includes('data-composition-id') && htmlContent.includes('window.__timelines')) {
    if (!htmlContent.includes('data-duration')) {
      htmlContent = htmlContent.replace('data-composition-id=', `data-duration="${durationSeconds}" data-composition-id=`)
    }
    return htmlContent
  }

  let bodyContent = htmlContent
  const bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*)<\/body>/i)
  if (bodyMatch) {
    bodyContent = bodyMatch[1]
  }

  let styles = ''
  const styleMatches = Array.from(htmlContent.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi))
  for (const match of styleMatches) {
    styles += match[1] + '\n'
  }

  bodyContent = bodyContent.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
  bodyContent = bodyContent.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')

  let inlineScripts = ''
  const scriptMatches = Array.from(htmlContent.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi))
  for (const match of scriptMatches) {
    if (match[1].trim()) {
      inlineScripts += match[1] + '\n'
    }
  }

  const hasTimelineRegistration = inlineScripts.includes('window.__timelines')

  const timelineScript = hasTimelineRegistration
    ? inlineScripts
    : `
      window.__timelines = window.__timelines || {};
      const tl = gsap.timeline({ paused: true });

      const clip = document.querySelector('#root .clip') || document.querySelector('#root');
      let sceneList = [];

      if (clip) {
        const selectors = [
          '.scene', '.slide', 'section',
          ':scope > div[class*="scene"]',
          ':scope > div[class*="slide"]'
        ];

        for (const sel of selectors) {
          try {
            const found = Array.from(clip.querySelectorAll(sel));
            if (found.length > 1) {
              sceneList = found;
              break;
            }
          } catch(e) {}
        }

        if (sceneList.length <= 1) {
          const children = Array.from(clip.children).filter(
            el => el.tagName === 'DIV' && el.className && el.className.trim()
          );
          if (children.length > 1) {
            sceneList = children;
          }
        }

        if (sceneList.length <= 1) {
          const children = Array.from(clip.children).filter(
            el => el.tagName !== 'SCRIPT' && el.tagName !== 'STYLE'
          );
          if (children.length > 1) {
            sceneList = children;
          }
        }
      }

      if (sceneList.length > 1) {
        sceneList.forEach((el, i) => {
          if (getComputedStyle(el).position === 'static') {
            el.style.position = 'absolute';
            el.style.width = '100%';
            el.style.height = '100%';
            el.style.top = '0';
            el.style.left = '0';
          }
          gsap.set(el, { opacity: i === 0 ? 1 : 0 });
        });

        const hold = ${durationSeconds} / sceneList.length;
        const transition = Math.min(hold * 0.3, 0.8);

        sceneList.forEach((el, i) => {
          const start = i * hold;

          if (i === 0) {
            tl.from(el, { opacity: 0, duration: 0.4, ease: "power2.out" }, 0);
          }

          if (i > 0) {
            tl.to(sceneList[i - 1], { opacity: 0, duration: transition, ease: "power2.inOut" }, start);
            tl.fromTo(el, { opacity: 0 }, { opacity: 1, duration: transition, ease: "power2.inOut" }, start);
          }

          const textEls = el.querySelectorAll('h1, h2, h3, p, span.title, span.subtitle, .text-overlay');
          textEls.forEach((child, ci) => {
            if (ci < 6) {
              tl.fromTo(child,
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" },
                start + 0.2 + ci * 0.12
              );
            }
          });
        });

        tl.to({}, { duration: 0.01 }, ${durationSeconds} - 0.01);
      } else {
        const root = document.querySelector('#root');
        if (root) {
          gsap.set(root, { opacity: 1 });
          tl.from(root, { opacity: 0, duration: 0.5, ease: "power2.out" }, 0);
          tl.to({}, { duration: 0.01 }, ${durationSeconds} - 0.01);
        }
      }

      window.__timelines["reelmind-ad"] = tl;
      ${inlineScripts}
    `

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=${width}, height=${height}" />
  <script src="./gsap.min.js"><\/script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: ${width}px;
      height: ${height}px;
      overflow: hidden;
      font-family: "Trebuchet MS", "Segoe UI", sans-serif;
    }
    #root {
      position: relative;
      width: ${width}px;
      height: ${height}px;
      overflow: hidden;
    }
    #root .scene, #root .slide, #root section {
      position: absolute;
      width: 100%;
      height: 100%;
      top: 0;
      left: 0;
    }
    #root .scene:first-child, #root .slide:first-child, #root section:first-child {
      opacity: 1 !important;
    }
    ${styles}
  </style>
</head>
<body>
  <div id="root" data-composition-id="reelmind-ad" data-start="0" data-duration="${durationSeconds}" data-width="${width}" data-height="${height}">
    <div data-start="0" data-duration="${durationSeconds}" data-track-index="0" class="clip" style="width:100%;height:100%;position:relative;">
      ${bodyContent}
    </div>
  </div>
  <script>
    ${timelineScript}
  <\/script>
</body>
</html>`
}

// Background render for HTML
async function renderHtmlInBackground(jobId: string, htmlCode: string, durationSeconds: number) {
  const HEYFRAMES_ROOT = '/app/Heyframes'
  const TEMP_ROOT = `${HEYFRAMES_ROOT}/.tmp/jobs`
  const RENDERS_DIR = `${HEYFRAMES_ROOT}/renders`

  const { writeFileSync, mkdirSync, copyFileSync, existsSync } = await import('fs')
  const { randomUUID } = await import('crypto')

  const renderJobId = randomUUID()
  const jobDir = `${TEMP_ROOT}/${renderJobId}`
  const fileName = `reelmind-html-${Date.now()}.mp4`
  const outputPath = `${RENDERS_DIR}/${fileName}`

  try {
    mkdirSync(jobDir, { recursive: true })
    mkdirSync(RENDERS_DIR, { recursive: true })

    const processedHtml = wrapHtmlForHyperframes(htmlCode, durationSeconds)

    writeFileSync(`${jobDir}/index.html`, processedHtml, 'utf8')
    if (existsSync(`${HEYFRAMES_ROOT}/hyperframes.json`)) {
      copyFileSync(`${HEYFRAMES_ROOT}/hyperframes.json`, `${jobDir}/hyperframes.json`)
    }
    if (existsSync(`${HEYFRAMES_ROOT}/DESIGN.md`)) {
      copyFileSync(`${HEYFRAMES_ROOT}/DESIGN.md`, `${jobDir}/DESIGN.md`)
    }
    writeFileSync(`${jobDir}/meta.json`, JSON.stringify({
      id: 'reelmind-html-ad',
      name: 'ReelMind HTML Ad'
    }), 'utf8')

    // Copy GSAP locally so render doesn't need CDN access
    const gsapLocalPath = `${HEYFRAMES_ROOT}/node_modules/gsap/dist/gsap.min.js`
    if (existsSync(gsapLocalPath)) {
      copyFileSync(gsapLocalPath, `${jobDir}/gsap.min.js`)
    }

    const job = jobStore.get(jobId)
    if (job) job.status = 'rendering'

    console.log(`Starting HTML render: ${jobDir} -> ${outputPath}`)
    try {
      await execAsync(
        `npx hyperframes render "${jobDir}" --output "${outputPath}" --quality draft --fps 24 --workers 1`,
        {
          cwd: HEYFRAMES_ROOT,
          timeout: 240000,
          env: { ...process.env, PATH: `${HEYFRAMES_ROOT}/node_modules/.bin:${process.env.PATH}` },
          maxBuffer: 10 * 1024 * 1024,
        }
      )
    } catch (renderErr: any) {
      console.warn('First render attempt failed, retrying with minimal settings:', renderErr?.message?.slice(0, 300), renderErr?.stderr?.toString()?.slice(0, 300))
      await execAsync(
        `npx hyperframes render "${jobDir}" --output "${outputPath}" --quality draft --fps 24 --workers 1`,
        {
          cwd: HEYFRAMES_ROOT,
          timeout: 240000,
          env: { ...process.env, PATH: `${HEYFRAMES_ROOT}/node_modules/.bin:${process.env.PATH}` },
          maxBuffer: 10 * 1024 * 1024,
        }
      )
    }

    try { await execAsync(`rm -rf "${jobDir}"`, { timeout: 5000 }) } catch {}

    const completedJob = jobStore.get(jobId)
    if (completedJob) {
      completedJob.status = 'complete'
      completedJob.video_url = `/api/heyframes/video/${fileName}`
      completedJob.fileName = fileName
    }
    console.log(`Render complete: ${fileName}`)
  } catch (error: any) {
    try { await execAsync(`rm -rf "${jobDir}"`, { timeout: 5000 }) } catch {}
    try {
      const { unlinkSync } = await import('fs')
      unlinkSync(outputPath)
    } catch {}

    console.error('HTML render error:', error?.message, error?.stderr?.toString()?.slice(0, 500))
    const failedJob = jobStore.get(jobId)
    if (failedJob) {
      failedJob.status = 'failed'
      failedJob.error = error instanceof Error ? error.message : 'Rendering failed'
    }
  }
}

// Background render for slides
async function renderSlidesInBackground(jobId: string, slides: any[], compositionId: string) {
  try {
    // Check Heyframes is running
    try {
      await fetch(`${HEYFRAMES_URL}/health`, { signal: AbortSignal.timeout(5000) })
    } catch {
      const job = jobStore.get(jobId)
      if (job) {
        job.status = 'failed'
        job.error = 'Video rendering service is not available.'
      }
      return
    }

    const job = jobStore.get(jobId)
    if (job) job.status = 'rendering'

    const sanitizedSlides = slides.map((slide: any, idx: number) => sanitizeSlide(slide, idx))

    const renderPayload = {
      fileName: `reelmind-${Date.now()}.mp4`,
      compositionId: compositionId === 'PaintExplainerChunk' ? 'PaintExplainerChunk' : 'ExplainerDeck',
      props: { slides: sanitizedSlides },
    }

    const renderResponse = await fetch(`${HEYFRAMES_URL}/render`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(renderPayload),
    })

    if (!renderResponse.ok) {
      let errorDetail = ''
      try {
        const errorJson = await renderResponse.json()
        errorDetail = errorJson.message || ''
      } catch {
        errorDetail = await renderResponse.text().catch(() => '')
      }
      const failedJob = jobStore.get(jobId)
      if (failedJob) {
        failedJob.status = 'failed'
        failedJob.error = `Rendering failed: ${errorDetail || renderResponse.status}`
      }
      return
    }

    const renderResult = await renderResponse.json()

    if (!renderResult.ok) {
      const failedJob = jobStore.get(jobId)
      if (failedJob) {
        failedJob.status = 'failed'
        failedJob.error = renderResult.message || 'Render failed'
      }
      return
    }

    const fileName = renderResult.fileName || ''
    const completedJob = jobStore.get(jobId)
    if (completedJob) {
      completedJob.status = 'complete'
      completedJob.video_url = `/api/heyframes/video/${fileName}`
      completedJob.fileName = fileName
    }
  } catch (error: any) {
    console.error('Slides render error:', error)
    const failedJob = jobStore.get(jobId)
    if (failedJob) {
      failedJob.status = 'failed'
      failedJob.error = error instanceof Error ? error.message : 'Rendering failed'
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    cleanupOldJobs()
    const body = await req.json()
    const { randomUUID } = await import('crypto')
    const jobId = randomUUID()

    // HTML rendering path
    if (body.html_code && typeof body.html_code === 'string') {
      const job: RenderJob = {
        id: jobId,
        status: 'pending',
        hasAudio: false,
        renderType: 'html',
        createdAt: Date.now(),
      }
      jobStore.set(jobId, job)

      // Fire and forget -- renders in the background
      renderHtmlInBackground(jobId, body.html_code, body.total_duration_seconds || 20).catch(err => {
        console.error('Background HTML render crashed:', err)
        const j = jobStore.get(jobId)
        if (j) { j.status = 'failed'; j.error = 'Render process crashed' }
      })

      return NextResponse.json({ success: true, jobId, status: 'pending' })
    }

    // Slides rendering path
    const { slides, compositionId = 'ExplainerDeck' } = body as {
      slides: any[]
      compositionId?: string
    }

    if (!Array.isArray(slides) || slides.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No slides or html_code provided for video rendering' },
        { status: 400 }
      )
    }

    const job: RenderJob = {
      id: jobId,
      status: 'pending',
      hasAudio: false,
      renderType: 'slides',
      createdAt: Date.now(),
    }
    jobStore.set(jobId, job)

    renderSlidesInBackground(jobId, slides, compositionId).catch(err => {
      console.error('Background slides render crashed:', err)
      const j = jobStore.get(jobId)
      if (j) { j.status = 'failed'; j.error = 'Render process crashed' }
    })

    return NextResponse.json({ success: true, jobId, status: 'pending' })
  } catch (error) {
    console.error('Heyframes proxy error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Video rendering failed' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const healthResponse = await fetch(`${HEYFRAMES_URL}/health`)
    const data = await healthResponse.json()
    return NextResponse.json({ success: true, heyframes: data })
  } catch {
    return NextResponse.json({ success: false, error: 'Heyframes service unreachable' }, { status: 503 })
  }
}
