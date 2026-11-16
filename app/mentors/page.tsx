'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { MentorService, TopMentor } from '@/services/mentorService'
import { AuthService } from '@/services/authService'
import { createClient } from '@/lib/supabase'
import { Profile, Portfolio } from '@/types/database'
import { ShieldCheck, ChevronRight, Search, Sparkles, BookOpen, Crown, Medal } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ImageSlot } from '@/components/ui/ImageSlot'
import { useToast } from '@/components/ui/Toast'

// ── Shared avatar helpers ───────────────────────────────────────
const AVATAR_BG = [
  'bg-blue-600', 'bg-indigo-600', 'bg-violet-600',
  'bg-sky-600',  'bg-teal-600',   'bg-emerald-600',
]
function getInitials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((n) => n[0].toUpperCase()).join('')
}
function avatarBg(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff
  return AVATAR_BG[h % AVATAR_BG.length]
}

// ── Avatar component ────────────────────────────────────────────
function Avatar({
  name,
  url,
  size = 'md',
}: {
  name: string
  url: string | null | undefined
  size?: 'sm' | 'md' | 'lg' | 'xl'
}) {
  const sizeMap = {
    sm: 'w-10 h-10 text-sm',
    md: 'w-14 h-14 text-base',
    lg: 'w-20 h-20 text-xl',
    xl: 'w-28 h-28 text-3xl',
  }
  const cls = `${sizeMap[size]} rounded-2xl flex items-center justify-center font-black select-none shrink-0 overflow-hidden`
  const dim = { sm: 40, md: 56, lg: 80, xl: 112 }[size]

  if (url) {
    return (
      <div className={`${cls} border-2 border-white dark:border-slate-800 shadow-lg`}>
        <Image src={url} alt={name} width={dim} height={dim} className="w-full h-full object-cover dark:brightness-95" />
      </div>
    )
  }
  return (
    <div className={`${cls} ${avatarBg(name)} text-white shadow-lg`}>
      {getInitials(name)}
    </div>
  )
}

// ── Leaderboard medal icons ─────────────────────────────────────
function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Crown size={16} className="text-yellow-500" aria-hidden="true" />
  if (rank === 2) return <Medal size={16} className="text-gray-400" aria-hidden="true" />
  if (rank === 3) return <Medal size={16} className="text-amber-600" aria-hidden="true" />
  return <span className="text-xs font-black text-gray-400 w-4 text-center">#{rank}</span>
}

// Rank ring colors for the podium
const podiumRing: Record<number, string> = {
  1: 'ring-4 ring-yellow-400 ring-offset-2',
  2: 'ring-4 ring-gray-300 ring-offset-2',
  3: 'ring-4 ring-amber-500 ring-offset-2',
}
const podiumBadge: Record<number, string> = {
  1: 'bg-yellow-400 text-yellow-900',
  2: 'bg-gray-200 text-gray-700',
  3: 'bg-amber-500 text-white',
}

