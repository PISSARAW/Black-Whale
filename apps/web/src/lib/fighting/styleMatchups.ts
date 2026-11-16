import { entry, type StyleMatchup } from './styleMatchupTypes'
import { FIRST_STYLE_MATCHUPS } from './styleMatchupsFirst'
import { SECOND_STYLE_MATCHUPS } from './styleMatchupsSecond'
import type { FighterId } from './types'
export type { StyleRole, StyleMatchup } from './styleMatchupTypes'
export const STYLE_MATCHUPS = { ...FIRST_STYLE_MATCHUPS, ...SECOND_STYLE_MATCHUPS }
const FALLBACK = entry(
  'control',
  ['Gérer la distance et confirmer les touches.', 'Manage spacing and confirm hits.'],
  ['Faire manquer puis punir la récupération.', 'Bait whiffs, then punish recovery.'],
)
export const styleMatchup = (id: FighterId): StyleMatchup => STYLE_MATCHUPS[id] ?? FALLBACK
