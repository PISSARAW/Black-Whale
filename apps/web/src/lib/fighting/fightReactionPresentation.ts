import { createFightPoseClock } from './fightPoseClock'
import { rosterContactMotion } from './rosterHitReaction'
import type { ReactionContext } from './fightReactions'
import type { ArcadeFighter, FightSide, FightState } from './types'

type Input = { fighter: ArcadeFighter; seconds: number; progress?: number }
type Contact = Pick<ReactionContext, 'hitZone' | 'strikeReaction' | 'strikeMotion'>

/** Keep the contact's direction even when the attacker has already cancelled into another move. */
export function createFightReactionPresentation() {
  let key = ''
  let lastFrame = -1
  const contacts: Partial<Record<FightSide, { sequence: number; contact: Contact }>> = {}
  let clock = createFightPoseClock()
  return (state: FightState, side: FightSide, input: Input): ReactionContext => {
    const nextKey = `${state.player.id}:${state.opponent.id}:${state.roundNumber}`
    if (key !== nextKey || state.frame < lastFrame) {
      key = nextKey
      delete contacts.player
      delete contacts.opponent
      clock = createFightPoseClock()
    }
    lastFrame = state.frame
    const impact = receivedImpact(state, side)
    if (impact && contacts[side]?.sequence !== impact.sequence)
      contacts[side] = {
        sequence: impact.sequence,
        contact: contactContext(state),
      }
    return {
      ...contacts[side]?.contact,
      progress:
        input.progress ??
        clock(side, input.fighter, { seconds: input.seconds, impact: impact?.sequence }),
    }
  }
}

function receivedImpact(state: FightState, side: FightSide) {
  return state.impact?.attacker === side ? null : state.impact
}

function contactContext(state: FightState): Contact {
  const impact = state.impact!
  const attacker = state[impact.attacker]
  const ordinary = { hitZone: impact.zone }
  if (!directionalContact(state)) return ordinary
  const directed = { ...ordinary, strikeMotion: rosterContactMotion(state) }
  if (attacker.id !== 'shizuku') return directed
  const move = attacker.attack?.moveId
  if (move === 'shizuku:standingHeavy') return { ...ordinary, strikeReaction: 'blinky-hammer' }
  if (move === 'shizuku:forwardSpecial') return { ...ordinary, strikeReaction: 'blinky-drive' }
  return directed
}

function directionalContact(state: FightState): boolean {
  const impact = state.impact!
  return (
    !impact.blocked &&
    !impact.parried &&
    !impact.avoided &&
    !impact.invulnerable &&
    impact.projectileId === null
  )
}
