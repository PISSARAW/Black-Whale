import type { ArcadeFighter, FighterId } from '../types'
export type EnEvidence =
  'observed-minimum' | 'documented-unmeasured' | 'catalogue-unmeasured' | 'not-documented'
export interface EnProfile {
  evidence: EnEvidence
  chapters: readonly number[]
  observedMinimumMetres?: number
  radiusUnits: number | null
  unstable: boolean
}
/** En-only duel calibration, not a claim about model scale or a canonical maximum. */
export const EN_UNITS_PER_METRE = 4
export const ARCADE_EN_RADIUS = 22
const unknown: EnProfile = {
  evidence: 'not-documented',
  chapters: [],
  radiusUnits: null,
  unstable: false,
}
const catalogue: EnProfile = {
  evidence: 'catalogue-unmeasured',
  chapters: [],
  radiusUnits: null,
  unstable: false,
}
const unqualified: readonly FighterId[] = [
  'hisoka',
  'benjamin',
  'tserriednich',
  'feitan',
  'saiyu',
  'theta',
  'biscuit',
  'franklin',
  'machi',
  'illumi',
  'kalluto',
  'bonolenov',
  'shizuku',
  'mizaistom',
  'leorio',
  'hanzo',
  'rihan',
  'zakuro',
  'melody',
  'basho',
  'camilla',
  'halkenburg',
  'gel',
  'lynch',
  'luini',
  'bill',
  'furykov',
  'cluck',
  'beyond',
  'longhi',
  'musse',
  'padaille',
  'sayird',
  'terebellum',
  'voconte',
  'yokotani',
]
/** No affinity, rank, Hatsu copy, body disguise or career level proves learned En. */
export const EN_PROFILES: Readonly<Partial<Record<FighterId, EnProfile>>> = {
  ...Object.fromEntries(unqualified.map((id) => [id, unknown])),
  kurapika: catalogue,
  chrollo: catalogue,
  hinrigh: {
    evidence: 'observed-minimum',
    chapters: [398],
    observedMinimumMetres: 5,
    radiusUnits: 5 * EN_UNITS_PER_METRE,
    unstable: false,
  },
  phinks: { evidence: 'documented-unmeasured', chapters: [400], radiusUnits: 12, unstable: true },
}
export function enProfile(fighter: Pick<ArcadeFighter, 'id' | 'nenOwner'>): EnProfile {
  return EN_PROFILES[fighter.nenOwner ?? fighter.id] ?? unknown
}
export function enRadius(fighter: ArcadeFighter): number | null {
  return enProfile(fighter).radiusUnits
}
