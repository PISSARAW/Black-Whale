import { describe, expect, it } from 'vitest'
import { get } from 'svelte/store'
import { ClashPvpRegistry } from '$lib/server/clashPvp'
import { createFightEnvironment } from '../fightEnvironment'
import { createPvpClient, decodePvpView } from './client'
import { PVP_RULESET, pvpSessionKey, type PvpView } from './types'

async function connection() {
  let now = 1000,
    id = 0,
    fail = false,
    posts = 0
  let snapshot!: PvpView
  let controller: ReadableStreamDefaultController<Uint8Array> | undefined
  const registry = new ClashPvpRegistry(
    () => now,
    () => `response-${++id}`,
  )
  const host = registry.create({
    player: 'kurapika',
    opponent: 'chrollo',
    formatId: 'knockout',
    environment: createFightEnvironment(),
  })
  const guest = registry.join(host.matchId, PVP_RULESET, {
    invitation: host.inviteHref.split('#')[1],
  })
  const fetcher = async (_url: RequestInfo | URL, init?: RequestInit) => {
    if (String(_url).includes('stream=1'))
      return new Response(
        new ReadableStream({
          start(value) {
            controller = value
          },
        }),
        { headers: { 'content-type': 'text/event-stream' } },
      )
    const body = init?.body ? JSON.parse(String(init.body)) : null
    if (body?.kind === 'ready')
      snapshot = registry.ready(host.matchId, {
        token: host.token,
        ruleset: PVP_RULESET,
        configHash: body.configHash,
      })
    else if (body?.kind === 'input') {
      posts++
      snapshot = registry.submit(host.matchId, { token: host.token, packet: body.packet })
      if (fail) {
        fail = false
        throw Error('NETWORK')
      }
    } else snapshot = registry.view(host.matchId, host.token)
    return new Response(JSON.stringify(snapshot))
  }
  const client = createPvpClient({
    matchId: host.matchId,
    endpoint: '/match',
    fetch: fetcher as typeof fetch,
    now: () => now,
    storage: {
      getItem: (key) => (key === pvpSessionKey(host.matchId) ? host.token : null),
      setItem: () => {},
      removeItem: () => {},
    },
  })
  await client.join()
  await client.ready()
  registry.ready(host.matchId, {
    token: guest.token,
    ruleset: PVP_RULESET,
    configHash: snapshot.configHash,
  })
  await client.step(0)
  return {
    client,
    registry,
    host,
    guest,
    view: () => snapshot,
    time: (ms: number) => {
      now += ms
    },
    posts: () => posts,
    fail: () => {
      fail = true
    },
    async push(view: PvpView) {
      controller!.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(view)}\n\n`))
      for (let i = 0; i < 8; i++) await Promise.resolve()
    },
    async stream() {
      client.pump(0)
      for (let i = 0; i < 12; i++) await Promise.resolve()
    },
  }
}
describe('stream reconciliation and bounded input traffic', () => {
  it('ignores reordered snapshots and keeps authoritative HUD separate from predicted poses', async () => {
    const c = await connection()
    try {
      await c.stream()
      const old = structuredClone(c.view())
      c.client.queue({ kind: 'move', action: 'light', input: 0 })
      c.time(17)
      c.client.advance(1 / 60, 0)
      expect(c.client.visualPrediction?.player.attack).not.toBeNull()
      expect(get(c.client).state!.player.attack).toBeNull()
      await c.client.step(0)
      c.time(34)
      const fresh = c.registry.view(c.host.matchId, c.host.token)
      await c.push(fresh)
      const state = get(c.client).state
      await c.push(old)
      expect(get(c.client).view!.revision).toBe(fresh.revision)
      expect(get(c.client).state).toBe(state)
      expect(get(c.client).state).toEqual(decodePvpView(fresh))
    } finally {
      c.client.stop()
    }
  })
  it('bounds the pump and stops all callbacks and views after disposal', async () => {
    const c = await connection()
    try {
      await c.stream()
      for (let i = 0; i < 120; i++) {
        c.time(1000 / 60)
        c.client.advance(1 / 60, i % 2)
        c.client.pump(i % 2)
        for (let j = 0; j < 5; j++) await Promise.resolve()
      }
      expect(c.posts()).toBeLessThanOrEqual(45)
      const state = get(c.client).state
      c.client.stop()
      c.client.pump(0)
      c.client.advance(1 / 60, 0)
      await c.client.step(0)
      expect(get(c.client).state).toBe(state)
      expect(c.client.visualPrediction).toBeNull()
    } finally {
      c.client.stop()
    }
  })
})
