export type GuardShape = 'high' | 'mid' | 'low' | 'extended'
export type CentreLine = 'upright' | 'forward' | 'back' | 'low'
export type StepLanguage = 'glide' | 'box' | 'creep' | 'march' | 'skip'
export type MotionTempo = 'measured' | 'staccato' | 'fluid' | 'explosive' | 'heavy'
export type RecoveryShape = 'crisp' | 'elastic' | 'deliberate'

/**
 * The animation contract for a fighter. Numeric values are intentionally
 * narrow multipliers: identity should alter timing and silhouette without
 * changing simulation, reach or frame data.
 */
export interface FighterMovementBible {
  guard: GuardShape
  centre: CentreLine
  step: StepLanguage
  tempo: MotionTempo
  recovery: RecoveryShape
  locomotion: number
  burst: number
  air: number
  commitment: number
  weight: number
  exaggeration: number
  freeHand: string
  secondary: string
}

type BibleNumbers = readonly [
  locomotion: number,
  burst: number,
  air: number,
  commitment: number,
  weight: number,
  exaggeration: number,
]

export function movement({
  guard,
  centre,
  step,
  tempo,
  recovery,
  numbers,
  freeHand,
  secondary,
}: {
  guard: GuardShape
  centre: CentreLine
  step: StepLanguage
  tempo: MotionTempo
  recovery: RecoveryShape
  numbers: BibleNumbers
  freeHand: string
  secondary: string
}): FighterMovementBible {
  const [locomotion, burst, air, commitment, weight, exaggeration] = numbers
  return {
    guard,
    centre,
    step,
    tempo,
    recovery,
    locomotion,
    burst,
    air,
    commitment,
    weight,
    exaggeration,
    freeHand,
    secondary,
  }
}
