'use client'

/**
 * VideoShowcase
 * ─────────────────────────────────────────────────────────────────────
 * Section "See it in action" di halaman beranda.
 *
 * CARA MENAMBAHKAN VIDEO:
 *   1. Letakkan file video kamu di:  public/videos/demo.mp4
 *   2. Simpan, selesai — video akan langsung muncul di section ini.
 *
 * Format yang didukung: .mp4 (H.264), .webm
 * Resolusi rekomendasi: 1280×720 atau 1920×1080
 * ─────────────────────────────────────────────────────────────────────
 */

import { useRef, useState, useEffect, useCallback } from 'react'
import { Play, Pause, Volume2, VolumeX, Maximize2 } from 'lucide-react'
import { AnimateIn } from '@/components/ui/AnimateIn'
import { Container } from '@/components/ui/Container'

// ── Ganti path ini jika nama file video kamu berbeda ─────────────────
const VIDEO_SRC = '/videos/demo.mp4'

// ── Stat badges — 4 sudut video ──────────────────────────────────────
const STATS = [
  { icon: '🎓', label: 'Lessons completed', value: '12,400+', corner: 'top-left'    },
  { icon: '⭐', label: 'Average rating',     value: '4.9 / 5', corner: 'top-right'   },
  { icon: '🚀', label: 'Skills unlocked',   value: '3,200+',  corner: 'bottom-left'  },
  { icon: '🧑‍🏫', label: 'Active mentors',   value: '180+',    corner: 'bottom-right' },
]

const CORNER_CLASS: Record<string, string> = {
  'top-left':     'top-0 left-0 -translate-x-1/4 -translate-y-1/2',
  'top-right':    'top-0 right-0 translate-x-1/4 -translate-y-1/2',
  'bottom-left':  'bottom-0 left-0 -translate-x-1/4 translate-y-1/2',
  'bottom-right': 'bottom-0 right-0 translate-x-1/4 translate-y-1/2',
}

// ── Feature cards di bawah video ─────────────────────────────────────
const FEATURES = [
  {
    icon: '🎥',
    title: 'Video lessons',
    desc: 'Watch at your own pace, rewind freely, and pick up right where you left off.',
  },
  {
    icon: '📝',
    title: 'Instant quizzes',
    desc: 'Test your understanding after each module — feedback shows up right away.',
  },
  {
    icon: '💬',
    title: 'Mentor support',
    desc: 'Ask questions and get personal guidance without switching to another app.',
  },
]

