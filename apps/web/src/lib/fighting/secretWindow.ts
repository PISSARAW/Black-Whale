import { voluntaryNenAvailable } from './nenAccess'
import { chrolloHasActivePage } from './chrolloBook'
import { sleepingBody } from './hanzoProjection'
import { chainAbilitySealed } from './kurapika'
import type { ArcadeFighter, FightSide, FightState, FighterPose } from './types'

export interface SecretWindowObservation {
  frame: number
  action: FighterPose | 'concealed-gesture' | 'sleeping-body' | 'audio-only'
}

export interface SecretWindowState {
  target: FightSide
  attachedAt: number
  observation: SecretWindowObservation
  mode?: 'contact' | 'listening'
  words?: { frame: number; speaker: FightSide; text: string }
  history?: SecretWindowObservation[]
  recordings?: { frame: number; speaker: FightSide; text: string }[]
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

/** Keep only acquired observations. This never reconstructs events before the bird existed. */
export function advanceSecretWindowFeed(state: FightState, side: FightSide): SecretWindowState {
  const feed = state[side].secretWindow!
  const observation: SecretWindowObservation =
    feed.mode === 'listening'
      ? { frame: state.frame, action: 'audio-only' }
      : observeSecretWindow(state, feed.target)
  const history = feed.history ?? [feed.observation]
  return {
    ...feed,
    observation,
    history:
      history.at(-1)?.action === observation.action
        ? history
        : [...history, observation].slice(-64),
  }
}

/** Contact relays its target's speech; the shoulder bird listens through barriers.
 * No range beyond the duel's actual participants is asserted as a canonical limit.
 */
export function relaySecretWindowSpeech(
  state: FightState,
  speaker: FightSide,
  text: string,
): FightState {
  let next = state
  for (const side of ['player', 'opponent'] as const) {
    const feed = next[side].secretWindow
    if (!feed || feed.target !== speaker || !secretWindowNenActive(next[side])) continue
    const words = { frame: state.frame, speaker, text }
    next = {
      ...next,
      [side]: {
        ...next[side],
        secretWindow: {
          ...feed,
          words,
          recordings: [...(feed.recordings ?? []), words].slice(-64),
        },
      },
    }
  }
  return next
}
