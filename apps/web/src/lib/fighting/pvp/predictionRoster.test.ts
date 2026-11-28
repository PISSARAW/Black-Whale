import { describe, expect, it } from 'vitest'
import { projectHanzo } from '../hanzoProjection'
import { beginCatsName } from '../camillaCat'
import { beginFight, createFight } from '../engine'
import { FIGHTING_ROSTER } from '../roster'
import { fightReplayHash } from '../fightReplayHash'
import { createReplayRecorder } from '../fightReplayRecorder'
import { createReplayPlayer } from '../fightReplayPlayer'
import { FIXED_STEP } from '../fightClock'
import type { FighterId, FightSide, FightState } from '../types'
import { createPvpPrediction } from './prediction'
import { predictionEligible } from './predictionPolicy'
import { privatePvpState, pvpSnapshot } from './view'
import { decodePvpView } from './clientView'
import { AuthoritativeClashMatch } from './serverMatch'
import { pvpConfigHash } from './config'
import { PVP_RULESET, type PvpView, type PvpCommand } from './types'

const roster = FIGHTING_ROSTER.map(({ id }) => id)
const light = { kind: 'move', action: 'light', input: 0 } as const
function fixture(player: FighterId, opponent: FighterId = 'hisoka', side: FightSide = 'player') {
  const initial = beginFight(
    createFight(player, opponent, { mode: 'versus-local', formatId: 'knockout' }),
  )
  initial.player.x = 44
  initial.opponent.x = 50
  const server = new AuthoritativeClashMatch(initial)
  let now = 0,
    revision = 0
  const predictor = createPvpPrediction(() => now)
  function view(): PvpView {
    const state = server.snapshot()
    const setup = { player, opponent, formatId: state.formatId, environment: state.environment }
    return {
      matchId: 'roster',
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
      authorityHash: fightReplayHash(state),
      ...pvpSnapshot(state, side),
      disconnectedSide: null,
    }
  }
  function accept() {
    const next = view()
    predictor.accept(decodePvpView(next), next)
  }
  accept()
  return {
    initial,
    server,
    predictor,
    accept,
    queue(command: PvpCommand) {
      const id = predictor.command(command)
      const packet = { sequence: server.nextSequence(side), input: 0, commands: [command] }
      predictor.sent(packet, [id])
      return packet
    },
    step(input = 0) {
      now += 1000 / 60
      return predictor.advance(FIXED_STEP, input)
    },
  }
}

