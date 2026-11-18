import { residualNenReaction } from './nenReactionCarry'
import { nenConstraintPlan } from './nenImpactResponse'
import { createFightPoseClock } from './fightPoseClock'
import { rosterContactMotion } from './rosterHitReaction'
import { physicalHitAtContact } from './fightHitResponse'
import { createFightPoseContinuity } from './fightPoseContinuity'
import { physicalRosterPair } from './fightPhysicalRoster'
import type { ReactionContext } from './fightReactions'
import type { ArcadeFighter, FightSide, FightState } from './types'

type Input = { fighter: ArcadeFighter; seconds: number; progress?: number }
type Contact = Pick<
  ReactionContext,
  'hitZone' | 'strikeReaction' | 'strikeMotion' | 'physicalHit' | 'nenResponse' | 'nenCarry'
>
type Received = { sequence: number; contact: Contact; progress: number; reacting: boolean }

/** Keep the contact's direction even when the attacker has already cancelled into another move. */
export function createFightReactionPresentation() {
  let key = ''
  let lastFrame = -1
  const contacts: Partial<Record<FightSide, Received>> = {}
  let clock = createFightPoseClock()
  let motion = { player: createFightPoseContinuity(), opponent: createFightPoseContinuity() }
  return (state: FightState, side: FightSide, input: Input): ReactionContext => {
    const nextKey = `${state.player.id}:${state.opponent.id}:${state.roundNumber}`
    if (key !== nextKey || state.frame < lastFrame) {
      key = nextKey
      delete contacts.player
      delete contacts.opponent
      clock = createFightPoseClock()
      motion = { player: createFightPoseContinuity(), opponent: createFightPoseContinuity() }
    }
    lastFrame = state.frame
    const impact = receivedImpact(state, side)
    if (impact && contacts[side]?.sequence !== impact.sequence)
      contacts[side] = {
        sequence: impact.sequence,
        contact: contactContext(state, contacts[side]),
        progress: 0,
        reacting: true,
      }
    const progress =
      input.progress ??
      clock(side, input.fighter, { seconds: input.seconds, impact: impact?.sequence })
    rememberProgress(contacts[side], progress, input.fighter)
    return {
      rival: rivalOf(state, side),
      ...contacts[side]?.contact,
      nenConstraint: nenConstraintPlan(state, side),
      poseContinuity: physicalRosterPair(state.player.id, state.opponent.id)
        ? motion[side]
        : undefined,
      progress,
    }
  }
}

function rivalOf(state: FightState, side: FightSide): ArcadeFighter {
  return state[side === 'player' ? 'opponent' : 'player']
}

function rememberProgress(
  received: Received | undefined,
  progress: number,
  fighter: ArcadeFighter,
) {
  if (received) Object.assign(received, { progress, reacting: fighter.pose === 'hit' })
}

function receivedImpact(state: FightState, side: FightSide) {
  return state.impact?.attacker === side ? null : state.impact
}

function contactContext(state: FightState, previous?: Received): Contact {
  const impact = state.impact!
  const attacker = state[impact.attacker]
  const victim = state[impact.attacker === 'player' ? 'opponent' : 'player']
  const ordinary = {
    hitZone: impact.zone,
    nenResponse: impact.nenResponse,
    nenCarry: residualNenReaction(victim, previous),
  }
  if (!directionalContact(state)) return ordinary
  const directed = {
    ...ordinary,
    strikeMotion: rosterContactMotion(state),
    physicalHit: physicalHitAtContact(state, priorBalance(state, previous)),
  }
  if (attacker.id !== 'shizuku') return directed
  const move = attacker.attack?.moveId
  if (move === 'shizuku:standingHeavy') return { ...directed, strikeReaction: 'blinky-hammer' }
  if (move === 'shizuku:forwardSpecial') return { ...directed, strikeReaction: 'blinky-drive' }
  return directed
}

function priorBalance(state: FightState, previous?: Received) {
  const hit = previous?.contact.physicalHit
  const side = state.impact!.attacker === 'player' ? 'opponent' : 'player'
  if (!hit || !previous?.reacting || state[side].comboHits < 2) return undefined
  return { hit, progress: previous.progress }
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
