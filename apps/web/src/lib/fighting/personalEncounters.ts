import { seesCombatBody } from './fightCounterplay'
import { sleepingBody } from './hanzoProjection'
import { physicalBodyKey, visibleBodyAppearance } from './fightBodyIdentity'
import type { ArcadeFighter, FighterId, FightSide, FightState } from './types'

export interface PersonalEncounter {
  bodyKey: string
  appearance: FighterId
  round: number
  frame: number
}
export function observePersonalEncounters(state: FightState): FightState {
  if (state.phase !== 'fighting' || state.catsName) return state
  return observe(observe(state, 'player'), 'opponent')
}
function observe(state: FightState, side: FightSide): FightState {
  const target = side === 'player' ? 'opponent' : 'player'
  const viewer = state[side],
    subject = state[target]
  if (!canMeet(viewer) || !canBeMet(subject) || !faceToFace(viewer, subject)) return state
  const bodyKey = physicalBodyKey(state, target),
    appearance = visibleBodyAppearance(subject)
  const previous = viewer.personalEncounters ?? []
  if (previous.some((e) => e.bodyKey === bodyKey && e.appearance === appearance)) return state
  return {
    ...state,
    [side]: {
      ...viewer,
      personalEncounters: [
        ...previous,
        { bodyKey, appearance, round: state.roundNumber, frame: state.frame },
      ],
    },
  }
}
function canMeet(actor: ArcadeFighter): boolean {
  return !actor.blackVoiceAutopilot && seesCombatBody(actor) && canBeMet(actor)
}
function canBeMet(actor: ArcadeFighter): boolean {
  return actor.health > 0 && !actor.arsenalSleep && !actor.clothCapture && !actor.hanzoProjection
}
function faceToFace(viewer: ArcadeFighter, subject: ArcadeFighter): boolean {
  const a = sleepingBody(viewer),
    b = sleepingBody(subject)
  return (
    Math.hypot(a.x - b.x, a.y - b.y) <= 18 &&
    (b.x - a.x) * viewer.facing >= 0 &&
    (a.x - b.x) * subject.facing >= 0
  )
}
