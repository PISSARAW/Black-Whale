import { finishFight } from './combatVerdict'
import { fightFormat } from './formats'
import { hurtboxes } from './frameData'
import { wakeHanzoBody } from './hanzoProjection'
import { nenDamageFactor } from './nen'
import type { RisingSun } from './feitanPain'
import type { ArcadeFighter, FightSide, FightState } from './types'

export const SUN_PULSE_FRAMES = 15
const SIDES = ['player', 'opponent'] as const

/** Numbers are duel tuning, not a claim that the manga fixes radii or durations. */
export function createRisingSun(fighter: ArcadeFighter, injuries: number): RisingSun {
  const pain = Math.min(100, injuries)
  return {
    x: fighter.x,
    y: fighter.y + 18,
    radius: 12 + pain * 0.25,
    damage: 2 + pain * 0.12,
    age: 0,
    duration: 120 + Math.round(pain * 2),
    scored: [],
  }
}

/** A circular area intersects the real body, including Hanzo's sleeping body. */
export function inSolarHeat(fighter: ArcadeFighter, sun: RisingSun): boolean {
  return hurtboxes(fighter).some((body) => {
    const x = Math.max(body.left, Math.min(body.right, sun.x))
    const y = Math.max(body.bottom, Math.min(body.top, sun.y))
    return Math.hypot(x - sun.x, y - sun.y) <= sun.radius
  })
}

/** Resolve both suns before judging, so simultaneous burns can produce a draw. */
export function resolveSolarHeat(state: FightState): FightState {
  const pulses = SIDES.flatMap((owner) => {
    const sun = state[owner].hatsuEffects.painPacker?.sun
    return sun && sun.age > 0 && sun.age % SUN_PULSE_FRAMES === 0 ? [{ owner, sun }] : []
  })
  if (pulses.length === 0) return state
  const heated = pulses.reduce((next, pulse) => burnArea(next, pulse), state)
  return judgeHeat(heated)
}

function burnArea(state: FightState, pulse: { owner: FightSide; sun: RisingSun }): FightState {
  let next = state
  const scored = [...pulse.sun.scored]
  for (const side of SIDES) {
    const fighter = next[side]
    if (fighter.hatsuEffects.painPacker?.armour || !inSolarHeat(fighter, pulse.sun)) continue
    const damage = Math.max(1, Math.round(pulse.sun.damage * nenDamageFactor(fighter, 'torso')))
    next = {
      ...next,
      [side]: { ...wakeHanzoBody(fighter), health: Math.max(0, fighter.health - damage) },
    }
    if (side !== pulse.owner && !scored.includes(side)) {
      scored.push(side)
      next = { ...next, score: { ...next.score, [pulse.owner]: next.score[pulse.owner] + 1 } }
    }
  }
  const owner = next[pulse.owner]
  const pain = owner.hatsuEffects.painPacker!
  return {
    ...next,
    [pulse.owner]: {
      ...owner,
      hatsuEffects: {
        ...owner.hatsuEffects,
        painPacker: { ...pain, sun: { ...pulse.sun, scored } },
      },
    },
  }
}

function judgeHeat(state: FightState): FightState {
  if (state.mode === 'training') {
    return {
      ...state,
      player: restoreTrainingHealth(state.player),
      opponent: restoreTrainingHealth(state.opponent),
    }
  }
  const format = fightFormat(state.formatId)
  const next = format.victory === 'points' ? preservePointHealth(state) : state
  const playerLost = heatLoss(next, 'player')
  const opponentLost = heatLoss(next, 'opponent')
  if (playerLost && opponentLost) {
    return { ...next, phase: 'finished', winner: 'draw', finishReason: playerLost }
  }
  if (playerLost) return finishFight(next, 'opponent', playerLost)
  return opponentLost ? finishFight(next, 'player', opponentLost) : next
}

function restoreTrainingHealth(fighter: ArcadeFighter): ArcadeFighter {
  return fighter.health > 0 ? fighter : { ...fighter, health: fighter.maxHealth }
}

function preservePointHealth(state: FightState): FightState {
  return {
    ...state,
    player: { ...state.player, health: Math.max(1, state.player.health) },
    opponent: { ...state.opponent, health: Math.max(1, state.opponent.health) },
  }
}

function heatLoss(state: FightState, side: FightSide): 'knockout' | 'hits' | null {
  const format = fightFormat(state.formatId)
  if (format.victory !== 'points' && state[side].health <= 0) return 'knockout'
  const opponent = side === 'player' ? 'opponent' : 'player'
  return format.hitTarget !== null && state.score[opponent] >= format.hitTarget ? 'hits' : null
}
