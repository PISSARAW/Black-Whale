import { get } from 'svelte/store'
import { describe, expect, it } from 'vitest'
import { ClashPvpRegistry } from '$lib/server/clashPvp'
import { createFightEnvironment } from '../fightEnvironment'
import { createPvpClient, decodePvpView } from './client'
import { PVP_RULESET, pvpSessionKey, type PvpView } from './types'

function connection() {
  let now = 1000,
    id = 0,
    fail = '',
    corrupt = false,
    version = false
  const registry = new ClashPvpRegistry(
    () => now,
    () => `client-${++id}`,
  )
  const host = registry.create({
    player: 'hisoka',
    opponent: 'kurapika',
    formatId: 'knockout',
    environment: createFightEnvironment(),
  })
  const guest = registry.join(host.matchId, PVP_RULESET, {
    invitation: host.inviteHref.split('#')[1],
  })
  const saved = new Map([[pvpSessionKey(host.matchId), host.token]])
  const bodies: Array<Record<string, unknown>> = []
  const fetcher = async function (this: unknown, _url, init) {
    expect(this).toBeUndefined()
    now += 10
    const body = init?.body ? JSON.parse(String(init.body)) : null
    if (body) bodies.push(body)
    let view: PvpView
    if (body?.kind === 'input') {
      view = registry.submit(host.matchId, { token: host.token, packet: body.packet })
      if (fail) {
        const reason = fail
        fail = ''
        throw Error(reason)
      }
    } else if (body?.kind === 'ready')
      view = registry.ready(host.matchId, {
        token: host.token,
        ruleset: body.ruleset,
        configHash: body.configHash,
      })
    else view = registry.view(host.matchId, host.token)
    if (corrupt) {
      corrupt = false
      view.snapshotHash = '00000000'
    }
    if (version) view.ruleset = 'old'
    return new Response(JSON.stringify(view), { status: 200 })
  } as typeof fetch
  const storage = {
    getItem: (key: string) => saved.get(key) ?? null,
    setItem: (key: string, value: string) => {
      saved.set(key, value)
    },
    removeItem: (key: string) => {
      saved.delete(key)
    },
  }
  const client = createPvpClient({
    matchId: host.matchId,
    endpoint: 'test',
    storage,
    fetch: fetcher,
    now: () => now,
  })
  async function start() {
    await client.join()
    await client.ready()
    registry.ready(host.matchId, {
      token: guest.token,
      ruleset: PVP_RULESET,
      configHash: registry.view(host.matchId, guest.token).configHash,
    })
    await client.step(0)
  }
  return {
    client,
    registry,
    host,
    guest,
    bodies,
    start,
    fail: () => (fail = 'NETWORK'),
    corrupt: () => (corrupt = true),
    version: () => (version = true),
  }
}
describe('private Clash client synchronization', () => {
  it('stops on an invalid player invitation instead of trying to authenticate the spectator', async () => {
    let requests = 0
    const client = createPvpClient({
      matchId: 'private',
      endpoint: '/test',
      invitation: 'watch-token',
      fetch: (async () => {
        requests++
        return new Response('{"error":"INVITATION"}', { status: 401 })
      }) as typeof fetch,
    })
    await client.join()
    expect(get(client).connection).toBe('error')
    expect(get(client).error).toBe('INVITATION')
    await client.step(0)
    expect(requests).toBe(1)
  })
  it('serializes a ready click behind an in-flight connection request', async () => {
    const c = connection()
    await Promise.all([c.client.join(), c.client.ready()])
    expect(get(c.client).view?.ready.player).toBe(true)
  })
  it('restores its seat token and verifies the received state before presenting it', async () => {
    const c = connection()
    await c.start()
    expect(get(c.client).connection).toBe('connected')
    expect(get(c.client).view?.side).toBe('player')
    expect(get(c.client).ping).toBe(10)
    expect(get(c.client).state?.player.id).toBe('hisoka')
  })
  it('retries a lost receipt with exactly the same sequence and action, without paying twice', async () => {
    const c = connection()
    await c.start()
    c.client.queue({ kind: 'move', action: 'special', input: 0 })
    c.fail()
    await c.client.step(0)
    expect(get(c.client).connection).toBe('reconnecting')
    await c.client.step(0)
    expect(get(c.client).connection).toBe('connected')
    const packets = c.bodies.filter((body) => body.kind === 'input')
    expect(packets.at(-1)).toEqual(packets.at(-2))
    expect(get(c.client).view?.nextSequence).toBe(1)
  })
  it('detects a changed snapshot, suspends commands, and resynchronizes before accepting new input', async () => {
    const c = connection()
    await c.start()
    const before = get(c.client).state
    c.corrupt()
    await c.client.step(0)
    expect(get(c.client).connection).toBe('diverged')
    expect(get(c.client).state).toBe(before)
    c.client.queue({ kind: 'call' })
    await c.client.step(0)
    expect(get(c.client).connection).toBe('connected')
    expect(c.bodies.filter((body) => body.kind === 'input')).toHaveLength(1)
  })
  it('blocks old clients and stops network work after disposal', async () => {
    const c = connection()
    c.version()
    await c.client.join()
    expect(get(c.client).connection).toBe('version')
    const count = c.bodies.length
    await c.client.step(0)
    expect(c.bodies).toHaveLength(count)
    c.client.stop()
    await c.client.ready()
    expect(c.bodies).toHaveLength(count)
  })
  it('does not trust malformed or divergent snapshots', async () => {
    const c = connection()
    await c.start()
    const view = get(c.client).view!
    expect(() => decodePvpView({ ...view, snapshotHash: 'ffffffff' })).toThrow('DIVERGED')
    expect(() => decodePvpView({ ...view, snapshot: '{}' })).toThrow('invalid-replay')
    expect(() => decodePvpView({ ...view, ruleset: 'old' })).toThrow('VERSION')
    expect(() => decodePvpView({ ...view, setup: { ...view.setup, player: 'camilla' } })).toThrow(
      'DIVERGED',
    )
  })
})
