import { Vector3 } from 'three'
import type { VictoryContext } from './types'
import type { BashoPose } from './bashoPose'
import { victoryPortrait, victoryShot } from './camera'
import { visibleVictoryBounds } from './bodyBounds'

function wide(context: VictoryContext) {
  const height = Math.max(context.hero.height, context.victim.height)
  victoryShot(context, {
    target: new Vector3(context.centre, height * 0.55, 0),
    offset: new Vector3(0.2, 0.2, 6),
    width: context.gap + 3,
    height: height + 1,
  })
}
export function bashoCamera(context: VictoryContext, pose: BashoPose) {
  const { age, hero, victim } = context
  if (context.comfort.camera === 0) return wide(context)
  if (age < 24) return victoryPortrait(context)
  if (age < 150)
    return victoryShot(context, {
      target: pose.page,
      offset: new Vector3(0, 0.02, 2).applyQuaternion(pose.pageQ),
      width: 0.85,
      height: 0.75,
    })
  if (age >= 486)
    return victoryShot(context, {
      target: hero.head.getWorldPosition(new Vector3()).add(new Vector3(0, -0.23, 0)),
      offset: new Vector3(0.1, 0.05, 3),
      width: 1.6,
      height: 1.6,
    })
  if (age >= 384) {
    const bounds = visibleVictoryBounds(hero.root).union(visibleVictoryBounds(victim.root))
    return victoryShot(context, {
      target: bounds.getCenter(new Vector3()).add(new Vector3(0, 0.15, 0)),
      offset: new Vector3(0.4, 0.2, 5),
      width: bounds.getSize(new Vector3()).x + 1.3,
      height: Math.max(hero.height, victim.height) + 1,
    })
  }
  victoryShot(context, {
    target: pose.contact.clone().lerp(victim.head.getWorldPosition(new Vector3()), 0.35),
    offset: new Vector3(0.15, 0.1, 3),
    width: 2.2,
    height: 1.8,
  })
}
