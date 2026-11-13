import type { AbilityPresentationProjection } from '@black-whale/nen-engine'
import {
  liveSurfaceAdapter,
  type AbilitySurfaceActionAvailability,
  type AbilitySurfaceAdapter,
} from '$lib/nen/abilityPresentation'
import type { AnswerCard, InfectionProgress, MorenaGame, TablePage } from '$lib/tour/morena'
import type { MorenaCommand } from '$lib/tour/morenaCommands'
import type { MorenaView } from '$lib/tour/morenaSession.svelte'

export interface ContagionSurfaceReasons {
  unsupported: string
  phaseUnavailable: string
  noQuestion: string
  noCard: string
  noTechnique: string
  choiceRequired: string
}

export interface ContagionSurfaceState {
  view: MorenaView
  game: MorenaGame
  progress: InfectionProgress
  choice: AnswerCard | null
  techniquePage: TablePage | null
}

export type ContagionSurfaceCommand =
  | { kind: 'open-game' }
  | { kind: 'game'; command: MorenaCommand }
  | { kind: 'witness-murder' }
  | { kind: 'close-game' }

type CommandResolver = (state: ContagionSurfaceState) => ContagionSurfaceCommand | null

const COMMAND_RESOLVERS: Record<string, CommandResolver> = {
  'open-game': (state) => (state.view === 'table' ? null : { kind: 'open-game' }),
  ask: (state) => {
    const question = state.game.phase === 'asking' ? state.game.questions[0] : null
    return question ? { kind: 'game', command: { kind: 'ask', question } } : null
  },
  stake: (state) => {
    const card = state.game.phase === 'deal' ? state.game.graveyard[0] : null
    return card ? { kind: 'game', command: { kind: 'accept-deal', card } } : null
  },
  'refuse-stake': (state) =>
    state.game.phase === 'deal' ? { kind: 'game', command: { kind: 'decline-deal' } } : null,
  'play-technique': (state) =>
    state.game.phase !== 'over' && state.techniquePage
      ? { kind: 'game', command: { kind: 'play-technique', page: state.techniquePage } }
      : null,
  'leave-table': (state) =>
    state.game.phase === 'over' ? null : { kind: 'game', command: { kind: 'leave' } },
  settle: (state) => {
    if (state.game.phase !== 'settling') return null
    const command: MorenaCommand = state.choice
      ? { kind: 'settle', choice: state.choice }
      : { kind: 'settle' }
    return { kind: 'game', command }
  },
  'witness-murder': (state) => {
    const { game, progress } = state
    const eligibleVerdict = game.verdict === 'infected' || game.verdict === 'forced'
    return game.phase === 'over' &&
      !game.proxied &&
      game.kissed &&
      eligibleVerdict &&
      !progress.witnessedMurder
      ? { kind: 'witness-murder' }
      : null
  },
  'close-game': (state) => (state.game.phase === 'over' ? { kind: 'close-game' } : null),
}

/** Translates a canonical Contagion use into the encounter reducer's vocabulary. */
export function contagionCommandFor(
  state: ContagionSurfaceState,
  actionId: string,
): ContagionSurfaceCommand | null {
  return COMMAND_RESOLVERS[actionId]?.(state) ?? null
}

export function contagionActionAvailability(
  state: ContagionSurfaceState,
  reasons: ContagionSurfaceReasons,
  actionId: string,
): AbilitySurfaceActionAvailability {
  if (contagionCommandFor(state, actionId)) return { executable: true }
  if (actionId === 'ask')
    return {
      executable: false,
      reason: state.game.questions.length ? reasons.phaseUnavailable : reasons.noQuestion,
    }
  if (actionId === 'stake')
    return {
      executable: false,
      reason: state.game.graveyard.length ? reasons.phaseUnavailable : reasons.noCard,
    }
  if (actionId === 'play-technique')
    return {
      executable: false,
      reason: state.techniquePage ? reasons.phaseUnavailable : reasons.noTechnique,
    }
  if (actionId === 'record-kill') return { executable: false, reason: reasons.choiceRequired }
  if (
    ['open-game', 'refuse-stake', 'leave-table', 'settle', 'close-game', 'witness-murder'].includes(
      actionId,
    )
  )
    return { executable: false, reason: reasons.phaseUnavailable }
  return { executable: false, reason: reasons.unsupported }
}

/** Live Contagion view model backed by the same state as the Morena encounter. */
export function contagionSurfaceAdapter(options: {
  presentation: AbilityPresentationProjection
  name: string
  owner: string
  reducedMotion: boolean
  state: ContagionSurfaceState
  reasons: ContagionSurfaceReasons
  execute: (command: ContagionSurfaceCommand) => void
}): AbilitySurfaceAdapter {
  return liveSurfaceAdapter({
    name: options.name,
    owner: options.owner,
    reducedMotion: options.reducedMotion,
    snapshot: () => ({
      targets: options.state.view === 'table' ? ['local-player'] : [],
      metrics: {
        phase: options.state.game.phase,
        round: options.state.game.round,
        questionsLeft: options.state.game.questions.length,
        answersLeft: options.state.game.hand.length,
        infectionSteps: options.state.progress.completedSteps.length,
        infected: options.state.progress.member !== null,
      },
    }),
    availability: (actionId) =>
      contagionActionAvailability(options.state, options.reasons, actionId),
    dispatch: (actionId) => {
      const command = contagionCommandFor(options.state, actionId)
      if (command) options.execute(command)
    },
  })
}
