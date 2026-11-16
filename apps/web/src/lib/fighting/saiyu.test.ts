import { describe, expect, it } from 'vitest'
import {
  beginFight,
  createFight,
  nextRound,
  performAttack,
  performAuraAttack,
  tickFight,
} from './engine'
import { hatsuFor } from './hatsu'
import { canCallHanzoBody, callHanzoBody } from './hanzoBodyCall'
import { projectHanzo } from './hanzoProjection'
import { finisherReady } from './movesets'
import {
  SAIYU_MONKEYS,
  canSpeak,
  saiyuAudioEnabled,
  sealedSenseCount,
  senseDeprived,
} from './saiyuSenses'
import { EMPTY_INPUT, type FightSide, type FightState } from './types'

function duel(): FightState {
  const state = beginFight(
    createFight('saiyu', 'hisoka', { mode: 'versus-local', formatId: 'knockout' }),
  )
  return {
    ...state,
    player: { ...state.player, x: 42, aura: 100 },
    opponent: { ...state.opponent, x: 48 },
  }
}

function advance(state: FightState, frames = 65): FightState {
  for (let i = 0; i < frames; i++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  return state
}

function touch(
  state: FightState,
  moveId: string,
  defenderSide: FightSide = 'opponent',
): FightState {
  return hatsuFor('saiyu').onImpact({
    state,
    side: defenderSide === 'player' ? 'opponent' : 'player',
    defenderSide,
    source: 'saiyu',
    moveId,
    blocked: false,
    concealed: false,
  })
}

function cast(state: FightState, moveId: string): FightState {
  return performAuraAttack({ state, side: 'player', kind: 'special', moveId, auraCharged: false })
}

describe('Saiyu independent Three Monkeys', () => {
  it.each(SAIYU_MONKEYS)('$name removes only $sense, including when used first', (monkey) => {
    const state = duel()
    const sealed = touch(state, monkey.moveId)
    for (const other of SAIYU_MONKEYS)
      expect(senseDeprived(sealed.opponent, other.sense)).toBe(other === monkey)
    expect(sealedSenseCount(sealed.opponent)).toBe(1)
    expect(touch(sealed, monkey.moveId)).toBe(sealed)
    expect(sealed.opponent.nen).toBe(state.opponent.nen)
    expect(sealed.opponent.hitStun).toBe(state.opponent.hitStun)
    expect(sealed.opponent.hatsuEffects.forcedZetsuFrames).toBe(0)
  })

  it.each(SAIYU_MONKEYS)('$name requires a real unguarded contact in the engine', (monkey) => {
    const state = duel()
    expect(sealedSenseCount(advance(cast(state, monkey.moveId)).opponent)).toBe(1)
    const far = { ...state, opponent: { ...state.opponent, x: 93 } }
    expect(sealedSenseCount(advance(cast(far, monkey.moveId)).opponent)).toBe(0)
    let blocked = cast(state, monkey.moveId)
    for (let frame = 0; frame < 65; frame++)
      blocked = tickFight(blocked, EMPTY_INPUT, {
        dt: 1 / 60,
        opponentInput: { ...EMPTY_INPUT, guard: true, down: monkey.sense === 'speech' },
      })
    expect(sealedSenseCount(blocked.opponent)).toBe(0)
  })

  it('accepts any order and never forces Zetsu or extra stun with all three faculties removed', () => {
    let state = duel()
    state = {
      ...state,
      opponent: {
        ...state.opponent,
        hatsuEffects: { ...state.opponent.hatsuEffects, forcedZetsuFrames: 23 },
      },
    }
    for (const moveId of ['saiyu:downSpecial', 'saiyu:neutralSpecial', 'saiyu:forwardSpecial'])
      state = touch(state, moveId)
    expect(state.opponent.hatsuEffects.senseSeals).toBe(7)
    expect(state.opponent.hatsuEffects.forcedZetsuFrames).toBe(23)
    expect(state.opponent.nen.mode).toBe('ten')
    expect(state.opponent.hitStun).toBe(0)
  })

  it('requires two distinct faculties for the martial finisher, not a high single bit', () => {
    const speech = touch(duel(), 'saiyu:downSpecial')
    expect(finisherReady(speech, 'player')).toBe(false)
    expect(finisherReady(touch(speech, 'saiyu:neutralSpecial'), 'player')).toBe(true)
    expect(touch(speech, 'saiyu:backSpecial')).toBe(speech)
    expect(touch(speech, 'saiyu:finisher')).toBe(speech)
  })

  it('keeps physical attacks and Nen abilities usable after all three seals', () => {
    let state = duel()
    for (const monkey of SAIYU_MONKEYS) state = touch(state, monkey.moveId)
    expect(performAttack(state, 'opponent', 'light').opponent.attack).not.toBeNull()
    expect(
      performAuraAttack({
        state,
        side: 'opponent',
        kind: 'special',
        moveId: 'hisoka:neutralSpecial',
        auraCharged: false,
      }).opponent.attack,
    ).not.toBeNull()
    expect(advance(state, 180).opponent.hatsuEffects.senseSeals).toBe(7)
    const next = nextRound({ ...state, phase: 'finished', winner: 'player' })
    expect(next.opponent.hatsuEffects.senseSeals).toBe(0)
  })

  it('distinguishes hearing from speech for the selected audio perspective', () => {
    const speech = touch(duel(), 'saiyu:downSpecial', 'player')
    expect(canSpeak(speech.player)).toBe(false)
    expect(saiyuAudioEnabled(speech)).toBe(true)
    const deaf = touch(duel(), 'saiyu:forwardSpecial', 'opponent')
    expect(saiyuAudioEnabled(deaf, 'player')).toBe(true)
    expect(saiyuAudioEnabled(deaf, 'opponent')).toBe(false)
    expect(saiyuAudioEnabled({ ...deaf, mode: 'versus-ai' }, 'opponent')).toBe(true)
  })

  it('uses only Mizaru for Skill Hunter’s single copied command', () => {
    const sealed = touch(duel(), 'chrollo:neutralSpecial')
    expect(senseDeprived(sealed.opponent, 'sight')).toBe(true)
    expect(sealedSenseCount(sealed.opponent)).toBe(1)
    expect(touch(duel(), 'chrollo:forwardSpecial').opponent.hatsuEffects.senseSeals).toBe(0)
  })

  it('prevents a speech-deprived caller and a hearing-deprived body from using the spoken wake-up', () => {
    const state = duel()
    const projected = { ...state, opponent: projectHanzo({ ...state.opponent, id: 'hanzo' }) }
    expect(canCallHanzoBody(projected, 'player')).toBe(true)
    const mute = touch(projected, 'saiyu:downSpecial', 'player')
    expect(canCallHanzoBody(mute, 'player')).toBe(false)
    expect(callHanzoBody(mute, 'player')).toBe(mute)
    const deaf = touch(projected, 'saiyu:forwardSpecial')
    expect(canCallHanzoBody(deaf, 'player')).toBe(false)
    expect(callHanzoBody(deaf, 'player')).toBe(deaf)
    const blind = touch(projected, 'saiyu:neutralSpecial', 'player')
    expect(callHanzoBody(blind, 'player').opponent.hanzoProjection).toBeUndefined()
  })
})
