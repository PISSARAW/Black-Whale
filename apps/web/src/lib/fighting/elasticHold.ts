import { gumNetwork, ownedGumLinks, withGumNetwork } from './bungeeNetwork'
import { hisokaUtilityMove } from './hisokaTechnique'
import { attackData } from './frameData'
import { FIGHT_FPS } from './fightClock'
import type { FightSide, FightState } from './types'

/**
 * Tension élastique (Élastique meurtrier, signatureCombos.ts): while Hisoka works a Bungee
 * Gum link that holds an opponent already caught in his combo (recall, rebound, a link in
 * motion, a gum cast, or the flight that follows a rebound), the opponent's hitstun and knockdown do not run out. A combo may
 * spend at most ELASTIC_HOLD_FRAMES this way; the budget refills once the combo ends.
 * Duel tuning, not canon.
 */
export const ELASTIC_HOLD_FRAMES = 132
const SIDES = ['player', 'opponent'] as const

/** Height the diving Aerial Axe aims to reach when its active frames begin. */
const DIVE_ARRIVAL_HEIGHT = 4

export function advanceElasticHold(state: FightState): FightState {
  return SIDES.reduce((current, side) => holdFor(diveFor(current, side), side), state)
}

/**
 * The Aerial Axe started during a held combo lets go of the rebound's anchor, drops onto the
 * target and takes back the link that still holds it.
 */
function diveFor(state: FightState, side: FightSide): FightState {
  const owner = state[side]
  if (owner.id !== 'hisoka' || !owner.elasticHold || owner.y <= 0) return state
  if (owner.attack?.moveId !== 'hisoka:airHeavy' || owner.velocityY < 0) return state
  const network = gumNetwork(state)
  const remaining = Math.max(1, attackData('heavy', owner).startup - owner.attack.frame)
  const velocityY = (-(owner.y - DIVE_ARRIVAL_HEIGHT) * FIGHT_FPS) / remaining
  const released = network.links.filter((link) => link.owner === side && link.motion === 'rebound')
  const held = network.links.find(
    (link) => link.owner === side && link.target.kind === 'fighter' && link.target.side !== side,
  )
  return withGumNetwork(
    { ...state, [side]: { ...owner, velocityY: Math.min(-1, velocityY) } },
    {
      ...network,
      links: network.links.filter((link) => !released.includes(link)),
      selected: held ? { ...network.selected, [side]: held.id } : network.selected,
    },
  )
}

function holdFor(state: FightState, side: FightSide): FightState {
  const owner = state[side]
  const targetSide = side === 'player' ? 'opponent' : 'player'
  const target = state[targetSide]
  if (owner.id !== 'hisoka') return state
  if (target.comboHits === 0) return owner.elasticHold ? clearHold(state, side) : state
  const spent = owner.elasticHold ?? 0
  if (spent >= ELASTIC_HOLD_FRAMES || !holding(state, side, targetSide)) return state
  return {
    ...state,
    [side]: { ...owner, elasticHold: spent + 1 },
    [targetSide]: {
      ...target,
      hitStun: target.hitStun > 0 ? target.hitStun + 1 : 0,
      knockdownFrames: target.knockdownFrames > 0 ? target.knockdownFrames + 1 : 0,
    },
  }
}

function holding(state: FightState, side: FightSide, targetSide: FightSide): boolean {
  const target = state[targetSide]
  if (target.hitStun === 0 && target.knockdownFrames === 0) return false
  const links = ownedGumLinks(state, side)
  const tied = links.some(
    (link) => link.target.kind === 'fighter' && link.target.side === targetSide,
  )
  if (!tied) return false
  return (
    hisokaUtilityMove(state[side]) ||
    Boolean(gumNetwork(state).pending[side]) ||
    state[side].y > 0 ||
    links.some((link) => link.motion !== 'idle')
  )
}

function clearHold(state: FightState, side: FightSide): FightState {
  return { ...state, [side]: { ...state[side], elasticHold: undefined } }
}
