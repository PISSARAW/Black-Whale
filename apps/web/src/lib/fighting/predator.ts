import { needleAutonomy } from './illumiState'
import { senseDeprived } from './saiyuSenses'
import { canUseHatsu } from '@black-whale/nen-engine'
import { chrolloHasActivePage, chrolloPageForMove } from './chrolloBook'
import { hatsuSealedByOn } from './onTechnique'
import { enforcePredatorSeal, predatorNenLocked, PREDATOR_SEAL_FRAMES } from './predatorSeal'
import { PREDATOR_PREY, predatorPrey, preyIsLive, preyPosition } from './predatorPrey'
import { createPredatorState, type PredatorAnalysis, type PredatorState } from './predatorTypes'
import type { ArcadeFighter, FightSide, FightState } from './types'

/** Duel abstraction: three seconds of direct study of this particular live manifestation. */
export const PREDATOR_ANALYSIS_FRAMES = 180
export const PREDATOR_AURA_COST = 40
export const PREDATOR_MAX_HUNT_FRAMES = 180

export function ownsPredator(fighter: ArcadeFighter): boolean {
  if (fighter.id === 'rihan') return true
  if (fighter.id === 'chrollo') return chrolloHasActivePage(fighter, 'rihan')
  return fighter.kurapika?.held?.used === true && fighter.kurapika.held.source === 'rihan'
}

export function isPredatorMove(fighter: ArcadeFighter, moveId?: string): boolean {
  if (fighter.id === 'rihan') return true
  return chrolloPageForMove(fighter, moveId) === 'rihan'
}

export function predatorNenAvailable(fighter: ArcadeFighter): boolean {
  if (!needleAutonomy(fighter)) return false
  return (
    ownsPredator(fighter) &&
    !predatorNenLocked(fighter) &&
    canUseHatsu(fighter.nen) &&
    !hatsuSealedByOn(fighter) &&
    fighter.hatsuEffects.hatsuStolen === 0 &&
    fighter.hatsuEffects.forcedZetsuFrames === 0 &&
    fighter.health > 0 &&
    !fighter.auraExhausted
  )
}

export function canSeePrey(
  state: FightState,
  side: FightSide,
  analysis: PredatorAnalysis,
): boolean {
  const viewer = state[side]
  const owner = state[analysis.owner]
  if (senseDeprived(viewer, 'sight') || viewer.hitStun > 0 || viewer.knockdownFrames > 0)
    return false
  const hidden = owner.nen.in || (analysis.preyId === 'bungee-gum' && state.bungeeGum?.hidden)
  if (hidden && !viewer.nen.gyo) return false
  const point = preyPosition(state, analysis.owner, analysis.preyId)
  return Math.abs(viewer.x - point.x) <= 80 && (point.x - viewer.x) * viewer.facing >= -2
}

export function predatorReady(state: FightState, side: FightSide): boolean {
  const fighter = state[side]
  const analysis = fighter.predator?.analysis
  if (!analysis || fighter.predator?.hunt || !predatorNenAvailable(fighter)) return false
  return (
    analysis.observedFrames >= PREDATOR_ANALYSIS_FRAMES &&
    fighter.aura >= PREDATOR_AURA_COST &&
    preyIsLive(state, analysis.owner, analysis.preyId)
  )
}

export function beginPredatorAnalysis(state: FightState, side: FightSide): FightState {
  const fighter = state[side]
  const predator = fighter.predator ?? createPredatorState()
  if (!predatorNenAvailable(fighter) || predator.hunt) return state
  return { ...state, [side]: { ...fighter, predator: { ...predator, watching: true } } }
}

export function choosePredatorPrey(
  state: FightState,
  side: FightSide,
  direction: -1 | 1,
): FightState {
  const fighter = state[side]
  const predator = fighter.predator ?? createPredatorState()
  if (!predatorNenAvailable(fighter) || predator.hunt || !predator.known.length) return state
  const at = predator.analysis ? predator.known.indexOf(predator.analysis.preyId) : -1
  const preyId = predator.known[(at + direction + predator.known.length) % predator.known.length]
  if (predator.analysis?.preyId === preyId) return beginPredatorAnalysis(state, side)
  return {
    ...state,
    [side]: {
      ...fighter,
      predator: {
        ...predator,
        watching: true,
        analysis: { owner: side === 'player' ? 'opponent' : 'player', preyId, observedFrames: 0 },
      },
    },
  }
}

