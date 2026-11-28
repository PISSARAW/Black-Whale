import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performMove, tickFight } from '../engine'
import { fightReplayHash } from '../fightReplayHash'
import { addChrolloPage, toggleChrolloBookmark } from '../chrolloBook'
import { recordFightDeath } from '../fightDeaths'
import { resolveFightOutcome } from '../fightOutcome'
import { EMPTY_INPUT, type FighterId } from '../types'
import { fightSoundEvents } from '../audio/events'
import { cinematicEvents, cameraSnapshot } from '../cinematicEvents'
import { applyPvpCommand } from './commands'
import { AuthoritativeClashMatch } from './serverMatch'
import { createPvpPrediction } from './prediction'
import { pvpSnapshot, privatePvpState } from './view'
import { decodePvpView } from './clientView'
import { pvpConfigHash } from './config'
import { PVP_RULESET, type PvpView } from './types'

function duel(player: FighterId, opponent: FighterId = 'hisoka') {
  const state = beginFight(
    createFight(player, opponent, { mode: 'versus-local', formatId: 'knockout' }),
  )
  return {
    ...state,
    player: { ...state.player, aura: 100, x: 20 },
    opponent: { ...state.opponent, x: 76 },
  }
}
function future() {
  let state = performMove({ state: duel('tserriednich'), side: 'player', action: 'special' })
  for (let frame = 0; frame < 32; frame++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT, ai: false })
  expect(state.parallelFuture?.phase).toBe('vision')
  return state
}
function cat() {
  const state = duel('camilla')
  state.player.health = 0
  const after = resolveFightOutcome(
    recordFightDeath(state, { victimSide: 'player', killerSide: 'opponent', cause: 'strike' }),
  )
  expect(after.catsName).toBeDefined()
  return after
}
function contract() {
  let state = duel('longhi')
  state.opponent.x = 26
  state = applyPvpCommand(state, 'player', { kind: 'offer' })
  state = applyPvpCommand(state, 'opponent', { kind: 'respond', accept: true })
  expect(state.moonlight?.active?.recipient).toBe('opponent')
  return state
}
function copy() {
  const state = duel('chrollo')
  state.player.chrolloBook = toggleChrolloBookmark(
    addChrolloPage(state.player.chrolloBook!, 'melody'),
  )
  return state
}
function charge() {
  const state = performMove({ state: duel('phinks'), side: 'player', action: 'special' })
  expect(state.player.cyclotronWindup).toBeDefined()
  return state
}
function envelope(server: AuthoritativeClashMatch, revision: number): PvpView {
  const state = server.snapshot()
  const setup = {
    player: state.player.id,
    opponent: state.opponent.id,
    formatId: state.formatId,
    environment: state.environment,
  }
  return {
    matchId: 'safe',
    side: 'player',
    setup,
    configHash: pvpConfigHash(setup),
    ruleset: PVP_RULESET,
    status: 'playing',
    ready: { player: true, opponent: true },
    connected: { player: true, opponent: true },
    nextSequence: server.nextSequence('player'),
    ...server.acknowledgement('player'),
    revision,
    tick: server.tick,
    authorityHash: fightReplayHash(state),
    ...pvpSnapshot(state, 'player'),
    disconnectedSide: null,
  }
}

describe('private reconciliation preserves temporal, post-mortem and conditional Nen states', () => {
  it.each([
    ['future', future],
    ['post-mortem', cat],
    ['contract', contract],
    ['copy', copy],
    ['charge', charge],
  ] as const)(
    '%s survives a control generation change without replaying pending intentions',
    (_name, create) => {
      const state = create()
      const server = new AuthoritativeClashMatch(state)
      let now = 0
      const predictor = createPvpPrediction(() => now)
      const before = envelope(server, 1)
      predictor.accept(decodePvpView(before), before)
      const command = { kind: 'move', action: 'special', input: 0 } as const
      const id = predictor.command(command)
      predictor.sent({ sequence: 0, input: 2, commands: [command] }, [id])
      predictor.advance(1 / 60, 2)
      const hash = fightReplayHash(server.snapshot())
      server.release()
      now += 4000
      const after = envelope(server, 2)
      predictor.accept(decodePvpView(after), after)
      expect(predictor.stats.pending).toBe(0)
      expect(fightReplayHash(server.snapshot())).toBe(hash)
      const privateHash = fightReplayHash(decodePvpView(after))
      predictor.advance(1 / 60, 0)
      expect(fightReplayHash(decodePvpView(after))).toBe(privateHash)
      const opponent = privatePvpState(server.snapshot(), 'opponent')
      expect(opponent.parallelFuture).toBeUndefined()
      if (state.player.chrolloBook) expect(opponent.opponent.chrolloBook?.pages).toEqual([])
      if (state.parallelFuture || state.catsName) expect(predictor.current).toBeNull()
    },
    20000,
  )
  it('resimulation cannot publish resource, result, sound or camera events', () => {
    const state = duel('hisoka', 'bill')
    const server = new AuthoritativeClashMatch(state)
    const predictor = createPvpPrediction(() => 0)
    const view = envelope(server, 1),
      authority = decodePvpView(view)
    const hash = fightReplayHash(authority)
    predictor.accept(authority, view)
    predictor.command({ kind: 'move', action: 'special', input: 0 })
    predictor.advance(0.05, 2)
    const visual = predictor.current!
    expect(visual).not.toBeNull()
    expect(Object.keys(visual.player).sort()).toEqual(
      ['attack', 'blocking', 'crouching', 'facing', 'motion', 'pose', 'velocityY', 'x', 'y'].sort(),
    )
    expect(fightReplayHash(authority)).toBe(hash)
    expect(fightSoundEvents(authority, authority)).toEqual([])
    expect(cinematicEvents(authority, cameraSnapshot(authority))).toEqual([])
  })
  it('does not replay an already confirmed impact’s sounds or camera after a duplicate private view', () => {
    let state = duel('hisoka', 'bill')
    state.opponent.x = 26
    state = performMove({ state, side: 'player', action: 'heavy' })
    const before = state
    for (let frame = 0; frame < 60 && !state.impact; frame++)
      state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT, ai: false })
    expect(state.impact).not.toBeNull()
    const confirmed = privatePvpState(state, 'player')
    expect(fightSoundEvents(before, confirmed).some((event) => event.kind === 'impact')).toBe(true)
    const duplicate = structuredClone(confirmed)
    expect(fightSoundEvents(confirmed, duplicate)).toEqual([])
    expect(cinematicEvents(duplicate, cameraSnapshot(confirmed))).toEqual([])
  })
})
