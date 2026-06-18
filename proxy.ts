import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function proxy(req: NextRequest) {
  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          req.cookies.set({
            name,
            value,
            ...options,
          })
          res = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          res.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          req.cookies.set({
            name,
            value: '',
            ...options,
          })
          res = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          res.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const userRole = session?.user?.user_metadata?.role

  // Governance: Proteksi rute berdasarkan status login
  const isAuthRoute = req.nextUrl.pathname.startsWith('/login') || req.nextUrl.pathname.startsWith('/register')
  const isDashboardRoute = req.nextUrl.pathname.startsWith('/dashboard')
  const isAdminRoute = req.nextUrl.pathname.startsWith('/admin')

  if (!session) {
    if (isDashboardRoute || isAdminRoute) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
  } else {
    // Jika sudah login tapi mencoba ke login/register, redirect ke dashboard yang sesuai
    if (isAuthRoute) {
      if (userRole === 'mentor') return NextResponse.redirect(new URL('/dashboard/mentor', req.url))
      if (userRole === 'admin') return NextResponse.redirect(new URL('/admin/dashboard', req.url))
      return NextResponse.redirect(new URL('/dashboard/student', req.url))
    }

    // Role-based protection
    if (req.nextUrl.pathname.startsWith('/dashboard/mentor') && userRole !== 'mentor' && userRole !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard/student', req.url))
    }

    if (req.nextUrl.pathname.startsWith('/dashboard/student') && userRole !== 'student' && userRole !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard/mentor', req.url))
    }

    if (isAdminRoute && userRole !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard/student', req.url))
    }
  }

  return res
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/profile/:path*', '/login', '/register'],
}
