import { canAct } from './fightActorState'
import { judgmentClauses } from './judgmentRules'
import { chainRuleDeath } from './kurapikaActions'
import { speakPaperWords } from './kallutoListening'
import { voiceAvailable } from './kallutoListening'
import type { ArsenalInvocation, ArsenalOption } from './retrospectiveTypes'
import type { FightSide, FightState } from './types'

declare module './preparationTypes' {
  interface PreparedEntity {
    captiveOf?: FightSide
    releasedAt?: number
  }
}
declare module './types' {
  interface ArcadeFighter {
    judgmentDisclosure?: number
  }
}

/** The deadline is announced duel tuning; the source scene's deadline was midnight. */
export const HOSTAGE_DEADLINE_FRAMES = 30 * 60
export function judgmentHostage(state: FightState, captor: FightSide) {
  return state.battlefield?.entities.find(
    (entry) =>
      entry.kind === 'hostage' && entry.present && entry.health > 0 && entry.captiveOf === captor,
  )
}

export function performJudgmentExtra({ state, side, command }: ArsenalInvocation): FightState {
  const actor = state[side]
  if (state.phase !== 'fighting' || state.catsName) return state
  if (command.action === 'judgment-reveal') return revealSecret(state, side)
  if (command.action !== 'judgment-return-hostage' || !canAct(actor) || actor.attack) return state
  return returnHostage(state, side, command.target)
}
function revealSecret(state: FightState, side: FightSide): FightState {
  if (!voiceAvailable(state, side)) return state
  const marked = { ...state, [side]: { ...state[side], judgmentDisclosure: state.frame } }
  const spoken = speakPaperWords(
    marked,
    side,
    'Kurapika utilise des chaînes de Nen et Judgment Chain impose une règle mortelle.',
  )
  return { ...spoken, [side]: { ...spoken[side], judgmentDisclosure: undefined } }
}
function returnHostage(state: FightState, side: FightSide, id?: string): FightState {
  const actor = state[side]
  const hostage = state.battlefield?.entities.find(
    (entry) =>
      entry.id === id &&
      entry.kind === 'hostage' &&
      entry.present &&
      entry.health > 0 &&
      entry.captiveOf === side,
  )
  if (!hostage || Math.hypot(hostage.x - actor.x, hostage.y - actor.y) > 6) return state
  const seal = actor.judgmentChain
  if (seal?.hostageId === hostage.id) {
    const receiver = state[seal.owner]
    if (receiver.health <= 0 || Math.hypot(receiver.x - hostage.x, receiver.y - hostage.y) > 8)
      return state
  }
  return {
    ...state,
    battlefield: {
      ...state.battlefield!,
      entities: state.battlefield!.entities.map((entry) =>
        entry.id === hostage.id
          ? { ...entry, captiveOf: undefined, releasedAt: state.frame, consenting: true }
          : entry,
      ),
    },
  }
}

export function advanceJudgmentHostages(state: FightState): FightState {
  let next = state
  for (const side of ['player', 'opponent'] as const) {
    if (hostageBreach(next, side)) next = chainRuleDeath(next, side)
  }
  return next
}

function hostageBreach(state: FightState, side: FightSide): boolean {
  const seal = state[side].judgmentChain
  if (!seal?.hostageId || !judgmentClauses(state[side]).includes('return-hostage')) return false
  const deadline = seal.deadlineFrame ?? Infinity
  const hostage = state.battlefield?.entities.find((entry) => entry.id === seal.hostageId)
  if (!hostage) return state.frame >= deadline
  if (hostage.releasedAt !== undefined && hostage.releasedAt <= deadline) return false
  return hostage.health <= 0 || state.frame >= deadline
}

export function judgmentExtraOptions(state: FightState, side: FightSide): ArsenalOption[] {
  const entries: { command: ArsenalInvocation['command']; fr: string; en: string }[] = []
  if (state[side].judgmentChain)
    entries.push({
      command: { action: 'judgment-reveal' },
      fr: 'Parler · Révéler le secret de Kurapika',
      en: 'Speak · Disclose Kurapika’s secret',
    })
  for (const hostage of state.battlefield?.entities ?? [])
    if (hostage.kind === 'hostage' && hostage.captiveOf === side)
      entries.push({
        command: { action: 'judgment-return-hostage', target: hostage.id },
        fr: `Rendre l’otage · ${hostage.id}`,
        en: `Return hostage · ${hostage.id}`,
      })
  return entries.map(({ command, fr, en }) => ({
    command,
    labelFr: fr,
    labelEn: en,
    ready: performJudgmentExtra({ state, side, command }) !== state,
    conditionFr:
      'La divulgation doit réellement être prononcée et entendue. L’otage doit exister, être vivant et être rendu physiquement au destinataire avant le délai annoncé. Une violation d’une clause implantée est mortelle.',
    conditionEn:
      'Disclosure must actually be spoken and heard. The hostage must exist, be alive and be physically handed back before the announced deadline. Breaching an implanted clause is fatal.',
  }))
}
