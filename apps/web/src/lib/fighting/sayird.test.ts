import { describe, expect, it } from 'vitest'
import { beginFight, createFight, nextRound, performAuraAttack, tickFight } from './engine'
import { hatsuFor, hatsuSourceFor } from './hatsu'
import { chainAbilitySealed } from './kurapika'
import { toggleEmperorTime } from './kurapikaActions'
import { dolphinCanUse, returnChainAbility, stealableChainMove } from './kurapikaDolphin'
import { canUseMovesetMove, moveById, moveForSlot, movesetFor } from './movesets'
import { LITTLE_EYE } from './outsideDuelAbility'
import { EMPTY_INPUT, type FightSide, type FightState } from './types'

function duel(thief: FightSide = 'player'): FightState {
  const state = beginFight(
    createFight('kurapika', 'sayird', {
      mode: 'versus-local',
      formatId: 'knockout',
    }),
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
  for (let i = 0; i < frames; i++)
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

describe('Sayird and Little Eye outside the 2D duel', () => {
  it('describes control, sight, hearing and real small targets in both languages', () => {
    const moveset = movesetFor('sayird')!
    expect(moveset.mechanicFr).toMatch(/contrôle.*animal réel.*hamster.*voit et entend/)
    expect(moveset.mechanicFr).toContain('créatures matérialisées par le Nen sont exclues')
    expect(moveset.mechanicEn).toMatch(/controls.*real small animal.*hamster.*sees and hears/)
    expect(moveset.mechanicEn).toContain('Nen-conjured creatures are excluded')
  })

  it('keeps Little Eye distinct from all martial strikes, with no combat Hatsu hooks', () => {
    const state = duel()
    const hatsu = hatsuFor('sayird')
    expect(moveById(LITTLE_EYE.id)).toBeNull()
    expect(hatsu.martialOnly).toBe(true)
    expect(hatsuSourceFor(state.opponent)).toBeNull()
    expect(hatsu.onTrigger({ state, side: 'opponent', source: 'sayird' })).toBe(state)
    expect(
      hatsu.onImpact({
        state,
        side: 'opponent',
        defenderSide: 'player',
        source: 'sayird',
        blocked: false,
        concealed: false,
      }),
    ).toBe(state)
    expect(hatsu.onFrame(state)).toBe(state)
  })

  it.each(['player', 'opponent'] as const)(
    'lets %s steal Little Eye through real syringe contact and drainage',
    (thief) => {
      const victim = thief === 'player' ? 'opponent' : 'player'
      const state = duel(thief)
      expect(state[thief].hatsuEffects.witnessedHatsu).toBeNull()
      const drained = advance(steal(state, thief), 90)
      expect(drained[thief].kurapika?.held).toMatchObject({
        source: 'sayird',
        victim,
        moveId: LITTLE_EYE.id,
        loaded: false,
        used: false,
      })
      expect(drained[victim].stolenChainAbility).toEqual({
        owner: thief,
        ownerMember: 0,
        moveId: LITTLE_EYE.id,
        theftId: drained[thief].kurapika!.held!.theftId,
      })
      expect(drained[victim].aura).toBeLessThan(10)
      expect(drained[victim].auraExhausted).toBe(true)
      expect(drained[victim].health).toBe(state[victim].health)
    },
  )

  it('does not mistake an ongoing martial special for Little Eye', () => {
    const state = duel()
    const striking = performAuraAttack({
      state: { ...state, opponent: { ...state.opponent, aura: 100 } },
      side: 'opponent',
      kind: 'special',
      moveId: 'sayird:forwardSpecial',
      auraCharged: false,
    })
    expect(striking.opponent.attack?.moveId).toBe('sayird:forwardSpecial')
    expect(stealableChainMove(striking.opponent)).toBe(LITTLE_EYE.id)
  })

  it('requires unguarded contact and a maintained draining connection', () => {
    const state = duel()
    const guarded = advance(steal(state), 90, 'opponent')
    expect(guarded.player.kurapika?.held).toBeNull()
    expect(guarded.opponent.stolenChainAbility).toBeUndefined()
    const far = { ...state, opponent: { ...state.opponent, x: 90 } }
    expect(advance(steal(far), 90).player.kurapika?.held).toBeNull()
    const attached = advance(steal(state), 19)
    expect(attached.opponent.drainingChain).toBeDefined()
    // Since the Stealth Dolphin donor-aura rule (733ff3225), a hit on Kurapika no longer
    // detaches a connected syringe; losing range or the needed Nen still stops the drain.
    const hit = advance({ ...attached, player: { ...attached.player, hitStun: 40 } }, 90)
    expect(hit.player.kurapika?.held).toMatchObject({ source: 'sayird' })
    const stopped = advance({ ...attached, player: { ...attached.player, x: 5 } }, 90)
    expect(stopped.player.kurapika?.held).toBeNull()
    expect(stopped.opponent.drainingChain).toBeUndefined()
  })

  it('seals only Little Eye and leaves every martial move available after aura recovery', () => {
    const held = recovered(advance(steal(duel()), 90))
    expect(chainAbilitySealed(held.opponent, LITTLE_EYE.id)).toBe(true)
    for (const move of movesetFor('sayird')!.moves) {
      expect(chainAbilitySealed(held.opponent, move.id)).toBe(false)
      if (move.category !== 'finisher')
        expect(canUseMovesetMove(held, 'opponent', move)).toBe(move.slot !== 'neutralSpecial')
    }
    expect(stealableChainMove(held.opponent)).toBeNull()
  })

  it('can load Little Eye but preserves its missing real target and the Dolphin lock', () => {
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
      moveId: LITTLE_EYE.id,
      loaded: true,
      used: false,
    })
    expect(later.player.attack).toBeNull()
    expect(later.projectiles).toHaveLength(0)
    expect(later.opponent.health).toBe(active.opponent.health)
    expect(toggleEmperorTime(later, 'player').player.kurapika?.emperorTime).toBe(true)
  })

  it('does not steal an already retained Hatsu or create an ability for other martial fighters', () => {
    const state = duel()
    expect(
      stealableChainMove({
        ...state.opponent,
        hatsuEffects: { ...state.opponent.hatsuEffects, hatsuStolen: 1 },
      }),
    ).toBeNull()
    for (const id of ['theta'] as const)
      expect(stealableChainMove({ ...state.opponent, id })).toBeNull()
  })

  it('clears both sides of the reservation on return, and keeps it across the next round', () => {
    const held = advance(steal(duel()), 90)
    const returned = returnChainAbility(held, 'player')
    expect(returned.player.kurapika?.held).toBeNull()
    expect(returned.opponent.stolenChainAbility).toBeUndefined()
    expect(stealableChainMove(returned.opponent)).toBe(LITTLE_EYE.id)
    // A round boundary keeps an unused stolen Hatsu (dolphinRound.ts); releasing still returns it.
    const next = nextRound({ ...held, phase: 'finished', winner: 'player' })
    expect(next.player.kurapika?.held).toMatchObject({ source: 'sayird', used: false })
    expect(next.opponent.stolenChainAbility).toMatchObject({ owner: 'player' })
    expect(stealableChainMove(next.opponent)).toBeNull()
    const released = returnChainAbility(next, 'player')
    expect(released.opponent.stolenChainAbility).toBeUndefined()
    expect(stealableChainMove(released.opponent)).toBe(LITTLE_EYE.id)
  })
})
