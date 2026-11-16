'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AuthService } from '@/services/authService'
import { User, LogOut, Settings, LayoutDashboard, GraduationCap, Home, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

export const Navbar = () => {
  const pathname = usePathname()
  const router = useRouter()
  const [session, setSession] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    async function getSession() {
      const session = await AuthService.getSession()
      setSession(session)
      if (session?.user) {
        const profileData = await AuthService.getUserProfile(session.user.id)
        setProfile(profileData)
      }
    }
    getSession()
  }, [pathname])

  const handleLogout = async () => {
    await AuthService.signOut()
    setSession(null)
    setProfile(null)
    setMobileMenuOpen(false)
    router.push('/login')
    router.refresh()
  }

  const baseLinks = [
    { name: 'Home', href: '/', icon: <Home size={18} /> },
    { name: 'Courses', href: '/courses', icon: <GraduationCap size={18} /> },
    { name: 'Direktori Mentor', href: '/mentors', icon: <User size={18} /> },
  ]

  const roleLinks = []
  if (session && profile) {
    if (profile.role === 'mentor') {
      roleLinks.push({ name: 'Mentor Dashboard', href: '/dashboard/mentor', icon: <LayoutDashboard size={18} /> })
    } else if (profile.role === 'admin') {
      roleLinks.push({ name: 'Admin', href: '/admin/dashboard', icon: <Settings size={18} /> })
    } else {
      roleLinks.push({ name: 'My Learning', href: '/dashboard/student', icon: <LayoutDashboard size={18} /> })
    }
  }

  const navLinks = [...baseLinks, ...roleLinks]

  return (
    <nav className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-gray-100 dark:border-slate-800 sticky top-0 z-40 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="group flex items-center gap-2.5 focus-visible:outline-2 focus-visible:outline-blue-600 rounded-xl p-1">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-300">
                <GraduationCap size={22} />
              </div>
              <span className="text-xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent tracking-tight">
                SkillSpace
              </span>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden sm:ml-8 sm:flex sm:space-x-2">
              {navLinks.map((link) => {
                const isActive = pathname === link.href
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`inline-flex items-center px-3.5 py-2 rounded-xl text-sm font-bold transition-all duration-200 gap-2 focus-visible:outline-2 focus-visible:outline-blue-600 ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                    }`}
                  >
                    <span className={`${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-slate-500 group-hover:text-gray-600'} transition-colors`}>
                      {link.icon}
                    </span>
                    {link.name}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Desktop Right Menu */}
          <div className="hidden sm:flex sm:items-center space-x-3">
            {/* Theme Toggle Button */}
            <ThemeToggle />

            {session ? (
              <div className="flex items-center gap-2.5 bg-gray-50 dark:bg-slate-800/90 p-1.5 pl-3 rounded-full border border-gray-100 dark:border-slate-700">
                <span className="text-xs font-bold text-gray-600 dark:text-slate-300 hidden lg:block">
                  Hi, {profile?.full_name?.split(' ')[0] || 'User'}
                </span>
                <Link 
                  href="/profile" 
                  aria-label="Profil Pengguna"
                  className={`relative group ${
                    pathname === '/profile' ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-900' : ''
                  } rounded-full transition-all duration-300 hover:scale-105 focus-visible:outline-2 focus-visible:outline-blue-600`}
                >
                  {profile?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={profile.avatar_url} 
                      alt={profile?.full_name || 'Avatar'} 
                      className="w-8 h-8 rounded-full object-cover ring-1 ring-gray-200 dark:ring-slate-700"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-950/80 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 ring-1 ring-blue-200 dark:ring-blue-900">
                      <User size={16} />
                    </div>
                  )}
                </Link>
                
                <div className="w-px h-4 bg-gray-200 dark:bg-slate-700" />

                <button 
                  onClick={handleLogout}
                  className="p-1.5 min-w-9 min-h-9 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-red-950/50 rounded-full transition-all duration-200 focus-visible:outline-2 focus-visible:outline-blue-600"
                  aria-label="Keluar dari akun"
                  title="Keluar"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button as="div" variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link href="/register">
                  <Button as="div" variant="primary" size="sm" className="shadow-blue-500/20">Get Started</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Right Controls: Theme Toggle + hamburger button */}
          <div className="flex items-center gap-1 sm:hidden">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="min-h-11 min-w-11 p-2.5 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 flex items-center justify-center transition-colors focus-visible:outline-2 focus-visible:outline-blue-600"
              aria-label={mobileMenuOpen ? 'Tutup menu' : 'Buka menu navigasi'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-gray-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top-2 duration-200">
          <div className="space-y-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold min-h-11 transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                  }`}
                >
                  <span className={isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-slate-500'}>{link.icon}</span>
                  {link.name}
                </Link>
              )
            })}
          </div>

          <div className="pt-3 border-t border-gray-100 dark:border-slate-800">
            {session ? (
              <div className="space-y-2">
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 dark:text-slate-200 dark:hover:bg-slate-800 min-h-11"
                >
                  {profile?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profile.avatar_url}
                      alt={profile?.full_name || 'Avatar'}
                      className="w-7 h-7 rounded-full object-cover ring-1 ring-gray-200 dark:ring-slate-700"
                    />
                  ) : (
                    <div className="w-7 h-7 bg-blue-100 dark:bg-blue-950 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400">
                      <User size={15} />
                    </div>
                  )}
                  <span>Profil ({profile?.full_name || 'User'})</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50 min-h-11 transition-colors text-left"
                >
                  <LogOut size={18} />
                  <span>Keluar</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link href="/login" className="w-full">
                  <Button as="div" variant="outline" className="w-full">Sign In</Button>
                </Link>
                <Link href="/register" className="w-full">
                  <Button as="div" variant="primary" className="w-full">Get Started</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
