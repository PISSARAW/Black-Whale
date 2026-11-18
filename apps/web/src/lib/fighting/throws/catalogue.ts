import { KURAPIKA_THROWS } from './kurapika'
import { HISOKA_THROWS } from './hisoka'
import { CHROLLO_THROWS } from './chrollo'
import { BENJAMIN_THROWS } from './benjamin'
import { TSERRIEDNICH_THROWS } from './tserriednich'
import { FEITAN_THROWS } from './feitan'
import { SAIYU_THROWS } from './saiyu'
import { THETA_THROWS } from './theta'
import { BISCUIT_THROWS } from './biscuit'
import { PHINKS_THROWS } from './phinks'
import type { FighterId } from '../types'
import type { ThrowPerformanceId } from './types'

export const THROW_PERFORMANCES = [
  ...KURAPIKA_THROWS,
  ...HISOKA_THROWS,
  ...CHROLLO_THROWS,
  ...BENJAMIN_THROWS,
  ...TSERRIEDNICH_THROWS,
  ...FEITAN_THROWS,
  ...SAIYU_THROWS,
  ...THETA_THROWS,
  ...BISCUIT_THROWS,
  ...PHINKS_THROWS,
]
const pairs = {
  kurapika: KURAPIKA_THROWS,
  hisoka: HISOKA_THROWS,
  chrollo: CHROLLO_THROWS,
  benjamin: BENJAMIN_THROWS,
  tserriednich: TSERRIEDNICH_THROWS,
  feitan: FEITAN_THROWS,
  saiyu: SAIYU_THROWS,
  theta: THETA_THROWS,
  biscuit: BISCUIT_THROWS,
  phinks: PHINKS_THROWS,
}
export function throwPerformance(id?: ThrowPerformanceId) {
  return THROW_PERFORMANCES.find((entry) => entry.id === id)
}
export function throwPerformanceFor(id: FighterId, powered: boolean) {
  const pair = pairs[id as keyof typeof pairs]
  return pair?.[Number(powered)]
}
