import { chainChest, chainFinger } from './kurapikaChainAnchors'
import type { EffectSceneOptions } from './fighterEffectScene'
import type { ChainMotion } from './kurapikaChainMotion'
import type { FightSide, FightState } from './types'

export function kurapikaChainPath(
  options: EffectSceneOptions,
  pose: {
    state: FightState
    side: FightSide
    motion: ChainMotion
    tipReach: number
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
  if (motion.mode === 'healing') {
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
    for (let index = 0; index <= 36; index++) {
      const ratio = index / 36
      const angle = ratio * Math.PI * 6
      points.push(
        new THREE.Vector3(
          centre.x + Math.cos(angle) * 0.3,
          centre.y - 0.38 + ratio * 0.75,
          centre.z + Math.sin(angle) * 0.24,
        ),
      )
    }
  }
  points.push(end)
  return { points, stage: motion.stage, direction }
}
