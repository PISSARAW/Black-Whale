import { addChrolloPage, chrolloNenActive, type ChrolloPage } from './chrolloBook'
import { reconcileChrolloPages } from './chrolloPageEffects'
import { canSpeak, senseDeprived } from './saiyuSenses'
import { canAct } from './fightActorState'
import { NEN_CANON } from './nenCanon'
import { chainAbilitySealed } from './kurapika'
import { speakPaperWords } from './kallutoListening'
import type { ArsenalCommand, ArsenalOption } from './retrospectiveTypes'
import type { ArcadeFighter, FightSide, FightState } from './types'

export const SKILL_HUNTER_WINDOW = 60 * 60 * 60
const SPEECH_RANGE = 18
const PALM_RANGE = 6

export function hunterInterviewReady(state: FightState, side: FightSide): boolean {
  const thief = state[side]
  const other = side === 'player' ? 'opponent' : 'player'
  const interview = thief.hunterInterview
  if (!interview || interview.target !== state[other].id || interview.answeredAt === undefined)
    return false
  if (thief.hatsuEffects.witnessedHatsu !== interview.target) return false
  const seen = thief.hatsuEffects.witnessedAt
  if (seen === undefined) return false
  return (
    state.frame - Math.min(seen, interview.askedAt, interview.answeredAt) <= SKILL_HUNTER_WINDOW
  )
}

function speechAvailable(state: FightState, side: FightSide): boolean {
  const other = side === 'player' ? 'opponent' : 'player'
  if (!canSpeak(state[side]) || senseDeprived(state[other], 'hearing')) return false
  if (state[other].coveringEars) return false
  return Math.hypot(state[side].x - state[other].x, state[side].y - state[other].y) <= SPEECH_RANGE
}

export function performHunterInterview(
  state: FightState,
  side: FightSide,
  command: ArsenalCommand,
): FightState {
  if (command.action === 'hunter-answer') return answerHunter(state, side)
  if (command.action === 'hunter-palm') return offerPalm(state, side)
  const thief = state[side]
  const other = side === 'player' ? 'opponent' : 'player'
  if (thief.id !== 'chrollo' || !chrolloNenActive(thief) || !canAct(thief)) return state
  if (!speechAvailable(state, side) || thief.attack) return state
  const spoken = speakPaperWords(state, side, 'Comment fonctionne ta capacité de Nen ?')
  return {
    ...spoken,
    [side]: { ...spoken[side], hunterInterview: { target: state[other].id, askedAt: state.frame } },
    [other]: { ...spoken[other], hunterQuestion: { owner: side, askedAt: state.frame } },
  }
}

function answerHunter(state: FightState, side: FightSide): FightState {
  const target = state[side]
  const question = target.hunterQuestion
  if (!question || !speechAvailable(state, side) || !canAct(target)) return state
  const owner = question.owner
  const interview = state[owner].hunterInterview
  if (!interview || interview.target !== target.id || interview.askedAt !== question.askedAt)
    return state
  if (state.frame - question.askedAt > SKILL_HUNTER_WINDOW) return state
  const ability = NEN_CANON[target.id]
  if (!ability?.abilities.length) return state
  const spoken = speakPaperWords(state, side, ability.condition)
  return {
    ...spoken,
    [owner]: { ...spoken[owner], hunterInterview: { ...interview, answeredAt: state.frame } },
  }
}

function offerPalm(state: FightState, side: FightSide): FightState {
  const target = state[side]
  const thiefSide = side === 'player' ? 'opponent' : 'player'
  if (!canAct(target) || target.attack || target.y > 0) return state
  return completeSkillHunter(state, thiefSide)
}

/** This operation denotes palm-to-cover contact, never a general torso hit. */
export function completeSkillHunter(state: FightState, side: FightSide): FightState {
  const thief = state[side]
  const other = side === 'player' ? 'opponent' : 'player'
  const target = state[other]
  if (!hunterInterviewReady(state, side) || !canAcquire(thief, target)) return state
  if (Math.hypot(thief.x - target.x, thief.y - target.y) > PALM_RANGE) return state
  const stolenMoveId = thief.hatsuEffects.witnessedMoveId ?? `${target.id}:neutralSpecial`
  if (chainAbilitySealed(target, stolenMoveId)) return state
  const next = {
    ...state,
    [side]: {
      ...thief,
      chrolloBook: addChrolloPage(thief.chrolloBook!, stolenMoveId as ChrolloPage),
      hunterInterview: undefined,
      hatsuEffects: { ...thief.hatsuEffects, stolenHatsu: target.id },
    },
    [other]: {
      ...target,
      hunterQuestion: undefined,
      skillHunterStolen: [
        ...(target.skillHunterStolen ?? []),
        { owner: side, moveId: stolenMoveId },
      ],
    },
  }
  return reconcileChrolloPages(state, next, side)
}

function canAcquire(thief: ArcadeFighter, target: ArcadeFighter): boolean {
  if (thief.id !== 'chrollo' || !thief.chrolloBook || !chrolloNenActive(thief)) return false
  if (!NEN_CANON[target.id]?.abilities.length || target.id === 'chrollo') return false
  return target.health > 0 && target.hatsuEffects.hatsuStolen === 0
}

export function hunterOptions(state: FightState, side: FightSide): ArsenalOption[] {
  const options: ArsenalOption[] = []
  if (state[side].id === 'chrollo')
    options.push({
      command: { action: 'hunter-ask' },
      labelFr: 'Skill Hunter · Interroger',
      labelEn: 'Skill Hunter · Ask',
      ready: canAct(state[side]) && speechAvailable(state, side),
      conditionFr:
        'Observer le pouvoir, obtenir une réponse et toucher la paume avec la couverture en moins d’une heure.',
      conditionEn:
        'Witness the ability, obtain an answer and touch the palm with the cover within one hour.',
    })
  if (state[side].hunterQuestion)
    for (const action of ['hunter-answer', 'hunter-palm'] as const)
      options.push({
        command: { action },
        labelFr:
          action === 'hunter-answer' ? 'Expliquer mon Hatsu' : 'Toucher l’empreinte du livre',
        labelEn: action === 'hunter-answer' ? 'Explain my Hatsu' : 'Touch the book’s handprint',
        ready: canAct(state[side]),
        conditionFr: 'Action volontaire ; le vol retire l’accès à la capacité.',
        conditionEn: 'Voluntary action; theft removes access to the ability.',
      })
  return options
}
