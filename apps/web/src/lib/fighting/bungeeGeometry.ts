import { theShip, ceilingOf } from '../tour/blueprint'
import { fightStage } from './stages'
import { FIGHT_WORLD_Y } from './fightCoordinates'
import { liveEntity } from './preparationWorld'
import { gumNetwork } from './bungeeNetwork'
import type { GumLink, GumLimb, GumTarget } from './bungeeTypes'
import type { FightSide, FightState } from './types'

export interface GumPoint {
  x: number
  y: number
}

export function gumLimbPoint(state: FightState, side: FightSide, limb: GumLimb): GumPoint {
  const body = state[side]
  const foot = limb.startsWith('foot')
  const offset = limb.endsWith('right') ? 1 : -1
  return { x: body.x + offset * body.facing * 1.5, y: body.y + (foot ? 1 : 9) }
}
export function gumTargetPoint(state: FightState, target: GumTarget): GumPoint | null {
  if (target.kind === 'fighter')
    return state[target.side].health > 0
      ? { x: state[target.side].x, y: state[target.side].y + 9 }
      : null
  if (target.kind === 'surface') return target.stage === state.environment.stageId ? target : null
  if (target.kind === 'projectile') return projectilePoint(state, target.id)
  return entityPoint(state, target.id)
}
function projectilePoint(state: FightState, id: number): GumPoint | null {
  const shot = state.projectiles.find((entry) => entry.id === id)
  return shot?.matter === 'object' && !shot.living ? shot : null
}
function entityPoint(state: FightState, id: string): GumPoint | null {
  const entity = state.battlefield?.entities.find((entry) => entry.id === id)
  return entity && liveEntity(entity) && entity.material === 'real'
    ? { x: entity.x, y: entity.y + (entity.arena?.height ?? 0) / 2 }
    : null
}
export function gumLinkPoints(state: FightState, link: GumLink): [GumPoint, GumPoint] | null {
  const target = gumTargetPoint(state, link.target)
  return target ? [gumLimbPoint(state, link.owner, link.limb), target] : null
}

/** The arena lighting gantry and the ship blueprint supply real overhead supports. */
export function gumCeilingHeight(state: FightState): number | null {
  if (state.environment.stageId === 'heavens-arena') return 13.6 / FIGHT_WORLD_Y
  const definition = fightStage(state.environment.stageId)
  if (!definition.spaceId || definition.id === 'observation-deck') return null
  const ship = theShip(),
    space = ship.spaces.get(definition.spaceId)
  if (!space) return null
  const tier = ship.plans.get(space.tierId)?.tier
  return tier ? ceilingOf(space, tier) / FIGHT_WORLD_Y : null
}
export function gumSurfaceTarget(
  state: FightState,
  side: FightSide,
  name: string,
): GumTarget | null {
  const body = state[side]
  const direction = name === 'floor-back' ? -body.facing : body.facing
  if (name === 'floor-front' || name === 'floor-back')
    return {
      kind: 'surface',
      stage: state.environment.stageId,
      surface: 'floor',
      x: Math.max(7, Math.min(93, body.x + direction * 18)),
      y: 0,
    }
  const ceiling = gumCeilingHeight(state)
  if (name !== 'ceiling' || ceiling === null) return null
  return {
    kind: 'surface',
    stage: state.environment.stageId,
    surface: 'ceiling',
    x: body.x,
    y: ceiling,
  }
}
export function selectedGumLimb(state: FightState, side: FightSide): GumLimb {
  return gumNetwork(state).limbs[side] ?? 'hand-right'
}
