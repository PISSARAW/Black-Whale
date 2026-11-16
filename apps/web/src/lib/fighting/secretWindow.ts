import { voluntaryNenAvailable } from './nenAccess'
import { chrolloHasActivePage } from './chrolloBook'
import { sleepingBody } from './hanzoProjection'
import { chainAbilitySealed } from './kurapika'
import type { ArcadeFighter, FightSide, FightState, FighterPose } from './types'

export interface SecretWindowObservation {
  frame: number
  action: FighterPose | 'concealed-gesture' | 'sleeping-body'
}

export interface SecretWindowState {
  target: FightSide
  attachedAt: number
  observation: SecretWindowObservation
}

/** The bird reports bodily actions, not aura, thoughts, attack names or the future. */
export function observeSecretWindow(state: FightState, target: FightSide): SecretWindowObservation {
  const fighter = state[target]
  const body = sleepingBody(fighter)
  const action = fighter.hanzoProjection
    ? 'sleeping-body'
    : body.attack?.concealed
      ? 'concealed-gesture'
      : body.pose
  return { frame: state.frame, action }
}

export function secretWindowNenActive(fighter: ArcadeFighter): boolean {
  return (
    voluntaryNenAvailable(fighter, { requireReserve: true }) &&
    hasSecretWindow(fighter) &&
    !chainAbilitySealed(fighter, 'musse:neutralSpecial')
  )
}

function hasSecretWindow(fighter: ArcadeFighter): boolean {
  if (fighter.id === 'musse') return true
  if (fighter.id === 'chrollo') return chrolloHasActivePage(fighter, 'musse')
  const held = fighter.kurapika?.held
  return Boolean(held?.used && held.source === 'musse')
}

/** One contact bird is sufficient for a duel with one opponent. */
export function musseMoveAvailable(fighter: ArcadeFighter, moveId?: string): boolean {
  if (fighter.id !== 'musse' || (moveId && moveId !== 'musse:neutralSpecial')) return true
  return secretWindowNenActive(fighter) && !fighter.secretWindow
}

export function secretWindowUtility(fighter: ArcadeFighter): boolean {
  return fighter.attack?.kind === 'special' && fighter.attack.hatsuSource === 'musse'
}

/** Only the user sees their owl. Local versus shares the two owners' HUDs. */
export function secretWindowVisibleTo(
  state: FightState,
  owner: FightSide,
  viewer: FightSide,
): boolean {
  return (
    owner === viewer && Boolean(state[owner].secretWindow) && secretWindowNenActive(state[owner])
  )
}
