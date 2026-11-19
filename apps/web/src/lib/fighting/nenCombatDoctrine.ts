import { nenMasteryProfile } from './nenMastery'
import { fightingStyle } from './fightStyles'
import { voluntaryNenAvailable } from './nenAccess'
import type { ArcadeFighter, FighterId } from './types'

type Range = readonly [number, number]
const TYPE_RANGES: Readonly<Record<string, Range>> = {
  enhancer: [4, 8],
  emitter: [18, 28],
  transmuter: [6, 12],
  conjurer: [9, 16],
  manipulator: [10, 18],
}
/** Technique-specific approaches override the category tendency, never the innate affinity. */
const PERSONAL_RANGES: Readonly<Partial<Record<FighterId, Range>>> = {
  franklin: [22, 34],
  leorio: [9, 18],
  melody: [18, 26],
  luini: [8, 16],
  voconte: [9, 18],
  sayird: [10, 18],
  phinks: [4, 8],
  bill: [7, 11],
  biscuit: [4, 8],
  feitan: [5, 9],
  hanzo: [6, 11],
  machi: [8, 14],
  hisoka: [7, 12],
  illumi: [6, 12],
  kalluto: [14, 24],
  shizuku: [6, 10],
  hinrigh: [8, 14],
  padaille: [4, 9],
  bonolenov: [12, 20],
}

export function nenCombatDoctrine(fighter: ArcadeFighter) {
  const profile = nenMasteryProfile(fighter.nenOwner ?? fighter.id)
  const style = fightingStyle(fighter.id)
  const preferred =
    PERSONAL_RANGES[fighter.id] ?? TYPE_RANGES[profile.affinity] ?? style.preferredRange
  const ranged = profile.affinity === 'emitter'
  const available = voluntaryNenAvailable(fighter, { requireHatsu: false, requireReserve: true })
  const range: Range = ranged && (!available || fighter.aura < 16) ? [5, 9] : preferred
  return { affinity: profile.affinity, range, retreatBelowHealth: style.retreatBelowHealth }
}

/** Walk toward a usable range, retreat if crowded; depleted emitters can fall back to physical combat. */
export function nenSpacingDirection(
  fighter: ArcadeFighter,
  situation: { gap: number; health: number },
): -1 | 0 | 1 {
  const doctrine = nenCombatDoctrine(fighter)
  const [near, far] = doctrine.range
  if (situation.gap < near) return -1
  if (situation.health <= doctrine.retreatBelowHealth && situation.gap < far) return -1
  return situation.gap > far ? 1 : 0
}
