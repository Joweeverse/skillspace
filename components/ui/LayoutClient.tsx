'use client'

/**
 * LayoutClient
 * Client boundary untuk root layout. Mendeteksi perubahan pathname
 * lalu me-remount <main> sehingga animasi page-enter terpicu
 * setiap kali user berpindah halaman.
 */

import { usePathname } from 'next/navigation'
import { useEffect, useRef, type ReactNode } from 'react'

export function LayoutClient({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const ref = useRef<HTMLDivElement>(null)

  // Setiap kali pathname berubah, tambahkan kelas animasi ulang
  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Hapus kelas lama, force reflow, lalu tambahkan kembali
    el.classList.remove('animate-page-enter')
    void el.offsetWidth // trigger reflow
    el.classList.add('animate-page-enter')
  }, [pathname])

  return (
    <div ref={ref} className="animate-page-enter">
      {children}
    </div>
  )
}
