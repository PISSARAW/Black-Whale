import { Vector3 } from 'three'
import type { VictoryContext } from './types'
import { victoryPortrait, victoryShot } from './camera'
import { visibleVictoryBounds } from './bodyBounds'

export function thetaCamera(context: VictoryContext, points: { hand: Vector3; casing: Vector3 }) {
  const { age, hero, victim } = context
  if (context.comfort.camera === 0 || (age >= 84 && age < 300) || (age >= 408 && age < 486)) {
    const bounds = visibleVictoryBounds(hero.root).union(visibleVictoryBounds(victim.root))
    const size = bounds.getSize(new Vector3())
    victoryShot(context, {
      target: bounds.getCenter(new Vector3()),
      offset: new Vector3(-0.1, 0.2, 6),
      width: size.x + 1.1,
      height: Math.max(hero.height, victim.height) + 0.45,
    })
  } else if (age >= 486) victoryPortrait(context)
  else if (age >= 376 && age < 408)
    victoryShot(context, {
      target: points.casing,
      offset: new Vector3(0.1, 0.05, 0.55),
      width: 0.65,
      height: 0.45,
    })
  else if (age < 84)
    victoryShot(context, {
      target: points.hand.clone().add(new Vector3(0, -0.06, 0.05)),
      offset: new Vector3(0.12, 0.02, 0.8),
      width: 0.75,
      height: 0.6,
    })
  else {
    const head = hero.head.getWorldPosition(new Vector3())
    victoryShot(context, {
      target: head.clone().lerp(points.hand, 0.5),
      offset: new Vector3(1.1, 0.12, 1.3),
      width: 1.2,
      height: hero.height * 0.65,
    })
  }
}
