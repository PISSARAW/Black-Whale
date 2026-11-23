import { canHear } from '../melodyRules'
import { musseCancelsIn } from '../musseWindowUpgrades'
import { enTargetInside } from '../nenPillars'
import { senseDeprived } from '../saiyuSenses'
import type { FightSide, FightState } from '../types'

export type AnalystSourceId = 'gyo' | 'en' | 'sonar' | 'musse' | 'furykov' | 'melody'

const SOURCE_LABELS: Record<AnalystSourceId, [string, string]> = {
  gyo: ['GYO · LECTURE', 'GYO · READ'],
  en: ['EN · CONTACT', 'EN · CONTACT'],
  sonar: ['SONAR · ACTIF', 'SONAR · ACTIVE'],
  musse: ['HIBOU · SUIVI', 'OWL · TRACKING'],
  furykov: ['ANALYSE · FURYKOV', 'ANALYSIS · FURYKOV'],
  melody: ['OUÏE · MELODY', 'HEARING · MELODY'],
}

export interface AnalystCue {
  id: AnalystSourceId
  label: string
}

/** Identifies the primary active Level 2 perception source lighting up the opponent dossier. */
export function activeAnalystCue(
  state: FightState,
  observerSide: FightSide,
  language: 'fr' | 'en',
): AnalystCue | null {
  const id = detectSource(state, observerSide)
  if (!id) return null
  return { id, label: SOURCE_LABELS[id][language === 'fr' ? 0 : 1] }
}

function detectSource(state: FightState, observerSide: FightSide): AnalystSourceId | null {
  const targetSide: FightSide = observerSide === 'player' ? 'opponent' : 'player'
  const observer = state[observerSide]
  const blinded = senseDeprived(observer, 'sight')

  if ((observer.nenOwner ?? observer.id) === 'melody' && canHear(observer)) return 'melody'
  if (blinded) return null
  if (observer.nen.gyo && !observer.gyoLow) return 'gyo'
  if (enTargetInside(state, observerSide)) return 'en'
  if (musseCancelsIn(state, targetSide)) return 'musse'
  return null
}
