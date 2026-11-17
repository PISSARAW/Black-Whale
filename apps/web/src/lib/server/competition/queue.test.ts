import { describe, it, expect } from 'vitest'
import { competitionFixture } from './testFixture'
describe('connection and identity filters', () => {
  it('uses single-use identity-bound server probes instead of a client ping number', () => {
    const f = competitionFixture()
    const { nonce } = f.service.probe(f.profiles[0])
    const prefs = { nonce, fighter: 'theta' as const, queue: 'ranked' as const, maxRtt: 300 }
    expect(() => f.service.enqueue(f.profiles[1], prefs)).toThrow('INVALID_PROBE')
    f.advance(40)
    f.service.enqueue(f.profiles[0], prefs)
    expect(f.service.view(f.profiles[0]).ticket?.rtt).toBe(40)
    f.service.cancel(f.profiles[0])
    expect(() => f.service.enqueue(f.profiles[0], prefs)).toThrow('INVALID_PROBE')
  })
  it('separates ranked and casual search, supports cancellation and expires vanished waiters', () => {
    const f = competitionFixture()
    f.enqueue(0, { queue: 'casual' })
    f.enqueue(1, { queue: 'ranked' })
    expect(f.service.view(f.profiles[0]).series).toBeNull()
    f.service.cancel(f.profiles[1])
    f.enqueue(1, { queue: 'casual' })
    expect(f.service.view(f.profiles[0]).series).not.toBeNull()
    f.enqueue(2)
    f.advance(15001)
    expect(f.service.view(f.profiles[2]).ticket).toBeNull()
  })
  it('honours both latency limits and rejects an already slow individual connection', () => {
    const f = competitionFixture()
    f.enqueue(0, { maxRtt: 100, rtt: 70 })
    f.enqueue(1, { maxRtt: 300, rtt: 60 })
    expect(f.service.view(f.profiles[0]).series).toBeNull()
    f.service.cancel(f.profiles[1])
    f.enqueue(1, { maxRtt: 300, rtt: 20 })
    expect(f.service.view(f.profiles[0]).series).not.toBeNull()
    expect(() => f.enqueue(2, { maxRtt: 100, rtt: 101 })).toThrow('CONNECTION')
  })
  it('initially matches nearby ratings, then widens only to the documented ceiling', () => {
    const f = competitionFixture()
    for (let i = 0; i < 30; i++)
      f.seasons.record({
        id: `past-${i}`,
        player: f.profiles[0],
        opponent: f.profiles[2],
        winner: 'player',
      })
    f.enqueue(0)
    f.enqueue(1)
    expect(f.service.view(f.profiles[0]).series).toBeNull()
    for (let i = 0; i < 20 && !f.service.view(f.profiles[0]).series; i++) {
      f.advance(10000)
      for (const profile of f.profiles.slice(0, 2)) {
        if (!f.service.view(profile).ticket) continue
        const { nonce } = f.service.probe(profile)
        f.service.refreshProbe(profile, nonce)
      }
    }
    expect(f.service.view(f.profiles[0]).series).not.toBeNull()
  })
  it('does not match a stale latency sample despite a live queue heartbeat', () => {
    const f = competitionFixture()
    f.enqueue(0, { queue: 'casual' })
    for (let i = 0; i < 4; i++) {
      f.advance(10000)
      f.service.view(f.profiles[0])
    }
    f.enqueue(1, { queue: 'casual' })
    expect(f.service.view(f.profiles[0]).series).toBeNull()
    const { nonce } = f.service.probe(f.profiles[0])
    f.service.refreshProbe(f.profiles[0], nonce)
    expect(f.service.view(f.profiles[0]).series).not.toBeNull()
  })
})
