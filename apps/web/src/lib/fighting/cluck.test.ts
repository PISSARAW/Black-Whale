import { describe, expect, it } from 'vitest'
import { beginFight, createFight, nextRound, performAuraAttack, tickFight } from './engine'
import { hatsuAvoidsImpact, hatsuDamageFactor, hatsuFor, hatsuSourceFor } from './hatsu'
import { chainAbilitySealed } from './kurapika'
import { toggleEmperorTime } from './kurapikaActions'
import { dolphinCanUse, returnChainAbility, stealableChainMove } from './kurapikaDolphin'
import { canUseMovesetMove, moveById, moveForSlot, movesetFor } from './movesets'
import { BIRD_MANIPULATION, LITTLE_EYE, outsideDuelAbility } from './outsideDuelAbility'
import { EMPTY_INPUT, type FightSide, type FightState } from './types'

function duel(thief: FightSide = 'player'): FightState {
  const state = beginFight(
    createFight('kurapika', 'cluck', { mode: 'versus-local', formatId: 'knockout' }),
  )
  const close = {
    ...state,
    player: { ...state.player, x: 42, aura: 100 },
    opponent: { ...state.opponent, x: 48, aura: 10 },
  }
  return thief === 'player'
    ? close
    : {
        ...close,
        player: { ...close.opponent, x: 42, facing: 1 },
        opponent: { ...close.player, x: 48, facing: -1 },
      }
}

function steal(state: FightState, side: FightSide = 'player'): FightState {
  return performAuraAttack({
    state,
    side,
    kind: 'special',
    moveId: 'kurapika:backSpecial',
    auraCharged: false,
  })
}

function advance(state: FightState, frames: number, guard?: FightSide): FightState {
  const blocking = { ...EMPTY_INPUT, guard: true }
  for (let frame = 0; frame < frames; frame++)
    state = tickFight(state, guard === 'player' ? blocking : EMPTY_INPUT, {
      dt: 1 / 60,
      opponentInput: guard === 'opponent' ? blocking : EMPTY_INPUT,
    })
  return state
}

function recovered(state: FightState): FightState {
  const reset = (fighter: FightState['player']) => ({
    ...fighter,
    aura: 100,
    auraExhausted: false,
    attack: null,
    hitStun: 0,
    blockStun: 0,
    knockdownFrames: 0,
    nen: { ...fighter.nen, mode: 'ten' as const },
  })
  return { ...state, hitstop: 0, player: reset(state.player), opponent: reset(state.opponent) }
}