describe('prediction across the complete playable roster', () => {
  it('uses exactly the forty playable identities', () => expect(roster).toHaveLength(40))
  for (const player of roster) {
    it.each(roster)(
      `${player} / %s: startup, applied reconciliation and replay keep the same referee`,
      (opponent) => {
        const c = fixture(player, opponent)
        const hash = fightReplayHash(c.initial)
        const packet = c.queue(light)
        for (let i = 0; i < 6; i++) c.step()
        const visual = c.predictor.current!
        expect(visual.player.attack?.moveId).toBe(`${player}:standingLight`)
        expect(visual.player.attack?.confirmedHit).toBe(false)
        expect(Object.keys(visual.player)).not.toContain('nen')
        expect(Object.keys(visual.player)).not.toContain('health')
        expect(fightReplayHash(c.server.snapshot())).toBe(hash)
        expect(fightReplayHash(c.initial)).toBe(hash)
        expect(c.server.submit('player', packet, 0)).toBe('accepted')
        c.server.advance(17)
        c.accept()
        expect(c.predictor.stats.pending).toBe(0)
        const after = c.server.snapshot(),
          confirmed = fightReplayHash(after)
        expect(c.server.submit('player', packet, 30)).toBe('duplicate')
        expect(fightReplayHash(c.server.snapshot())).toBe(confirmed)
        const recorder = createReplayRecorder(c.initial)!
        recorder.append(c.initial, [FIXED_STEP, 0, 0, [{ ...light, side: 'player' }]], after)
        const replay = createReplayPlayer(recorder.snapshot()!)
        replay.advance(0.1)
        expect(replay.error).toBe('')
        expect(fightReplayHash(replay.state)).toBe(confirmed)
      },
    )
  }
  it.each(roster)('%s also predicts the authenticated P2 body', (fighter) => {
    const c = fixture('hisoka', fighter, 'opponent')
    c.queue(light)
    const visual = c.step()!
    expect(visual.source.player.id).toBe(fighter)
    expect(visual.player.attack?.moveId).toBe(`${fighter}:standingLight`)
    expect(c.server.snapshot().opponent.attack).toBeNull()
    expect(visual.opponent && Object.keys(visual.opponent)).toEqual(['x', 'y'])
  })
  it.each(roster)('%s preserves native Nen admission under Zetsu', (fighter) => {
    const c = fixture(fighter)
    const state = c.server.snapshot()
    state.player.nen = { ...state.player.nen, mode: 'zetsu' }
    c.server.replaceRound(state)
    c.accept()
    const hash = fightReplayHash(c.server.snapshot())
    const packet = c.queue({ kind: 'move', action: 'special', input: 0 })
    const preview = c.step()
    expect(fightReplayHash(c.server.snapshot())).toBe(hash)
    c.server.submit('player', packet, 0)
    c.server.advance(17)
    if (preview)
      expect(preview.player.attack?.moveId).toBe(c.server.snapshot().player.attack?.moveId)
  })
  it('replays Kalluto’s semantic paper action before its receipt', () => {
    const c = fixture('kalluto')
    c.queue({ kind: 'paper-use', command: 'plant' })
    expect(c.step()!.player.attack?.moveId).toBe('kalluto:neutralSpecial')
    expect(c.server.snapshot().player.attack).toBeNull()
  })
  it('applies Bonolenov’s named preparation before another attack', () => {
    const c = fixture('bonolenov')
    c.queue({ kind: 'battle', moveId: 'bonolenov:neutralSpecial' })
    c.step()
    c.queue(light)
    expect(c.step()!.player.attack).toBeNull()
    expect(c.server.snapshot().player.battleCantabile?.preparation).toBe(
      c.initial.player.battleCantabile?.preparation,
    )
  })
  it('respects the body lock of an unacknowledged gesture', () => {
    const c = fixture('leorio')
    c.queue({ kind: 'easter', slot: 1 })
    expect(c.step(2)!.player.x).toBe(c.initial.player.x)
    expect(c.server.snapshot().player.easterEgg).toBeUndefined()
  })
  it('moves Hanzo’s confirmed double without inventing its activation', () => {
    const c = fixture('hanzo')
    const state = c.server.snapshot()
    state.player = projectHanzo(state.player)
    state.player.hanzoProjection!.startupFrames = 0
    c.server.replaceRound(state)
    c.accept()
    expect(c.step(2)!.player.x).toBeGreaterThan(state.player.x)
    expect(c.server.snapshot().player.x).toBe(state.player.x)
  })
  it('waits for confirmation when Hanzo changes the controlled vessel', () => {
    const c = fixture('hanzo')
    c.queue({ kind: 'move', action: 'special', input: 0 })
    expect(c.step()).toBeNull()
    expect(c.server.snapshot().player.hanzoProjection).toBeUndefined()
  })
  it('never invents or advances Camilla’s post-mortem sequence', () => {
    const c = fixture('camilla')
    const state = c.server.snapshot()
    state.player.health = 0
    const cat = beginCatsName(state, { victimSide: 'player', killerSide: 'opponent' })
    c.server.replaceRound(cat)
    c.accept()
    c.queue(light)
    expect(c.step()).toBeNull()
    expect(c.predictor.stats.steps).toBe(0)
    expect(c.server.snapshot().catsName?.frame).toBe(0)
  })
  it('accepts all copied Chrollo pages without exposing them to the other seat', () => {
    const c = fixture('chrollo')
    const state = c.server.snapshot()
    state.player.chrolloBook!.pages = roster.filter(
      (id): id is Exclude<FighterId, 'chrollo'> => id !== 'chrollo',
    )
    c.server.replaceRound(state)
    c.accept()
    c.queue(light)
    expect(c.step()!.player.attack?.moveId).toBe('chrollo:standingLight')
    expect(privatePvpState(c.server.snapshot(), 'opponent').opponent.chrolloBook!.pages).toEqual([])
  })
  it('stops speculative Parallel Future before it can create a 600-tick forecast', () => {
    const c = fixture('tserriednich')
    c.queue({ kind: 'move', action: 'special', input: 0 })
    expect(c.step()).toBeNull()
    for (let i = 0; i < 10; i++) c.step()
    expect(c.predictor.stats.steps).toBe(0)
    expect(c.server.snapshot().parallelFuture).toBeUndefined()
  })
  it('keeps confirmed alternate timelines outside the speculative simulation', () => {
    const c = fixture('tserriednich')
    const packet = c.queue({ kind: 'move', action: 'special', input: 0 })
    c.server.submit('player', packet, 0)
    c.server.advance(17)
    c.accept()
    expect(c.predictor.current).toBeNull()
    expect(predictionEligible(privatePvpState(c.server.snapshot(), 'player'))).toBe(false)
  })
  it('resumes prediction immediately after a confirmed special sequence ends', () => {
    const c = fixture('tserriednich')
    const packet = c.queue({ kind: 'move', action: 'special', input: 0 })
    c.server.submit('player', packet, 0)
    c.server.advance(17)
    c.accept()
    const state: FightState = { ...c.initial, parallelFuture: undefined }
    c.server.replaceRound(state)
    c.accept()
    c.queue(light)
    expect(c.step()!.player.attack?.moveId).toBe('tserriednich:standingLight')
  })
})
