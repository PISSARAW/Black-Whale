import { Vector3 } from 'three'
import type { VictoryContext } from './types'
import type { LynchPose } from './lynchPose'
import { victoryPortrait, victoryShot } from './camera'
import { visibleVictoryBounds } from './bodyBounds'

function wide(context: VictoryContext) {
  const height = Math.max(context.hero.height, context.victim.height)
  victoryShot(context, {
    target: new Vector3(context.centre + 0.7, height * 0.6, 0),
    offset: new Vector3(0.2, 0.3, 6),
    width: context.gap + 3.8,
    height: height + 1.8,
  })
}
function dialogue(context: VictoryContext, pose: LynchPose) {
  const response = context.age >= 126 && context.age < 216
  const target = pose.contact.clone().lerp(context.victim.head.getWorldPosition(new Vector3()), 0.4)
  victoryShot(context, {
    target,
    offset: new Vector3(response ? -0.35 : 0.35, 0.08, 3),
    width: response ? 1.7 : 2.2,
    height: response ? 1.3 : 1.8,
  })
}
export function lynchCamera(context: VictoryContext, pose: LynchPose) {
  const { age, hero, victim } = context
  if (context.comfort.camera === 0) return wide(context)
  if (age >= 480) return victoryPortrait(context)
  if (age >= 397) {
    const bounds = visibleVictoryBounds(victim.root).union(visibleVictoryBounds(hero.root))
    const size = bounds.getSize(new Vector3())
    return victoryShot(context, {
      target: bounds.getCenter(new Vector3()),
      offset: new Vector3(0.2, 0.3, 5),
      width: size.x + 1,
      height: size.y + 0.6,
    })
  }
  if (age < 78) return victoryPortrait(context)
  if (age >= 312 && age < 366) {
    return victoryShot(context, {
      target: pose.contact.clone().add(new Vector3(0, 0.22, 0)),
      offset: new Vector3(0.25, 0.04, 2.5),
      width: 1.4,
      height: 1.15,
    })
  }
  dialogue(context, pose)
}
