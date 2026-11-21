import { commitProjectileNen } from './nenProjectiles'
import { travelFightProjectile } from './projectileFlight'
import { paperZonePoint, paperCommandReady } from './kallutoPaper'
import { createPaperShot } from './kallutoPaperShot'
import { paperAbilityAvailable } from './kallutoAccess'
import type { FightProjectile, FightSide, FightState } from './types'
import type { PaperCommand } from './kallutoPaper'
import { activePaperOwner, paperMarksAt } from './kallutoSurveillance'
import { physicalBodyAt } from './fightBodyIdentity'
import { releasePaperScatter, commitPaperScatter } from './kallutoScatterFlight'
import { dispersePaper, dispersePaperFlight, regatherFlyingPaper } from './kallutoDispersion'
import { concentratePaperScatters } from './kallutoConcentration'

/** Paper is physical matter. Damage/speed/lifetime are duel tuning, never an explosive charge. */
export function launchKallutoPaper(
  state: FightState,
  side: FightSide,
  command: PaperCommand,
): FightState {
  if (!paperCommandReady(state, side, command)) return state
  const gathered = command === 'serpent' ? regatherFlyingPaper(state, side) : null
  if (gathered) return markPaperLaunched(gathered, side)
  const concentrated = command === 'serpent' ? concentratePaperScatters(state, side) : null
  if (concentrated) return markPaperLaunched(concentrated, side)
  const released = releasePaperScatter(state, side, command)
  if (!released) return state
  if (command === 'plant') return markPaperLaunched(dispersePaper(released, side), side)
  const fighter = released.state[side]
  const shot = createPaperShot(released, side, command)
  const prepared = commitPaperScatter(released, shot)
  return {
    ...prepared,
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

function markPaperLaunched(state: FightState, side: FightSide): FightState {
  const actor = state[side]
  if (!actor.attack) return state
  return {
    ...state,
    [side]: {
      ...actor,
      attack: { ...actor.attack, projectileSpawned: true, impacted: true },
    },
  }
}

/** A stream converges on its own embedded paper, not on arbitrary unmarked body parts. */
export function travelKallutoPaper(
  state: FightState,
  held: FightProjectile,
  step: number,
): FightProjectile {
  const shot = dispersePaperFlight(state, travelFightProjectile(held, step), step)
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
  if (!scatterSteeringAvailable(state, shot)) return undefined
  const owner = shot.paperOwner ?? activePaperOwner(state, shot.owner)
  const target =
    shot.paperTarget ?? activePaperOwner(state, shot.owner === 'player' ? 'opponent' : 'player')
  const emitter = physicalBodyAt(state, owner.owner, owner.member)
  if (
    !emitter ||
    !paperAbilityAvailable(emitter, 'serpent') ||
    !paperMarksAt(state, { owner, target, zone: shot.targetZone, use: 'guide' })
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
    paperMarksAt(state, {
      owner,
      target: activePaperOwner(state, target),
      zone: shot.targetZone,
      use: 'guide',
    })
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

function scatterSteeringAvailable(state: FightState, shot: FightProjectile): boolean {
  return (
    !shot.paperScatterId ||
    Boolean(
      state.battlefield?.entities.find((entry) => entry.id === shot.paperScatterId)?.paperScatter
        ?.controlled,
    )
  )
}
