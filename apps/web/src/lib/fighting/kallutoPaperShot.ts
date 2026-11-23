import { selectedPaperZone, paperZonePoint } from './kallutoPaper'
import { activePaperOwner } from './kallutoSurveillance'
import type { PaperRelease } from './kallutoScatterFlight'
import type { PaperCommand } from './kallutoPaperTypes'
import type { FightProjectile, FightSide } from './types'

export function createPaperShot(
  released: PaperRelease,
  side: FightSide,
  command: PaperCommand,
): FightProjectile {
  const fighter = released.state[side]
  const zone = selectedPaperZone(fighter)
  const point = paperZonePoint(fighter, zone)
  const serpent = command === 'serpent'
  return {
    id: released.state.nextProjectileId,
    owner: side,
    fighterId: 'kalluto',
    x: released.reuse ? released.scatter.x : fighter.x + fighter.facing * 3.4,
    y: released.reuse ? Math.max(1, released.scatter.y) : point.y,
    velocityX: fighter.facing * 66,
    width: serpent ? 1 : 0.35,
    height: 0.3,
    damage: serpent ? 18 : 4,
    hitstun: 16,
    blockstun: 8,
    hitstop: 4,
    knockback: 1.5,
    targetZone: zone,
    shape: 'card',
    colour: '#f4e9e5',
    age: 0,
    lifetime: 120,
    concealed: fighter.attack?.concealed,
    canHitDowned: Boolean(fighter.attack?.accel),
    matter: released.part.materialCopyId ? 'nen' : 'object',
    materialCopyId: released.part.materialCopyId,
    ...paperShotOrigin(released, command),
    paperOwner: activePaperOwner(released.state, side),
    paperTarget: activePaperOwner(released.state, side === 'player' ? 'opponent' : 'player'),
  }
}
function paperShotOrigin(released: PaperRelease, command: PaperCommand) {
  if (command === 'serpent')
    return {
      paperId: released.scatter.paperScatter!.paperId,
      paperScatterId: released.scatter.id,
      kallutoPaper: 'serpent' as const,
    }
  return {
    paperId: released.part.id,
    paperBurstId: released.scatter.id,
    kallutoPaper: 'plant' as const,
  }
}
