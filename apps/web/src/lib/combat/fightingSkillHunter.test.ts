import { describe, expect, it } from 'vitest'
import { initialArenaMatchState } from '../arena/match'
import { DEFAULT_REPLAY_MATCH } from '../arena/replay/types'
import { combatReducer } from './reducer'
import { castHatsu } from './hatsuCast'
import { initialCombatState, type CombatAction, type CombatState } from './types'

type FightingMove = Extract<CombatAction, { type: 'FIGHTING_MOVE' }>

function move(slot: FightingMove['slot']): FightingMove {
  return {
    type: 'FIGHTING_MOVE',
    side: 'player',
    fighterId: 'chrollo',
    slot,
    targetAt: [1, 0],
  }
}

function duel(): CombatState {
  const setup = {
    playerAt: [0, 0] as const,
    opponentAt: [1, 0] as const,
    terrain: initialCombatState().terrain,
  }
  return initialArenaMatchState(setup, {
    ...DEFAULT_REPLAY_MATCH,
    fighterId: 'chrollo',
    opponentFighterId: 'hisoka',
  })
}

function ready(state: CombatState): CombatState {
  return { ...state, player: { ...state.player, cooldown: 0 } }
}

describe('Arena Skill Hunter book', () => {
  it('opens with Clash’s four prepared Heavens Arena pages', () => {
    expect(duel().player.skillHunterBook).toEqual({
      deck: ['sun-and-moon', 'black-voice', 'order-stamp', 'convert-hands'],
      stolenPage: null,
      selectedSlot: 0,
      open: true,
      bookmarkSlot: null,
    })
  })

  it('turns pages, bookmarks one and invokes it from the closed book', () => {
    const turned = combatReducer(duel(), move('backSpecial'))
    expect(turned.player.skillHunterBook).toMatchObject({ selectedSlot: 1, open: true })

    const bookmarked = combatReducer(ready(turned), move('downSpecial'))
    expect(bookmarked.player.skillHunterBook).toMatchObject({
      selectedSlot: 1,
      bookmarkSlot: 1,
      open: false,
    })

    const invoked = combatReducer(ready(bookmarked), move('finisher'))
    expect(invoked.opponent.bound).toBeGreaterThan(0)
    expect(invoked.lastHatsuBySide.player).toBe('black-voice')
  })

  it('steals an observed Hatsu at palm range and seals it on the original owner', () => {
    const observed = {
      ...duel(),
      lastHatsuBySide: { player: null, opponent: 'bungee-gum' },
    }
    const stolen = combatReducer(observed, move('forwardSpecial'))

    expect(stolen.player.skillHunterBook).toMatchObject({
      stolenPage: 'bungee-gum',
      selectedSlot: 'stolen',
      open: true,
    })
    expect(stolen.nenEffects).toContainEqual(
      expect.objectContaining({
        kind: 'CAPTURED_ABILITY',
        owner: 'player',
        target: 'opponent',
        detail: 'bungee-gum',
      }),
    )

    const denied = castHatsu(stolen, {
      side: 'opponent',
      effect: 'bind',
      zone: 'arms',
      hatsuId: 'bungee-gum',
      targetAt: stolen.player.position,
      cost: 0,
    })
    expect(denied).toBe(stolen)

    const replayed = combatReducer(ready(stolen), move('neutralSpecial'))
    expect(replayed.tethers[0]).toMatchObject({ owner: 'player', subject: 'opponent' })
    expect(replayed.lastHatsuBySide.player).toBe('bungee-gum')
  })

  it('replaces only the fifth page and returns the former ability to its owner', () => {
    const first = combatReducer(
      { ...duel(), lastHatsuBySide: { player: null, opponent: 'bungee-gum' } },
      move('forwardSpecial'),
    )
    const second = combatReducer(
      {
        ...ready(first),
        lastHatsuBySide: { player: first.lastHatsuBySide.player, opponent: 'chain-jail' },
      },
      move('forwardSpecial'),
    )

    expect(second.player.skillHunterBook?.stolenPage).toBe('chain-jail')
    expect(second.nenEffects.filter(({ kind }) => kind === 'CAPTURED_ABILITY')).toHaveLength(1)
    expect(second.nenEffects[0]?.detail).toBe('chain-jail')
    expect(
      castHatsu(second, {
        side: 'opponent',
        effect: 'bind',
        zone: 'arms',
        hatsuId: 'bungee-gum',
        cost: 0,
      }),
    ).not.toBe(second)
  })

  it('does not steal concealed Nen without Gyo or an ability outside palm range', () => {
    const base = duel()
    const hidden = {
      ...base,
      opponent: { ...base.opponent, in: true },
      lastHatsuBySide: { player: null, opponent: 'bungee-gum' },
    }
    expect(combatReducer(hidden, move('forwardSpecial'))).toBe(hidden)

    const far = {
      ...base,
      opponent: { ...base.opponent, position: [1.21, 0] as [number, number] },
      lastHatsuBySide: { player: null, opponent: 'bungee-gum' },
    }
    expect(combatReducer(far, move('forwardSpecial'))).toBe(far)
  })

  it('buffers page handling through hitstop with the selected target intact', () => {
    const frozen = { ...duel(), hitstop: 1 / 60 }
    const buffered = combatReducer(frozen, move('backSpecial'))
    const resumed = combatReducer(buffered, { type: 'TICK', dt: 1 / 60 })

    expect(buffered.player.buffered?.slot).toBe('backSpecial')
    expect(resumed.player.skillHunterBook?.selectedSlot).toBe(1)
  })
})
