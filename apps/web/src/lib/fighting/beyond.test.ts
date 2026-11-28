import { describe, expect, it } from 'vitest'
import {
  beginFight,
  createFight,
  performAttack,
  performAuraAttack,
  performMove,
  tickFight,
  opponentAttack,
} from './engine'
import { BEYOND_CURSE } from './beyondCurse'
import { CHROLLO_BOOKMARK, createChrolloBook } from './chrolloBook'
import { fightSpecialPresentation } from './fightSpecialPresentation'
import { hatsuFor, hatsuSourceFor } from './hatsu'
import { dolphinCanUse, stealableChainMove } from './kurapikaDolphin'
import { toggleEmperorTime } from './kurapikaActions'
import { finisherReady, moveById, moveForSlot, movesetFor } from './movesets'
import { outsideDuelAbility } from './outsideDuelAbility'
import {
  EMPTY_INPUT,
  type FighterId,
  type FightSide,
  type FightState,
  type MoveAction,
} from './types'

function fight(player: FighterId = 'beyond', opponent: FighterId = 'hisoka'): FightState {
  const state = beginFight(
    createFight(player, opponent, { mode: 'versus-local', formatId: 'knockout' }),
  )
  return {
    ...state,
    player: { ...state.player, x: 44, aura: 100 },
    opponent: { ...state.opponent, x: 50, aura: 100 },
  }
}
function frames(state: FightState, count: number): FightState {
  for (let frame = 0; frame < count; frame++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  return state
}
function steal(state: FightState): FightState {
  return performAuraAttack({
    state,
    side: 'player',
    kind: 'special',
    auraCharged: false,
    moveId: 'kurapika:backSpecial',
  })
}
function recovered(state: FightState): FightState {
  const reset = (fighter: FightState['player']) => ({
    ...fighter,
    aura: 100,
    auraExhausted: false,
    attack: null,
    blocking: false,
    hitStun: 0,
    blockStun: 0,
    knockdownFrames: 0,
    nen: { ...fighter.nen, mode: 'ten' as const },
  })
  return { ...state, hitstop: 0, player: reset(state.player), opponent: reset(state.opponent) }
}

describe('Beyond: physical duel and a real prepared curse', () => {
  it('keeps fourteen physical moves without any low-health super or dangling cancel', () => {
    const moveset = movesetFor('beyond')!
    expect(moveset.moves).toHaveLength(14)
    expect(moveForSlot('beyond', 'finisher')).toBeNull()
    expect(moveById('beyond:finisher')).toBeNull()
    expect(moveset.moves.every((move) => move.canon.evidence === 'gameplay-abstraction')).toBe(true)
    const hasMove = (id: string) => id.startsWith('beyond:') && moveById(id) !== null
    expect(moveset.moves.every((move) => move.cancelInto.every(hasMove))).toBe(true)
    expect(moveset.combos.flat().every(hasMove)).toBe(true)
    expect(JSON.stringify(moveset)).not.toMatch(/Dernière frontière|Final Frontier|40 PV|40 HP/)
  })
  it.each([
    { action: 'light', input: {}, slot: 'standingLight', y: 0 },
    { action: 'heavy', input: {}, slot: 'standingHeavy', y: 0 },
    { action: 'light', input: { down: true }, slot: 'lowLight', y: 0 },
    { action: 'heavy', input: { down: true }, slot: 'lowHeavy', y: 0 },
    { action: 'light', input: {}, slot: 'airLight', y: 5 },
    { action: 'heavy', input: {}, slot: 'airHeavy', y: 5 },
    { action: 'light', input: { right: true }, slot: 'forwardLight', y: 0 },
    { action: 'heavy', input: { right: true }, slot: 'forwardHeavy', y: 0 },
    { action: 'heavy', input: { left: true }, slot: 'backHeavy', y: 0 },
    { action: 'special', input: {}, slot: 'neutralSpecial', y: 0 },
    { action: 'special', input: { right: true }, slot: 'forwardSpecial', y: 0 },
    { action: 'special', input: { down: true }, slot: 'downSpecial', y: 0 },
    { action: 'special', input: { left: true }, slot: 'backSpecial', y: 0 },
    { action: 'throw', input: {}, slot: 'throw', y: 0 },
  ])(
    'retains a real physical hit for $slot, without presenting it as the curse',
    ({ action, input, slot, y }) => {
      const base = fight()
      const state = { ...base, player: { ...base.player, y } }
      const armed = performMove({
        state,
        side: 'player',
        action: action as MoveAction,
        input: { ...EMPTY_INPUT, ...input },
      })
      expect(armed.player.attack?.moveId).toBe(`beyond:${slot}`)
      expect(armed.player.attack?.hatsuSource).toBeNull()
      const hit = frames(armed, 50)
      expect(hit.opponent.health).toBeLessThan(base.opponent.health)
      expect(hit.opponent.hatsuEffects.witnessedHatsu).toBeNull()
    },
  )
  it.each([1, 40, 100])('never unlocks a finisher at %s HP', (health) => {
    const base = fight()
    const state = { ...base, player: { ...base.player, health } }
    expect(finisherReady(state, 'player')).toBe(false)
    expect(performMove({ state, side: 'player', action: 'finisher' })).toBe(state)
  })
  it('declares a real Hatsu independently of the martial hooks, without an activation or death effect', () => {
    const state = fight()
    const hatsu = hatsuFor('beyond')
    expect(hatsu.stealableOutsideDuel).toBe(BEYOND_CURSE)
    expect(outsideDuelAbility(BEYOND_CURSE.id)).toBe(BEYOND_CURSE)
    expect(stealableChainMove(state.player)).toBe(BEYOND_CURSE.id)
    expect(hatsuSourceFor(state.player)).toBeNull()
    expect(hatsu.onTrigger({ state, side: 'player', source: 'beyond' })).toBe(state)
    expect(
      hatsu.onImpact({
        state,
        side: 'player',
        defenderSide: 'opponent',
        source: 'beyond',
        blocked: false,
        concealed: false,
      }),
    ).toBe(state)
    expect(hatsu.onFrame(state)).toBe(state)
    expect(hatsu.onDeath).toBeUndefined()
  })
  it.each(['player', 'opponent'] as const)(
    'refuses a raw curse command or removed finisher for %s without a hit, aura payment or buffer',
    (side: FightSide) => {
      const state = side === 'player' ? fight() : fight('hisoka', 'beyond')
      for (const moveId of [BEYOND_CURSE.id, 'beyond:finisher'])
        for (const kind of ['special', 'heavy'] as const)
          expect(performAuraAttack({ state, side, moveId, kind, auraCharged: true })).toBe(state)
    },
  )
  it('refuses a copied curse page without blocking ordinary book management', () => {
    const base = fight('chrollo')
    const state = {
      ...base,
      player: {
        ...base.player,
        chrolloBook: createChrolloBook(['beyond', 'sun-and-moon', 'black-voice', 'order-stamp']),
      },
    }
    expect(performAttack(state, 'player', 'special')).toBe(state)
    expect(fightSpecialPresentation(state, 'fr')).toMatchObject({
      ready: false,
      hint: BEYOND_CURSE.reasonFr,
    })
    expect(fightSpecialPresentation(state, 'en').hint).toBe(BEYOND_CURSE.reasonEn)
    const bookmark = performAuraAttack({
      state,
      side: 'player',
      kind: 'special',
      moveId: CHROLLO_BOOKMARK,
      auraCharged: false,
    })
    expect(bookmark.player.chrolloBook).toMatchObject({ open: false, bookmark: 'beyond' })
    const settled = frames(bookmark, 20)
    expect(performAttack(settled, 'player', 'special')).toBe(settled)
    expect(fightSpecialPresentation(settled, 'fr').ready).toBe(false)
    expect(finisherReady(settled, 'player')).toBe(false)
  })
  it('lets Steal Chain retain the actual curse rather than one of Beyond’s physical blows', () => {
    const base = fight('kurapika', 'beyond')
    const state = frames(steal({ ...base, opponent: { ...base.opponent, aura: 10 } }), 90)
    expect(state.player.kurapika?.held).toMatchObject({
      source: 'beyond',
      moveId: BEYOND_CURSE.id,
      used: false,
    })
    const reset = recovered(state)
    const physical = performAttack(reset, 'opponent', 'special')
    expect(physical.opponent.attack?.moveId).toBe('beyond:neutralSpecial')
    expect(physical.opponent.attack?.hatsuSource).toBeNull()
    const emperor = toggleEmperorTime(reset, 'player')
    // Even a previously loaded curse cannot bypass the missing preparation.
    const loaded = {
      ...emperor,
      player: {
        ...emperor.player,
        kurapika: {
          ...emperor.player.kurapika!,
          held: { ...emperor.player.kurapika!.held!, loaded: true },
        },
      },
    }
    expect(dolphinCanUse(loaded, 'player')).toBe(false)
    expect(steal(loaded)).toBe(loaded)
  })
  it('labels L as a physical charge in both languages while explaining the missing sacrificial preparation', () => {
    const state = fight()
    expect(fightSpecialPresentation(state, 'fr')).toMatchObject({
      label: 'Charge physique',
      ready: true,
    })
    expect(fightSpecialPresentation(state, 'en')).toMatchObject({
      label: 'Physical charge',
      ready: true,
    })
    expect(BEYOND_CURSE.reasonFr).toMatch(/porteur marqué.*cible désignée.*mort du porteur/)
    expect(BEYOND_CURSE.reasonEn).toMatch(/marked vessel.*designated target.*vessel’s death/)
    const empty = { ...state, player: { ...state.player, aura: 0 } }
    expect(fightSpecialPresentation(empty, 'fr').ready).toBe(false)
    expect(performAttack(empty, 'player', 'light').player.attack?.kind).toBe('light')
  })
  it('keeps the low-health AI fighting physically and never responds to Beyond’s own death with the curse', () => {
    const base = fight('hisoka', 'beyond')
    const wounded = { ...base, opponent: { ...base.opponent, health: 1 } }
    const attacking = opponentAttack(wounded)
    expect(attacking.opponent.attack?.moveId).not.toBe('beyond:finisher')
    const dead = frames(performAttack(wounded, 'player', 'heavy'), 40)
    expect(dead.winner).toBe('player')
    expect(dead.player.health).toBe(base.player.health)
    expect(dead.catsName).toBeUndefined()
  })
})
