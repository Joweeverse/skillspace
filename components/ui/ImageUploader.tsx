'use client'

import React, { useRef, useState, useCallback } from 'react'
import Image from 'next/image'
import { Upload, X, AlertCircle, Loader2, ImageIcon } from 'lucide-react'

interface ImageUploaderProps {
  /** Current image URL (from previous upload or existing data). Null means no image. */
  value: string | null
  /** Called with the new public URL after a successful upload, or null when removed. */
  onChange: (url: string | null) => void
  /** Async function that uploads the file and returns the public URL. */
  onUpload: (file: File) => Promise<string>
  /** CSS aspect-ratio value, e.g. "16/9" or "4/3". Defaults to "16/9". */
  aspectRatio?: string
  /** Disables all interactions while true. */
  disabled?: boolean
  /** Comma-separated MIME types accepted. */
  accept?: string
  /** Label shown above the uploader (optional). */
  label?: React.ReactNode
  /** Additional class names for the outer wrapper. */
  className?: string
}

const DEFAULT_ACCEPT = 'image/jpeg,image/png,image/webp'

export function ImageUploader({
  value,
  onChange,
  onUpload,
  aspectRatio = '16/9',
  disabled = false,
  accept = DEFAULT_ACCEPT,
  label,
  className = '',
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [localPreview, setLocalPreview] = useState<string | null>(null)

  // The image to display: local blob preview while uploading, then the settled value
  const displaySrc = localPreview ?? value

  const validateFile = (file: File): string | null => {
    const allowed = DEFAULT_ACCEPT.split(',')
    if (!allowed.includes(file.type)) {
      return 'Hanya file JPEG, PNG, atau WebP yang diizinkan.'
    }
    if (file.size > 2 * 1024 * 1024) {
      return 'Ukuran file maksimal 2 MB.'
    }
    return null
  }

  const processFile = useCallback(
    async (file: File) => {
      setError(null)
      const validationError = validateFile(file)
      if (validationError) {
        setError(validationError)
        return
      }

      // Show instant local preview
      const blobUrl = URL.createObjectURL(file)
      setLocalPreview(blobUrl)
      setUploading(true)

      try {
        const publicUrl = await onUpload(file)
        onChange(publicUrl)
        // Release the blob URL now that we have the real URL
        URL.revokeObjectURL(blobUrl)
        setLocalPreview(null)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Upload gagal, silakan coba lagi.'
        setError(msg)
        URL.revokeObjectURL(blobUrl)
        setLocalPreview(null)
      } finally {
        setUploading(false)
      }
    },
    [onUpload, onChange]
  )

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0 || disabled) return
    processFile(files[0])
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files)
    // Reset so the same file can be re-selected after removal
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (disabled) return
    handleFiles(e.dataTransfer.files)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled || uploading) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      inputRef.current?.click()
    }
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (disabled || uploading) return
    setLocalPreview(null)
    setError(null)
    onChange(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const isInteractive = !disabled && !uploading

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="text-xs font-black text-gray-400 dark:text-slate-400 uppercase tracking-[0.2em] ml-1">
          {label}
        </label>
      )}

      {/* Drop zone / preview area */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={displaySrc ? 'Gambar cover kursus. Klik untuk mengganti.' : 'Upload gambar cover kursus. Klik atau seret file ke sini.'}
        aria-disabled={disabled}
        onClick={() => isInteractive && inputRef.current?.click()}
        onKeyDown={handleKeyDown}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className={[
          'relative isolate w-full overflow-hidden rounded-2xl border-2 transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/30',
          displaySrc
            ? 'border-gray-200 bg-gray-50 dark:border-slate-700 dark:bg-slate-900'
            : 'border-dashed border-blue-200 bg-blue-50/40 hover:bg-blue-50 hover:border-blue-400 dark:border-slate-700 dark:bg-slate-900/60 dark:hover:bg-slate-800/60 dark:hover:border-blue-500',
          isInteractive ? 'cursor-pointer' : 'cursor-not-allowed opacity-70',
        ].join(' ')}
        style={{ aspectRatio }}
      >
        {/* Preview image */}
        {displaySrc && (
          <Image
            src={displaySrc}
            alt="Preview gambar cover"
            fill
            className="object-cover dark:brightness-95"
            sizes="(min-width: 1024px) 480px, 100vw"
            unoptimized={displaySrc.startsWith('blob:')}
          />
        )}

        {/* Upload prompt (no image yet) */}
        {!displaySrc && !uploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center pointer-events-none">
            <div className="rounded-full bg-blue-100 dark:bg-slate-800 p-3">
              <Upload className="size-6 text-blue-500 dark:text-blue-400" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700 dark:text-slate-200">Klik atau seret gambar ke sini</p>
              <p className="mt-0.5 text-xs text-gray-400 dark:text-slate-400">JPEG, PNG, atau WebP · Maks 2 MB</p>
            </div>
          </div>
        )}

        {/* Uploading overlay */}
        {uploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm pointer-events-none">
            <Loader2 className="size-7 animate-spin text-blue-500 dark:text-blue-400" aria-hidden="true" />
            <p className="text-xs font-semibold text-gray-600 dark:text-slate-300">Mengunggah…</p>
          </div>
        )}

        {/* Hover overlay when there's a preview */}
        {displaySrc && !uploading && isInteractive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/0 hover:bg-black/40 transition-colors duration-200 group pointer-events-none">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center gap-1">
              <ImageIcon className="size-6 text-white" aria-hidden="true" />
              <span className="text-xs font-semibold text-white drop-shadow">Ganti gambar</span>
            </div>
          </div>
        )}

        {/* Remove button */}
        {displaySrc && !uploading && isInteractive && (
          <button
            type="button"
            onClick={handleRemove}
            aria-label="Hapus gambar cover"
            className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-white/90 text-gray-700 dark:bg-slate-800 dark:text-slate-200 shadow-md hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 transition-colors pointer-events-auto"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p role="alert" className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 font-medium ml-1">
          <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
        disabled={disabled || uploading}
        onChange={handleInputChange}
      />
    </div>
  )
}
