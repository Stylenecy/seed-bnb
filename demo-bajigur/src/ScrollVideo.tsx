import { useEffect, useRef, useState } from 'react'

const VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260611_104107_121bfb5a-b1df-4e0d-8240-25b81f7cc85d.mp4'

const MAX_FRAME_WIDTH = 1280

/** Decode the video into a bitmap sequence so scroll can scrub without seek lag. */
async function extractFrames(
  blobUrl: string,
  cancelled: () => boolean,
): Promise<ImageBitmap[]> {
  const video = document.createElement('video')
  video.src = blobUrl
  video.muted = true
  video.playsInline = true
  video.preload = 'auto'

  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve()
    video.onerror = () => reject(new Error('video metadata failed'))
  })

  const { duration, videoWidth, videoHeight } = video
  const scale = Math.min(1, MAX_FRAME_WIDTH / videoWidth)
  const width = Math.round(videoWidth * scale)
  const height = Math.round(videoHeight * scale)

  const count = Math.min(120, Math.max(30, Math.round(duration * 24)))
  const span = Math.max(0, duration - 0.05)
  const frames: ImageBitmap[] = []

  for (let i = 0; i < count; i++) {
    if (cancelled()) break
    const time = count === 1 ? 0 : (i / (count - 1)) * span
    await new Promise<void>((resolve) => {
      video.onseeked = () => resolve()
      video.currentTime = time
    })
    frames.push(
      await createImageBitmap(video, {
        resizeWidth: width,
        resizeHeight: height,
      }),
    )
  }

  video.src = ''
  return frames
}

export default function ScrollVideo() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fallbackRef = useRef<HTMLVideoElement>(null)
  const framesRef = useRef<ImageBitmap[]>([])
  const [ready, setReady] = useState(false)

  // Load + decode frames.
  useEffect(() => {
    let cancelled = false
    let objectUrl: string | null = null

    ;(async () => {
      try {
        const blob = await fetch(VIDEO_URL).then((r) => r.blob())
        if (cancelled) return
        objectUrl = URL.createObjectURL(blob)
        const frames = await extractFrames(objectUrl, () => cancelled)
        if (cancelled) {
          frames.forEach((f) => f.close())
          return
        }
        framesRef.current = frames
        setReady(frames.length > 0)
      } catch {
        // ponytail: fall back to <video> currentTime scrubbing, no retry ladder.
      }
    })()

    return () => {
      cancelled = true
      framesRef.current.forEach((f) => f.close())
      framesRef.current = []
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [])

  // Scroll-driven render loop.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let target = 0
    let smoothed = 0
    let lastIndex = -1
    let raf = 0
    let seeking = false

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      canvas.width = Math.max(1, Math.round(canvas.clientWidth * dpr))
      canvas.height = Math.max(1, Math.round(canvas.clientHeight * dpr))
      lastIndex = -1
    }
    resize()

    const readScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      target = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
    }
    readScroll()

    const drawCover = (frame: ImageBitmap) => {
      const scale = Math.max(
        canvas.width / frame.width,
        canvas.height / frame.height,
      )
      const w = frame.width * scale
      const h = frame.height * scale
      ctx.drawImage(frame, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h)
    }

    const video = fallbackRef.current
    const onSeeked = () => {
      seeking = false
    }
    video?.addEventListener('seeked', onSeeked)

    const tick = () => {
      smoothed += (target - smoothed) * 0.1
      const frames = framesRef.current

      if (frames.length > 0) {
        const index = Math.min(
          frames.length - 1,
          Math.round(smoothed * (frames.length - 1)),
        )
        if (index !== lastIndex) {
          lastIndex = index
          drawCover(frames[index])
        }
      } else if (video && video.duration > 0 && !seeking) {
        const time = smoothed * Math.max(0, video.duration - 0.05)
        if (Math.abs(video.currentTime - time) > 0.001) {
          seeking = true
          video.currentTime = time
        }
      }

      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    window.addEventListener('scroll', readScroll, { passive: true })
    window.addEventListener('resize', resize)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', readScroll)
      window.removeEventListener('resize', resize)
      video?.removeEventListener('seeked', onSeeked)
    }
  }, [ready])

  return (
    <div className="fixed inset-0 -z-10 bg-[#0a0a0a]">
      {!ready && (
        <video
          ref={fallbackRef}
          src={VIDEO_URL}
          muted
          playsInline
          preload="auto"
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <div className="absolute inset-0 bg-black/20" />
    </div>
  )
}
