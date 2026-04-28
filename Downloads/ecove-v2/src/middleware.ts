import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

// Routes that require authentication
const PROTECTED: { pattern: RegExp; roles: string[]; redirect: string }[] = [
  {
    pattern: /^\/admin(\/.*)?$/,
    roles:   ['admin', 'super_admin'],
    redirect: '/login?next=/admin&reason=admin_only',
  },
  {
    pattern: /^\/vendor\/dashboard(\/.*)?$/,
    roles:   ['vendor'],
    redirect: '/vendor/login?reason=vendor_only',
  },
]

// API routes that should return 401 (not redirect)
const PROTECTED_API = [
  /^\/api\/admin\//,
  /^\/api\/vendor\//,
  /^\/api\/auth\/me$/,
  /^\/api\/checkout$/,
  /^\/api\/upload$/,
]

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // ── API protection — return JSON 401 ────────────────────
  if (PROTECTED_API.some(p => p.test(pathname))) {
    // Token is validated inside each route handler via requireAuth()
    // Middleware just adds CORS headers and logs
    const res = NextResponse.next()
    res.headers.set('X-Content-Type-Options', 'nosniff')
    res.headers.set('X-Frame-Options', 'DENY')
    return res
  }

  // ── Page protection — redirect unauthenticated users ───
  for (const rule of PROTECTED) {
    if (!rule.pattern.test(pathname)) continue

    const token =
      req.cookies.get('ecove_token')?.value ||
      req.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      const url = req.nextUrl.clone()
      url.pathname = rule.redirect.split('?')[0]
      url.search   = rule.redirect.includes('?') ? '?' + rule.redirect.split('?')[1] : ''
      return NextResponse.redirect(url)
    }

    try {
      const payload = verifyToken(token)
      if (!rule.roles.includes(payload.role)) {
        const url      = req.nextUrl.clone()
        url.pathname   = '/unauthorized'
        return NextResponse.redirect(url)
      }
    } catch {
      const url      = req.nextUrl.clone()
      url.pathname   = rule.redirect.split('?')[0]
      url.search     = '?reason=session_expired'
      return NextResponse.redirect(url)
    }

    break
  }

  // ── Security headers on all responses ───────────────────
  const res = NextResponse.next()
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('X-Frame-Options', 'SAMEORIGIN')
  res.headers.set('X-XSS-Protection', '1; mode=block')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  if (process.env.NODE_ENV === 'production') {
    res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  }
  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimisation)
     * - favicon.ico
     * - public files (images etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|images/|fonts/).*)',
  ],
}
