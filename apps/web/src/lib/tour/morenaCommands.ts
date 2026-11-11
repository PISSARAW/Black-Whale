import {
  askMorena,
  leaveTheTable,
  playTechnique,
  refuseTheDeal,
  settle,
  takeTheDeal,
  type AnswerCard,
  type MorenaGame,
  type QuestionCard,
  type TablePage,
} from '@black-whale/ability-modules'

/** Every state-changing move accepted by Morena's negotiation session. */
export type MorenaCommand =
  | { kind: 'ask'; question: QuestionCard }
  | { kind: 'accept-deal'; card: AnswerCard }
  | { kind: 'decline-deal' }
  | { kind: 'settle'; choice?: AnswerCard }
  | { kind: 'play-technique'; page: TablePage }
  | { kind: 'leave' }

/**
 * One command entry point shared by buttons, cards in the 3D room and Hatsu controls.
 * The ability module remains the only place where a move's rules are decided.
 */
export function applyMorenaCommand(
  game: MorenaGame,
  command: MorenaCommand,
  options: { random?: () => number } = {},
): MorenaGame {
  switch (command.kind) {
    case 'ask':
      return askMorena(game, command.question, options)
    case 'accept-deal':
      return takeTheDeal(game, command.card)
    case 'decline-deal':
      return refuseTheDeal(game)
    case 'settle':
      return settle(game, command.choice)
    case 'play-technique':
      return playTechnique(game, { page: command.page, random: options.random })
    case 'leave':
      return leaveTheTable(game)
  }
}
