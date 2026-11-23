import type { FightInput, MoveAction } from './types'

export type CombatChordResult =
  | { kind: 'action'; action: MoveAction | 'ranged' }
  | { kind: 'burst' }
  | null

type OffensiveButton = 'light' | 'heavy' | 'special'

/**
 * Tracks held offensive keys per side so simultaneous presses resolve cleanly:
 * - Guard + Light + Heavy -> Burst
 * - Guard + Special -> ranged attack
 * - Light + Heavy -> Throw
 * - Heavy + Special -> Finisher
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
      if (held.has('light') && held.has('heavy')) {
        return input.guard ? { kind: 'burst' } : { kind: 'action', action: 'throw' }
      }
      if (input.guard && button === 'special') {
        return { kind: 'action', action: 'ranged' }
      }
      if (held.has('heavy') && held.has('special')) {
        return { kind: 'action', action: 'finisher' }
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
  if (newPair({ left: pad.light, right: pad.heavy, leftNew: lightNew, rightNew: heavyNew })) {
    return pad.guard ? { actions: [], burst: true } : { actions: ['throw'], burst: false }
  }
  if (pad.guard && specialNew) {
    return { actions: ['ranged'], burst: false }
  }
  if (newPair({
    left: pad.heavy,
    right: pad.special,
    leftNew: heavyNew,
    rightNew: specialNew,
  })) {
    return { actions: ['finisher'], burst: false }
  }
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
