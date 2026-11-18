import { INTRO_PERFORMANCES_ONE } from './introPerformancesOne'
import { INTRO_PERFORMANCES_TWO } from './introPerformancesTwo'
import { INTRO_PERFORMANCES_THREE } from './introPerformancesThree'
import { INTRO_PERFORMANCES_FOUR } from './introPerformancesFour'
import type { IntroPerformance } from './introPerformanceTypes'
import type { FighterId } from '../types'

export const INTRO_PERFORMANCES = {
  ...INTRO_PERFORMANCES_ONE,
  ...INTRO_PERFORMANCES_TWO,
  ...INTRO_PERFORMANCES_THREE,
  ...INTRO_PERFORMANCES_FOUR,
} satisfies Partial<Record<FighterId, IntroPerformance>>

export function introPerformance(id: FighterId): IntroPerformance | undefined {
  return (INTRO_PERFORMANCES as Partial<Record<FighterId, IntroPerformance>>)[id]
}
