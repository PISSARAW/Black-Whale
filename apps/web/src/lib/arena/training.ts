import type { CombatAction, CombatEvent, CombatState } from '../combat/types'
import { formatFrameAdvantage, moveFrameAdvantage } from '../fighting/moveFrameAdvantage'
import { moveById } from '../fighting/movesets'
import type { FighterMove } from '../fighting/movesetTypes'

export const ARENA_LESSON_COUNT = 6

export interface ArenaFrameReadout {
  startup: number
  active: number
  recovery: number
  onHit: string
  onBlock: string
  safeOnBlock: boolean | null
}

export interface ArenaTrainingFeedback {
  move: string
  data: ArenaFrameReadout
  tone: 'confirm' | 'warning' | 'punish' | 'neutral'
  lesson: string
}

interface LessonInput {
  lesson: number
  action: CombatAction
  before: CombatState
  after: CombatState
}

/** The exact authored Clash timing, with advantage only where Clash declares it static. */
export function arenaFrameReadout(move: FighterMove, language: 'fr' | 'en'): ArenaFrameReadout {
  const measured = moveFrameAdvantage(move)
  return {
    startup: move.tuning.startup,
    active: move.tuning.active,
    recovery: move.tuning.recovery,
    onHit: measured ? formatFrameAdvantage(measured.onHit, language) : '—',
    onBlock: measured ? formatFrameAdvantage(measured.onBlock, language) : '—',
    safeOnBlock: measured ? measured.onBlock >= -3 : null,
  }
}

const OPENING_ACTIONS: Partial<Record<number, LessonInput['action']['type']>> = {
  0: 'RYU',
  1: 'GUARD',
  2: 'FEINT',
}

/** Advances only on an accepted action or a newly resolved exchange. */
export function advanceArenaLesson(input: LessonInput): number {
  const { lesson, action, before, after } = input
  if (OPENING_ACTIONS[lesson] === action.type) return lesson + 1
  const event = after.lastEvent !== before.lastEvent ? after.lastEvent : null
  if (lesson === 3 && playerLandedAuthoredMove(event)) return 4
  if (lesson === 4 && completedChain(after)) return 5
  if (lesson === 5 && blockedRivalAction(event)) return 6
  return lesson
}

function completedChain(state: LessonInput['after']): boolean {
  return (state.player.chain?.history.length ?? 0) >= 2
}

function blockedRivalAction(event: LessonInput['after']['lastEvent']): boolean {
  return event?.attacker === 'opponent' && event.impact === 'blocked'
}

export function arenaTrainingFeedback(
  event: CombatEvent,
  language: 'fr' | 'en',
): ArenaTrainingFeedback | null {
  const move = moveById(event.moveId)
  if (!move) return null
  const data = arenaFrameReadout(move, language)
  const french = language === 'fr'
  if (event.impact === 'miss')
    return feedback({
      move,
      data,
      tone: 'warning',
      lesson: french
        ? `Raté : ${data.recovery}f de récupération à couvrir.`
        : `Whiff: cover ${data.recovery}f of recovery.`,
    })
  if (event.impact === 'blocked')
    return blockFeedback({ move, data, attacker: event.attacker, french })
  const advantage =
    data.onHit === '—' ? '' : french ? ` · avantage ${data.onHit}` : ` · ${data.onHit} advantage`
  return feedback({
    move,
    data,
    tone: 'confirm',
    lesson:
      event.attacker === 'player'
        ? french
          ? `Confirmé${advantage}. Enchaîne pendant la fenêtre de cancel.`
          : `Confirmed${advantage}. Chain during the cancel window.`
        : french
          ? 'Touché : reprends la garde avant la suite.'
          : 'Hit: recover your guard before the follow-up.',
  })
}

function blockFeedback(options: {
  move: FighterMove
  data: ArenaFrameReadout
  attacker: CombatEvent['attacker']
  french: boolean
}): ArenaTrainingFeedback {
  const { move, data, attacker, french } = options
  if (data.safeOnBlock === null)
    return feedback({
      move,
      data,
      tone: 'neutral',
      lesson: french
        ? 'Avantage dynamique : lis la distance et la récupération.'
        : 'Dynamic advantage: read distance and recovery.',
    })
  const punishable = data.safeOnBlock === false
  if (attacker === 'opponent' && punishable)
    return feedback({
      move,
      data,
      tone: 'punish',
      lesson: french
        ? `Punition ouverte à ${data.onBlock}.`
        : `Punish available at ${data.onBlock}.`,
    })
  return feedback({
    move,
    data,
    tone: punishable ? 'warning' : 'neutral',
    lesson: punishable
      ? french
        ? `Bloqué à ${data.onBlock} : votre récupération est punissable.`
        : `Blocked at ${data.onBlock}: your recovery is punishable.`
      : french
        ? `Bloqué à ${data.onBlock} : coup sûr, reprenez l'espace.`
        : `Blocked at ${data.onBlock}: safe, reset spacing.`,
  })
}

function feedback(
  options: Omit<ArenaTrainingFeedback, 'move'> & { move: FighterMove },
): ArenaTrainingFeedback {
  const { move, data, tone, lesson } = options
  return { move: move.id, data, tone, lesson }
}

function playerLandedAuthoredMove(event: CombatEvent | null): boolean {
  return Boolean(event?.moveId && event.attacker === 'player' && event.impact !== 'miss')
}
