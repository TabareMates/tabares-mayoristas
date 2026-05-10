import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
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

  const isAuthPage = request.nextUrl.pathname === '/'
  const isCallback = request.nextUrl.pathname.startsWith('/auth/')
  const isApi = request.nextUrl.pathname.startsWith('/api/')
  const isAdmin = request.nextUrl.pathname.startsWith('/admin')

  // Redirect unauthenticated users to login
  if (!user && !isAuthPage && !isCallback && !isApi) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Redirect logged-in users away from login page
  if (user && isAuthPage) {
    return NextResponse.redirect(new URL('/catalog', request.url))
  }

  // Admin protection — check admin flag in DB happens in the page itself
  // (middleware just checks authentication)

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
