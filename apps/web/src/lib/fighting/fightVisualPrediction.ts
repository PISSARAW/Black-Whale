import { interpolatedPosition } from './fightInterpolation'
import type { ArcadeFighter, FightSide, FightState } from './types'

export const FIGHT_VISUAL_PREDICTION = Symbol('fight-visual-prediction')
export type FighterVisual = Pick<
  ArcadeFighter,
  'x' | 'y' | 'velocityY' | 'facing' | 'motion' | 'pose' | 'attack' | 'crouching' | 'blocking'
>
export interface FightVisualPrediction {
  /** Identity check prevents a preview leaking into a reset, replay or other match. */
  source: FightState
  player: FighterVisual
  opponent?: Pick<FighterVisual, 'x' | 'y'>
}
export type ReadFightVisualPrediction = () => FightVisualPrediction | null

export function visualFighter(
  state: FightState,
  side: FightSide,
  prediction: FightVisualPrediction | null,
): ArcadeFighter {
  if (prediction?.source !== state || side !== 'player') return state[side]
  return { ...state.player, ...prediction.player }
}

/** Controlled bodies use the latest completed tick, eliminating one render tick of delay. */
export function responsiveFightPosition(
  state: FightState,
  side: FightSide,
  prediction: FightVisualPrediction | null = null,
): { x: number; y: number } {
  if (prediction?.source === state && prediction[side]) return prediction[side]!
  if (!state.pvpSeat && (side === 'player' || state.mode === 'versus-local')) {
    const { x, y } = state[side]
    return { x, y }
  }
  return interpolatedPosition(state, side)
}

/** The whitelist deliberately excludes health, aura, Nen, hit results, projectiles and verdicts. */
export function fighterVisual(authority: ArcadeFighter, predicted: ArcadeFighter): FighterVisual {
  const sameAttack = authority.attack?.moveId === predicted.attack?.moveId
  const attack = predicted.attack
    ? {
        ...predicted.attack,
        confirmedHit: Boolean(sameAttack && authority.attack?.confirmedHit),
        confirmedBlock: Boolean(sameAttack && authority.attack?.confirmedBlock),
        impacted: Boolean(sameAttack && authority.attack?.impacted),
      }
    : null
  return {
    x: predicted.x,
    y: predicted.y,
    velocityY: predicted.velocityY,
    facing: predicted.facing,
    motion: predicted.motion,
    pose: predicted.pose,
    crouching: predicted.crouching,
    blocking: predicted.blocking,
    attack,
  }
}
