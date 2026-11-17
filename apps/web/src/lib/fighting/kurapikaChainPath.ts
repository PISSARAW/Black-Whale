import { chainChest, chainFinger } from './kurapikaChainAnchors'
import type { EffectSceneOptions } from './fighterEffectScene'
import type { ChainMotion } from './kurapikaChainMotion'
import type { FightSide, FightState } from './types'
import { chainEase } from './kurapikaPresentation'

export function kurapikaChainPath(
  options: EffectSceneOptions,
  pose: {
    state: FightState
    side: FightSide
    motion: ChainMotion
    tipReach: number
    captureFrame?: number | null
  },
) {
  const { THREE, worldX } = options
  const { state, side, motion, tipReach } = pose
  const fighter = state[side]
  const targetSide = side === 'player' ? 'opponent' : 'player'
  const start = chainFinger(options, { state, side, stage: motion.stage })
  const centre = chainChest(options, { state, side: targetSide })
  const direction = new THREE.Vector3(fighter.facing, 0, 0)
  const contact = centre.clone().add(new THREE.Vector3(-fighter.facing * 0.18, 0, 0.15))
  if (motion.mode === 'dowsing') {
    const swing = dowsingSwing(state, side)
    contact.copy(start).add(new THREE.Vector3(fighter.facing * 0.12 + swing, -0.65, 0.2))
    direction.set(0, -1, 0)
  } else if (motion.mode === 'healing') {
    contact.copy(start).add(new THREE.Vector3(fighter.facing * 0.12, -0.48, 0.2))
    direction.set(0, -1, 0)
  } else if (motion.mode === 'attack') {
    const maximum = worldX(fighter.x + fighter.facing * motion.reach)
    contact.x = fighter.facing > 0 ? Math.min(contact.x, maximum) : Math.max(contact.x, maximum)
  }
  const end = start.clone().lerp(contact.addScaledVector(direction, -tipReach), motion.extension)
  const bend = start.clone().lerp(end, 0.5)
  bend.y -= 0.12 * (1 - motion.extension * 0.5)
  bend.z = Math.max(start.z, end.z) + 0.12
  const points = [start, bend]
  if (motion.mode === 'jail') {
    const gather = pose.captureFrame == null ? 0 : (1 - chainEase(pose.captureFrame / 18)) * 0.16
    for (let index = 0; index <= 36; index++) {
      const ratio = index / 36
      const angle = ratio * Math.PI * 6
      points.push(
        new THREE.Vector3(
          centre.x + Math.cos(angle) * (0.3 + gather),
          centre.y - 0.38 + ratio * 0.75,
          centre.z + Math.sin(angle) * (0.24 + gather),
        ),
      )
    }
  }
  points.push(end)
  return { points, stage: motion.stage, direction }
}

function dowsingSwing(state: FightState, side: FightSide): number {
  const session = state[side].dowsingSession
  return session?.swings ? Math.sin((state.frame - (session.readingAt ?? 0)) * 0.28) * 0.22 : 0
}
