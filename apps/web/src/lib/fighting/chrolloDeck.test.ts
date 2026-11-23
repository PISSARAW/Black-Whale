import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performMove, tickFight } from './engine'
import {
  CHROLLO_DECK_PRESETS,
  addChrolloPage,
  createChrolloBook,
  isSlotRevealed,
  selectChrolloSlot,
  toggleChrolloBookmark,
} from './chrolloBook'
import { canStartFighterAttack } from './fighterAttacks'
import { applyAuraContext, nenAttackFactor } from './nen'
import { EMPTY_INPUT, type FightState } from './types'

const DT = 1 / 60

function chrolloDuel(): FightState {
  const base = beginFight(createFight('chrollo', 'hisoka'))
  return { ...base, mode: 'versus-local' }
}

describe('Chrollo 4+1 prepared deck and ergonomic selection', () => {
  it('initializes with 4 prepared pages from canonical presets and an empty 5th stolen slot', () => {
    const heavens = createChrolloBook('heavens-arena')
    expect(heavens.deck).toEqual(CHROLLO_DECK_PRESETS['heavens-arena'])
    expect(heavens.pages).toHaveLength(4)
    expect(heavens.stolenPage).toBeNull()
    expect(heavens.openSlot).toBe(0)
    expect(heavens.bookmarkSlot).toBeNull()
    expect(heavens.revealedSlots).toEqual([])

    const yorknew = createChrolloBook('yorknew')
    expect(yorknew.deck).toEqual(CHROLLO_DECK_PRESETS.yorknew)
    expect(yorknew.pages[0]).toBe('indoor-fish')
  })

  it('selects slots 0..3 directly via face buttons while holding 4S (Feuilletage)', () => {
    let state = chrolloDuel()
    // 4S enters flipping posture (and cycles 0 -> 1 on initial press)
    state = performMove({
      state,
      side: 'player',
      action: 'special',
      input: { ...EMPTY_INPUT, left: true, hatsu: true },
    })
    expect(state.player.chrolloBook?.isFlipping).toBe(true)

    // 4S + Light -> Slot 0
    const s0 = performMove({
      state,
      side: 'player',
      action: 'light',
      input: { ...EMPTY_INPUT, hatsu: true },
    })
    expect(s0.player.chrolloBook?.openSlot).toBe(0)
    expect(s0.player.chrolloBook?.isFlipping).toBe(false)

    // 4S + Heavy -> Slot 1
    const s1 = performMove({
      state,
      side: 'player',
      action: 'heavy',
      input: { ...EMPTY_INPUT, hatsu: true },
    })
    expect(s1.player.chrolloBook?.openSlot).toBe(1)

    // 4S + Kameo -> Slot 2
    const s2 = tickFight(
      state,
      { ...EMPTY_INPUT, hatsu: true, kameo: true },
      { dt: DT, opponentInput: EMPTY_INPUT },
    )
    expect(s2.player.chrolloBook?.openSlot).toBe(2)

    // 4S + Context -> Slot 3
    const s3 = tickFight(
      state,
      { ...EMPTY_INPUT, hatsu: true, context: true },
      { dt: DT, opponentInput: EMPTY_INPUT },
    )
    expect(s3.player.chrolloBook?.openSlot).toBe(3)
  })

  it('recycles 6S to immediately open the 5th stolen slot once filled', () => {
    let state = chrolloDuel()
    const withStolen = addChrolloPage(state.player.chrolloBook!, 'hisoka')
    expect(withStolen.stolenPage).toBe('hisoka')
    expect(withStolen.openSlot).toBe('stolen')

    // Turn back to slot 0, then press 6S -> jumps straight back to 'stolen'
    state = {
      ...state,
      player: { ...state.player, chrolloBook: selectChrolloSlot(withStolen, 0) },
    }
    expect(state.player.chrolloBook?.openSlot).toBe(0)
    const recycled = performMove({
      state,
      side: 'player',
      action: 'special',
      input: { ...EMPTY_INPUT, right: true },
    })
    expect(recycled.player.chrolloBook?.openSlot).toBe('stolen')
    expect(recycled.player.chrolloBook?.open).toBe(true)
  })
})

describe('Chrollo open-book right hand cost, Double Face and Gyo intel', () => {
  it('blocks Throw and weakens hand Heavy while open, then restores both hands on 2S Double Face', () => {
    const state = chrolloDuel()
    const openChrollo = state.player
    expect(openChrollo.chrolloBook?.open).toBe(true)
    expect(canStartFighterAttack(openChrollo, 'heavy', 'chrollo:throw')).toBe(false)

    const closedBook = toggleChrolloBookmark(openChrollo.chrolloBook!)
    expect(closedBook.open).toBe(false)
    expect(closedBook.bookmarkSlot).toBe(0)
    const closedChrollo = { ...openChrollo, chrolloBook: closedBook }
    expect(canStartFighterAttack(closedChrollo, 'heavy', 'chrollo:throw')).toBe(true)

    // Hand heavy attack power is penalized while book is open (forwardHeavy uses hands)
    const openHeavy = {
      ...openChrollo,
      attack: {
        kind: 'heavy' as const,
        variant: 'forward' as const,
        moveId: 'chrollo:forwardHeavy',
        frame: 1,
        impacted: false,
        auraCharged: false,
        concealed: false,
        hatsuSource: null,
        projectileSpawned: false,
        confirmedHit: false,
      },
    }
    const closedHeavy = { ...openHeavy, chrolloBook: closedBook }
    expect(nenAttackFactor(openHeavy, 'heavy')).toBeLessThan(nenAttackFactor(closedHeavy, 'heavy'))

    // Offensive Ko on hands is refused while book is open
    const chargingHand = { ...openHeavy, attack: { ...openHeavy.attack, auraCharged: true } }
    const releasedOpen = applyAuraContext(chargingHand, EMPTY_INPUT)
    expect(releasedOpen.nen.ko).toBeNull()
  })

  it('reveals open pages to the opponent only when used or read with full ocular Gyo', () => {
    const start = chrolloDuel()
    expect(isSlotRevealed(start.player.chrolloBook!, 0)).toBe(false)

    // Low Gyo does not reveal the page
    const lowGyo = tickFight(start, EMPTY_INPUT, {
      dt: DT,
      opponentInput: { ...EMPTY_INPUT, gyo: true, down: true },
    })
    expect(isSlotRevealed(lowGyo.player.chrolloBook!, 0)).toBe(false)

    // Full ocular Gyo (Aura + Up) reveals the currently open slot 0
    const fullGyo = tickFight(start, EMPTY_INPUT, {
      dt: DT,
      opponentInput: { ...EMPTY_INPUT, aura: true, jump: true },
    })
    expect(isSlotRevealed(fullGyo.player.chrolloBook!, 0)).toBe(true)
    expect(isSlotRevealed(fullGyo.player.chrolloBook!, 1)).toBe(false)
  })
})
