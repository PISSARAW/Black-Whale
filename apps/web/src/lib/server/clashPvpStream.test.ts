import { describe, expect, it } from 'vitest'
import { ClashPvpRegistry } from './clashPvp'
import { openClashPvpStream } from './clashPvpStream'
import { PVP_RULESET } from '$lib/fighting/pvp/types'
import { createFightEnvironment } from '$lib/fighting/fightEnvironment'
import { decodePvpView } from '$lib/fighting/pvp/client'

describe('authenticated snapshot stream', () => {
  it('pushes only the authenticated perspective and never renews presence on outgoing traffic', async () => {
    let now = 0,
      id = 0
    const registry = new ClashPvpRegistry(
      () => now,
      () => `stream-${++id}`,
    )
    const host = registry.create({
      player: 'chrollo',
      opponent: 'hisoka',
      formatId: 'knockout',
      environment: createFightEnvironment(),
    })
    const guest = registry.join(host.matchId, PVP_RULESET, {
      invitation: host.inviteHref.split('#')[1],
    })
    for (const token of [host.token, guest.token])
      registry.ready(host.matchId, {
        token,
        ruleset: PVP_RULESET,
        configHash: registry.view(host.matchId, token).configHash,
      })
    const abort = new AbortController()
    const response = openClashPvpStream({
      id: host.matchId,
      token: guest.token,
      signal: abort.signal,
      peek: () => registry.peek(host.matchId, guest.token),
    })
    expect(response.headers.get('content-type')).toContain('text/event-stream')
    expect(response.headers.get('cache-control')).toContain('no-transform')
    const reader = response.body!.getReader()
    try {
      const first = await reader.read()
      const text = new TextDecoder().decode(first.value)
      const view = JSON.parse(text.slice(6).trim())
      expect(text).not.toContain(guest.token)
      const state = decodePvpView(view)
      expect(state.player.id).toBe('hisoka')
      expect(state.opponent.chrolloBook!.pages).toEqual([])
      now = 3100
      expect(registry.peek(host.matchId, guest.token).status).toBe('interrupted')
      abort.abort()
      expect((await reader.read()).done).toBe(true)
    } finally {
      await reader.cancel()
    }
  })
  it('rejects a foreign token before opening a successful stream', () => {
    const registry = new ClashPvpRegistry()
    const response = openClashPvpStream({
      id: 'missing',
      token: 'foreign',
      signal: new AbortController().signal,
      peek: () => registry.peek('missing', 'foreign'),
    })
    expect(response.status).toBe(404)
    expect(response.headers.get('content-type')).not.toContain('text/event-stream')
  })
})
