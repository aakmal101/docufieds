import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// ─────────────────────────────────────────────────────────────────────────────
// Root Middleware — Supabase Native Auth Routing
// ─────────────────────────────────────────────────────────────────────────────
//
// This middleware runs on the Edge runtime. It:
//   1. Refreshes the Supabase auth session (token + cookie sync).
//   2. Enforces route-level access control based on auth state.
//
// NO NextAuth. NO Prisma. NO Node.js runtime APIs.
// ─────────────────────────────────────────────────────────────────────────────

// ── Route Definitions ───────────────────────────────────────────────────────

/**
 * Routes that require a valid, authenticated Supabase user.
 * Any path starting with one of these prefixes will redirect
 * unauthenticated visitors to the login page.
 */
const PROTECTED_PREFIXES = [
  '/dashboard',
  '/admin',
] as const

/**
 * Auth routes (login, register, etc.). Authenticated users should NOT be
 * able to visit these — they are redirected to their dashboard instead.
 *
 * Exception: `/auth/confirm` and `/auth/callback` are OAuth/Magic Link
 * completion routes that must remain accessible regardless of auth state.
 */
const AUTH_PREFIXES = [
  '/auth/signin',
  '/auth/signup',
  '/auth/login',
  '/auth/register',
  '/auth/support-login',
  '/auth/support-lead/login',
  '/auth/support-member/login',
] as const

/**
 * Auth sub-paths that should ALWAYS be accessible (token exchange, OAuth
 * callback, sign-out). These are excluded from the "redirect logged-in
 * users away from auth pages" rule.
 */
const AUTH_PASSTHROUGH_PREFIXES = [
  '/auth/confirm',
  '/auth/callback',
  '/auth/signout',
] as const

// ── Helpers ─────────────────────────────────────────────────────────────────

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

function isAuthRoute(pathname: string): boolean {
  return AUTH_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

function isAuthPassthrough(pathname: string): boolean {
  return AUTH_PASSTHROUGH_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  )
}

// ── Middleware Handler ──────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  // 1. Refresh the session and extract the validated user.
  const { response, user } = await updateSession(request)

  const { pathname } = request.nextUrl

  // 2. RULE A — Protected routes require authentication.
  //    Redirect unauthenticated users to /auth/login with a ?next= param
  //    so they can be sent back after successful sign-in.
  if (isProtectedRoute(pathname) && !user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/auth/signin'
    loginUrl.searchParams.set('next', pathname)

    const redirectResponse = NextResponse.redirect(loginUrl)

    // Preserve the Supabase cookie sync — copy refreshed cookies onto the
    // redirect response so the browser stays in sync even during a redirect.
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value)
    })

    return redirectResponse
  }

  // 3. RULE B — Authenticated users must not linger on auth pages.
  //    Exception: passthrough routes like /auth/confirm, /auth/callback.
  if (isAuthRoute(pathname) && !isAuthPassthrough(pathname) && user) {
    const dashboardUrl = request.nextUrl.clone()
    dashboardUrl.pathname = '/dashboard'
    dashboardUrl.search = '' // clear any stale query params

    const redirectResponse = NextResponse.redirect(dashboardUrl)

    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value)
    })

    return redirectResponse
  }

  // 4. Default — pass the request through with refreshed cookies.
  return response
}

// ── Config Matcher ──────────────────────────────────────────────────────────
//
// Run middleware on ALL routes EXCEPT:
//   • _next/static  — static assets bundled by Next.js
//   • _next/image   — Next.js image optimization
//   • favicon.ico   — browser favicon
//   • Common image/font extensions — avoid burning Supabase API calls on
//     loading SVGs, PNGs, JPEGs, WebP, GIFs, ICOs, WOFFs, etc.
//
// API routes (/api/*) ARE included so that session cookies stay fresh
// even for fetch requests made from client components.
// ─────────────────────────────────────────────────────────────────────────────

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot)$).*)',
  ],
}
