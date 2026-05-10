import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { User } from '@supabase/supabase-js'

// ─────────────────────────────────────────────────────────────────────────────
// Supabase Middleware Utility — Session Refresh & Cookie Sync
// ─────────────────────────────────────────────────────────────────────────────
//
// This file implements the canonical `updateSession` pattern from the official
// Supabase SSR documentation. It creates a middleware-scoped Supabase client,
// refreshes the auth token via `supabase.auth.getUser()`, and carefully
// propagates the refreshed cookies from the Supabase response back into the
// Next.js `NextResponse`.
//
// IMPORTANT: `getUser()` is used (not `getSession()`) because `getUser()`
// revalidates the JWT against the Supabase Auth server every time, making it
// safe for server-side trust boundaries. `getSession()` only reads the JWT
// from cookies without revalidation and MUST NOT be trusted in middleware.
//
// Edge Runtime compatible — no Prisma, no Node.js-only APIs.
// ─────────────────────────────────────────────────────────────────────────────

export interface SessionResult {
  response: NextResponse
  user: User | null
}

/**
 * Refreshes the Supabase auth session and synchronizes cookies between the
 * incoming request and the outgoing response.
 *
 * Returns both the `NextResponse` (with updated cookies) and the validated
 * `user` object (or `null` if unauthenticated), so the caller can make
 * routing decisions without a second Supabase call.
 */
export async function updateSession(
  request: NextRequest
): Promise<SessionResult> {
  // Start with a pass-through response that carries the original request
  // headers (including cookies) forward to the Next.js server.
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Create a fresh Supabase server client scoped to this single request.
  // NEVER store this in a global variable — each request must get its own
  // client to avoid cross-request cookie contamination.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // 1. Write cookies into the *request* object so that downstream
          //    Server Components / Route Handlers see the refreshed values.
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )

          // 2. Rebuild the response so it carries the mutated request cookies.
          supabaseResponse = NextResponse.next({
            request,
          })

          // 3. Write cookies into the *response* so the browser stores them.
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // ── CRITICAL ──────────────────────────────────────────────────────────────
  // Do NOT insert any logic between `createServerClient` and `getUser()`.
  // Doing so risks subtle bugs where users are randomly logged out because
  // the cookie state drifts between the client construction and the auth
  // call.
  // ─────────────────────────────────────────────────────────────────────────

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return { response: supabaseResponse, user }
}
