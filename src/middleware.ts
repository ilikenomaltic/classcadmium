import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const publicPaths = ['/login', '/signup']
  const isPublicPath = publicPaths.some((p) => pathname.startsWith(p))

  if (!user) {
    if (!isPublicPath) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  // Authenticated — fetch role for redirect logic
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role
  const isTeacherPath = pathname.startsWith('/teacher')

  // Root / → redirect to role-appropriate dashboard
  if (pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = role === 'teacher' ? '/teacher/dashboard' : '/dashboard'
    return NextResponse.redirect(url)
  }

  // Student accessing /dashboard → redirect teacher away
  if (role === 'teacher' && !isTeacherPath && !isPublicPath && pathname !== '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/teacher/dashboard'
    return NextResponse.redirect(url)
  }

  // Teacher accessing student routes
  if (role === 'student' && isTeacherPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
