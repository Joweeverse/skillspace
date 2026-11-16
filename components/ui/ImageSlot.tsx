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
}

export function ImageSlot({
  src,
  darkSrc,
  alt,
  aspectRatio,
  priority = false,
  rounded = true,
  className = '',
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
      className={`relative isolate w-full overflow-hidden bg-blue-50/80 dark:bg-slate-900/90 dark:border dark:border-slate-800/80 transition-colors duration-200 ${
        rounded ? 'rounded-3xl' : ''
      } ${className}`}
      style={{ aspectRatio: normalizedAspectRatio }}
    >
      {isMissing ? (
        <div
          className="flex size-full flex-col items-center justify-center gap-3 border border-dashed border-blue-200 bg-blue-50 px-6 text-center text-blue-800 dark:border-slate-700 dark:bg-slate-900 dark:text-blue-300"
          role="img"
          aria-label={`Ilustrasi yang dibutuhkan: ${alt}`}
        >
          <ImageIcon className="size-7" aria-hidden="true" />
          <span className="text-xs font-semibold">{filename}</span>
        </div>
      ) : (
        <Image
          src={localSrc}
          alt={alt}
          fill
          preload={priority}
          loading={priority ? undefined : 'lazy'}
          sizes="(min-width: 1024px) 50vw, 100vw"
          className={`object-contain transition-all duration-300 ${
            isExternalOrPhoto ? 'dark:brightness-95' : ''
          }`}
          onError={() => setIsMissing(true)}
        />
      )}
    </div>
  )
}
