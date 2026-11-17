import { fighterDefinition } from './roster'
import { movesetFor } from './movesets'
import { fightingStyle } from './fightStyles'
import { styleMatchup } from './styleMatchups'
import { REPLAY_RULESET } from './fightReplayTypes'
import type { FighterId, FightSide, FightState } from './types'
import type { TrainingPosition, TrainingSettings } from './trainingTypes'

export interface ExchangeTrial {
  id: string
  title: readonly [string, string]
  instructions: readonly [string, string]
  position: TrainingPosition
  dummy: Partial<TrainingSettings['dummy']>
}

export const EXCHANGE_TRIALS: readonly ExchangeTrial[] = [
  {
    id: 'spacing',
    title: ['Distance et coups ratés', 'Spacing and whiffs'],
    position: 'center',
    dummy: { behavior: 'manual', delay: 0 },
    instructions: [
      'À deux joueurs, faire manquer un lourd puis avancer pour punir sa récupération. Alterner les rôles et les distances.',
      'With two players, bait a heavy whiff then step in to punish recovery. Swap roles and distances.',
    ],
  },
  {
    id: 'approach',
    title: ['Approche et anti-air', 'Approach and anti-air'],
    position: 'center',
    dummy: { behavior: 'manual', delay: 0 },
    instructions: [
      'Comparer marche, dash et saut contre un lourd debout. Vérifier le coût d’une approche prévisible et changer de rôle.',
      'Compare walking, dashing and jumping against a standing heavy. Check the cost of a predictable approach, then swap roles.',
    ],
  },
  {
    id: 'projectiles',
    title: ['Projectiles et soutien', 'Projectiles and support'],
    position: 'center',
    dummy: { behavior: 'manual', delay: 0 },
    instructions: [
      'À deux, reculer pour établir la distance de tir. Alterner tir, garde, saut et avance pendant la récupération. Un personnage sans tir conserve ses outils réels.',
      'With two players, back away to establish projectile range. Alternate shots, guard, jumps and approaches during recovery. A fighter without a projectile keeps their actual tools.',
    ],
  },
  {
    id: 'throws',
    title: ['Frappe et projection', 'Strike and throw'],
    position: 'center',
    dummy: { behavior: 'manual', delay: 0 },
    instructions: [
      'Se rapprocher, alterner frappe et projection ; répondre par déprojection ou saut. Une projection manquée doit laisser une ouverture.',
      'Move close, alternate strikes and throws; answer with a throw tech or jump. A whiffed throw must leave an opening.',
    ],
  },
  {
    id: 'corner',
    title: ['Pression au coin', 'Corner pressure'],
    position: 'right',
    dummy: { behavior: 'guard-after-hit', delay: 0 },
    instructions: [
      'Avancer jusqu’au contact, confirmer une route puis répéter les légers. La garde doit revenir après une longue chaîne physique ; inverser les côtés pour le second essai.',
      'Move into range, confirm a route then repeat jabs. Guard must return after a long physical string; reverse sides for the second trial.',
    ],
  },
  {
    id: 'wakeup',
    title: ['Mise au sol et relevée', 'Knockdown and wakeup'],
    position: 'center',
    dummy: { behavior: 'reversal', action: 'light', delay: 0 },
    instructions: [
      'Projeter le mannequin puis comparer attaque immédiate et attaque retardée sur sa relevée. Sa riposte utilise son léger réel, sans invulnérabilité ajoutée.',
      'Throw the dummy, then compare immediate and delayed wakeup pressure. Its response uses its actual jab, without added invulnerability.',
    ],
  },
  {
    id: 'preparation',
    title: ['Préparation et interruption', 'Setup and interruption'],
    position: 'center',
    dummy: { behavior: 'manual', delay: 0 },
    instructions: [
      'À deux, tester le pouvoir avec son équipement et ses conditions réels, puis tenter de couper la préparation. Sans prérequis, constater le refus ; aucun allié ni pouvoir n’est accordé par cet essai.',
      'With two players, test the ability with its actual equipment and conditions, then try to interrupt its setup. Without prerequisites, observe the refusal; this trial grants no ally or ability.',
    ],
  },
]

/** Base duel parameters; temporary Nen modifiers are deliberately outside this comparison. */
export function exchangeFighterProfile(id: FighterId) {
  const fighter = fighterDefinition(id)
  const jab = movesetFor(id)!.moves.find((move) => move.slot === 'standingLight')!
  return {
    id,
    name: fighter.name,
    ...styleMatchup(id),
    jab: { startup: jab.tuning.startup, reach: jab.tuning.reach, recovery: jab.tuning.recovery },
    walk: Math.round(fighter.speed * fightingStyle(id).moveScale * 28 * 10) / 10,
  }
}

export type ExchangeObservation = 'opening' | 'locked' | 'unclear'
export interface ExchangeNote {
  trial: string
  player: FighterId
  opponent: FighterId
  stage: string
  frame: number
  observation: ExchangeObservation
  comment: string
  resources: TrainingSettings['resources']
  dummy: TrainingSettings['dummy']
  lastContact?: { attacker: FightSide; contactFrame: number; blocked: boolean; advantage: number }
}

/** Human observations remain distinct from automated balance evidence. No private combat snapshot. */
export function recordExchangeNote(options: {
  state: FightState
  trial: string
  observation: ExchangeObservation
  comment: string
}): ExchangeNote | null {
  const { state } = options
  if (state.mode !== 'training' || !state.training) return null
  if (!EXCHANGE_TRIALS.some((trial) => trial.id === options.trial)) return null
  const measurement = state.training.measurement
  return {
    trial: options.trial,
    player: state.player.id,
    opponent: state.opponent.id,
    stage: state.environment.stageId,
    frame: state.frame,
    observation: options.observation,
    comment: options.comment.slice(0, 800),
    resources: structuredClone(state.training.settings.resources),
    dummy: { ...state.training.settings.dummy },
    lastContact:
      measurement?.status === 'complete'
        ? {
            attacker: measurement.attacker,
            contactFrame: measurement.contactFrame,
            blocked: measurement.blocked,
            advantage: measurement.advantage!,
          }
        : undefined,
  }
}

export function exchangeStudyReport(notes: readonly ExchangeNote[]) {
  return {
    version: 1,
    ruleset: REPLAY_RULESET,
    evidence: 'human-observation',
    notes: notes.slice(-40),
  }
}
