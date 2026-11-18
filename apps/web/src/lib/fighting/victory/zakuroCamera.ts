import { Quaternion, Vector3 } from 'three'
import type { VictoryContext } from './types'
import type { ZakuroPose } from './zakuroPose'
import { victoryShot } from './camera'
import { visibleVictoryBounds } from './bodyBounds'

function wide(context: VictoryContext) {
  const height = Math.max(context.hero.height, context.victim.height)
  victoryShot(context, {
    target: new Vector3(context.centre, (height + 2.5) * 0.5, 0),
    offset: new Vector3(0.1, 0.3, 7),
    width: context.gap + height + 0.8,
    height: height + 2.9,
  })
}
function impact(context: VictoryContext) {
  const bounds = visibleVictoryBounds(context.victim.root)
  victoryShot(context, {
    target: bounds.getCenter(new Vector3()),
    offset: new Vector3(0.25, 0.25, 4),
    width: context.victim.height + 1,
    height: context.victim.height + 0.7,
  })
}
function isImpactShot(age: number) {
  return (age >= 318 && age < 336) || (age >= 390 && age < 432)
}
export function zakuroCamera(context: VictoryContext, pose: ZakuroPose) {
  const { age } = context
  if (context.comfort.camera === 0) return wide(context)
  if (age >= 486) {
    const q = context.hero.head.getWorldQuaternion(new Quaternion())
    victoryShot(context, {
      target: context.hero.head.getWorldPosition(new Vector3()).lerp(pose.finger, 0.2),
      offset: new Vector3(0.1, 0.02, 2).applyQuaternion(q),
      width: 1.3,
      height: 1.25,
    })
    return
  }
  if (age < 48) {
    victoryShot(context, {
      target: pose.wound,
      offset: new Vector3(0.2, 0.06, 1),
      width: 0.85,
      height: 0.65,
    })
    return
  }
  if (age >= 84 && age < 132) {
    victoryShot(context, {
      target: new Vector3(context.victim.root.position.x - 0.3, 0.15, 0.2),
      offset: new Vector3(0.15, 0.18, 1.6),
      width: 1.5,
      height: 0.85,
    })
    return
  }
  if (isImpactShot(age)) return impact(context)
  if (age >= 264 && age < 420) return wide(context)
  const bounds = visibleVictoryBounds(context.hero.root).union(
    visibleVictoryBounds(context.victim.root),
  )
  victoryShot(context, {
    target: bounds.getCenter(new Vector3()),
    offset: new Vector3(0.15, 0.2, 6),
    width: bounds.getSize(new Vector3()).x + 1.4,
    height: Math.max(context.hero.height, context.victim.height) + 0.6,
  })
}
