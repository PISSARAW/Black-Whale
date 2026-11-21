import { ACCEL_HEAT_MAX } from './accelCancel'
import { cancelGrammarFor } from './duelComboProfiles'
import type { ArcadeFighter } from './types'

export type AccelHeatPhase = 'ready' | 'warm' | 'overheated'

export interface AccelHeatView {
  /** 0–100, share of the gauge filled. */
  percent: number
  phase: AccelHeatPhase
  label: string
}

/** Relance heat as the HUD shows it; null for fighters without the relance. */
export function accelHeatView(
  fighter: ArcadeFighter,
  language: 'fr' | 'en',
): AccelHeatView | null {
  if (!cancelGrammarFor(fighter.id)?.accel) return null
  const heat = fighter.accelHeat
  const percent = Math.round(((heat?.heat ?? 0) / ACCEL_HEAT_MAX) * 100)
  const phase: AccelHeatPhase = heat?.overheated ? 'overheated' : heat ? 'warm' : 'ready'
  return { percent, phase, label: heatLabel(phase, language) }
}

function heatLabel(phase: AccelHeatPhase, language: 'fr' | 'en'): string {
  if (phase === 'overheated') return language === 'fr' ? 'REN · SURCHAUFFE' : 'REN · OVERHEAT'
  if (phase === 'warm') return language === 'fr' ? 'REN · CHAUD' : 'REN · WARM'
  return language === 'fr' ? 'REN · RELANCE PRÊTE' : 'REN · RELAUNCH READY'
}
