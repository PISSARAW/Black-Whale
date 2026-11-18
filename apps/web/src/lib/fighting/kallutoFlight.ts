import { commitProjectileNen } from './nenProjectiles'
import { travelFightProjectile } from './projectileFlight'
import { paperZonePoint, selectedPaperZone } from './kallutoPaper'
import { paperAbilityAvailable } from './kallutoAccess'
import type { FightProjectile, FightSide, FightState } from './types'
import type { PaperCommand } from './kallutoPaper'
import { activePaperOwner, paperMarksAt } from './kallutoSurveillance'
import { physicalBodyAt } from './fightBodyIdentity'
import { issuePaperPart } from './kallutoMaterials'

/** Paper is physical matter. Damage/speed/lifetime are duel tuning, never an explosive charge. */
export function launchKallutoPaper(
  state: FightState,
  side: FightSide,
  command: PaperCommand,
): FightState {
  const issued = issuePaperPart(state, side, command)
  if (!issued) return state
  const fighter = issued.actor
  const zone = selectedPaperZone(fighter)
  const point = paperZonePoint(fighter, zone)
  const shot: FightProjectile = {
    id: state.nextProjectileId,
    owner: side,
    fighterId: 'kalluto',
    x: fighter.x + fighter.facing * 3.4,
    y: point.y,
    velocityX: fighter.facing * 66,
    width: command === 'serpent' ? 1 : 0.35,
    height: 0.3,
    damage: command === 'serpent' ? 18 : 4,
    hitstun: 16,
    blockstun: 8,
    hitstop: 4,
    knockback: 1.5,
    targetZone: zone,
    shape: 'card',
    colour: '#f4e9e5',
    matter: issued.part.materialCopyId ? 'nen' : 'object',
    materialCopyId: issued.part.materialCopyId,
    paperId: issued.part.id,
    age: 0,
    lifetime: 120,
    concealed: fighter.attack?.concealed,
    kallutoPaper: command === 'serpent' ? 'serpent' : 'plant',
    paperOwner: activePaperOwner(state, side),
    paperTarget: activePaperOwner(state, side === 'player' ? 'opponent' : 'player'),
  }
  return {
    ...state,
    nextProjectileId: state.nextProjectileId + 1,
    projectiles: [...state.projectiles, commitProjectileNen(shot, fighter)],
    [side]: {
      ...fighter,
      attack: fighter.attack
        ? {
            ...fighter.attack,
            projectileSpawned: true,
            impacted: true,
          }
        : null,
    },
  }
}

/** A stream converges on its own embedded paper, not on arbitrary unmarked body parts. */
export function travelKallutoPaper(
  state: FightState,
  held: FightProjectile,
  step: number,
): FightProjectile {
  const shot = travelFightProjectile(held, step)
  const target = serpentTarget(state, held)
  if (!target) return shot
  const point = paperZonePoint(target, held.targetZone)
  const dx = point.x - held.x
  const dy = point.y - held.y
  const distance = Math.hypot(dx, dy)
  const travel = Math.min(distance, 66 * step)
  return {
    ...shot,
    x: held.x + (dx / (distance || 1)) * travel,
    y: held.y + (dy / (distance || 1)) * travel,
    velocityX: Math.sign(dx || held.velocityX) * 66,
  }
}

function serpentTarget(state: FightState, shot: FightProjectile) {
  if (shot.kallutoPaper !== 'serpent') return undefined
  const owner = shot.paperOwner ?? activePaperOwner(state, shot.owner)
  const target =
    shot.paperTarget ?? activePaperOwner(state, shot.owner === 'player' ? 'opponent' : 'player')
  const emitter = physicalBodyAt(state, owner.owner, owner.member)
  if (
    !emitter ||
    !paperAbilityAvailable(emitter, 'serpent') ||
    !paperMarksAt(state, { owner, target, zone: shot.targetZone })
  )
    return undefined
  return physicalBodyAt(state, target.owner, target.member)
}

/** Only a landed physical fragment embeds paper. Guard, avoidance and ordinary punches never do. */
export function plantPaperAfterHit(state: FightState, shot: FightProjectile): FightState {
  if (!physicalPaperLanded(state, shot)) return state
  const target = shot.owner === 'player' ? 'opponent' : 'player'
  const owner = shot.paperOwner ?? activePaperOwner(state, shot.owner)
  if (
    paperMarksAt(state, { owner, target: activePaperOwner(state, target), zone: shot.targetZone })
  )
    return state
  return {
    ...state,
    [target]: {
      ...state[target],
      plantedPaper: [
        ...(state[target].plantedPaper ?? []),
        {
          owner: owner.owner,
          ownerMember: owner.member,
          zone: shot.targetZone,
          paperId: shot.paperId,
          materialCopyId: shot.materialCopyId,
        },
      ],
    },
  }
}

function physicalPaperLanded(state: FightState, shot: FightProjectile): boolean {
  const impact = state.impact
  if (
    shot.kallutoPaper !== 'plant' ||
    !impact ||
    impact.blocked ||
    impact.avoided ||
    impact.projectileId !== shot.id ||
    impact.transfer
  )
    return false
  return true
}
