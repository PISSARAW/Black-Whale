import { beforeEach, describe, expect, it, vi } from 'vitest'

const PASSWORD = 'correct horse battery staple'

async function loadLogin() {
  vi.resetModules()
  return import('./+page.server')
}

beforeEach(() => {
  process.env.NODE_ENV = 'test'
  process.env.ADMIN_PASSWORD = PASSWORD
  process.env.SESSION_SECRET = 'a'.repeat(48)
})

interface SubmitOptions {
  password?: string
  next?: string
  address?: string
}

/** A single call, with a fresh cookie jar so the caller can inspect what was set. */
function submission({ password, next, address }: SubmitOptions) {
  const body = new FormData()
  if (password !== undefined) body.set('password', password)
  if (next !== undefined) body.set('next', next)

  const set = vi.fn()
  return {
    set,
    event: {
      request: { formData: async () => body },
      cookies: { set },
      getClientAddress: () => address ?? `10.0.0.${Math.floor(Math.random() * 250)}`,
    },
  }
}

/** SvelteKit throws its redirects, so a success has to be caught to be read. */
async function runAction(action: unknown, event: unknown) {
  try {
    return { result: await (action as (e: unknown) => Promise<unknown>)(event), thrown: null }
  } catch (thrown) {
    return { result: null, thrown: thrown as { status?: number; location?: string } }
  }
}

describe('login action', () => {
  it('issues a session cookie and redirects on the right password', async () => {
    const { actions } = await loadLogin()
    const { event, set } = submission({ password: PASSWORD })
    const { thrown } = await runAction(actions.default, event)

    expect(thrown?.status).toBe(303)
    expect(thrown?.location).toBe('/')
    expect(set).toHaveBeenCalledOnce()
    const [name, , options] = set.mock.calls[0]!
    expect(name).toBe('bw_admin_session')
    expect(options).toMatchObject({ httpOnly: true, sameSite: 'strict', path: '/' })
  })

  it('sets no cookie on a wrong password, and does not say why', async () => {
    const { actions } = await loadLogin()
    const { event, set } = submission({ password: 'wrong' })
    const { result } = await runAction(actions.default, event)

    expect(result).toMatchObject({ status: 400, data: { invalid: true, throttled: false } })
    expect(set).not.toHaveBeenCalled()
  })

  it('refuses a submission with no password field at all', async () => {
    const { actions } = await loadLogin()
    const { event, set } = submission({})
    const { result } = await runAction(actions.default, event)

    expect(result).toMatchObject({ status: 400 })
    expect(set).not.toHaveBeenCalled()
  })

  it('throttles guessing after ten attempts from one address', async () => {
    const { actions } = await loadLogin()
    const address = '198.51.100.7'
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const { event } = submission({ password: 'wrong', address })
      const { result } = await runAction(actions.default, event)
      expect(result, `attempt ${attempt}`).toMatchObject({ status: 400 })
    }

    const { event, set } = submission({ password: 'wrong', address })
    const { result } = await runAction(actions.default, event)
    expect(result).toMatchObject({ status: 429, data: { throttled: true } })
    expect(set).not.toHaveBeenCalled()
  })

  it('throttles the right password too, once the budget is spent', async () => {
    const { actions } = await loadLogin()
    const address = '198.51.100.8'
    for (let attempt = 0; attempt < 11; attempt += 1) {
      await runAction(actions.default, submission({ password: 'wrong', address }).event)
    }

    const { event, set } = submission({ password: PASSWORD, address })
    const { result } = await runAction(actions.default, event)
    expect(result).toMatchObject({ status: 429 })
    expect(set).not.toHaveBeenCalled()
  })

  it('clears the counter on success, so a typo does not cost the next login', async () => {
    const { actions } = await loadLogin()
    const address = '198.51.100.9'
    for (let attempt = 0; attempt < 9; attempt += 1) {
      await runAction(actions.default, submission({ password: 'wrong', address }).event)
    }
    await runAction(actions.default, submission({ password: PASSWORD, address }).event)

    const { event } = submission({ password: 'wrong', address })
    const { result } = await runAction(actions.default, event)
    expect(result).toMatchObject({ status: 400 })
  })

  it('only follows `next` back to a path on this host', async () => {
    const { actions } = await loadLogin()
    const cases: Array<[string, string]> = [
      ['/characters', '/characters'],
      ['//evil.example.com', '/'],
      ['https://evil.example.com', '/'],
      ['javascript:alert(1)', '/'],
      ['characters', '/'],
    ]

    for (const [next, expected] of cases) {
      const { thrown } = await runAction(
        actions.default,
        submission({ password: PASSWORD, next }).event,
      )
      expect(thrown?.location, next).toBe(expected)
    }
  })
})

describe('login load', () => {
  it('sends an already-authenticated admin straight through', async () => {
    const { load } = await loadLogin()
    const event = {
      locals: { authenticated: true },
      url: new URL('http://admin.test/login?next=/facts'),
    }
    const { thrown } = await runAction(load, event)
    expect(thrown?.status).toBe(303)
    expect(thrown?.location).toBe('/facts')
  })

  it('sanitises `next` before handing it to the form', async () => {
    const { load } = await loadLogin()
    const event = {
      locals: { authenticated: false },
      url: new URL('http://admin.test/login?next=//evil.example.com'),
    }
    const { result } = await runAction(load, event)
    expect(result).toEqual({ next: '/' })
  })
})
