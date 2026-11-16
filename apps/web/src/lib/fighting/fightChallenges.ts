import { beginFight, createFight, performAuraAttack, performMove, tickFight } from './engine'
import { FIXED_STEP } from './fightClock'
import { readCounterplay } from './fightCounterplay'
import { EMPTY_INPUT, type FightInput, type FightState, type FighterId } from './types'

export type ChallengeId =
  'interrupt-preparation' | 'interrupt-tether' | 'protect-body' | 'reveal-in'
export interface FightChallenge {
  id: ChallengeId
  title: readonly [string, string]
  instruction: readonly [string, string]
}
export const FIGHT_CHALLENGES: readonly FightChallenge[] = [
  {
    id: 'interrupt-preparation',
    title: ['Punir une préparation', 'Punish a preparation'],
    instruction: [
      'Touche Phinks pendant son moulinet avec un vrai coup. Les tours déjà acquis ne disparaissent pas.',
      'Land a real hit during Phinks’s winding. Completed rotations remain.',
    ],
  },
  {
    id: 'interrupt-tether',
    title: ['Interrompre une traction', 'Interrupt a pull'],
    instruction: [
      'Le lien est déjà attaché. Utilise l’allonge ou un tir pour arrêter sa traction ; la gomme reste attachée.',
      'The tether is already attached. Use reach or a shot to stop pulling; gum remains attached.',
    ],
  },
  {
    id: 'protect-body',
    title: ['Protéger le corps de Hanzo', 'Protect Hanzo’s body'],
    instruction: [
      'Reviens à gauche près du corps, réintègre-le avec Hatsu puis utilise Bas + Garde contre le tir bas. Aucune balle ne doit toucher sans garde.',
      'Return left to the body, rejoin with Hatsu then crouch-guard the low shot. Do not take an unguarded hit.',
    ],
  },
  {
    id: 'reveal-in',
    title: ['Repérer In avec Gyo', 'Detect In with Gyo'],
    instruction: [
      'Maintiens Gyo une demi-seconde pour percevoir le lien caché. Le repérer ne doit pas le dissiper.',
      'Hold Gyo for half a second to perceive the hidden tether. Detecting it must not dispel it.',
    ],
  },
]
export interface ChallengeProgress {
  id: ChallengeId
  start: number
  lastFrame: number
  lastImpact: number
  held: number
  contactWitnessed: boolean
  wasPreparing: boolean
  wasPulling: boolean
  health: number
  player: FighterId
  opponent: FighterId
  complete: boolean
  failed: boolean
}
export function createChallengeFight(id: ChallengeId): FightState {
  const pair: Record<ChallengeId, [FighterId, FighterId]> = {
    'interrupt-preparation': ['hisoka', 'phinks'],
    'interrupt-tether': ['kurapika', 'hisoka'],
    'protect-body': ['hanzo', 'franklin'],
    'reveal-in': ['kurapika', 'hisoka'],
  }
  const [player, opponent] = pair[id]
  let state = beginFight(
    createFight(player, opponent, {
      mode: 'training',
      formatId: 'knockout',
      environment: { stageId: 'heavens-arena', arenaInteractions: false },
    }),
  )
  state = {
    ...state,
    player: { ...state.player, x: 44, aura: 100 },
    opponent: { ...state.opponent, x: 53, aura: 100 },
  }
  if (id === 'interrupt-preparation')
    return performMove({ state, side: 'opponent', action: 'special' })
  if (id === 'protect-body') return sleepingBodyScenario(state)
  if (id === 'interrupt-tether')
    state = {
      ...state,
      player: { ...state.player, x: 18 },
      opponent: { ...state.opponent, x: 82, aura: 60 },
    }
  return {
    ...state,
    bungeeGum: {
      owner: 'opponent',
      target: 'player',
      hidden: id === 'reveal-in',
      retracting: id === 'interrupt-tether',
    },
  }
}
function sleepingBodyScenario(state: FightState): FightState {
  state = { ...state, player: { ...state.player, x: 36 }, opponent: { ...state.opponent, x: 75 } }
  state = performMove({ state, side: 'player', action: 'special' })
  state = advance(state, 25)
  state = advance(state, 12, { right: true })
  state = performAuraAttack({
    state,
    side: 'opponent',
    kind: 'special',
    moveId: 'franklin:downSpecial',
    auraCharged: false,
  })
  for (let frame = 0; frame < 40 && !state.projectiles.length; frame++) state = advance(state, 1)
  return state
}
function advance(state: FightState, count: number, input: Partial<FightInput> = {}): FightState {
  for (let i = 0; i < count; i++)
    state = tickFight(
      state,
      { ...EMPTY_INPUT, ...input },
      { dt: FIXED_STEP, opponentInput: EMPTY_INPUT, ai: false },
    )
  return state
}
export function initialChallengeProgress(id: ChallengeId, state: FightState): ChallengeProgress {
  return {
    id,
    start: state.frame,
    lastFrame: state.frame,
    lastImpact: state.impact?.sequence ?? 0,
    held: 0,
    contactWitnessed: false,
    wasPreparing: Boolean(state.opponent.cyclotronWindup),
    wasPulling: Boolean(state.bungeeGum?.retracting),
    health: state.player.health,
    player: state.player.id,
    opponent: state.opponent.id,
    complete: false,
    failed: false,
  }
}
export function observeChallenge(
  progress: ChallengeProgress,
  state: FightState,
): ChallengeProgress {
  if (progress.complete || progress.failed || state.frame === progress.lastFrame) return progress
  if (cannotContinueChallenge(progress, state)) return { ...progress, failed: true }
  const passed = challengePassed(progress, state)
  const held = passed ? progress.held + state.frame - progress.lastFrame : 0
  return {
    ...progress,
    lastFrame: state.frame,
    lastImpact: state.impact?.sequence ?? progress.lastImpact,
    held,
    contactWitnessed: progress.contactWitnessed || witnessedInterruption(progress, state),
    wasPreparing: Boolean(state.opponent.cyclotronWindup),
    wasPulling: Boolean(state.bungeeGum?.retracting),
    complete: challengeComplete(progress, { passed, held }),
  }
}
function cannotContinueChallenge(p: ChallengeProgress, s: FightState): boolean {
  const invalid =
    s.player.id !== p.player ||
    s.opponent.id !== p.opponent ||
    s.mode !== 'training' ||
    s.frame < p.lastFrame
  return (
    invalid ||
    (p.id === 'protect-body' && s.player.health < p.health && !s.impact?.blocked) ||
    s.frame - p.start > 1200
  )
}
function challengeComplete(
  p: ChallengeProgress,
  result: { passed: boolean; held: number },
): boolean {
  return result.passed && (p.id !== 'reveal-in' || result.held >= 30)
}
function newImpact(p: ChallengeProgress, s: FightState) {
  const hit = s.impact
  return hit && hit.sequence !== p.lastImpact && !hit.avoided ? hit : null
}
function playerHit(p: ChallengeProgress, s: FightState): boolean {
  const hit = newImpact(p, s)
  return Boolean(hit && hit.attacker === 'player' && !hit.blocked)
}
function witnessedInterruption(p: ChallengeProgress, s: FightState): boolean {
  if (!playerHit(p, s)) return false
  return p.id === 'interrupt-preparation'
    ? p.wasPreparing
    : p.id === 'interrupt-tether' && p.wasPulling
}
const CHALLENGE_CHECKS: Record<ChallengeId, (p: ChallengeProgress, s: FightState) => boolean> = {
  'reveal-in': (_p, s) =>
    Boolean(
      s.bungeeGum?.hidden && s.player.nen.gyo && readCounterplay(s, 'player')?.kind === 'tether',
    ),
  'interrupt-preparation': (p, s) =>
    (p.contactWitnessed || witnessedInterruption(p, s)) && !s.opponent.cyclotronWindup,
  'interrupt-tether': (p, s) =>
    (p.contactWitnessed || witnessedInterruption(p, s)) &&
    Boolean(s.bungeeGum && !s.bungeeGum.retracting),
  'protect-body': (p, s) =>
    !s.player.hanzoProjection &&
    newImpact(p, s)?.attacker === 'opponent' &&
    Boolean(s.impact?.blocked),
}
function challengePassed(progress: ChallengeProgress, state: FightState): boolean {
  return CHALLENGE_CHECKS[progress.id](progress, state)
}
