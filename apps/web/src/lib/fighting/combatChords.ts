import type { FightInput, MoveAction } from './types'

export type CombatChordResult =
  | { kind: 'action'; action: MoveAction }
  | { kind: 'burst' }
  | null

type OffensiveButton = 'light' | 'heavy' | 'special'

/**
 * Tracks held offensive keys per side so simultaneous presses resolve cleanly:
 * - Guard + Light + Heavy -> Burst
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
  actions: MoveAction[]
  burst: boolean
} {
  const lightNew = pad.light && !pad.prevLight
  const heavyNew = pad.heavy && !pad.prevHeavy
  const specialNew = pad.special && !pad.prevSpecial
  if (pad.light && pad.heavy && (lightNew || heavyNew)) {
    return pad.guard ? { actions: [], burst: true } : { actions: ['throw'], burst: false }
  }
  if (pad.heavy && pad.special && (heavyNew || specialNew)) {
    return { actions: ['finisher'], burst: false }
  }
  const actions: MoveAction[] = []
  if (lightNew) actions.push('light')
  if (heavyNew) actions.push('heavy')
  if (specialNew) actions.push('special')
  return { actions, burst: false }
}
