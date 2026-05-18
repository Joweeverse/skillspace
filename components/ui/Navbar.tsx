'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AuthService } from '@/services/authService'
import { User, LogOut, Settings, LayoutDashboard, GraduationCap, Home } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export const Navbar = () => {
  const pathname = usePathname()
  const router = useRouter()
  const [session, setSession] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)

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
    router.push('/login')
    router.refresh()
  }

  const baseLinks = [
    { name: 'Home', href: '/', icon: <Home size={18} /> },
    { name: 'Direktori Mentor', href: '/mentors', icon: <User size={18} /> },
  ]

  // Add Courses link only if NOT a mentor
  if (!profile || profile.role !== 'mentor') {
    baseLinks.push({ name: 'Courses', href: '/courses', icon: <GraduationCap size={18} /> })
  }

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
    <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="group flex items-center gap-2">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-300">
                  <GraduationCap size={24} />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  SkillSpace
                </span>
              </Link>
            </div>
            <div className="hidden sm:ml-10 sm:flex sm:space-x-4">
              {navLinks.map((link) => {
                const isActive = pathname === link.href
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 gap-2 group ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 shadow-sm'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <span className={`${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'} transition-colors`}>
                      {link.icon}
                    </span>
                    {link.name}
                  </Link>
                )
              })}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
            {session ? (
              <div className="flex items-center gap-3 bg-gray-50 p-1.5 pl-3 rounded-full border border-gray-100">
                <span className="text-xs font-bold text-gray-500 hidden lg:block">
                  Hi, {profile?.full_name?.split(' ')[0] || 'User'}
                </span>
                <Link 
                  href="/profile" 
                  className={`relative group ${
                    pathname === '/profile' ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                  } rounded-full transition-all duration-300 hover:scale-105`}
                >
                  {profile?.avatar_url ? (
                    <img 
                      src={profile.avatar_url} 
                      alt="Avatar" 
                      className="w-8 h-8 rounded-full object-cover ring-1 ring-gray-200"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 ring-1 ring-blue-200">
                      <User size={18} />
                    </div>
                  )}
                </Link>
                
                <div className="w-px h-4 bg-gray-200 mx-1" />

                <button 
                  onClick={handleLogout}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-200"
                  title="Keluar"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link href="/register">
                  <Button variant="primary" size="sm" className="shadow-blue-500/20">Get Started</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

