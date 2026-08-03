import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * The gate is the whole security surface of the back-office: everything else
 * assumes `locals.authenticated` was decided here. It had no test at all.
 */
async function loadHandle() {
  vi.resetModules()
  const [{ handle }, session] = await Promise.all([
    import('./hooks.server'),
    import('$lib/server/session'),
  ])
  return { handle, ...session }
}

beforeEach(() => {
  process.env.NODE_ENV = 'test'
  process.env.ADMIN_PASSWORD = 'correct horse battery staple'
  process.env.SESSION_SECRET = 'a'.repeat(48)
})

interface EventOptions {
  path: string
  cookie?: string
}

function buildEvent({ path, cookie }: EventOptions) {
  return {
    url: new URL(`http://admin.test${path}`),
    cookies: { get: (name: string) => (name === 'bw_admin_session' ? cookie : undefined) },
    locals: {} as { authenticated?: boolean },
  }
}

const resolved = () => new Response('page', { status: 200 })

describe('admin handle', () => {
  it('redirects an anonymous visitor to /login, remembering where they were going', async () => {
    const { handle } = await loadHandle()
    const event = buildEvent({ path: '/characters' })
    const response = await handle({ event, resolve: resolved } as never)

    expect(response.status).toBe(303)
    expect(response.headers.get('location')).toBe('/login?next=%2Fcharacters')
    expect(event.locals.authenticated).toBe(false)
  })

  it('answers 401 JSON on the API rather than redirecting a fetch into HTML', async () => {
    const { handle } = await loadHandle()
    const response = await handle({
      event: buildEvent({ path: '/api/characters' }),
      resolve: resolved,
    } as never)

    expect(response.status).toBe(401)
    expect(response.headers.get('content-type')).toContain('application/json')
    await expect(response.json()).resolves.toEqual({ message: 'Unauthorized' })
  })

  it('lets /login and /health through unauthenticated', async () => {
    const { handle } = await loadHandle()
    for (const path of ['/login', '/health']) {
      const response = await handle({ event: buildEvent({ path }), resolve: resolved } as never)
      expect(response.status, path).toBe(200)
    }
  })

  it('serves a page to a holder of a valid session', async () => {
    const { handle, createSession } = await loadHandle()
    const event = buildEvent({ path: '/characters', cookie: createSession() })
    const response = await handle({ event, resolve: resolved } as never)

    expect(response.status).toBe(200)
    expect(event.locals.authenticated).toBe(true)
  })

  it('rejects a forged cookie exactly as it rejects none', async () => {
    const { handle, createSession } = await loadHandle()
    const forged = `${createSession().split('.').slice(0, 3).join('.')}.forged`
    const response = await handle({
      event: buildEvent({ path: '/characters', cookie: forged }),
      resolve: resolved,
    } as never)

    expect(response.status).toBe(303)
  })

  it('hardens every answer, including the redirect and the 401', async () => {
    const { handle, createSession } = await loadHandle()
    const cases = [
      buildEvent({ path: '/characters' }),
      buildEvent({ path: '/api/characters' }),
      buildEvent({ path: '/characters', cookie: createSession() }),
    ]

    for (const event of cases) {
      const response = await handle({ event, resolve: resolved } as never)
      expect(response.headers.get('x-frame-options'), event.url.pathname).toBe('DENY')
      expect(response.headers.get('x-content-type-options')).toBe('nosniff')
      expect(response.headers.get('x-robots-tag')).toContain('noindex')
      expect(response.headers.get('cache-control')).toBe('no-store, private')
      expect(response.headers.get('strict-transport-security')).toBe(null)
    }
  })

  it('adds HSTS in production only', async () => {
    process.env.NODE_ENV = 'production'
    const { handle } = await loadHandle()
    const response = await handle({
      event: buildEvent({ path: '/login' }),
      resolve: resolved,
    } as never)
    expect(response.headers.get('strict-transport-security')).toContain('max-age=31536000')
  })
})
