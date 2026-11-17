import { describe, expect, it } from 'vitest'
import { beginFight, createFight } from '../engine'
import { fightReplayHash } from '../fightReplayHash'
import { decodePvpView } from './client'
import { pvpSnapshot } from './view'
import { pvpConfigHash } from './config'
import { AuthoritativeClashMatch } from './serverMatch'
import { createPvpPrediction, MAX_PREDICTION_FRAMES } from './prediction'
import { PVP_RULESET, type PvpView } from './types'
import type { FighterId } from '../types'

function session(fighter: FighterId, opponent: FighterId = 'chrollo') {
  let now = 0,
    revision = 0
  const state = beginFight(
    createFight(fighter, opponent, { mode: 'versus-local', formatId: 'knockout' }),
  )
  state.player.x = 44
  state.opponent.x = 50
  const server = new AuthoritativeClashMatch(state)
  const prediction = createPvpPrediction(() => now)
  function view(side: 'player' | 'opponent' = 'player'): PvpView {
    const current = server.snapshot()
    const setup = {
      player: current.player.id,
      opponent: current.opponent.id,
      formatId: current.formatId,
      environment: current.environment,
    }
    return {
      matchId: 'prediction',
      side,
      setup,
      ruleset: PVP_RULESET,
      configHash: pvpConfigHash(setup),
      status: 'playing',
      ready: { player: true, opponent: true },
      connected: { player: true, opponent: true },
      nextSequence: server.nextSequence(side),
      ...server.acknowledgement(side),
      revision: ++revision,
      tick: server.tick,
      authorityHash: fightReplayHash(current),
      ...pvpSnapshot(current, side),
      disconnectedSide: null,
    }
  }
  const first = view()
  const authority = decodePvpView(first)
  prediction.accept(authority, first)
  return {
    server,
    prediction,
    view,
    authority,
    time: (ms: number) => {
      now = ms
    },
    step: () => {
      now += 1000 / 60
      return prediction.advance(1 / 60, 0)
    },
  }
}
describe('owner prediction and authoritative reconciliation', () => {
  it.each(['kurapika', 'hisoka', 'chrollo', 'benjamin'] as const)(
    'starts %s on the next local tick, before any server reply',
    (fighter) => {
      const c = session(fighter)
      const hash = fightReplayHash(c.authority)
      c.prediction.command({ kind: 'move', action: 'light', input: 0 })
      const visual = c.step()!
      expect(visual.player.attack?.moveId).toBe(`${fighter}:standingLight`)
      expect(visual.player.attack?.confirmedHit).toBe(false)
      expect(c.server.snapshot().player.attack).toBeNull()
      expect(fightReplayHash(c.authority)).toBe(hash)
      expect(Object.keys(visual.player)).not.toContain('nen')
      expect(Object.keys(visual.player)).not.toContain('aura')
      expect(Object.keys(visual.player)).not.toContain('health')
    },
  )
  it.each(['kurapika', 'hisoka', 'chrollo', 'benjamin'] as const)(
    'reconciles delayed %s acknowledgements without restarting or charging twice',
    (fighter) => {
      const c = session(fighter)
      const command = { kind: 'move', action: 'light', input: 0 } as const
      const id = c.prediction.command(command)
      c.step()
      const packet = { sequence: 0, input: 0, commands: [command] }
      c.prediction.sent(packet, [id])
      for (let i = 0; i < 7; i++) c.step()
      const predicted = c.prediction.current!.player.attack!.frame
      c.server.submit('player', packet, 0)
      const received = c.view()
      expect(received.nextSequence).toBe(1)
      expect(received.appliedSequence).toBe(0)
      c.server.advance(1000 / 60)
      const applied = c.view()
      c.prediction.accept(decodePvpView(applied), applied)
      expect(c.prediction.current!.player.attack!.frame).toBe(predicted)
      const hash = fightReplayHash(c.server.snapshot())
      expect(c.server.submit('player', packet, 100)).toBe('duplicate')
      expect(fightReplayHash(c.server.snapshot())).toBe(hash)
      expect(c.prediction.stats.pending).toBe(0)
    },
  )
  it('keeps startup progress when a received packet is still awaiting its simulation tick', () => {
    const c = session('hisoka')
    const command = { kind: 'move', action: 'light', input: 0 } as const
    const id = c.prediction.command(command)
    c.prediction.sent({ sequence: 0, input: 0, commands: [command] }, [id])
    for (let i = 0; i < 4; i++) c.step()
    const frame = c.prediction.current!.player.attack!.frame
    c.server.submit('player', { sequence: 0, input: 0, commands: [command] }, 0)
    const received = c.view()
    c.prediction.accept(decodePvpView(received), received)
    expect(c.prediction.current!.player.attack!.frame).toBe(frame)
    expect(c.prediction.stats.pending).toBe(1)
  })
  it('accepts a resumed sequence without repeatedly discarding newly queued commands', () => {
    const c = session('benjamin')
    c.server.submit('player', { sequence: 0, input: 0, commands: [] }, 0)
    c.server.advance(17)
    const resumed = c.view()
    c.prediction.clear()
    c.prediction.accept(decodePvpView(resumed), resumed)
    c.prediction.command({ kind: 'move', action: 'light', input: 0 })
    c.step()
    const next = c.view()
    c.prediction.accept(decodePvpView(next), next)
    expect(c.prediction.stats.pending).toBe(1)
    expect(c.prediction.current!.player.attack?.moveId).toBe('benjamin:standingLight')
  })
  it('keeps new controls responsive after delayed receipts fill the visual horizon', () => {
    const c = session('hisoka')
    c.prediction.sent({ sequence: 0, input: 0, commands: [] }, [])
    for (let i = 0; i < 20; i++) c.step()
    const fresh = c.view()
    c.prediction.accept(decodePvpView(fresh), fresh)
    expect(c.prediction.stats.backlogFrames).toBeLessThanOrEqual(8)
    c.prediction.command({ kind: 'move', action: 'light', input: 0 })
    expect(c.step()!.player.attack?.moveId).toBe('hisoka:standingLight')
    expect(c.prediction.stats.steps).toBeLessThanOrEqual(12 + 8 + 1)
    expect(c.server.snapshot().player.attack).toBeNull()
  })
  it.each(['kurapika', 'hisoka', 'chrollo', 'benjamin'] as const)(
    'starts a fresh %s intent even when jitter has filled the visual horizon',
    (fighter) => {
      const c = session(fighter)
      for (let i = 0; i < 12; i++) c.step()
      c.prediction.command({ kind: 'move', action: 'light', input: 0 })
      expect(c.step()!.player.attack?.moveId).toBe(`${fighter}:standingLight`)
      expect(c.prediction.stats.steps).toBeLessThanOrEqual(12 + 8 + 1)
      expect(c.server.snapshot().player.attack).toBeNull()
    },
  )
  it('reserves a local tick for a changed held direction even at the horizon', () => {
    const c = session('kurapika')
    for (let i = 0; i < 12; i++) c.step()
    const before = c.prediction.current!.player.x
    c.time(210)
    expect(c.prediction.advance(1 / 60, 2)!.player.x).toBeGreaterThan(before)
    expect(c.server.snapshot().player.x).toBe(44)
  })
  it('never predicts forbidden Nen, publishes a verdict or changes authority', () => {
    const c = session('kurapika')
    const view = c.view()
    const state = decodePvpView(view)
    state.player.aura = 0
    const hash = fightReplayHash(state)
    c.prediction.accept(state, view)
    c.prediction.command({ kind: 'move', action: 'special', input: 0 })
    expect(c.step()!.player.attack).toBeNull()
    expect(fightReplayHash(state)).toBe(hash)
  })
  it('immediately yields to an authoritative hit, death, interruption and round change', () => {
    const c = session('hisoka')
    c.prediction.command({ kind: 'move', action: 'light', input: 0 })
    c.step()
    const view = c.view()
    const state = decodePvpView(view)
    state.player.hitStun = 30
    state.player.pose = 'hit'
    c.prediction.accept(state, view)
    expect(c.prediction.current).toBeNull()
    c.prediction.clear()
    expect(c.prediction.current).toBeNull()
    expect(c.prediction.stats.pending).toBe(0)
  })
  it('bounds speculative work and stops on stale authority', () => {
    const c = session('benjamin')
    for (let i = 0; i < 100; i++) c.step()
    expect(c.prediction.stats.steps).toBeLessThanOrEqual(MAX_PREDICTION_FRAMES)
    expect(c.prediction.current).toBeNull()
  })
  it('keeps secret pages and concealed techniques outside the predictor, including P2', () => {
    const c = session('chrollo', 'hisoka')
    const state = c.server.snapshot()
    state.player.chrolloBook!.pages = ['machi']
    state.player.nen.in = true
    c.server.replaceRound(state)
    const view = c.view('opponent'),
      own = decodePvpView(view)
    const prediction = createPvpPrediction(() => 0)
    prediction.accept(own, view)
    prediction.command({ kind: 'move', action: 'light', input: 0 })
    const result = prediction.advance(1 / 60, 0)!
    expect(result.source.player.id).toBe('hisoka')
    expect(result.source.opponent.chrolloBook!.pages).toEqual([])
    expect(result.source.opponent.nen.in).toBe(false)
    expect(result.opponent && Object.keys(result.opponent)).toEqual(['x', 'y'])
  })
})