// ── Leaderboard skeleton ────────────────────────────────────────
function LeaderboardSkeleton() {
  return (
    <div className="bg-gradient-to-br from-blue-900 to-indigo-900 rounded-[2rem] p-8 md:p-10 animate-pulse" aria-hidden="true">
      {/* Podium placeholders */}
      <div className="flex items-end justify-center gap-6 mb-8">
        {[2, 1, 3].map((r) => (
          <div key={r} className="flex flex-col items-center gap-2" style={{ marginBottom: r === 1 ? 0 : '1.5rem' }}>
            <div className={`rounded-2xl bg-white/10 ${r === 1 ? 'w-24 h-24' : 'w-16 h-16'}`} />
            <div className="h-3 w-20 rounded-full bg-white/10" />
            <div className="h-5 w-12 rounded-full bg-white/10" />
          </div>
        ))}
      </div>
      {/* List placeholders */}
      <div className="space-y-3">
        {[4, 5].map((r) => (
          <div key={r} className="flex items-center gap-4 bg-white/5 rounded-2xl px-5 py-3">
            <div className="w-10 h-10 rounded-xl bg-white/10" />
            <div className="flex-1 h-3 rounded-full bg-white/10" />
            <div className="w-14 h-5 rounded-full bg-white/10" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Leaderboard panel ───────────────────────────────────────────
function Leaderboard() {
  const [leaders, setLeaders] = useState<TopMentor[]>([])
  const [loading, setLoading] = useState(true)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const supabase = createClient()

  const fetchLeaders = useCallback(async () => {
    try {
      const data = await MentorService.getTopMentors(5)
      setLeaders(data)
    } catch (err) {
      console.error('Leaderboard fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLeaders()

    // Try Supabase Realtime first
    const channel = supabase
      .channel('leaderboard-profiles')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles' },
        () => { fetchLeaders() }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          // Realtime not enabled — fall back to polling every 30 s
          if (!pollRef.current) {
            pollRef.current = setInterval(fetchLeaders, 30_000)
          }
        }
      })

    return () => {
      supabase.removeChannel(channel)
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [fetchLeaders, supabase])

  if (loading) return <LeaderboardSkeleton />

  if (leaders.length === 0) {
    return (
      <div className="bg-gradient-to-br from-blue-900 to-indigo-900 rounded-[2rem] p-10 flex flex-col items-center gap-4">
        <div className="w-40">
          <ImageSlot src="/illustrations/empty-search.svg" alt="Belum ada mentor" aspectRatio="4/3" />
        </div>
        <p className="text-white/60 font-bold text-sm">Belum ada mentor di leaderboard.</p>
      </div>
    )
  }

  const podium = leaders.slice(0, 3)   // ranks 1-3
  const rest   = leaders.slice(3)       // ranks 4-5

  // Podium display order: 2 | 1 | 3
  const podiumOrder = [
    podium[1],  // rank 2 (left)
    podium[0],  // rank 1 (center / tallest)
    podium[2],  // rank 3 (right)
  ].filter(Boolean)
  const podiumRanks = [2, 1, 3]

  return (
    <div
      className="bg-gradient-to-br from-blue-900 via-indigo-900 to-blue-800 rounded-[2rem] p-8 md:p-10 shadow-2xl shadow-blue-900/40 border border-white/5"
      role="region"
      aria-label="Leaderboard Mentor Terbaik"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-yellow-400/20 rounded-xl">
          <Crown size={20} className="text-yellow-400" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-white font-black text-xl tracking-tight">Top Mentor</h2>
          <p className="text-blue-200/60 text-xs font-medium">Diperbarui secara realtime</p>
        </div>
      </div>

      {/* ── Podium (desktop) / ranked list (mobile) ── */}

      {/* Mobile: stacked ranked list */}
      <div className="flex flex-col gap-3 md:hidden mb-6">
        {leaders.map((m, i) => {
          const rank = i + 1
          return (
            <Link
              key={m.id}
              href={`/mentors/${m.id}`}
              className="flex items-center gap-4 bg-white/10 hover:bg-white/20 rounded-2xl px-5 py-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
            >
              <div className="w-6 flex justify-center shrink-0">
                <RankIcon rank={rank} />
              </div>
              <Avatar name={m.full_name} url={m.avatar_url} size="sm" />
              <span className="flex-1 text-white font-bold text-sm truncate">{m.full_name}</span>
              <span className="inline-flex items-center gap-1 bg-amber-400/20 text-amber-300 border border-amber-400/30 px-3 py-1 rounded-full text-xs font-black whitespace-nowrap">
                <Sparkles size={10} aria-hidden="true" /> {m.points ?? 0}
              </span>
            </Link>
          )
        })}
      </div>

      {/* Desktop: podium */}
      <div className="hidden md:flex items-end justify-center gap-4 mb-6">
        {podiumOrder.map((m, idx) => {
          const rank = podiumRanks[idx]
          const isFirst = rank === 1
          return (
            <Link
              key={m.id}
              href={`/mentors/${m.id}`}
              className={`flex flex-col items-center gap-3 px-4 pb-6 pt-4 rounded-[1.5rem] bg-white/10 hover:bg-white/20 transition-all duration-300 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 motion-safe:transition-transform ${isFirst ? 'pt-2' : 'mt-6'}`}
              style={{ minWidth: isFirst ? 160 : 128 }}
            >
              {/* Crown/medal above avatar */}
              <div className="flex justify-center">
                <RankIcon rank={rank} />
              </div>
              {/* Avatar with ring */}
              <div className={`rounded-2xl ${podiumRing[rank]}`}>
                <Avatar name={m.full_name} url={m.avatar_url} size={isFirst ? 'xl' : 'lg'} />
              </div>
              {/* Rank badge */}
              <span className={`${podiumBadge[rank]} text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest`}>
                #{rank}
              </span>
              {/* Name */}
              <span className="text-white font-black text-sm text-center leading-snug line-clamp-2 max-w-[120px]">
                {m.full_name}
              </span>
              {/* Points */}
              <span className="inline-flex items-center gap-1 bg-amber-400/20 text-amber-300 border border-amber-400/30 px-3 py-1 rounded-full text-xs font-black">
                <Sparkles size={10} aria-hidden="true" /> {m.points ?? 0} Poin
              </span>
            </Link>
          )
        })}
      </div>

      {/* Ranks 4-5 compact list (both desktop + mobile shows via the mobile list above, desktop only here) */}
      {rest.length > 0 && (
        <div className="hidden md:flex flex-col gap-2 border-t border-white/10 pt-5">
          {rest.map((m, i) => {
            const rank = i + 4
            return (
              <Link
                key={m.id}
                href={`/mentors/${m.id}`}
                className="flex items-center gap-4 bg-white/5 hover:bg-white/10 rounded-2xl px-5 py-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
              >
                <div className="w-6 flex justify-center shrink-0">
                  <RankIcon rank={rank} />
                </div>
                <Avatar name={m.full_name} url={m.avatar_url} size="sm" />
                <span className="flex-1 text-white/80 font-bold text-sm truncate">{m.full_name}</span>
                <span className="inline-flex items-center gap-1 bg-amber-400/10 text-amber-300/80 border border-amber-400/20 px-3 py-1 rounded-full text-xs font-black whitespace-nowrap">
                  <Sparkles size={10} aria-hidden="true" /> {m.points ?? 0}
                </span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Mentor card ─────────────────────────────────────────────────
function MentorCard({ mentor }: { mentor: Profile & { portfolios: Portfolio[]; courses?: { id: string }[] } }) {
  const initials = getInitials(mentor.full_name)
  const color = avatarBg(mentor.full_name)
  const tags = mentor.portfolios.slice(0, 3)
  const extraTags = mentor.portfolios.length - tags.length
  const courseCount = (mentor as any).courses?.length ?? (mentor as any).course_count ?? null

  return (
    <Link
      href={`/mentors/${mentor.id}`}
      className="group bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl shadow-gray-200/20 dark:shadow-none border border-gray-100 dark:border-slate-800 overflow-hidden hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/5 hover:-translate-y-1 flex flex-col focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-2"
    >
      {/* Top accent strip */}
      <div className="h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 w-full" />

      <div className="p-6 flex flex-col flex-1">
        {/* Avatar + name row */}
        <div className="flex items-start gap-4 mb-4">
          <div className="flex-shrink-0">
            {mentor.avatar_url ? (
              <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white dark:border-slate-800 shadow-lg group-hover:scale-105 transition-transform duration-500">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={mentor.avatar_url}
                  alt={mentor.full_name}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover dark:brightness-95"
                  loading="lazy"
                />
              </div>
            ) : (
              <div className={`w-16 h-16 rounded-2xl ${color} flex items-center justify-center text-white text-xl font-black shadow-lg group-hover:scale-105 transition-transform duration-500 select-none`}>
                {initials}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-base font-black text-gray-900 dark:text-slate-100 tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug break-words">
              {mentor.full_name}
            </h3>
            <div className="flex items-center flex-wrap gap-1.5 mt-1">
              {mentor.is_verified && (
                <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-900/60 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest">
                  <ShieldCheck size={9} /> Terverifikasi
                </span>
              )}
              {(mentor.points ?? 0) > 0 && (
                <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-100 dark:border-amber-900/60 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest">
                  <Sparkles size={9} /> {mentor.points} Poin
                </span>
              )}
              {courseCount !== null && courseCount > 0 && (
                <span className="inline-flex items-center gap-1 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/60 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest">
                  <BookOpen size={9} /> {courseCount} Kursus
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Bio */}
        <p className="text-gray-500 dark:text-slate-400 text-sm font-medium line-clamp-2 leading-relaxed mb-4 flex-1">
          {mentor.bio || 'Mentor belum menambahkan deskripsi diri.'}
        </p>

        {/* Portfolio tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {tags.map((p) => (
              <span
                key={p.id}
                className="bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700/60 px-2.5 py-1 rounded-xl text-[10px] font-bold text-gray-600 dark:text-slate-300 group-hover:bg-blue-50 dark:group-hover:bg-slate-700 group-hover:border-blue-100 dark:group-hover:border-slate-600 transition-colors truncate max-w-[140px]"
                title={p.title}
              >
                {p.title}
              </span>
            ))}
            {extraTags > 0 && (
              <span className="bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700/60 px-2.5 py-1 rounded-xl text-[10px] font-bold text-gray-400 dark:text-slate-400">
                +{extraTags}
              </span>
            )}
          </div>
        )}

        {/* CTA row */}
        <div className="pt-4 border-t border-gray-50 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Lihat Profil</span>
          <ChevronRight size={16} className="text-gray-300 dark:text-slate-600 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
        </div>
      </div>
    </Link>
  )
}

// ── Page ────────────────────────────────────────────────────────
export default function MentorsPage() {
  const { showToast } = useToast()
  const [mentors, setMentors] = useState<(Profile & { portfolios: Portfolio[] })[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function loadData() {
      try {
        const [mentorsData, session] = await Promise.all([
          MentorService.getAllMentors(),
          AuthService.getSession(),
        ])
        setMentors(mentorsData)
        if (session?.user) {
          setCurrentUser(session.user)
          const profileData = await AuthService.getUserProfile(session.user.id)
          setCurrentProfile(profileData)
        }
      } catch (err) {
        console.error('Error loading mentors:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const handleUpgradeToMentor = async () => {
    if (!currentUser || !confirm('Apakah Anda yakin ingin mendaftar sebagai Mentor?')) return
    setLoading(true)
    try {
      await AuthService.upgradeToMentor(currentUser.id)
      showToast('Selamat! Anda sekarang adalah seorang Mentor.', 'success')
      router.push('/dashboard/mentor')
      router.refresh()
    } catch (err: any) {
      showToast('Gagal upgrade role: ' + err.message, 'error')
      setLoading(false)
    }
  }

  const filteredMentors = mentors.filter(
    (m) =>
      m.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.bio && m.bio.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <p className="font-bold text-gray-500 dark:text-slate-400 animate-pulse uppercase tracking-widest text-xs">Menemukan Mentor Terbaik...</p>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:px-10 md:py-12 animate-in fade-in duration-500">

      {/* ── Page header ── */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="bg-blue-600 text-white text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-widest shadow-lg shadow-blue-500/20">
            Direktori
          </span>
          <div className="flex items-center text-blue-600 dark:text-blue-400 gap-1">
            <Sparkles size={13} aria-hidden="true" />
            <span className="text-[10px] font-black uppercase tracking-wider">Temukan Pembimbing Anda</span>
          </div>
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-slate-100 tracking-tight">Daftar Mentor</h1>
        <p className="text-gray-500 dark:text-slate-400 font-medium mt-1 text-sm">Belajar langsung dari para ahli di bidangnya.</p>
      </div>

      {/* ── Leaderboard ── */}
      <div className="mb-10">
        <Leaderboard />
      </div>

      {/* ── Search bar ── */}
      <div className="relative group w-full max-w-lg mb-10">
        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors">
          <Search size={20} aria-hidden="true" />
        </div>
        <input
          type="text"
          placeholder="Cari nama atau keahlian mentor..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          aria-label="Cari mentor"
          className="block w-full pl-14 pr-6 py-4 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-[1.5rem] text-sm font-medium text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 transition-all duration-300 shadow-xl shadow-gray-200/20 dark:shadow-none focus:ring-[6px] focus:ring-blue-500/10 focus:border-blue-500 outline-none"
        />
      </div>

      {/* ── Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMentors.map((mentor) => (
          <MentorCard key={mentor.id} mentor={mentor} />
        ))}

        {/* Empty state */}
        {filteredMentors.length === 0 && (
          <div className="col-span-full py-16 text-center bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-dashed border-gray-100 dark:border-slate-800 shadow-xl shadow-gray-200/10 dark:shadow-none flex flex-col items-center gap-5">
            <div className="w-52 max-w-full">
              <ImageSlot
                src="/illustrations/empty-search.svg"
                alt="Tidak ada mentor yang ditemukan"
                aspectRatio="4/3"
              />
            </div>
            <div>
              <h3 className="text-2xl font-black text-gray-900 dark:text-slate-100 mb-2 tracking-tight">Mentor Tidak Ditemukan</h3>
              <p className="text-gray-500 dark:text-slate-400 max-w-xs mx-auto font-medium text-sm">
                Coba gunakan kata kunci pencarian yang berbeda.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Become mentor CTA ── */}
      {currentProfile?.role === 'student' && (
        <div className="mt-16 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-[3rem] p-10 md:p-14 text-white relative overflow-hidden shadow-2xl shadow-blue-500/30">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400/20 rounded-full -ml-32 -mb-32 blur-3xl" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="text-center md:text-left space-y-4">
              <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full backdrop-blur-md border border-white/10">
                <Sparkles size={16} aria-hidden="true" />
                <span className="text-xs font-black uppercase tracking-widest">Wujudkan Potensi Anda</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
                Jadilah Bagian dari Mentor Kami
              </h2>
              <p className="text-blue-100 font-medium max-w-xl text-sm">
                Daftar sebagai Mentor di SkillSpace dan mulai buat kursus Anda sendiri.
              </p>
            </div>
            <button
              onClick={handleUpgradeToMentor}
              className="bg-white text-blue-700 hover:bg-blue-50 px-8 py-5 rounded-[2rem] font-black shadow-2xl transition-all hover:scale-105 active:scale-95 flex items-center gap-3 flex-shrink-0 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Daftar Sebagai Mentor
              <ChevronRight size={20} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
