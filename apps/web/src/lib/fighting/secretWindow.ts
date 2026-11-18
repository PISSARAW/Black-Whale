import { sleepingBody } from './hanzoProjection'
import { physicalBodyAt } from './fightBodyIdentity'
import { secretWindowNenActive } from './secretWindowAccess'
export { secretWindowNenActive } from './secretWindowAccess'
import type { ArcadeFighter, FightSide, FightState, FighterPose } from './types'

export interface SecretWindowObservation {
  frame: number
  action: FighterPose | 'concealed-gesture' | 'sleeping-body'
}

export interface SecretWindowState {
  musseInheritance?: 'canon373'
  target: FightSide
  targetMember?: number
  attachedAt: number
  observation: SecretWindowObservation
  heard?: { frame: number; text: string }
}

/** The bird reports bodily actions, not aura, thoughts, attack names or the future. */
export function observeSecretWindow(
  state: FightState,
  target: FightSide,
  member?: number,
): SecretWindowObservation {
  const fighter = physicalBodyAt(state, target, member) ?? state[target]
  const body = sleepingBody(fighter)
  const action = fighter.hanzoProjection
    ? 'sleeping-body'
    : body.attack?.concealed
      ? 'concealed-gesture'
      : body.pose
  return { frame: state.frame, action }
}

export function secretWindowTarget(
  state: FightState,
  feed: SecretWindowState,
): ArcadeFighter | undefined {
  return physicalBodyAt(state, feed.target, feed.targetMember)
}

/** One contact bird is sufficient for a duel with one opponent. */
export function musseMoveAvailable(fighter: ArcadeFighter, moveId?: string): boolean {
  if (fighter.id === 'musse' && moveId === 'musse:downSpecial')
    return secretWindowNenActive(fighter) && !fighter.secretWindowListening
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
