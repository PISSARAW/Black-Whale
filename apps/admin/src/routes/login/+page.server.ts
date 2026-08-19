import { fail, redirect } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'
import {
  ADMIN_SESSION_COOKIE,
  createSession,
  sessionCookieOptions,
  verifyPassword,
} from '$lib/server/session'
import { rateLimit, resetRateLimit } from '$lib/server/rate-limit'

// A single shared admin password is the only credential, so guessing has to be
// made expensive: ten attempts per source address per ten minutes.
const LOGIN_ATTEMPT_LIMIT = 10
const LOGIN_WINDOW_MS = 10 * 60 * 1000

function safeNext(value: FormDataEntryValue | string | null): string {
  const next = typeof value === 'string' ? value : '/'
  return next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\') ? next : '/'
}

export const load: PageServerLoad = ({ locals, url }) => {
  if (locals.authenticated) throw redirect(303, safeNext(url.searchParams.get('next')))
  return { next: safeNext(url.searchParams.get('next')) }
}

export const actions: Actions = {
  default: async ({ request, cookies, getClientAddress }) => {
    const data = await request.formData()
    const clientKey = `login:${getClientAddress()}`

    const limit = rateLimit(clientKey, LOGIN_ATTEMPT_LIMIT, LOGIN_WINDOW_MS)
    if (!limit.allowed) {
      return fail(429, {
        invalid: true,
        throttled: true,
        retryAfterSeconds: limit.retryAfterSeconds,
        next: safeNext(data.get('next')),
      })
    }

    const password = data.get('password')
    if (typeof password !== 'string' || !verifyPassword(password)) {
      return fail(400, {
        invalid: true,
        throttled: false,
        retryAfterSeconds: 0,
        next: safeNext(data.get('next')),
      })
    }

    resetRateLimit(clientKey)
    cookies.set(ADMIN_SESSION_COOKIE, createSession(), sessionCookieOptions)
    throw redirect(303, safeNext(data.get('next')))
  },
}