export function launchPredator(state: FightState, side: FightSide): FightState {
  if (!predatorReady(state, side)) return state
  const fighter = state[side]
  const predator = fighter.predator!
  return {
    ...state,
    [side === 'player' ? 'opponent' : 'player']: {
      ...state[side === 'player' ? 'opponent' : 'player'],
      hatsuEffects: {
        ...state[side === 'player' ? 'opponent' : 'player'].hatsuEffects,
        witnessedHatsu: 'rihan',
      },
    },
    [side]: {
      ...fighter,
      aura: fighter.aura - PREDATOR_AURA_COST,
      predator: {
        ...predator,
        watching: false,
        hunt: { ...predator.analysis!, x: fighter.x, y: fighter.y + 7, age: 0 },
      },
    },
  }
}

export function advancePredator(state: FightState): FightState {
  if (state.phase !== 'fighting') return state
  return advanceForSide(advanceForSide(state, 'player'), 'opponent')
}

function advanceForSide(state: FightState, side: FightSide): FightState {
  const fighter = state[side]
  const predator = fighter.predator
  if (!predator) return state
  if (!predatorNenAvailable(fighter)) return suspendPredator(state, side)
  if (predator.hunt) return advanceHunt(state, side)
  if (!predator.watching) return state
  return studyPrey(state, side, predator)
}

function suspendPredator(state: FightState, side: FightSide): FightState {
  const fighter = state[side]
  const predator = fighter.predator!
  if (!predator.watching && !predator.hunt) return state
  return {
    ...state,
    [side]: { ...fighter, predator: { ...predator, watching: false, hunt: null } },
  }
}

function studyPrey(state: FightState, side: FightSide, predator: PredatorState): FightState {
  const owner: FightSide = side === 'player' ? 'opponent' : 'player'
  const seen = PREDATOR_PREY.filter((prey) => preyIsLive(state, owner, prey.id))
    .map((prey) => ({ owner, preyId: prey.id, observedFrames: 0 }))
    .filter((prey) => canSeePrey(state, side, prey))
  const known = [...new Set([...predator.known, ...seen.map((prey) => prey.preyId)])]
  const analysis = predator.analysis ?? seen[0] ?? null
  const visible = analysis && seen.some((prey) => prey.preyId === analysis.preyId)
  const studied =
    analysis && visible
      ? {
          ...analysis,
          observedFrames: Math.min(PREDATOR_ANALYSIS_FRAMES, analysis.observedFrames + 1),
        }
      : analysis
  return {
    ...state,
    [side]: { ...state[side], predator: { ...predator, known, analysis: studied } },
  }
}

function advanceHunt(state: FightState, side: FightSide): FightState {
  const fighter = state[side]
  const hunt = fighter.predator!.hunt!
  if (!preyIsLive(state, hunt.owner, hunt.preyId) || hunt.age >= PREDATOR_MAX_HUNT_FRAMES)
    return suspendPredator(state, side)
  const point = preyPosition(state, hunt.owner, hunt.preyId)
  const distance = Math.hypot(point.x - hunt.x, point.y - hunt.y)
  if (distance <= 2) return consumePrey(state, side)
  const step = Math.min(0.8, distance)
  const next = {
    ...hunt,
    x: hunt.x + ((point.x - hunt.x) / distance) * step,
    y: hunt.y + ((point.y - hunt.y) / distance) * step,
    age: hunt.age + 1,
  }
  return { ...state, [side]: { ...fighter, predator: { ...fighter.predator!, hunt: next } } }
}

function consumePrey(state: FightState, side: FightSide): FightState {
  const fighter = state[side]
  const predator = fighter.predator!
  const hunt = predator.hunt!
  const consumed = predatorPrey(hunt.preyId).consume(state, hunt.owner)
  return {
    ...consumed,
    [side]: enforcePredatorSeal({
      ...consumed[side],
      predator: {
        ...predator,
        watching: false,
        analysis: null,
        hunt: null,
        sealFrames: PREDATOR_SEAL_FRAMES,
        successes: predator.successes + 1,
      },
    }),
  }
}
