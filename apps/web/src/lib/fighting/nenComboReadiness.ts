import { voluntaryNenAvailable } from './nenAccess'
import { nenOutputAllows } from './nenBudget'
import { attackAuraCost } from './fightAttackCost'
import { usesVoluntaryNen } from './nenActionRules'
import type { FighterMove } from './movesetTypes'
import type { ArcadeFighter } from './types'

export type NenFollowupReadiness = 'ready' | 'transfer' | 'distribution' | 'output' | 'access'

/** Existing routes still own the cancel. This check never grants an ability, object or condition. */
export function nenFollowupReadiness(
  fighter: ArcadeFighter,
  move: FighterMove,
): NenFollowupReadiness {
  if (!confirmedContact(fighter)) return 'ready'
  if (!usesVoluntaryNen(fighter, { kind: move.kind, moveId: move.id })) return 'ready'
  if (!voluntaryNenAvailable(fighter, { requireReserve: true })) return 'access'
  const cost = attackAuraCost({ fighter, kind: move.kind, moveId: move.id })
  if (fighter.aura < cost || !nenOutputAllows(fighter, cost)) return 'output'
  if (fighter.nenTransfer) return 'transfer'
  return distributionReady(fighter, move) ? 'ready' : 'distribution'
}

function distributionReady(fighter: ArcadeFighter, move: FighterMove): boolean {
  // A paid Ko is committed to its region until contact. A different region needs a real transfer.
  if (fighter.nen.ko) return fighter.nen.ko === move.tuning.auraZone
  const shares = fighter.nen.ryu
  const focused = Object.values(shares).some((share) => Number(share) >= 0.5)
  return !focused || Number(shares[move.tuning.auraZone] ?? 0) >= 0.25
}

function confirmedContact(fighter: ArcadeFighter): boolean {
  return Boolean(fighter.attack?.confirmedHit || fighter.attack?.confirmedBlock)
}

export function nenTransferWaiting(fighter: ArcadeFighter, move: FighterMove): boolean {
  const readiness = nenFollowupReadiness(fighter, move)
  return readiness === 'transfer' || readiness === 'distribution'
}
