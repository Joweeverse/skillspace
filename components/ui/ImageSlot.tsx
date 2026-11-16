'use client'

import Image from 'next/image'
import { ImageIcon } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'

interface ImageSlotProps {
  src: string
  darkSrc?: string
  alt: string
  aspectRatio: string
  priority?: boolean
  rounded?: boolean
  className?: string
  objectFit?: 'contain' | 'cover'
}

export function ImageSlot({
  src,
  darkSrc,
  alt,
  aspectRatio,
  priority = false,
  rounded = true,
  className = '',
  objectFit = 'contain',
}: ImageSlotProps) {
  const [isMissing, setIsMissing] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = mounted && resolvedTheme === 'dark'
  const chosenSrc = (isDark && darkSrc) ? darkSrc : src

  const localSrc =
    chosenSrc.startsWith('http://') || chosenSrc.startsWith('https://')
      ? chosenSrc
      : chosenSrc.startsWith('/illustrations/')
      ? chosenSrc
      : `/illustrations/${chosenSrc.replace(/^\/+/, '')}`

  const isExternalOrPhoto =
    localSrc.startsWith('http://') ||
    localSrc.startsWith('https://') ||
    localSrc.startsWith('blob:')

  const filename = localSrc.split('/').filter(Boolean).at(-1) ?? 'illustration'
  const normalizedAspectRatio = aspectRatio.includes(':') ? aspectRatio.replace(':', '/') : aspectRatio

  return (
    <div
      className={`relative isolate w-full overflow-hidden bg-slate-50/70 dark:bg-slate-900/60 dark:border dark:border-slate-800/80 transition-colors duration-200 ${
        rounded ? 'rounded-3xl' : ''
      } ${className}`}
      style={{ aspectRatio: normalizedAspectRatio }}
    >
      {isMissing ? (
        <div
          className="flex size-full flex-col items-center justify-center gap-2.5 bg-gradient-to-br from-blue-50/50 via-slate-50/50 to-indigo-50/40 dark:from-slate-800/40 dark:via-slate-900/60 dark:to-slate-800/40 px-6 text-center text-slate-500 dark:text-slate-400"
          role="img"
          aria-label={`Ilustrasi yang dibutuhkan: ${alt}`}
        >
          <div className="flex size-10 items-center justify-center rounded-2xl bg-white/80 dark:bg-slate-800/80 shadow-sm border border-slate-200/50 dark:border-slate-700/60">
            <ImageIcon className="size-5 text-blue-500 dark:text-blue-400" aria-hidden="true" />
          </div>
          <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{filename}</span>
        </div>
      ) : (
        <Image
          src={localSrc}
          alt={alt}
          fill
          preload={priority}
          loading={priority ? undefined : 'lazy'}
          sizes="(min-width: 1024px) 50vw, 100vw"
          className={`${
            objectFit === 'cover' ? 'object-cover' : 'object-contain'
          } transition-all duration-300 ${
            isExternalOrPhoto ? 'dark:brightness-95' : ''
          }`}
          onError={() => setIsMissing(true)}
        />
      )}
    </div>
  )
}
