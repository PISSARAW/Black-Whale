import { describe, expect, it } from 'vitest'
import { ROSTER_TECHNIQUES } from '../../rosterTechniqueDirection'
import { runLoopback, type LinkProfile } from './loopback'
import { longDuel, script } from './sessionFixture'
import { RollbackSession } from './session'
import type { FighterId } from '../../types'

const ROSTER = Object.keys(ROSTER_TECHNIQUES) as FighterId[]

const INTERNET: LinkProfile = { delayMs: 50, jitterMs: 10, loss: 0.02, seed: 7 }

describe('rollback session (lot L2)', () => {
  it.each(ROSTER.map((id, index) => [id, ROSTER[(index + 7) % ROSTER.length]] as const))(
    '%s against %s at 100 ms round trip: A, B and the reference agree',
    (player, opponent) => {
      const result = runLoopback({
        initial: longDuel(player, opponent),
        script,
        frames: 600,
        link: INTERNET,
      })
      expect(result.a).toBe(result.reference)
      expect(result.b).toBe(result.reference)
      expect(result.desync).toEqual({ a: null, b: null })
      expect(result.stats.a.rollbacks).toBeGreaterThan(0)
      expect(result.stats.a.longestRollback).toBeLessThanOrEqual(8)
    },
  )

  it.each([0, 25, 50, 75])('agrees at %i ms one way with jitter and loss', (delayMs) => {
    for (const [player, opponent] of [
      ['kurapika', 'hisoka'],
      ['chrollo', 'benjamin'],
    ] as const) {
      const result = runLoopback({
        initial: longDuel(player, opponent),
        script,
        frames: 900,
        link: { delayMs, jitterMs: 15, loss: 0.05, seed: delayMs + 1 },
      })
      expect([result.a, result.b]).toEqual([result.reference, result.reference])
    }
  })

  it('waits instead of rolling back further than its window', () => {
    const result = runLoopback({
      initial: longDuel('feitan', 'machi'),
      script,
      frames: 300,
      link: { delayMs: 250, jitterMs: 0, loss: 0, seed: 1 },
    })
    expect(result.stats.a.stalls).toBeGreaterThan(0)
    expect(result.stats.a.longestRollback).toBeLessThanOrEqual(8)
    expect([result.a, result.b]).toEqual([result.reference, result.reference])
  })

  it('detects a desync through the exchanged checksums', () => {
    const initial = longDuel('kurapika', 'hisoka')
    const result = runLoopback({
      initial,
      initialB: { ...initial, rng: initial.rng ^ 1 },
      script,
      frames: 300,
      link: INTERNET,
    })
    expect(result.a).toBe(result.reference)
    expect(result.b).not.toBe(result.reference)
    expect(result.desync.a).not.toBeNull()
    expect(result.desync.b).not.toBeNull()
  })

  it('never predicts a one-shot command and ignores duplicated inputs', () => {
    const session = new RollbackSession({
      initial: longDuel('hisoka', 'chrollo'),
      local: 'player',
      inputDelay: 0,
      maxRollback: 8,
    })
    const talk = { input: 0, commands: [{ kind: 'talk', words: 'Ici.' } as const] }
    session.receive({ inputs: [{ frame: 0, seat: talk }], ack: -1, checksums: [] })
    session.receive({ inputs: [{ frame: 0, seat: talk }], ack: -1, checksums: [] })
    for (let frame = 0; frame < 3; frame++) {
      session.addLocalInput({ input: 0, commands: [] })
      expect(session.advance()).toBe(true)
    }
    expect(session.stats.rollbacks).toBe(0)
    expect(session.confirmedFrame).toBe(1)
  })
})
