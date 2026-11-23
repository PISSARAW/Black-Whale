import { createFightingNen } from './nen'
import { gyoSight } from './nenPerception'
import { musseCancelsIn } from './musseWindowUpgrades'
import { enTargetInside } from './nenPillars'
import { kallutoDollRevealsOpponent } from './shizukuHanzoKallutoUpgrades'
import type { ArcadeFighter, FightSide, FightState } from './types'

/** Private snapshots use a sentinel rather than leaking the authoritative reserve. */
export const CONCEALED_AURA = -1

const PREPARATION_EFFECTS = [
  'cohortWillFrames',
  'arrowNocked',
  'cyclotronTurns',
  'coinCharges',
  'synthesisFrames',
  'eyeWogFrames',
] as const

export function nenInformationConcealed(source: ArcadeFighter, observer: ArcadeFighter): boolean {
  return source.nen.in && !gyoSight(observer)
}

/**
 * Removes information, never mechanics. The authoritative fighter keeps their exact aura,
 * Ryu transfer and fulfilled conditions; only the opponent-facing clone is altered.
 */
export function concealNenInformation(enemy: ArcadeFighter, observer: ArcadeFighter): void {
  if (!nenInformationConcealed(enemy, observer)) return
  enemy.aura = CONCEALED_AURA
  enemy.nen = createFightingNen()
  enemy.gyoFocus = undefined
  enemy.gyoLow = undefined
  enemy.defensiveKo = undefined
  enemy.nenTransfer = undefined
  enemy.lastAuraShares = undefined
  enemy.ryuWindow = 0
  enemy.hatsuChargeFrames = 0
  const hatsuEffects = { ...enemy.hatsuEffects }
  for (const key of PREPARATION_EFFECTS) hatsuEffects[key] = 0
  enemy.hatsuEffects = hatsuEffects
}

export function auraInformationKnown(
  state: FightState,
  observerSide: FightSide,
  sourceSide: FightSide,
): boolean {
  if (observerSide === sourceSide) return true
  const source = state[sourceSide]
  if (
    (source.sonarRevealFrames ?? 0) > 0 ||
    (source.zakuroRevealedFrames ?? 0) > 0 ||
    musseCancelsIn(state, sourceSide) ||
    kallutoDollRevealsOpponent(state, observerSide) ||
    enTargetInside(state, observerSide)
  )
    return true
  return source.aura !== CONCEALED_AURA && !nenInformationConcealed(source, state[observerSide])
}
