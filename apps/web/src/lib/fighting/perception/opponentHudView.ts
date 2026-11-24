import { canHear } from '../melodyRules'
import { musseCancelsIn } from '../musseWindowUpgrades'
import { CONCEALED_AURA, nenInformationConcealed } from '../nenInformationWar'
import { enTargetInside } from '../nenPillars'
import { senseDeprived } from '../saiyuSenses'
import { textureSurpriseView } from '../textureSurpriseMask'
import type { ArcadeFighter, FightSide, FightState } from '../types'
import type { FightHudMode } from './hudMode'
import { createOpponentIntel, type ObservedCondition, type OpponentIntel } from './opponentIntel'

export type PerceptionLevel = 0 | 1 | 2
export type HealthEstimateTier = 'intact' | 'scratched' | 'wounded' | 'critical'
export type AuraBracket = 'high' | 'medium' | 'low'
export type LivingPortraitMood = 'calm' | 'strained' | 'critical'

export interface OpponentHealthView {
  level: PerceptionLevel
  exact: number | null
  max: number
  tier: HealthEstimateTier | null
  portraitMood: LivingPortraitMood
  textureMasked: boolean
  auraSeeping: boolean
  adrenalineAlert: boolean
}

export interface OpponentAuraView {
  level: PerceptionLevel
  exact: number | null
  bracket: AuraBracket | null
  ryuVisible: boolean
  concealed: boolean
}

export interface OpponentBurstView {
  level: PerceptionLevel
  knownSpent: boolean
  exactAvailable: boolean | null
  zetsuSeconds: number | null
  tensionAlert: boolean
}

export interface OpponentKameoView {
  visible: boolean
  showCooldown: boolean
  showRole: boolean
}

export interface OpponentHatsuView {
  level: PerceptionLevel
  revealedConditions: readonly ObservedCondition[]
  showExactCharges: boolean
}

export interface OpponentHudView {
  mode: FightHudMode
  level: PerceptionLevel
  blinded: boolean
  health: OpponentHealthView
  aura: OpponentAuraView
  burst: OpponentBurstView
  kameo: OpponentKameoView
  hatsu: OpponentHatsuView
}

export interface OpponentPerceptionInput {
  state: FightState
  observerSide: FightSide
  mode?: FightHudMode
}

const DEFAULT_MAX_HEALTH = 100

/**
 * Computes the observer's active Nen perception level (0 = naked eye, 1 = deduced in combat,
 * 2 = full Gyo / En / Sonar / Musse / analytical specialist).
 */
export function resolvePerceptionLevel(input: {
  state: FightState
  observerSide: FightSide
}): PerceptionLevel {
  const { state, observerSide } = input
  const targetSide: FightSide = observerSide === 'player' ? 'opponent' : 'player'
  const observer = state[observerSide]
  if (senseDeprived(observer, 'sight')) return hasMelodyHearing(observer) ? 1 : 0
  if (hasLevelTwoPerception(state, observerSide, targetSide)) return 2
  const intel = state.opponentIntel?.[observerSide]
  if (intel && hasAnyDeduction(intel)) return 1
  return 0
}

/** Projects the opponent's authoritative state into what the observer's HUD may display. */
export function resolveOpponentHudView(input: OpponentPerceptionInput): OpponentHudView {
  const mode = input.mode ?? 'tactical'
  const targetSide: FightSide = input.observerSide === 'player' ? 'opponent' : 'player'
  const observer = input.state[input.observerSide]
  const target = input.state[targetSide]
  const intel = input.state.opponentIntel?.[input.observerSide] ?? createOpponentIntel()
  const blinded = senseDeprived(observer, 'sight')
  const level = mode === 'omniscient' ? 2 : resolvePerceptionLevel(input)

  return {
    mode,
    level,
    blinded,
    health: buildHealthView({ target, observer, intel, mode, level }),
    aura: buildAuraView({
      state: input.state,
      observerSide: input.observerSide,
      intel,
      mode,
      level,
    }),
    burst: buildBurstView({ state: input.state, targetSide, intel, mode, level }),
    kameo: buildKameoView(intel, mode),
    hatsu: buildHatsuView(intel, mode, level),
  }
}

function hasLevelTwoPerception(
  state: FightState,
  observerSide: FightSide,
  targetSide: FightSide,
): boolean {
  const observer = state[observerSide]
  const fullGyo = Boolean(observer.nen.gyo && !observer.gyoLow)
  if (fullGyo || enTargetInside(state, observerSide)) return true
  if (musseCancelsIn(state, targetSide)) return true
  return hasMelodyHearing(observer)
}

function hasMelodyHearing(observer: ArcadeFighter): boolean {
  return (observer.nenOwner ?? observer.id) === 'melody' && canHear(observer)
}

function hasAnyDeduction(intel: OpponentIntel): boolean {
  return (
    intel.cleanHitsLanded > 0 ||
    intel.auraObserved ||
    intel.burstUsedSeen ||
    intel.kameoRevealed ||
    intel.revealedConditions.length > 0
  )
}

