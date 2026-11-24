import { describe, expect, it, vi } from 'vitest'
import { createFightState } from './fightState'
import { performMove, tickFight } from './engine'
import { advanceNen, applyAuraContext } from './nen'
import { resolveContextInput } from './contextInput'
import { sampleGamepad, type FightPad } from './fightGamepad'
import { createCombatChordTracker } from './combatChords'
import { createKeyboardMapper, defaultBindings } from './fightInputBindings'
import {
  dispatchPlayerAttackKey,
  resetKeyboardChords,
} from '../../routes/fighting/fightingKeyboard'
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
  it('maps gamepad A+B to Throw, LB+X to a projectile, B+X to Finisher, LB+A+B to Burst, Y to Kameo, LT to Burst, RT to Context', () => {
    expect(sampleGamepad(pad([0, 1]), pad()).actions).toEqual(['throw'])
    const projectile = sampleGamepad(pad([4, 2]), pad([4]))
    expect(projectile.actions).toEqual(['ranged'])
    expect(projectile.input.hatsu).toBe(false)
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

  it('fires the ranged action from Guard + Hatsu without starting a Hatsu charge', () => {
    resetKeyboardChords()
    const control = vi.fn()
    const onMove = vi.fn()
    const event = { key: 'l', repeat: false, preventDefault: vi.fn() } as unknown as KeyboardEvent
    dispatchPlayerAttackKey(event, true, {
      input: { ...EMPTY_INPUT, guard: true },
      control,
      onMove,
    })
    expect(onMove).toHaveBeenCalledWith('ranged')
    expect(control).not.toHaveBeenCalledWith('hatsu', true)
    dispatchPlayerAttackKey(event, false, {
      input: { ...EMPTY_INPUT, guard: true },
      control,
      onMove,
    })
    expect(control).toHaveBeenCalledWith('hatsu', false)
  })

  it('resolves keyboard offensive chords (L+H = Throw, H+S = Finisher, Guard+L+H = Burst)', () => {
    const tracker = createCombatChordTracker()
    expect(tracker.press('light', { guard: false })).toEqual({ kind: 'action', action: 'light' })
    expect(tracker.press('heavy', { guard: false })).toEqual({ kind: 'action', action: 'throw' })
    tracker.release('light')
    expect(tracker.press('special', { guard: false })).toEqual({
      kind: 'action',
      action: 'finisher',
    })
    tracker.clear()
    expect(tracker.press('special', { guard: true })).toEqual({
      kind: 'action',
      action: 'ranged',
    })
    tracker.clear()
    tracker.press('light', { guard: true })
    expect(tracker.press('heavy', { guard: true })).toEqual({ kind: 'burst' })
  })

  it('keeps Finisher above projectile and Throw when three offensive buttons overlap', () => {
    const guarded = createCombatChordTracker()
    guarded.press('heavy', { guard: true })
    expect(guarded.press('special', { guard: true })).toEqual({
      kind: 'action',
      action: 'finisher',
    })

    const unguarded = createCombatChordTracker()
    unguarded.press('light', { guard: false })
    unguarded.press('heavy', { guard: false })
    expect(unguarded.press('special', { guard: false })).toEqual({
      kind: 'action',
      action: 'finisher',
    })

    expect(sampleGamepad(pad([4, 1, 2]), pad([4])).actions).toEqual(['finisher'])
    expect(sampleGamepad(pad([0, 1, 2]), pad()).actions).toEqual(['finisher'])
  })

  it('allows 3-frame chord lenience (plinking L -> Throw within startup) and avoids macOS Alt dead keys', () => {
    const keys = defaultBindings()
    expect(keys.opponentAura).toBe('r')
    const mapper = createKeyboardMapper()
    expect(mapper.key({ key: 'Dead', code: 'KeyN', altKey: true }, true, keys)).toBe(
      'direct:playerBurst',
    )
    expect(mapper.key({ key: '≤', code: 'Comma', altKey: true }, true, keys)).toBeNull()

    const start = { ...createFightState('kurapika', 'hisoka'), phase: 'fighting' as const }
    const withLight = performMove({
      state: start,
      side: 'player',
      action: 'light',
      input: EMPTY_INPUT,
    })
    expect(withLight.player.attack?.kind).toBe('light')
    const frame2 = tickFight(tickFight(withLight, EMPTY_INPUT, { dt: 1 / 60 }), EMPTY_INPUT, {
      dt: 1 / 60,
    })
    const plinked = performMove({
      state: frame2,
      side: 'player',
      action: 'throw',
      input: EMPTY_INPUT,
    })
    expect(plinked.player.attack?.variant).toBe('throw')
  })
})

describe('compressed directional Nen and automatic Shu', () => {
  it('uses Aura + Guard + Up/Forward/Down for defensive Ko while keeping Neutral and Back as Ken', () => {
    const state = createFightState('kurapika', 'hisoka')
    const ken = applyAuraContext(state.player, { ...EMPTY_INPUT, aura: true, guard: true })
    expect(ken.nen.ken).toBe(true)
    expect(ken.nen.ko).toBeNull()

    const backKen = applyAuraContext(state.player, {
      ...EMPTY_INPUT,
      aura: true,
      guard: true,
      left: true,
    })
    expect(backKen.nen.ken).toBe(true)
    expect(backKen.nen.ko).toBeNull()
    expect(backKen.aura).toBe(state.player.aura)

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

  it('maps Aura + Back to In, keeps Aura + Down in Zetsu, and activates En only from its own input', () => {
    const state = createFightState('hinrigh', 'hisoka')
    const withIn = applyAuraContext(state.player, { ...EMPTY_INPUT, aura: true, left: true })
    expect(withIn.nen.in).toBe(true)

    const withShu = applyAuraContext(state.opponent, { ...EMPTY_INPUT, aura: true })
    expect(withShu.nen.mode).toBe('ren')
    expect(withShu.nen.shu).toContain('cards')

    let fighter = { ...state.player, aura: 50 }
    const instant = applyAuraContext(fighter, { ...EMPTY_INPUT, aura: true, down: true })
    expect(instant.nen.mode).toBe('zetsu')
    expect(instant.nen.en).toBeNull()

    for (let frame = 0; frame < 60; frame++) {
      fighter = advanceNen(
        applyAuraContext(fighter, { ...EMPTY_INPUT, aura: true, down: true }),
        1 / 60,
      )
    }
    expect(fighter.nen.mode).toBe('zetsu')
    expect(fighter.nen.en).toBeNull()
    expect(fighter.aura).toBeCloseTo(60)

    const en = applyAuraContext(state.player, { ...EMPTY_INPUT, en: true })
    expect(en.nen.mode).toBe('ren')
    expect(en.nen.en).not.toBeNull()
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
