import { categoryPower } from '../nenCategories'
import { attackPhase } from '../frameData'
import {
  BUNGEE_REST_DISTANCE,
  hisokaNenActive,
  hisokaTechnique,
  hisokaTechniqueAllowed,
} from '../hisokaTechnique'
import type { ArcadeFighter, FightSide, FightState } from '../types'
import { unchangedTrigger, type FighterHatsu } from './contract'

export { BUNGEE_REST_DISTANCE } from '../hisokaTechnique'

const ELASTIC_RECOVERY = 0.14
const MIN_PULL = 0.6
const SIDES = ['player', 'opponent'] as const

/** Ch. 55: sticky elastic aura and a separate surface disguise, never teleportation or evasion. */
export const hisokaHatsu: FighterHatsu = {
  id: 'hisoka',
  onTrigger: unchangedTrigger,
  onImpact: ({ state, side, defenderSide, moveId, blocked, concealed }) => {
    if (blocked || !hisokaNenActive(state[side])) return state
    const technique = hisokaTechnique(state[side], moveId)
    if (technique === 'finish')
      return state.bungeeGum?.owner === side ? { ...state, bungeeGum: null } : state
    if (technique !== 'attach') return state
    return {
      ...state,
      bungeeGum: { owner: side, target: defenderSide, hidden: concealed, retracting: false },
    }
  },
  onFrame: (state) => reelIn(SIDES.reduce(advanceTechnique, state)),
}

function advanceTechnique(state: FightState, side: FightSide): FightState {
  const fighter = state[side]
  if (fighter.textureSurprise && !hisokaNenActive(fighter))
    return { ...state, [side]: { ...fighter, textureSurprise: undefined } }
  const pending = activeTechnique(fighter)
  if (!pending || !hisokaTechniqueAllowed(state, side, pending.attack.moveId)) return state
  const { attack, technique } = pending
  if (technique === 'finish') {
    // This composed card strike reels in its attached target and consumes
    // the link only when it actually lands.
    return { ...state, bungeeGum: { ...state.bungeeGum!, retracting: true, rebounding: false } }
  }
  const committed = { ...fighter, attack: { ...attack, impacted: true } }
  if (technique === 'texture')
    return { ...state, [side]: { ...committed, textureSurprise: { surface: 'cloth' } } }
  return {
    ...state,
    [side]: committed,
    bungeeGum: { ...state.bungeeGum!, retracting: true, rebounding: technique === 'rebound' },
  }
}

function activeTechnique(fighter: ArcadeFighter) {
  const attack = fighter.attack
  if (!attack || attack.kind !== 'special' || attack.hatsuSource !== 'hisoka' || attack.impacted)
    return null
  if (attackPhase(fighter) !== 'active') return null
  const technique = hisokaTechnique(fighter, attack.moveId)
  return technique && technique !== 'attach' ? { attack, technique } : null
}

function reelIn(state: FightState): FightState {
  const gum = state.bungeeGum
  if (!gum) return state
  const owner = state[gum.owner]
  const target = state[gum.target]
  if (!hisokaNenActive(owner) || target.health <= 0) return { ...state, bungeeGum: null }
  if (!gum.retracting) return state
  if (retractionInterrupted(owner))
    return { ...state, bungeeGum: { ...gum, retracting: false, rebounding: false } }
  const stretch = Math.abs(target.x - owner.x) - BUNGEE_REST_DISTANCE
  if (stretch <= 0) return { ...state, bungeeGum: { ...gum, retracting: false, rebounding: false } }
  const pull = Math.min(stretch, Math.max(MIN_PULL, stretch * ELASTIC_RECOVERY * categoryPower(owner, 'transmuter')))
  const direction = target.x >= owner.x ? 1 : -1
  const side = gum.rebounding ? gum.owner : gum.target
  const moving = state[side]
  return {
    ...state,
    [side]: { ...moving, x: clamp(moving.x + (gum.rebounding ? direction : -direction) * pull) },
  }
}

function retractionInterrupted(owner: ArcadeFighter): boolean {
  return owner.hitStun > 0 || owner.knockdownFrames > 0 || owner.blockStun > 0
}

function clamp(value: number): number {
  return Math.min(93, Math.max(7, value))
}
