import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performAttack } from './engine'
import { attackPhase } from './frameData'
import { hatsuFor } from './hatsu'
import { advanceMachiThreads } from './machiThread'
import {
  MACHI_DEFAULT_THREAD,
  MACHI_SPOOL,
  MACHI_TRAP_THREAD,
  machiAvailableThread,
  machiEngagedThread,
} from './machiSpool'
import { advanceMachiTraps } from './machiTraps'
import { performArsenalCommand } from './retrospectiveArsenal'
import type { ArsenalCommand } from './retrospectiveTypes'
import type { FightState } from './types'

function duel(): FightState {
  const state = beginFight(
    createFight('machi', 'hisoka', { mode: 'versus-local', formatId: 'knockout' }),
  )
  return {
    ...state,
    player: { ...state.player, x: 42, aura: 100 },
    opponent: { ...state.opponent, x: 60 },
  }
}
const command = (state: FightState, order: ArsenalCommand) =>
  performArsenalCommand(state, 'player', order)
function threaded(state: FightState, length = MACHI_DEFAULT_THREAD): FightState {
  const target = state.opponent
  return {
    ...state,
    opponent: {
      ...target,
      machiThread: { owner: 'player', kind: 'mark', length, x: target.x, y: target.y },
    },
  }
}
const spent = (state: FightState, lost: number): FightState => ({
  ...state,
  player: { ...state.player, machiSpoolLost: lost },
})
function strike(state: FightState, moveId: string): FightState {
  return hatsuFor('machi').onImpact({
    state,
    side: 'player',
    defenderSide: 'opponent',
    source: 'machi',
    blocked: false,
    concealed: false,
    moveId,
  })
}

describe('Machi’s finite thread', () => {
  it('counts every engaged strand against one physical spool', () => {
    const state = command(threaded(duel()), { action: 'machi-trap' })
    expect(state.player.machiTraps).toHaveLength(1)
    expect(machiEngagedThread(state, 'player')).toBe(MACHI_DEFAULT_THREAD + MACHI_TRAP_THREAD)
    expect(machiAvailableThread(state, 'player')).toBe(
      MACHI_SPOOL - MACHI_DEFAULT_THREAD - MACHI_TRAP_THREAD,
    )
  })

  it('cannot lengthen a thread beyond what is left, but can shorten it', () => {
    const near = duel()
    const state = spent(threaded({ ...near, opponent: { ...near.opponent, x: 46 } }), 40)
    expect(machiAvailableThread(state, 'player')).toBe(8)
    expect(command(state, { action: 'machi-length', target: '32' })).toBe(state)
    const shorter = command(state, { action: 'machi-length', target: '8' })
    expect(shorter.opponent.machiThread?.length).toBe(8)
    expect(machiAvailableThread(shorter, 'player')).toBe(16)
  })

  it('a strike leaves no thread when the spool is exhausted', () => {
    expect(strike(duel(), 'machi:downSpecial').opponent.machiThread?.kind).toBe('bind')
    const empty = spent(duel(), MACHI_SPOOL - 4)
    expect(strike(empty, 'machi:downSpecial').opponent.machiThread).toBeUndefined()
  })

  it('a suture needs free thread, like any other use', () => {
    const wounded = { ...duel(), player: { ...duel().player, health: 40, openWounds: 1 } }
    const order: ArsenalCommand = { action: 'machi-suture', target: 'player' }
    expect(command(wounded, order).player.machiSuture).toBeDefined()
    expect(command(spent(wounded, MACHI_SPOOL - 2), order).player.machiSuture).toBeUndefined()
  })

  it('a trap snags a grounded opponent and binds only while Machi holds it short', () => {
    const laid = command(duel(), { action: 'machi-trap' })
    const stepped = { ...laid, opponent: { ...laid.opponent, x: 44 } }
    const snagged = advanceMachiTraps(stepped)
    expect(snagged.player.machiTraps).toBeUndefined()
    expect(snagged.opponent.machiThread).toMatchObject({ kind: 'bind', length: MACHI_TRAP_THREAD })
    expect(advanceMachiThreads(snagged).opponent.machiThread?.kind).toBe('bind')
    const far = { ...snagged, player: { ...snagged.player, x: 20 } }
    expect(advanceMachiThreads(far).opponent.machiThread?.kind).toBe('mark')
    expect(machiEngagedThread(snagged, 'player')).toBe(MACHI_TRAP_THREAD)
  })

  it('an active strike over a trap cuts it and the strand is lost', () => {
    const laid = command(duel(), { action: 'machi-trap' })
    let swinging = performAttack(
      { ...laid, opponent: { ...laid.opponent, x: 50, y: 6 } },
      'opponent',
      'light',
    )
    while (swinging.opponent.attack && attackPhase(swinging.opponent) !== 'active')
      swinging = {
        ...swinging,
        opponent: {
          ...swinging.opponent,
          attack: { ...swinging.opponent.attack, frame: swinging.opponent.attack.frame + 1 },
        },
      }
    const reach = { ...swinging, opponent: { ...swinging.opponent, x: 44, facing: -1 as const } }
    const cut = advanceMachiTraps(reach)
    expect(cut.player.machiTraps).toBeUndefined()
    expect(cut.opponent.machiThread).toBeUndefined()
    expect(cut.player.machiSpoolLost).toBe(MACHI_TRAP_THREAD)
  })

  it('cutting her own thread frees the target but shortens the spool for the round', () => {
    const state = { ...threaded(duel()), opponent: { ...threaded(duel()).opponent, x: 44 } }
    const cut = command(state, { action: 'machi-cut', target: 'thread' })
    expect(cut.opponent.machiThread).toBeUndefined()
    expect(cut.player.machiSpoolLost).toBe(MACHI_DEFAULT_THREAD)
    expect(machiAvailableThread(cut, 'player')).toBe(MACHI_SPOOL - MACHI_DEFAULT_THREAD)
  })
})
