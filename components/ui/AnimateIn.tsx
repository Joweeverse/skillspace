'use client'

/**
 * AnimateIn
 * Scroll-reveal wrapper menggunakan IntersectionObserver.
 * Tidak perlu library eksternal. Otomatis skip animasi jika
 * user mengaktifkan prefers-reduced-motion.
 *
 * Contoh:
 *   <AnimateIn>konten</AnimateIn>
 *   <AnimateIn variant="fadeLeft" delay={150}>konten</AnimateIn>
 */

import { useEffect, useRef, useState, type ReactNode, type ElementType } from 'react'

export type AnimateVariant =
  | 'fadeUp'    // naik + fade (default)
  | 'fadeDown'  // turun + fade
  | 'fadeLeft'  // dari kiri + fade
  | 'fadeRight' // dari kanan + fade
  | 'fade'      // fade saja
  | 'scale'     // scale up + fade
  | 'scaleDown' // scale down + fade

interface AnimateInProps {
  children: ReactNode
  variant?: AnimateVariant
  /** Delay setelah elemen terlihat, dalam milidetik */
  delay?: number
  /** Durasi transisi, dalam milidetik */
  duration?: number
  /** Berapa persen elemen harus terlihat sebelum trigger (0–1) */
  threshold?: number
  className?: string
  as?: ElementType
}

const VARIANTS: Record<AnimateVariant, { from: string; to: string }> = {
  fadeUp:    { from: 'opacity-0 translate-y-10', to: 'opacity-100 translate-y-0' },
  fadeDown:  { from: 'opacity-0 -translate-y-10', to: 'opacity-100 translate-y-0' },
  fadeLeft:  { from: 'opacity-0 -translate-x-10', to: 'opacity-100 translate-x-0' },
  fadeRight: { from: 'opacity-0 translate-x-10',  to: 'opacity-100 translate-x-0' },
  fade:      { from: 'opacity-0',                  to: 'opacity-100' },
  scale:     { from: 'opacity-0 scale-90',         to: 'opacity-100 scale-100' },
  scaleDown: { from: 'opacity-0 scale-110',        to: 'opacity-100 scale-100' },
}

export function AnimateIn({
  children,
  variant = 'fadeUp',
  delay = 0,
  duration = 550,
  threshold = 0.12,
  className = '',
  as: Tag = 'div',
}: AnimateInProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  // Baca prefers-reduced-motion sekali saat render (aman di luar effect)
  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    if (reduced) return // Langsung tampilkan tanpa animasi

    const el = ref.current
    if (!el) return

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          io.unobserve(el)
        }
      },
      { threshold }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [reduced, threshold])

  const { from, to } = VARIANTS[variant]

  // Jika reduced-motion, langsung render tanpa class animasi
  if (reduced) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    )
  }

  return (
    <Tag
      ref={ref}
      className={['will-change-transform', visible ? to : from, className].join(' ')}
      style={{
        transitionProperty: 'opacity, transform',
        transitionDuration: `${duration}ms`,
        transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
        transitionDelay: visible ? `${delay}ms` : '0ms',
      }}
    >
      {children}
    </Tag>
  )
}
