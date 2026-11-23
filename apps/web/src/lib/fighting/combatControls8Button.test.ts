import { describe, expect, it, vi } from 'vitest'
import { createFightState } from './fightState'
import { performMove } from './engine'
import { applyAuraContext, EN_HOLD_FRAMES } from './nen'
import { resolveContextInput } from './contextInput'
import { sampleGamepad, type FightPad } from './fightGamepad'
import { createCombatChordTracker } from './combatChords'
import { dispatchPlayerAttackKey, resetKeyboardChords } from '../../routes/fighting/fightingKeyboard'
import { EMPTY_INPUT } from './types'

function pad(buttons: number[] = []): FightPad {
  return {
    index: 0,
    id: 'Pad 0',
    connected: true,
    mapping: 'standard',
    axes: [0, 0],
    buttons: Array.from({ length: 17 }, (_, button) => ({
      pressed: buttons.includes(button),
      value: Number(buttons.includes(button)),
    })),
  }
}

describe('8-button combat layout and chords', () => {
  it('maps gamepad A+B to Throw, B+X to Finisher, LB+A+B to Burst, Y to Kameo, LT to Burst, RT to Context', () => {
    expect(sampleGamepad(pad([0, 1]), pad()).actions).toEqual(['throw'])
    expect(sampleGamepad(pad([1, 2]), pad()).actions).toEqual(['finisher'])
    const chordBurst = sampleGamepad(pad([4, 0, 1]), pad([4]))
    expect(chordBurst.actions).toEqual([])
    expect(chordBurst.input.burst).toBe(true)

    const dedicated = sampleGamepad(pad([3, 6, 7]), pad())
    expect(dedicated.input.kameo).toBe(true)
    expect(dedicated.input.burst).toBe(true)
    expect(dedicated.input.context).toBe(true)
  })

  it('fires Hatsu on press and swears On immediately when Aura is held', () => {
    resetKeyboardChords()
    const control = vi.fn()
    const onMove = vi.fn()
    const event = { key: 'l', repeat: false, preventDefault: vi.fn() } as unknown as KeyboardEvent
    dispatchPlayerAttackKey(event, true, { input: EMPTY_INPUT, control, onMove })
    expect(control).toHaveBeenCalledWith('hatsu', true)
    expect(onMove).toHaveBeenCalledWith('special')
    dispatchPlayerAttackKey(event, false, { input: EMPTY_INPUT, control, onMove })
    expect(onMove).toHaveBeenCalledTimes(1)

    const state = createFightState('kurapika', 'hisoka')
    const ready = {
      ...state,
      phase: 'fighting' as const,
      player: { ...state.player, on: { grudge: 80, sealFrames: 0 } },
    }
    const next = performMove({
      state: ready,
      side: 'player',
      action: 'special',
      input: { ...EMPTY_INPUT, aura: true, hatsu: true },
    })
    expect(next.player.nen.on).toBe(true)
    expect(next.player.attack).toBeNull()
  })

  it('resolves keyboard offensive chords (L+H = Throw, H+S = Finisher, Guard+L+H = Burst)', () => {
    const tracker = createCombatChordTracker()
    expect(tracker.press('light', { guard: false })).toEqual({ kind: 'action', action: 'light' })
    expect(tracker.press('heavy', { guard: false })).toEqual({ kind: 'action', action: 'throw' })
    tracker.release('light')
    expect(tracker.press('special', { guard: false })).toEqual({ kind: 'action', action: 'finisher' })
    tracker.clear()
    tracker.press('light', { guard: true })
    expect(tracker.press('heavy', { guard: true })).toEqual({ kind: 'burst' })
  })
})

describe('compressed directional Nen and automatic Shu', () => {
  it('uses Aura + Guard + Direction for defensive Ko while keeping Aura + Guard neutral as Ken', () => {
    const state = createFightState('kurapika', 'hisoka')
    const ken = applyAuraContext(state.player, { ...EMPTY_INPUT, aura: true, guard: true })
    expect(ken.nen.ken).toBe(true)
    expect(ken.nen.ko).toBeNull()

    const headKo = applyAuraContext(state.player, {
      ...EMPTY_INPUT,
      aura: true,
      guard: true,
      jump: true,
    })
    expect(headKo.nen.ko).toBe('head')

    const feetKo = applyAuraContext(state.player, {
      ...EMPTY_INPUT,
      aura: true,
      guard: true,
      down: true,
    })
    expect(feetKo.nen.ko).toBe('feet')

    const handsKo = applyAuraContext(state.player, {
      ...EMPTY_INPUT,
      aura: true,
      guard: true,
      right: true,
    })
    expect(handsKo.nen.ko).toBe('hands')
  })

  it('maps Aura + Back to In, Aura + Down instant to Zetsu and held to En, and auto-enables Shu in Ren', () => {
    const state = createFightState('hinrigh', 'hisoka')
    const withIn = applyAuraContext(state.player, { ...EMPTY_INPUT, aura: true, left: true })
    expect(withIn.nen.in).toBe(true)

    const withShu = applyAuraContext(state.opponent, { ...EMPTY_INPUT, aura: true })
    expect(withShu.nen.mode).toBe('ren')
    expect(withShu.nen.shu).toContain('cards')

    let fighter = state.player
    const instant = applyAuraContext(fighter, { ...EMPTY_INPUT, aura: true, down: true })
    expect(instant.nen.mode).toBe('zetsu')
    expect(instant.nen.en).toBeNull()

    for (let frame = 0; frame < EN_HOLD_FRAMES; frame++) {
      fighter = applyAuraContext(fighter, { ...EMPTY_INPUT, aura: true, down: true })
    }
    expect(fighter.nen.en).not.toBeNull()
  })
})

describe('unified Context button priority', () => {
  it('resolves wounds > sound threat > arena > call', () => {
    const base = createFightState('kurapika', 'hisoka')
    const ctx = { ...EMPTY_INPUT, context: true }

    const wounded = { ...base, player: { ...base.player, openWounds: 1 } }
    expect(resolveContextInput(wounded, 'player', ctx).plugWounds).toBe(true)

    const acoustic: typeof base = {
      ...base,
      opponent: {
        ...base.opponent,
        melodyPerformance: {
          piece: 'lullaby',
          startupFrames: 0,
          playingFrames: 10,
          originX: base.opponent.x,
          moveId: 'melody:neutralSpecial',
        },
      },
    }
    expect(resolveContextInput(acoustic, 'player', ctx).coverEars).toBe(true)

    expect(resolveContextInput(base, 'player', ctx).call).toBe(true)
  })
})
