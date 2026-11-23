import { privatePvpState } from '../fighting/pvp/view'
import { readAura } from '../combat/perception'
import type { CombatSide, CombatState } from '../combat/types'
import type { FightSide, FightState } from '../fighting/types'

/**
 * Pure POV projection of an Arena bout.
 *
 * The Clash information asymmetry — Parallel Future, Secret Window, Body and
 * Soul, Melody Hearing, concealed attacks under In without Gyo — is applied here,
 * through the pure PvP filters, and never on the canonical simulation state:
 * replays and replay checksums keep the unfiltered state, and the omniscient
 * spectator mode stays available for the coaching step.
 */
export function arenaPov(state: CombatState, side?: CombatSide): CombatState
export function arenaPov(state: FightState, side?: FightSide): FightState
export function arenaPov(
  state: CombatState | FightState,
  side: CombatSide | FightSide = 'player',
): CombatState | FightState {
  return isCombatState(state)
    ? privateArenaState(state, side as CombatSide)
    : privatePvpState(state, side as FightSide)
}

function isCombatState(state: CombatState | FightState): state is CombatState {
  return 'clock' in state && 'terrain' in state && 'tethers' in state
}

function privateArenaState(state: CombatState, side: CombatSide): CombatState {
  const view = structuredClone(state)
  const other = side === 'player' ? 'opponent' : 'player'
  const observer = view[side]
  const target = view[other]
  const reading = readAura(observer, target)

  if (reading.intentZone === null) target.intent = null
  if (reading.koZone === null) target.ko = null
  if (reading.feintZone === null) target.feint = null
  if (!observer.gyo) {
    target.attackShare = 0.5
    target.guard = 'torso'
    target.ryuShift = null
  }
  return view
}
