import { forgetArenaVacuum, ejectArenaVacuum } from './arenaVacuum'
import { swallowPaperScatter } from './kallutoScatterVacuum'
import { attackData, attackPhase } from './frameData'
import { sleepingBody } from './hanzoProjection'
import { recordFightDeath } from './fightDeaths'
import { resolveFightOutcome } from './fightOutcome'
import {
  blinkyAvailable,
  blinkyCommand,
  blinkyNozzleY,
  blinkyState,
  inBlinkyNozzle,
  exposedBlinkyWounds,
  BLINKY_BLOOD_DAMAGE,
  BLINKY_BLOOD_INTERVAL,
} from './blinky'
import type { FightSide, FightState } from './types'

export function advanceBlinky(state: FightState): FightState {
  const next = stepBlinky(stepBlinky(state, 'player'), 'opponent')
  return next.deaths !== state.deaths ? resolveFightOutcome(next) : next
}
function stepBlinky(state: FightState, side: FightSide): FightState {
  const fighter = state[side]
  const command = blinkyCommand(fighter)
  if (command && fighter.attack && !blinkyAvailable(fighter))
    return {
      ...state,
      [side]: {
        ...fighter,
        attack: null,
        bufferedAttack: null,
        hatsuEffects: { ...fighter.hatsuEffects, blinkyFrames: 0 },
      },
    }
  const active = blinkyAvailable(fighter) && command && attackPhase(fighter) === 'active'
  if (!active)
    return fighter.hatsuEffects.blinkyFrames > 0
      ? {
          ...state,
          [side]: { ...fighter, hatsuEffects: { ...fighter.hatsuEffects, blinkyFrames: 0 } },
        }
      : state
  const data = attackData('special', fighter)
  const elapsed = fighter.attack!.frame - data.startup
  const next = {
    ...state,
    [side]: {
      ...fighter,
      hatsuEffects: { ...fighter.hatsuEffects, blinkyFrames: data.active - elapsed },
    },
  }
  if (command === 'eject') return eject(next, side)
  return command === 'blood' ? drawBlood(next, side, elapsed) : swallow(next, side)
}
function swallow(state: FightState, side: FightSide): FightState {
  const fighter = state[side]
  const memory = blinkyState(fighter)
  const swallowed = state.projectiles
    .filter(
      (shot) =>
        shot.matter === 'object' &&
        !shot.living &&
        shot.shape === memory.target &&
        inBlinkyNozzle(fighter, shot),
    )
    .sort((a, b) => Math.abs(a.x - fighter.x) - Math.abs(b.x - fighter.x) || a.id - b.id)
  if (!swallowed.length) return swallowPaperScatter(state, side)
  state = forgetArenaVacuum(state, side)
  const ids = new Set(swallowed.map((shot) => shot.id))
  const lastObject = {
    ...swallowed[swallowed.length - 1],
    kallutoPaper: undefined,
    paperOwner: undefined,
    paperTarget: undefined,
    nenPower: 1,
    hatsuPower: 1,
    shuCharged: false,
    shuFrames: undefined,
    concealed: false,
  }
  return {
    ...state,
    projectiles: state.projectiles.filter((shot) => !ids.has(shot.id)),
    [side]: {
      ...fighter,
      blinky: { ...memory, lastObject, lastWasBlood: false, lastArenaObject: undefined },
    },
  }
}
function eject(state: FightState, side: FightSide): FightState {
  const fighter = state[side]
  const memory = blinkyState(fighter)
  if (fighter.attack!.projectileSpawned) return state
  if (memory.lastArenaObject) {
    const next = ejectArenaVacuum(state, side)
    return {
      ...next,
      [side]: { ...next[side], attack: { ...next[side].attack!, projectileSpawned: true } },
    }
  }
  if (memory.lastWasBlood)
    return {
      ...state,
      [side]: {
        ...fighter,
        blinky: { ...memory, lastObject: undefined, lastWasBlood: false },
        attack: { ...fighter.attack!, projectileSpawned: true },
      },
    }
  if (!memory.lastObject) return state
  const shot = memory.lastObject
  return {
    ...state,
    nextProjectileId: state.nextProjectileId + 1,
    projectiles: [
      ...state.projectiles,
      {
        ...shot,
        id: state.nextProjectileId,
        owner: side,
        x: fighter.x + fighter.facing * 3.4,
        y: blinkyNozzleY(fighter),
        targetZone: 'torso',
        velocityX: fighter.facing * Math.abs(shot.velocityX),
        age: 0,
        lifetime: 120,
      },
    ],
    [side]: {
      ...fighter,
      blinky: { ...memory, lastObject: undefined },
      attack: { ...fighter.attack!, projectileSpawned: true },
    },
  }
}
function drawBlood(state: FightState, side: FightSide, elapsed: number): FightState {
  if (elapsed % BLINKY_BLOOD_INTERVAL !== 0) return state
  const target = side === 'player' ? 'opponent' : 'player'
  const defender = state[target]
  const body = sleepingBody(defender)
  if (!inBlinkyNozzle(state[side], { x: body.x, y: body.y + 6.1 })) return state
  const wounds = exposedBlinkyWounds(defender)
  if (!wounds || defender.health <= 0) return state
  state = forgetArenaVacuum(state, side)
  const next = {
    ...state,
    [side]: {
      ...state[side],
      blinky: {
        ...blinkyState(state[side]),
        lastObject: undefined,
        lastWasBlood: true,
        lastArenaObject: undefined,
      },
    },
    [target]: { ...defender, health: Math.max(0, defender.health - BLINKY_BLOOD_DAMAGE * wounds) },
  }
  return recordFightDeath(next, { victimSide: target, killerSide: side, cause: 'blood' })
}
