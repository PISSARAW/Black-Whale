import { beginFight, createFight } from './engine'
import type { FightState, FighterId } from './types'
import type { FightStageId } from './stages'

export const ARCADE_ENCOUNTERS: readonly {
  opponent: FighterId
  stage: FightStageId
  title: readonly [string, string]
  lesson: readonly [string, string]
}[] = [
  {
    opponent: 'hisoka',
    stage: 'heavens-arena',
    title: ['1 · Distance et engagement', '1 · Spacing and commitment'],
    lesson: [
      'Fais manquer puis réponds ; repérer une gomme ne la retire pas.',
      'Bait whiffs and respond; detecting gum does not remove it.',
    ],
  },
  {
    opponent: 'franklin',
    stage: 'whale-hold',
    title: ['2 · Approcher sous les tirs', '2 · Approach under fire'],
    lesson: [
      'Varie garde et saut ; interrompt les tirs encore à émettre.',
      'Mix guard and jumping; interrupt shots not yet released.',
    ],
  },
  {
    opponent: 'phinks',
    stage: 'observation-deck',
    title: ['3 · Contester une préparation', '3 · Contest preparation'],
    lesson: [
      'Approche pendant le moulinet et respecte le poing déjà chargé.',
      'Approach during winding and respect the charged punch.',
    ],
  },
  {
    opponent: 'hanzo',
    stage: 'screening-room',
    title: ['4 · Retrouver le corps', '4 · Find the body'],
    lesson: [
      'Le double laisse un corps endormi : un contact ou une parole audible peut le réveiller.',
      'The double leaves a sleeping body: contact or audible speech can wake it.',
    ],
  },
  {
    opponent: 'chrollo',
    stage: 'heavens-arena',
    title: ['5 · Finale : le livre', '5 · Final: the book'],
    lesson: [
      'Surveille les transitions ; les pages gardent leurs mains, coûts et prérequis.',
      'Watch transitions; pages retain their hand, cost and preparation requirements.',
    ],
  },
]
export interface ArcadeProgress {
  player: FighterId
  index: number
  seed: number
  complete: boolean
  failed: boolean
}
export function initialArcade(player: FighterId, seed = 61016): ArcadeProgress {
  return { player, index: 0, seed, complete: false, failed: false }
}
export function arcadeFight(progress: ArcadeProgress): FightState {
  const encounter = ARCADE_ENCOUNTERS[progress.index]
  if (!encounter || progress.complete) throw Error('arcade-complete')
  const state = beginFight(
    createFight(progress.player, encounter.opponent, {
      mode: 'versus-ai',
      formatId: 'knockout',
      environment: { stageId: encounter.stage, arenaInteractions: false },
    }),
  )
  return { ...state, rng: (progress.seed + progress.index * 7919) >>> 0 }
}
export function observeArcade(progress: ArcadeProgress, state: FightState): ArcadeProgress {
  if (progress.complete || progress.failed || !state.matchWinner) return progress
  if (
    state.player.id !== progress.player ||
    state.opponent.id !== ARCADE_ENCOUNTERS[progress.index]?.opponent
  )
    return { ...progress, failed: true }
  if (state.matchWinner === 'player' && progress.index < ARCADE_ENCOUNTERS.length - 1)
    return progress
  return state.matchWinner === 'opponent'
    ? { ...progress, failed: true }
    : { ...progress, complete: progress.index === ARCADE_ENCOUNTERS.length - 1 }
}
export function nextArcade(progress: ArcadeProgress, state: FightState): ArcadeProgress {
  if (state.matchWinner !== 'player' || progress.failed || progress.complete) return progress
  if (
    state.player.id !== progress.player ||
    state.opponent.id !== ARCADE_ENCOUNTERS[progress.index]?.opponent ||
    progress.index >= ARCADE_ENCOUNTERS.length - 1
  )
    return progress
  return { ...progress, index: progress.index + 1 }
}
