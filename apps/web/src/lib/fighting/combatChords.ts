import type { FightInput, MoveAction } from './types'

export type CombatChordResult =
  { kind: 'action'; action: MoveAction | 'ranged' } | { kind: 'burst' } | null

type OffensiveButton = 'light' | 'heavy' | 'special'

/**
 * Tracks held offensive keys per side so simultaneous presses resolve cleanly:
 * - Guard + Light + Heavy -> Burst
 * - Heavy + Special -> Finisher
 * - Guard + Special -> ranged attack
 * - Light + Heavy -> Throw
 */
export function createCombatChordTracker() {
  const held = new Set<OffensiveButton>()
  return {
    clear() {
      held.clear()
    },
    release(button: OffensiveButton) {
      held.delete(button)
    },
    press(button: OffensiveButton, input: Pick<FightInput, 'guard'>): CombatChordResult {
      held.add(button)
      if (input.guard && held.has('light') && held.has('heavy')) {
        return { kind: 'burst' }
      }
      if (held.has('heavy') && held.has('special')) {
        return { kind: 'action', action: 'finisher' }
      }
      if (input.guard && button === 'special') {
        return { kind: 'action', action: 'ranged' }
      }
      if (held.has('light') && held.has('heavy')) {
        return { kind: 'action', action: 'throw' }
      }
      return { kind: 'action', action: button }
    },
  }
}

export interface PadChordState {
  light: boolean
  heavy: boolean
  special: boolean
  guard: boolean
  prevLight: boolean
  prevHeavy: boolean
  prevSpecial: boolean
}

/** Resolves simultaneous face-button chords on a standard gamepad. */
export function resolvePadChords(pad: PadChordState): {
  actions: Array<MoveAction | 'ranged'>
  burst: boolean
} {
  const lightNew = newlyPressed(pad.light, pad.prevLight)
  const heavyNew = newlyPressed(pad.heavy, pad.prevHeavy)
  const specialNew = newlyPressed(pad.special, pad.prevSpecial)
  const lightHeavy = newPair({
    left: pad.light,
    right: pad.heavy,
    leftNew: lightNew,
    rightNew: heavyNew,
  })
  if (pad.guard && lightHeavy) {
    return { actions: [], burst: true }
  }
  if (
    newPair({
      left: pad.heavy,
      right: pad.special,
      leftNew: heavyNew,
      rightNew: specialNew,
    })
  ) {
    return { actions: ['finisher'], burst: false }
  }
  if (pad.guard && specialNew) {
    return { actions: ['ranged'], burst: false }
  }
  if (lightHeavy) return { actions: ['throw'], burst: false }
  return { actions: individualActions(lightNew, heavyNew, specialNew), burst: false }
}

function newlyPressed(current: boolean, previous: boolean): boolean {
  return current && !previous
}

function newPair(pair: {
  left: boolean
  right: boolean
  leftNew: boolean
  rightNew: boolean
}): boolean {
  return pair.left && pair.right && (pair.leftNew || pair.rightNew)
}

function individualActions(light: boolean, heavy: boolean, special: boolean): MoveAction[] {
  const actions: MoveAction[] = []
  if (light) actions.push('light')
  if (heavy) actions.push('heavy')
  if (special) actions.push('special')
  return actions
}