function formatTime(secs: number): string {
  if (!isFinite(secs)) return '0:00'
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function VideoShowcase() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying]   = useState(false)
  const [muted, setMuted]       = useState(true)
  const [progress, setProgress] = useState(0)
  const [current, setCurrent]   = useState(0)
  const [duration, setDuration] = useState(0)
  const [showCtrl, setShowCtrl] = useState(true)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Auto-play muted ketika 40% video terlihat di viewport
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().then(() => setPlaying(true)).catch(() => {})
        } else {
          video.pause()
          setPlaying(false)
        }
      },
      { threshold: 0.4 }
    )
    io.observe(video)
    return () => io.disconnect()
  }, [])

  // Sembunyikan controls setelah 3 detik playing
  const resetHideTimer = useCallback(() => {
    setShowCtrl(true)
    if (hideTimer.current) clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => {
      if (playing) setShowCtrl(false)
    }, 3000)
  }, [playing])

  function togglePlay() {
    const v = videoRef.current
    if (!v) return
    if (v.paused) { v.play(); setPlaying(true); resetHideTimer() }
    else          { v.pause(); setPlaying(false); setShowCtrl(true) }
  }

  function toggleMute() {
    const v = videoRef.current
    if (!v) return
    v.muted = !v.muted
    setMuted(v.muted)
  }

  function handleTimeUpdate() {
    const v = videoRef.current
    if (!v || !isFinite(v.duration)) return
    setCurrent(v.currentTime)
    setProgress((v.currentTime / v.duration) * 100)
  }

  function handleLoadedMetadata() {
    const v = videoRef.current
    if (v) setDuration(v.duration)
  }

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    const v = videoRef.current
    if (!v || !isFinite(v.duration) || v.duration === 0) return
    const pct = Number(e.target.value)
    v.currentTime = (pct / 100) * v.duration
    setProgress(pct)
  }

  function openFullscreen() {
    videoRef.current?.requestFullscreen?.()
  }

  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-br from-[#1a1f5e] via-[#1e2272] to-[#0f1340] py-20 sm:py-28">

      {/* Dekorasi blob cahaya */}
      <div className="pointer-events-none absolute -left-40 -top-40 size-[500px] rounded-full bg-blue-600/10 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 size-96 rounded-full bg-indigo-500/10 blur-3xl" aria-hidden="true" />

      <Container size="content">

        {/* ── Heading ─────────────────────────────────────────────── */}
        <AnimateIn variant="fadeUp" threshold={0.05} className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300">
            See it in action
          </p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Everything in one place,{' '}
            <span className="text-blue-300">exactly how it should&nbsp;be.</span>
          </h2>
          <p className="mt-4 text-base leading-7 text-blue-100/70">
            Watch how learners move seamlessly from video lessons to quizzes to
            mentor discussions — without ever leaving SkillSpace.
          </p>
        </AnimateIn>

        {/* ── Video card ──────────────────────────────────────────── */}
        <AnimateIn variant="scale" delay={120} threshold={0.05} className="mx-auto mt-14 max-w-4xl">
          {/*
           * Wrapper dengan padding ekstra di sisi & atas/bawah untuk memberi
           * ruang badge — badge diposisikan `absolute` di dalam wrapper ini
           * sehingga tidak melewati batas section.
           */}
          <div className="relative px-4 pb-10 pt-10 sm:px-14 sm:pb-10 sm:pt-10">

            {/* Floating stat badges — di sudut wrapper (dalam batas section) */}
            {STATS.map((s, i) => (
              <AnimateIn
                key={s.label}
                variant={s.corner.includes('left') ? 'fadeRight' : 'fadeLeft'}
                delay={260 + i * 70}
                threshold={0.05}
                className={`absolute z-10 hidden sm:block ${CORNER_CLASS[s.corner]}`}
              >
                <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#1e2272]/90 px-3 py-2 shadow-xl backdrop-blur-md">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-white/10 text-base" aria-hidden="true">
                    {s.icon}
                  </span>
                  <div>
                    <p className="text-[10px] font-medium text-blue-200/70">{s.label}</p>
                    <p className="text-sm font-bold text-white">{s.value}</p>
                  </div>
                </div>
              </AnimateIn>
            ))}

          {/* Browser chrome */}
          <div className="overflow-hidden rounded-2xl shadow-[0_32px_80px_rgba(0,0,0,0.6)] ring-1 ring-white/10">
            {/* Title bar */}
            <div className="flex items-center gap-2 bg-[#12163a] px-4 py-2.5">
              <span className="size-3 rounded-full bg-red-500/80"   aria-hidden="true" />
              <span className="size-3 rounded-full bg-yellow-400/80" aria-hidden="true" />
              <span className="size-3 rounded-full bg-green-500/80"  aria-hidden="true" />
              {/* URL bar */}
              <div className="ml-3 flex h-6 flex-1 max-w-sm items-center gap-1.5 rounded-md bg-[#0a0d26] px-3">
                <span className="size-2 rounded-full bg-green-400/60 shrink-0" aria-hidden="true" />
                <span className="truncate text-[11px] text-slate-400 select-none">
                  skillspace.app / learn / react-fundamentals
                </span>
              </div>
            </div>

            {/* Video player */}
            <div
              className="group relative bg-black aspect-video cursor-pointer"
              onMouseMove={resetHideTimer}
              onClick={togglePlay}
              role="button"
              aria-label={playing ? 'Pause video' : 'Play video'}
              tabIndex={0}
              onKeyDown={(e) => e.key === ' ' && togglePlay()}
            >
              {/* Video element */}
              <video
                ref={videoRef}
                src={VIDEO_SRC}
                muted
                loop
                playsInline
                preload="metadata"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                className="size-full object-cover"
              />

              {/* Centre play / pause overlay */}
              <div
                className={`pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
                  !playing || showCtrl ? 'opacity-100' : 'opacity-0'
                }`}
              >
                {!playing && (
                  <span className="flex size-20 items-center justify-center rounded-full bg-black/40 ring-2 ring-white/30 backdrop-blur-sm">
                    <Play className="size-8 translate-x-0.5 text-white" fill="white" aria-hidden="true" />
                  </span>
                )}
              </div>

              {/* Bottom controls — hover / paused */}
              <div
                className={`pointer-events-auto absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pb-3 pt-10 transition-opacity duration-300 ${
                  !playing || showCtrl ? 'opacity-100' : 'opacity-0'
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Progress bar */}
                <div className="relative mx-4 mb-2">
                  <div className="h-1 w-full overflow-hidden rounded-full bg-white/20">
                    <div
                      className="h-full rounded-full bg-blue-400 transition-all duration-100"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={0.1}
                    value={progress}
                    onChange={handleSeek}
                    aria-label="Seek video"
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  />
                </div>

                {/* Controls row */}
                <div className="flex items-center gap-2 px-4">
                  {/* Play / Pause */}
                  <button
                    onClick={togglePlay}
                    aria-label={playing ? 'Pause' : 'Play'}
                    className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 transition"
                  >
                    {playing
                      ? <Pause className="size-3.5" aria-hidden="true" />
                      : <Play  className="size-3.5 translate-x-px" aria-hidden="true" />
                    }
                  </button>

                  {/* Time */}
                  <span className="text-xs tabular-nums text-white/70 select-none">
                    {formatTime(current)} / {formatTime(duration)}
                  </span>

                  <div className="flex-1" />

                  {/* Mute */}
                  <button
                    onClick={toggleMute}
                    aria-label={muted ? 'Unmute' : 'Mute'}
                    className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 transition"
                  >
                    {muted
                      ? <VolumeX className="size-3.5" aria-hidden="true" />
                      : <Volume2 className="size-3.5" aria-hidden="true" />
                    }
                  </button>

                  {/* Fullscreen */}
                  <button
                    onClick={openFullscreen}
                    aria-label="Fullscreen"
                    className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 transition"
                  >
                    <Maximize2 className="size-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </div>{/* end browser chrome */}
          </div>{/* end padding wrapper */}
        </AnimateIn>

        {/* ── Feature cards ───────────────────────────────────────── */}
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {FEATURES.map((f, i) => (
            <AnimateIn key={f.title} variant="fadeUp" delay={i * 90} threshold={0.05}>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                <span className="text-2xl" aria-hidden="true">{f.icon}</span>
                <h3 className="mt-3 text-sm font-bold text-white">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-blue-100/60">{f.desc}</p>
              </div>
            </AnimateIn>
          ))}
        </div>

      </Container>
    </section>
  )
}
