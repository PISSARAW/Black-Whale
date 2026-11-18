import { Vector3 } from 'three'
import type { VictoryContext } from './types'
import type { MizaistomPose } from './mizaistomPose'
import { victoryPortrait, victoryShot } from './camera'
import { visibleVictoryBounds } from './bodyBounds'

export function mizaistomCamera(context: VictoryContext, pose: MizaistomPose) {
  const { age, hero, victim } = context
  if (context.comfort.camera === 0) {
    victoryShot(context, {
      target: new Vector3(context.centre + 0.5, Math.max(hero.height, victim.height) * 0.5, 0),
      offset: new Vector3(0.4, 0.2, 7),
      width: context.gap + 4,
      height: Math.max(hero.height, victim.height) + 0.6,
    })
    return
  }
  if (age >= 486) return victoryPortrait(context)
  if (age >= 168 && age < 198) {
    victoryShot(context, {
      target: victim.head.getWorldPosition(new Vector3()).add(new Vector3(0, -0.08, 0)),
      offset: new Vector3(-1.5, 0.1, 2),
      width: 1.15,
      height: 1.2,
    })
    return
  }
  if (age < 84 || (age >= 300 && age < 336)) {
    victoryShot(context, {
      target: pose.hand.clone().add(new Vector3(0, 0.08, 0)),
      offset: new Vector3(0.7, 0.03, 0.9),
      width: 0.8,
      height: 0.65,
    })
    return
  }
  const bounds = visibleVictoryBounds(hero.root).union(visibleVictoryBounds(victim.root))
  const size = bounds.getSize(new Vector3())
  const orbit = pose.confined ? Math.sin(((age - pose.confinementStart) / 90) * Math.PI) * 0.55 : 0
  victoryShot(context, {
    target: bounds.getCenter(new Vector3()),
    offset: new Vector3(orbit, age >= 414 ? 0.8 : 0.15, 6),
    width: Math.max(size.x + 1.1, 3.6),
    height: Math.max(hero.height, victim.height) + 0.6,
  })
}