describe('Cluck — bird control retained by Steal Chain', () => {
  it('recognizes bird control separately from martial attacks and Little Eye', () => {
    const state = duel()
    expect(hatsuFor('cluck').stealableOutsideDuel).toBe(BIRD_MANIPULATION)
    expect(stealableChainMove(state.opponent)).toBe(BIRD_MANIPULATION.id)
    expect(moveById(BIRD_MANIPULATION.id)).toBeNull()
    expect(BIRD_MANIPULATION.id).not.toBe(LITTLE_EYE.id)
    expect(outsideDuelAbility(BIRD_MANIPULATION.id)).toBe(BIRD_MANIPULATION)
    expect(outsideDuelAbility()).toBeNull()
    expect(outsideDuelAbility('cluck:neutralSpecial')).toBeNull()
  })

  it('does not introduce a flock, Nen attacks, evasion or a damage buff', () => {
    const state = duel()
    const hatsu = hatsuFor('cluck')
    expect(hatsu.onTrigger({ state, side: 'opponent', source: 'cluck' })).toBe(state)
    expect(
      hatsu.onImpact({
        state,
        side: 'opponent',
        defenderSide: 'player',
        source: 'cluck',
        blocked: false,
        concealed: false,
      }),
    ).toBe(state)
    expect(hatsu.onFrame(state)).toBe(state)
    expect(hatsuAvoidsImpact(state.opponent)).toBe(false)
    expect(hatsuDamageFactor(state.opponent)).toBe(1)
    for (const move of movesetFor('cluck')!.moves)
      expect(hatsuSourceFor(state.opponent, move.id)).toBeNull()
    const striking = performAuraAttack({
      state: { ...state, opponent: { ...state.opponent, aura: 100 } },
      side: 'opponent',
      kind: 'special',
      moveId: 'cluck:forwardSpecial',
      auraCharged: false,
    })
    expect(striking.opponent.attack?.hatsuSource).toBeNull()
    expect(stealableChainMove(striking.opponent)).toBe(BIRD_MANIPULATION.id)
    expect(advance(striking, 60).projectiles).toHaveLength(0)
  })

  it.each(['player', 'opponent'] as const)(
    'lets %s steal bird control by contact and drainage, without prior witnessing',
    (thief) => {
      const victim = thief === 'player' ? 'opponent' : 'player'
      const state = duel(thief)
      expect(state[thief].hatsuEffects.witnessedHatsu).toBeNull()
      const held = advance(steal(state, thief), 90)
      expect(held[thief].kurapika?.held).toMatchObject({
        source: 'cluck',
        victim,
        moveId: BIRD_MANIPULATION.id,
        loaded: false,
        used: false,
      })
      expect(held[victim].stolenChainAbility).toEqual({
        owner: thief,
        moveId: BIRD_MANIPULATION.id,
      })
      expect(held[victim].aura).toBeLessThan(state[victim].aura)
      expect(held[victim].auraExhausted).toBe(true)
      expect(held[victim].health).toBe(state[victim].health)
      expect(stealableChainMove(held[victim])).toBeNull()
    },
  )

  it('requires unguarded contact and a maintained connection before retaining the ability', () => {
    const state = duel()
    const guarded = advance(steal(state), 90, 'opponent')
    expect(guarded.player.kurapika?.held).toBeNull()
    expect(guarded.opponent.stolenChainAbility).toBeUndefined()
    const far = advance(steal({ ...state, opponent: { ...state.opponent, x: 90 } }), 90)
    expect(far.player.kurapika?.held).toBeNull()
    const attached = advance(steal(state), 19)
    expect(attached.opponent.drainingChain).toBeDefined()
    expect(attached.player.kurapika?.held).toBeNull()
    const stopped = advance({ ...attached, player: { ...attached.player, hitStun: 40 } }, 90)
    expect(stopped.player.kurapika?.held).toBeNull()
    expect(stopped.opponent.drainingChain).toBeUndefined()
  })

  it('seals bird control without sealing Cluck’s martial moves after aura recovery', () => {
    const state = recovered(advance(steal(duel()), 90))
    expect(chainAbilitySealed(state.opponent, BIRD_MANIPULATION.id)).toBe(true)
    for (const move of movesetFor('cluck')!.moves) {
      expect(chainAbilitySealed(state.opponent, move.id)).toBe(false)
      if (move.category !== 'finisher')
        expect(canUseMovesetMove(state, 'opponent', move)).toBe(move.slot !== 'neutralSpecial')
    }
    expect(
      stealableChainMove({
        ...state.opponent,
        stolenChainAbility: undefined,
        hatsuEffects: { ...state.opponent.hatsuEffects, hatsuStolen: 1 },
      }),
    ).toBeNull()
  })

  it('can load bird control but preserves its missing real target and the Dolphin lock', () => {
    const held = recovered(advance(steal(duel()), 90))
    const active = toggleEmperorTime(held, 'player')
    expect(active.player.kurapika?.emperorTime).toBe(true)
    expect(canUseMovesetMove(active, 'player', moveForSlot('kurapika', 'backSpecial')!)).toBe(true)
    expect(dolphinCanUse(active, 'player')).toBe(false)
    const loaded = steal(active)
    expect(dolphinCanUse(loaded, 'player')).toBe(false)
    expect(steal(loaded)).toBe(loaded)
    const later = advance(loaded, 120)
    expect(later.player.kurapika?.held).toMatchObject({
      moveId: BIRD_MANIPULATION.id,
      loaded: true,
      used: false,
    })
    expect(later.player.attack).toBeNull()
    expect(later.projectiles).toHaveLength(0)
    expect(later.opponent.health).toBe(active.opponent.health)
    expect(toggleEmperorTime(later, 'player').player.kurapika?.emperorTime).toBe(true)
  })

  it('returns the same ability when released or when the round resets', () => {
    const state = advance(steal(duel()), 90)
    const returned = returnChainAbility(state, 'player')
    expect(returned.player.kurapika?.held).toBeNull()
    expect(returned.opponent.stolenChainAbility).toBeUndefined()
    expect(stealableChainMove(returned.opponent)).toBe(BIRD_MANIPULATION.id)
    const reset = nextRound({ ...state, phase: 'finished', winner: 'player' })
    expect(reset.player.kurapika?.held).toBeNull()
    expect(reset.opponent.stolenChainAbility).toBeUndefined()
    expect(stealableChainMove(reset.opponent)).toBe(BIRD_MANIPULATION.id)
  })
})
