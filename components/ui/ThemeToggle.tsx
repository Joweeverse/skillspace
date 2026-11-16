'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useTheme } from 'next-themes'
import { Sun, Moon, Monitor, Check } from 'lucide-react'

interface ThemeToggleProps {
  variant?: 'dropdown' | 'inline'
  className?: string
}

const THEME_OPTIONS = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
] as const

export function ThemeToggle({ variant = 'dropdown', className = '' }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Close menu on click outside
  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  // Active theme label / icon
  const currentTheme = mounted ? theme ?? 'system' : 'system'
  const ActiveIcon =
    currentTheme === 'dark' ? Moon : currentTheme === 'light' ? Sun : Monitor

  if (variant === 'inline') {
    return (
      <div className={`grid grid-cols-3 gap-2.5 ${className}`} role="radiogroup" aria-label="Pengaturan tema tampilan">
        {THEME_OPTIONS.map(({ value, label, icon: Icon }) => {
          const isSelected = currentTheme === value
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => setTheme(value)}
              className={`flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl border text-xs font-bold transition-all duration-200 min-h-[44px] focus-visible:outline-2 focus-visible:outline-blue-600 ${
                isSelected
                  ? 'border-blue-600 bg-blue-50/80 text-blue-700 dark:bg-blue-950/70 dark:border-blue-500 dark:text-blue-300 shadow-sm'
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              <Icon size={18} className={isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-slate-400'} aria-hidden="true" />
              <span>{label}</span>
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className={`relative inline-block text-left ${className}`} ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 min-w-11 min-h-11 flex items-center justify-center rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 transition-colors focus-visible:outline-2 focus-visible:outline-blue-600"
        aria-label="Pilih tema tampilan (Light, Dark, atau System)"
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <ActiveIcon size={19} aria-hidden="true" />
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label="Pilihan tema"
          className="absolute right-0 mt-2 w-36 origin-top-right rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-xl shadow-gray-200/20 dark:shadow-black/50 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150"
        >
          {THEME_OPTIONS.map(({ value, label, icon: Icon }) => {
            const isSelected = currentTheme === value
            return (
              <button
                key={value}
                type="button"
                role="menuitemradio"
                aria-checked={isSelected}
                onClick={() => {
                  setTheme(value)
                  setIsOpen(false)
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-colors min-h-[40px] focus-visible:outline-2 focus-visible:outline-blue-600 ${
                  isSelected
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300'
                    : 'text-gray-700 hover:bg-gray-50 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon size={15} className={isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-slate-400'} aria-hidden="true" />
                  <span>{label}</span>
                </div>
                {isSelected && <Check size={14} className="text-blue-600 dark:text-blue-400" aria-hidden="true" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
