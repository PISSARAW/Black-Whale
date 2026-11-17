import { Vector3 } from 'three'
import type { VictoryContext } from './types'
import type { RihanPose } from './rihanPose'
import type { RihanPlan } from './rihanPlan'
import { victoryPortrait, victoryShot } from './camera'
import { visibleVictoryBounds } from './bodyBounds'

const portraitBeat = (age: number) => age < 78 || age >= 486

function wide(context: VictoryContext) {
  const bounds = visibleVictoryBounds(context.hero.root).union(
    visibleVictoryBounds(context.victim.root),
  )
  victoryShot(context, {
    target: bounds.getCenter(new Vector3()).add(new Vector3(0, -0.1, 0.2)),
    offset: new Vector3(0.1, 0.2, 6),
    width: bounds.getSize(new Vector3()).x + 1.7,
    height: Math.max(context.hero.height, context.victim.height) + 0.6,
  })
}
export function rihanCamera(
  context: VictoryContext,
  focus: { pose: RihanPose; maw: Vector3; plan: RihanPlan },
) {
  const { age } = context
  if (context.comfort.camera === 0) {
    victoryShot(context, {
      target: new Vector3(
        context.centre,
        Math.max(context.hero.height, context.victim.height) * 0.5,
        0.25,
      ),
      offset: new Vector3(0, 0.2, 7),
      width: context.gap + 3.2,
      height: Math.max(context.hero.height, context.victim.height) + 0.7,
    })
    return
  }
  if (portraitBeat(age)) return victoryPortrait(context)
  if (focus.plan.prey && age < 144) {
    victoryShot(context, {
      target: focus.pose.palm.clone().lerp(focus.maw, Math.max(0, Math.min(1, (age - 78) / 66))),
      offset: new Vector3(0.3, 0.1, 1.5),
      width: 1.7,
      height: 1.5,
    })
    return
  }
  if (focus.plan.prey && age >= 240 && age < 342) {
    victoryShot(context, {
      target: focus.maw,
      offset: new Vector3(1.7, 0.25, 1.4),
      width: 2.4,
      height: 1.65,
    })
    return
  }
  if (age >= 342 && age < 408) {
    const head = context.hero.head.getWorldPosition(new Vector3())
    victoryShot(context, {
      target: head.clone().lerp(focus.pose.target, 0.55),
      offset: new Vector3(-0.4, 0.2, 3),
      width: 2.6,
      height: Math.max(context.hero.height, context.victim.height) * 0.85,
    })
    return
  }
  wide(context)
}
