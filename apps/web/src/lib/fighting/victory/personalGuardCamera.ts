import { Vector3 } from 'three'
import { victoryPortrait, victoryShot } from './camera'
import { visibleVictoryBounds } from './bodyBounds'
import { GUARD_FALL, GUARD_PORTRAIT } from './personalGuardCombat'
import type { VictoryContext } from './types'

export function personalGuardCamera(context: VictoryContext, prop: Vector3) {
  const { age, frame } = context
  if (context.comfort.camera === 0) {
    const height = Math.max(context.hero.height, context.victim.height)
    victoryShot(context, {
      target: new Vector3(context.centre + 0.25, height * 0.5, 0),
      offset: new Vector3(0.2, 0.3, 6),
      width: context.gap + height + 1.1,
      height: height + 0.6,
    })
    return
  }
  if (age >= GUARD_PORTRAIT) {
    victoryPortrait(context)
    return
  }
  const propShot = frame.fighter === 'longhi' ? age < 78 : age >= 90 && age < 132
  if (propShot) {
    victoryShot(context, {
      target: prop,
      offset: new Vector3(0, 0.06, 0.95),
      width: 0.92,
      height: 0.7,
    })
    return
  }
  const bounds = visibleVictoryBounds(context.hero.root).union(
    visibleVictoryBounds(context.victim.root),
  )
  const size = bounds.getSize(new Vector3())
  victoryShot(context, {
    target: bounds.getCenter(new Vector3()),
    offset: new Vector3(0.1, age >= GUARD_FALL ? 0.4 : 0.12, 6),
    width: size.x + 1.1,
    height: Math.max(context.hero.height, context.victim.height) + 0.6,
  })
}
