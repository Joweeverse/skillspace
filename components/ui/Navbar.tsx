'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AuthService } from '@/services/authService'
import { User, LogOut, Settings } from 'lucide-react'

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
    { name: 'Home', href: '/' },
  ]

  // Add Courses link only if NOT a mentor
  if (!profile || profile.role !== 'mentor') {
    baseLinks.push({ name: 'Courses', href: '/courses' })
  }

  const roleLinks = []
  if (session && profile) {
    if (profile.role === 'mentor') {
      roleLinks.push({ name: 'Mentor Dashboard', href: '/dashboard/mentor' })
    } else if (profile.role === 'admin') {
      roleLinks.push({ name: 'Admin', href: '/admin/dashboard' })
    } else {
      roleLinks.push({ name: 'My Learning', href: '/dashboard/student' })
    }
  }

  const navLinks = [...baseLinks, ...roleLinks]

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-2xl font-bold text-blue-600">
                SkillSpace
              </Link>
            </div>
            <div className="hidden sm:-my-px sm:ml-8 sm:flex sm:space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                    pathname === link.href
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-6">
            {session ? (
              <div className="flex items-center space-x-4">
                <Link 
                  href="/profile" 
                  className={`flex items-center gap-2 p-1 rounded-full border-2 transition-all ${
                    pathname === '/profile' ? 'border-blue-500' : 'border-transparent hover:border-gray-200'
                  }`}
                >
                  {profile?.avatar_url ? (
                    <img 
                      src={profile.avatar_url} 
                      alt="Avatar" 
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                      <User size={18} />
                    </div>
                  )}
                </Link>
                
                <button 
                  onClick={handleLogout}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                  title="Keluar"
                >
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <Link href="/login">
                <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">
                  Sign In
                </button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

