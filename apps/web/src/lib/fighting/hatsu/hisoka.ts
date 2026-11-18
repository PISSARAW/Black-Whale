import { ownsBungeeGum } from '../hisokaArsenal'
import { withGumChannel } from '../bungeeChannel'
import { newGumSource } from '../bungeeSource'
import { maintainTextureSurprise } from '../hisokaTextureOrigin'
import { advanceGumArsenal } from '../hisokaArsenal'
import { advanceGumObjectAnchors } from '../gumObjectAnchorFrames'
import { categoryPower } from '../nenCategories'
import { chainAbilitySealed } from '../kurapika'
import { attackPhase } from '../frameData'
import { addGumLink, moveGumLink, removeGumLinks } from '../bungeeNetwork'
import { commandGumLink as selectedGumLink } from '../bungeeScoped'
import { advanceGumNetwork } from '../bungeeMotion'
import { armGumRecall } from '../bungeeProjectiles'
import {
  BUNGEE_REST_DISTANCE,
  hisokaNenActive,
  hisokaTechnique,
  hisokaTechniqueAllowed,
} from '../hisokaTechnique'
import type { ArcadeFighter, FightSide, FightState } from '../types'
import { unchangedTrigger, type FighterHatsu, type HatsuImpactContext } from './contract'

export { BUNGEE_REST_DISTANCE } from '../hisokaTechnique'

const ELASTIC_RECOVERY = 0.14
const MIN_PULL = 0.6
const SIDES = ['player', 'opponent'] as const

/** Ch. 55: sticky elastic aura and a separate surface disguise, never teleportation or evasion. */
export const hisokaHatsu: FighterHatsu = {
  id: 'hisoka',
  onTrigger: unchangedTrigger,
  onImpact: (context) =>
    withGumChannel(
      context.state,
      {
        side: context.side,
        ...(context.state[context.side].attack?.nenOrigin ??
          newGumSource(context.state[context.side])),
      },
      (state) => applyGumImpact({ ...context, state }),
    ),
  onFrame: (state) =>
    advanceGumObjectAnchors(
      advanceGumArsenal(advanceGumMotion(SIDES.reduce(advanceTechnique, state))),
    ),
}

function applyGumImpact({
  state,
  side,
  defenderSide,
  moveId,
  blocked,
  concealed,
}: HatsuImpactContext): FightState {
  if (blocked || !hisokaNenActive(state[side])) return state
  const technique = hisokaTechnique(state[side], moveId)
  if (technique === 'finish') {
    const link = selectedGumLink(state, side)
    return link ? removeGumLinks(state, (entry) => entry.id === link.id) : state
  }
  if (technique !== 'attach') return state
  return addGumLink(state, {
    side,
    target: { kind: 'fighter', side: defenderSide },
    hidden: concealed,
    ...(state[side].attack?.nenOrigin ?? newGumSource(state[side])),
  })
}

function advanceTechnique(state: FightState, side: FightSide): FightState {
  state = maintainTextureSurprise(state, side)
  const actor = state[side]
  const source = actor.attack?.nenOrigin
  return source
    ? withGumChannel(state, { ...source, side }, (scoped) => advanceActiveTechnique(scoped, side))
    : advanceActiveTechnique(state, side)
}
function advanceActiveTechnique(state: FightState, side: FightSide): FightState {
  const fighter = state[side]
  const pending = activeTechnique(fighter)
  if (!pending || !hisokaTechniqueAllowed(state, side, pending.attack.moveId)) return state
  const { attack, technique } = pending
  if (technique === 'finish') {
    // This composed card strike reels in its attached target and consumes
    // the link only when it actually lands.
    return activateGumMovement(state, side, false)
  }
  const committed = { ...fighter, attack: { ...attack, impacted: true } }
  if (technique === 'texture')
    return {
      ...state,
      [side]: {
        ...committed,
        textureSurprise: {
          surface: 'cloth',
          ...(fighter.attack?.nenOrigin ?? newGumSource(fighter)),
        },
      },
    }
  return activateGumMovement({ ...state, [side]: committed }, side, technique === 'rebound')
}

function activateGumMovement(state: FightState, side: FightSide, rebound: boolean): FightState {
  if (state.gumNetwork) {
    const moved = moveGumLink(state, side, rebound ? 'rebound' : 'recall')
    return rebound ? moved : armGumRecall(moved, side)
  }
  return {
    ...state,
    bungeeGum: { ...state.bungeeGum!, retracting: true, rebounding: rebound },
  }
}

function advanceGumMotion(state: FightState): FightState {
  return state.gumNetwork ? advanceGumNetwork(state) : reelIn(state)
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
  if (gumUnavailable(owner, target)) return { ...state, bungeeGum: null }
  if (!gum.retracting) return state
  if (retractionInterrupted(owner))
    return { ...state, bungeeGum: { ...gum, retracting: false, rebounding: false } }
  const stretch = Math.abs(target.x - owner.x) - BUNGEE_REST_DISTANCE
  if (stretch <= 0) return { ...state, bungeeGum: { ...gum, retracting: false, rebounding: false } }
  const pull = Math.min(
    stretch,
    Math.max(MIN_PULL, stretch * ELASTIC_RECOVERY * categoryPower(owner, 'transmuter')),
  )
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

function gumUnavailable(owner: ArcadeFighter, target: ArcadeFighter): boolean {
  return (
    !ownsBungeeGum(owner) ||
    chainAbilitySealed(owner, 'hisoka:neutralSpecial') ||
    target.health <= 0
  )
}

function clamp(value: number): number {
  return Math.min(93, Math.max(7, value))
}
