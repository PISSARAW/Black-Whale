import { Vector3 } from 'three'
import type { VictoryContext } from './types'
import type { LuiniPose } from './luiniPose'
import { victoryShot } from './camera'
import { visibleVictoryBounds } from './bodyBounds'
import { clearVoconteView } from './voconteView'

function wide(context: VictoryContext, pose: LuiniPose) {
  victoryShot(context, {
    target: new Vector3(context.centre, pose.layout.height / 2, 0),
    offset: new Vector3(-2, 0.6, 8),
    width: 7.5,
    height: pose.layout.height + 0.7,
  })
}
function activeShot(context: VictoryContext, pose: LuiniPose) {
  const { age, hero, victim } = context
  if (age >= 474) {
    const target = hero.head.getWorldPosition(new Vector3()).add(new Vector3(0, -0.2, 0))
    return victoryShot(context, {
      target,
      offset: new Vector3(0.1, 0.05, 3),
      width: 1.4,
      height: 1.6,
    })
  }
  if (age >= 408) {
    const bounds = visibleVictoryBounds(hero.root).union(visibleVictoryBounds(victim.root))
    return victoryShot(context, {
      target: bounds.getCenter(new Vector3()),
      offset: new Vector3(0.8, 0.6, 5),
      width: bounds.getSize(new Vector3()).x + 1,
      height: Math.max(hero.height, victim.height) + 0.8,
    })
  }
  if (age >= 384)
    return victoryShot(context, {
      target: pose.target.clone().add(new Vector3(-0.2, 0.2, 0)),
      offset: new Vector3(2.8, 0.1, 3),
      width: 1.9,
      height: 1.7,
    })
  if (age < 72)
    return victoryShot(context, {
      target: hero.head.getWorldPosition(new Vector3()).add(new Vector3(0.2, -0.25, 0)),
      offset: new Vector3(-0.7, 0.1, 4),
      width: 2.5,
      height: pose.layout.height,
    })
  if (age >= 132 && age < 216)
    return victoryShot(context, {
      target: hero.head
        .getWorldPosition(new Vector3())
        .lerp(victim.head.getWorldPosition(new Vector3()), 0.5)
        .add(new Vector3(0, -0.35, 0)),
      offset: new Vector3(1, 0.1, 4),
      width: 3.5,
      height: pose.layout.height + 0.3,
    })
  if (age >= 282)
    return victoryShot(context, {
      target: new Vector3(pose.layout.a + 0.2, pose.layout.height * 0.55, 0),
      offset: new Vector3(2, 0.2, 4),
      width: 3.4,
      height: pose.layout.height + 0.4,
    })
  wide(context, pose)
}
export function luiniCamera(context: VictoryContext, pose: LuiniPose) {
  if (context.comfort.camera === 0) wide(context, pose)
  else activeShot(context, pose)
  clearVoconteView(context)
}