function buildHealthView(input: {
  target: ArcadeFighter
  observer: ArcadeFighter
  intel: OpponentIntel
  mode: FightHudMode
  level: PerceptionLevel
}): OpponentHealthView {
  const { target, observer, intel, mode, level } = input
  const max = target.maxHealth ?? DEFAULT_MAX_HEALTH
  const texturePov = textureSurpriseView(target, observer, 'opponent')
  const shownHealth = texturePov.displayedHp
  const ratio = Math.max(0, Math.min(1, shownHealth / max))
  const portraitMood: LivingPortraitMood = texturePov.maskWounds ? 'calm' : moodFromRatio(ratio)
  const melodyActive = hasMelodyHearing(observer)
  const healthLevel = resolveHealthLevel({ intel, mode, level, melodyActive })

  return {
    level: healthLevel,
    exact: mode === 'omniscient' ? shownHealth : null,
    max,
    tier: healthLevel >= 1 ? tierFromRatio(ratio) : null,
    portraitMood,
    textureMasked: texturePov.maskActive,
    auraSeeping: texturePov.auraSeeping,
    adrenalineAlert: healthLevel === 2 && ratio <= 0.3 && !texturePov.maskWounds,
  }
}

function resolveHealthLevel(input: {
  intel: OpponentIntel
  mode: FightHudMode
  level: PerceptionLevel
  melodyActive: boolean
}): PerceptionLevel {
  if (input.mode === 'omniscient' || input.level === 2 || input.melodyActive) return 2
  return input.intel.cleanHitsLanded > 0 ? 1 : 0
}

function moodFromRatio(ratio: number): LivingPortraitMood {
  if (ratio <= 0.3) return 'critical'
  if (ratio <= 0.65) return 'strained'
  return 'calm'
}

function tierFromRatio(ratio: number): HealthEstimateTier {
  if (ratio >= 0.85) return 'intact'
  if (ratio >= 0.55) return 'scratched'
  if (ratio > 0.25) return 'wounded'
  return 'critical'
}

function buildAuraView(input: {
  state: FightState
  observerSide: FightSide
  intel: OpponentIntel
  mode: FightHudMode
  level: PerceptionLevel
}): OpponentAuraView {
  const targetSide: FightSide = input.observerSide === 'player' ? 'opponent' : 'player'
  const observer = input.state[input.observerSide]
  const target = input.state[targetSide]
  const concealed = target.aura === CONCEALED_AURA || nenInformationConcealed(target, observer)
  const pierced =
    input.level === 2 && (!concealed || hasAuraPierce(input.state, input.observerSide))

  if (input.mode === 'omniscient') return omniscientAuraView(target.aura, concealed)
  if (pierced) return perceivedAuraView(target.aura)
  const showBracket = input.intel.auraObserved && !concealed
  return {
    level: showBracket ? 1 : 0,
    exact: null,
    bracket: showBracket ? auraBracket(target.aura) : null,
    ryuVisible: false,
    concealed,
  }
}

function omniscientAuraView(aura: number, concealed: boolean): OpponentAuraView {
  return {
    level: concealed ? 0 : 2,
    exact: concealed ? null : Math.floor(aura),
    bracket: concealed ? null : auraBracket(aura),
    ryuVisible: !concealed,
    concealed,
  }
}

function perceivedAuraView(aura: number): OpponentAuraView {
  return {
    level: 2,
    exact: Math.floor(aura),
    bracket: auraBracket(aura),
    ryuVisible: true,
    concealed: false,
  }
}

function hasAuraPierce(state: FightState, observerSide: FightSide): boolean {
  const targetSide: FightSide = observerSide === 'player' ? 'opponent' : 'player'
  const observer = state[observerSide]
  return Boolean(
    (observer.nen.gyo && !observer.gyoLow) ||
    enTargetInside(state, observerSide) ||
    musseCancelsIn(state, targetSide),
  )
}

function auraBracket(aura: number): AuraBracket {
  if (aura >= 65) return 'high'
  if (aura >= 30) return 'medium'
  return 'low'
}

function buildBurstView(input: {
  state: FightState
  targetSide: FightSide
  intel: OpponentIntel
  mode: FightHudMode
  level: PerceptionLevel
}): OpponentBurstView {
  const { state, targetSide, intel, mode, level } = input
  const target = state[targetSide]
  const available = state.burstAvailable?.[targetSide] !== false
  const zetsuFrames = target.burstZetsuFrames ?? 0
  if (mode === 'omniscient') return omniscientBurstView(available, zetsuFrames)
  const tensionAlert = level === 2 && available && (target.hitStun > 0 || target.aura >= 75)
  return {
    level: observedBurstLevel(intel.burstUsedSeen, level),
    knownSpent: intel.burstUsedSeen,
    exactAvailable: null,
    zetsuSeconds: level === 2 && zetsuFrames > 0 ? Number((zetsuFrames / 60).toFixed(1)) : null,
    tensionAlert,
  }
}

function omniscientBurstView(available: boolean, zetsuFrames: number): OpponentBurstView {
  return {
    level: 2,
    knownSpent: !available,
    exactAvailable: available,
    zetsuSeconds: zetsuFrames > 0 ? Number((zetsuFrames / 60).toFixed(1)) : null,
    tensionAlert: false,
  }
}

function observedBurstLevel(spent: boolean, level: PerceptionLevel): PerceptionLevel {
  if (spent) return 1
  return level === 2 ? 2 : 0
}

function buildKameoView(intel: OpponentIntel, mode: FightHudMode): OpponentKameoView {
  if (mode === 'omniscient') {
    return { visible: true, showCooldown: true, showRole: true }
  }
  return {
    visible: intel.kameoRevealed,
    showCooldown: false,
    showRole: false,
  }
}

function buildHatsuView(
  intel: OpponentIntel,
  mode: FightHudMode,
  level: PerceptionLevel,
): OpponentHatsuView {
  if (mode === 'omniscient') {
    return { level: 2, revealedConditions: intel.revealedConditions, showExactCharges: true }
  }
  return {
    level: level === 2 ? 2 : intel.revealedConditions.length > 0 ? 1 : 0,
    revealedConditions: intel.revealedConditions,
    showExactCharges: false,
  }
}
