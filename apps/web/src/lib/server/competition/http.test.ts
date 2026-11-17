import { describe, it, expect } from 'vitest'
import { competitionFixture } from './testFixture'
import { competitionHttp } from './http'
import { PVP_RULESET } from '$lib/fighting/pvp/types'
import { readOnlineCommand } from '$lib/fighting/online/protocol'

let address = 0
function fixture() {
  const f = competitionFixture(),
    ip = `fixture-${++address}`
  async function request(
    options: { token?: string; body?: unknown; query?: string; method?: string } = {},
  ) {
    const method = options.method ?? (options.body === undefined ? 'GET' : 'POST')
    const request = new Request(`http://fixture/fighting/pvp/online/api${options.query ?? ''}`, {
      method,
      headers: {
        authorization: `Bearer ${options.token ?? ''}`,
        'content-type': 'application/json',
      },
      body: method === 'GET' ? undefined : JSON.stringify(options.body),
    })
    return competitionHttp(request, { service: f.service, ip })
  }
  return { ...f, request }
}
describe('competitive HTTP authentication, filtering and bounded commands', () => {
  it('recovers the authoritative identity from its existing code without accepting a name or result', async () => {
    const f = fixture()
    expect((await f.request()).status).toBe(401)
    const response = await f.request({ token: f.credentials[0].token })
    expect(response.headers.get('cache-control')).toBe('no-store')
    const value = await response.json()
    expect(value.profile).toEqual(f.profiles[0])
    expect(value).not.toHaveProperty('token')
    expect((await f.request({ token: f.credentials[1].token })).status).toBe(200)
    expect(value.ruleset).toBe(PVP_RULESET)
  })
  it('pairs two authenticated profiles through the same production handler', async () => {
    const f = fixture()
    for (const credential of f.credentials.slice(0, 2)) {
      const probe = await f.request({
        token: credential.token,
        body: { kind: 'probe', ruleset: PVP_RULESET },
      })
      const { nonce } = await probe.json()
      f.advance(30)
      const response = await f.request({
        token: credential.token,
        body: {
          kind: 'queue',
          ruleset: PVP_RULESET,
          nonce,
          fighter: 'theta',
          queue: 'ranked',
          maxRtt: 100,
        },
      })
      expect(response.status).toBe(200)
    }
    const one = await (await f.request({ token: f.credentials[0].token })).json(),
      two = await (await f.request({ token: f.credentials[1].token })).json()
    expect(one.session.side).toBe('player')
    expect(two.session.side).toBe('opponent')
    expect(JSON.stringify(one)).not.toContain(two.session.token)
    expect(JSON.stringify(two)).not.toContain(one.session.token)
  })
  it.each([
    'winner',
    'health',
    'aura',
    'rating',
    'profile',
    'token',
    'setup',
    'ping',
    'snapshot',
  ] as const)('rejects client-owned %s fields without changing a queue or verdict', async (key) => {
    const f = fixture(),
      body = {
        kind: 'queue',
        ruleset: PVP_RULESET,
        nonce: 'x',
        fighter: 'theta',
        queue: 'ranked',
        maxRtt: 300,
        [key]: 'forged',
      }
    const response = await f.request({ token: f.credentials[0].token, body })
    expect(response.status).toBe(400)
    expect(f.service.view(f.profiles[0]).ticket).toBeNull()
    expect(f.seasons.leaderboard().entries).toEqual([])
  })
  it.each(['result', 'advance', 'tick', 'rank', 'tournament-result', 'report-verdict'] as const)(
    'rejects the %s command',
    async (kind) => {
      const f = fixture()
      expect(
        (await f.request({ token: f.credentials[0].token, body: { kind, ruleset: PVP_RULESET } }))
          .status,
      ).toBe(400)
    },
  )
  it('rejects incompatible rules, oversized bodies and unsupported methods', async () => {
    const f = fixture(),
      token = f.credentials[0].token
    expect((await f.request({ token, body: { kind: 'probe', ruleset: 'old' } })).status).toBe(426)
    expect(
      (
        await f.request({
          token,
          body: { kind: 'probe', ruleset: PVP_RULESET, text: 'x'.repeat(9000) },
        })
      ).status,
    ).toBe(426)
    expect((await f.request({ token, method: 'DELETE', body: {} })).status).toBe(405)
  })
  it('rejects duplicate queue admission across simultaneous tabs', async () => {
    const f = fixture(),
      token = f.credentials[0].token,
      { nonce } = f.service.probe(f.profiles[0])
    const body = {
      kind: 'queue',
      ruleset: PVP_RULESET,
      nonce,
      fighter: 'theta',
      queue: 'casual',
      maxRtt: 100,
    }
    const result = await Promise.all([f.request({ token, body }), f.request({ token, body })])
    expect(result.map((r) => r.status).sort()).toEqual([200, 409])
  })
  it('returns only the public bracket and never treats viewers as a player heartbeat', async () => {
    const f = fixture(),
      inv = f.service.createTournament(f.profiles[0], { name: 'Cup', fighter: 'theta' })
    f.service.joinTournament(f.profiles[1], {
      id: inv.id,
      secret: inv.invitation,
      fighter: 'hisoka',
    })
    f.service.startTournament(f.profiles[0], inv.id)
    f.service.playTournament(f.profiles[0], inv.id)
    const pair = f.sessions()
    f.ready(pair)
    f.advance(3101)
    const result = await f.request({ query: `?tournament=${inv.id}` }),
      text = await result.text()
    expect(result.status).toBe(200)
    for (const secret of [
      inv.invitation,
      ...pair.map((s) => s.token),
      ...f.credentials.map((p) => p.token),
    ])
      expect(text).not.toContain(secret)
    expect(f.registry.peek(pair[0].matchId, pair[0].token).status).toBe('interrupted')
    expect(text).not.toContain('snapshot')
  })
  it.each([
    null,
    [],
    {},
    false,
    { kind: 'queue' },
    { kind: 'tournament-create', name: ' ', fighter: 'hisoka' },
    { kind: 'queue', nonce: 'x', fighter: 'invented', queue: 'ranked', maxRtt: 100 },
    { kind: 'queue', nonce: 'x', fighter: 'theta', queue: 'ranked', maxRtt: '100' },
  ])('rejects malformed commands %#', (value) => {
    expect(readOnlineCommand(value)).toBeNull()
  })
})
