import type { Object3D } from 'three'
import type { HumanFigure } from '$lib/tour/humanFigure'
import { humanFootRig, type HumanFootPose, type HumanFootRig } from '$lib/tour/humanFootRig'
import type { ArcadeFighter } from './types'

const MODELS = new WeakMap<
  Object3D,
  readonly [HumanFootRig | undefined, HumanFootRig | undefined]
>()

export function addFightFootPoseResponse(model: HumanFigure): void {
  const left = model.root.getObjectByName('foot-left')
  const right = model.root.getObjectByName('foot-right')
  if (!left || !right) return
  const rigs = [humanFootRig(left), humanFootRig(right)] as const
  if (rigs.some(Boolean)) MODELS.set(model.turns, rigs)
}

export function animateFightFootPoseResponse(figure: Object3D, fighter: ArcadeFighter): void {
  const rigs = MODELS.get(figure)
  if (!rigs) return
  const lead = fighter.facing === 1 ? 1 : 0
  rigs.forEach((rig, index) => rig?.pose(footPose(fighter, index === lead), poseAmount(fighter)))
}

function footPose(fighter: ArcadeFighter, lead: boolean): HumanFootPose {
  if (fighter.y > 0) return lead ? 'kick' : 'land'
  if (isLowHeavy(fighter)) return lead ? 'kick' : 'pivot'
  if (fighter.pose === 'guard') return 'crouch'
  if (isMoving(fighter)) return lead ? 'pivot' : 'flat'
  return 'flat'
}

function isLowHeavy(fighter: ArcadeFighter): boolean {
  return fighter.attack?.kind === 'heavy' && fighter.attack.variant === 'low'
}

function isMoving(fighter: ArcadeFighter): boolean {
  return Math.abs(fighter.motion?.velocityX ?? 0) > 0.1
}

function poseAmount(fighter: ArcadeFighter): number {
  if (!fighter.attack) return 1
  return Math.min(1, Math.max(0.2, (fighter.attack.frame + 1) / 6))
}
