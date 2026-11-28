import { attackData } from './frameData'
import { moveById, moveForSlot } from './movesets'
import { rosterPhysicalBranch } from './rosterComboBranches'
import { voluntaryNenAvailable } from './nenAccess'
import { fighterNenTraining } from './nenMastery'
import { usesVoluntaryNen } from './nenActionRules'
import type { ArcadeFighter, FightNenZone, FightState } from './types'

declare module './types' {
  interface ArcadeFighter {
    nenOpening?: { move: string; attackFrame: number; zone: FightNenZone; share: number }
    nenBranchCount?: number
    nenConversionCount?: number
  }
}
/** A successful, actually focused physical contact earns one additional personal conversion. */
export function recordNenOpening(before: FightState, after: FightState): FightState {
  const hit = after.impact
  if (!hit || hit.projectileId !== null || hit.damage <= 0 || hit.blocked || hit.avoided)
    return after
  const fighter = before[hit.attacker]
  if (!physicalFocus(fighter)) return after
  const zone = attackData(fighter.attack!.kind, fighter).auraZone
  const share = fighter.nen.ko === zone ? 1 : Number(fighter.nen.ryu[zone] ?? 0)
  if (share < 0.6) return after
  return {
    ...after,
    [hit.attacker]: {
      ...after[hit.attacker],
      nenOpening: {
        move: fighter.attack!.moveId!,
        attackFrame: fighter.attack!.frame,
        zone,
        share,
      },
    },
  }
}
function physicalFocus(fighter: ArcadeFighter): boolean {
  const attack = fighter.attack
  return Boolean(
    attack?.moveId &&
    ['light', 'heavy'].includes(attack.kind) &&
    attack.variant !== 'throw' &&
    voluntaryNenAvailable(fighter, { requireHatsu: false, requireReserve: true }) &&
    fighterNenTraining(fighter, 'enhancer').level > 0,
  )
}
export function preparedNenDestinations(fighter: ArcadeFighter): string[] {
  const attack = fighter.attack
  if (!preparedWindow(fighter)) return []
  const branch = rosterPhysicalBranch(fighter.id, 'tip')
  const physical = [
    branch?.slot,
    'forwardLight',
    'lowHeavy',
    'standingHeavy',
    'backHeavy',
    'forwardHeavy',
  ] as const
  const own = fighter.nenTactics?.slots ?? []
  const candidates = [...physical, ...own].flatMap((slot) => {
    const move = slot && moveForSlot(fighter.id, slot)
    return move && suitable(fighter, move.id) ? [move.id] : []
  })
  const original = moveById(attack!.moveId)?.cancelInto ?? []
  return [...new Set(candidates)].filter((id) => id !== attack!.moveId && !original.includes(id))
}
function suitable(fighter: ArcadeFighter, id: string): boolean {
  const move = moveById(id)!
  if (['normal', 'command'].includes(move.category)) return true
  return move.tuning.damage > 0 && usesVoluntaryNen(fighter, { kind: move.kind, moveId: id })
}
export function nextNenBranchCount(fighter: ArcadeFighter, id?: string): number {
  if (!fighter.attack) return 0
  return (
    (fighter.nenBranchCount ?? 0) +
    Number(Boolean(id && preparedNenDestinations(fighter).includes(id)))
  )
}

function preparedWindow(fighter: ArcadeFighter): boolean {
  const opening = fighter.nenOpening,
    attack = fighter.attack
  if (!opening || !attack?.confirmedHit || opening.move !== attack.moveId) return false
  return (fighter.nenBranchCount ?? 0) < 1 && attack.frame - opening.attackFrame <= 12
}

export function preparedBranchReady(fighter: ArcadeFighter, id: string): boolean {
  if (!preparedNenDestinations(fighter).includes(id)) return true
  const move = moveById(id)
  if (!move || fighter.nenTransfer) return false
  const zone = move.tuning.auraZone
  return fighter.nen.ko === zone || Number(fighter.nen.ryu[zone] ?? 0) >= 0.6
}
