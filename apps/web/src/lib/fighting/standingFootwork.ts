import type { StrikeShape } from './rosterChoreography'
import type { Foot } from './standingStrikeDirections'
import type { FighterId, MoveSlot } from './types'

type Footwork = readonly [
  shape: StrikeShape,
  support: Foot,
  chamberAt: number,
  pivot: number,
  compression: number,
  reachStep: number,
]

/** Neutral J and K. Angles, weight and travel are authored for each strike. */
const FOOTWORK: Partial<Record<FighterId, readonly [light: Footwork, heavy: Footwork]>> = {
  tserriednich: [
    ['thrust', 'rear', 0.42, -0.15, 0.09, 0.04],
    ['cross', 'lead', 0.72, 0.51, 0.39, 0.12],
  ],
  saiyu: [
    ['palm', 'lead', 0.53, -0.37, 0.27, 0.07],
    ['hammer', 'rear', 0.68, 0.32, 0.55, 0.14],
  ],
  theta: [
    ['jab', 'rear', 0.49, -0.12, 0.23, 0.06],
    ['thrust', 'lead', 0.59, 0.15, 0.32, 0.18],
  ],
  biscuit: [
    ['palm', 'rear', 0.38, -0.23, 0.25, 0.03],
    ['uppercut', 'lead', 0.74, 0.54, 0.63, 0.12],
  ],
  franklin: [
    ['cross', 'rear', 0.54, 0.26, 0.26, 0.05],
    ['hammer', 'lead', 0.78, 0.22, 0.73, 0.09],
  ],
  machi: [
    ['thrust', 'rear', 0.34, -0.25, 0.15, -0.025],
    ['hook', 'lead', 0.64, -0.62, 0.32, 0.11],
  ],
  illumi: [
    ['thrust', 'rear', 0.31, -0.08, 0.08, 0.085],
    ['palm', 'lead', 0.63, 0.14, 0.22, 0.16],
  ],
  leorio: [
    ['jab', 'lead', 0.35, -0.2, 0.38, 0.09],
    ['uppercut', 'rear', 0.7, 0.71, 0.65, 0.06],
  ],
  zakuro: [
    ['backhand', 'lead', 0.5, -0.44, 0.3, 0.08],
    ['kick', 'rear', 0.69, -0.51, 0.34, 0.04],
  ],
  melody: [
    ['palm', 'rear', 0.61, -0.1, 0.14, 0.015],
    ['hook', 'lead', 0.76, -0.39, 0.29, 0.08],
  ],
  halkenburg: [
    ['palm', 'lead', 0.62, -0.27, 0.23, 0.04],
    ['cross', 'rear', 0.79, 0.31, 0.48, 0.09],
  ],
  gel: [
    ['jab', 'rear', 0.45, -0.31, 0.19, 0.07],
    ['slash', 'lead', 0.71, -0.71, 0.37, 0.12],
  ],
  luini: [
    ['thrust', 'rear', 0.38, -0.44, 0.15, 0.115],
    ['slash', 'lead', 0.55, -0.57, 0.22, 0.19],
  ],
  bill: [
    ['palm', 'lead', 0.46, -0.18, 0.31, 0.05],
    ['charge', 'lead', 0.72, 0.47, 0.53, 0.2],
  ],
  yokotani: [
    ['palm', 'rear', 0.57, -0.29, 0.42, 0.06],
    ['charge', 'lead', 0.76, 0.24, 0.56, 0.17],
  ],
}

export function standingFootwork(id: FighterId, slot: MoveSlot): Footwork | undefined {
  if (slot !== 'standingLight' && slot !== 'standingHeavy') return undefined
  return FOOTWORK[id]?.[slot === 'standingLight' ? 0 : 1]
}
