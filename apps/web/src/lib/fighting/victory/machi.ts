import { Vector3 } from 'three'
import type { VictoryContext, VictoryDriver } from './types'
import { machiVictoryPose, MACHI_CUT, MACHI_UNPICK } from './machiPose'
import type { MachiVictoryPose } from './machiPose'
import { createMachiVictoryThreads } from './machiThreads'
import { createMachiSections } from './machiPieces'
import { victoryPortrait, victoryShot, victoryWide } from './camera'

function machiDetail(context: VictoryContext, pose: MachiVictoryPose) {
  const target = pose.grips[0].clone().lerp(pose.grips[1], 0.5)
  victoryShot(context, { target, offset: new Vector3(0.12, 0.1, 1.4), width: 0.8, height: 0.7 })
}
function machiFullScene(context: VictoryContext) {
  const height = Math.max(context.hero.height, context.victim.height)
  victoryShot(context, {
    target: new Vector3(context.centre + 0.65, height * 0.5, 0),
    offset: new Vector3(0.1, 0.25, 6),
    width: context.gap + 3.4,
    height: height + 0.8,
  })
}
function machiCamera(context: VictoryContext, pose: MachiVictoryPose) {
  const { age } = context
  if (context.comfort.camera === 0) {
    machiFullScene(context)
    return
  }
  if (age < 54 || (age >= 390 && age < MACHI_UNPICK)) {
    machiDetail(context, pose)
    return
  }
  if (age >= 510) {
    victoryPortrait(context)
    return
  }
  if (age >= MACHI_CUT && age < 390) {
    victoryShot(context, {
      target: pose.centre,
      offset: new Vector3(0.12, 0.12, 4),
      width: Math.max(1.9, context.victim.width + 1.1),
      height: context.victim.height + 0.6,
    })
    return
  }
  if (age >= MACHI_UNPICK) {
    machiFullScene(context)
    return
  }
  victoryWide(context, context.victim.height + 0.45)
}
export function createMachiVictory(): VictoryDriver {
  const threads = createMachiVictoryThreads(),
    pieces = createMachiSections()
  return {
    update(context) {
      const pose = machiVictoryPose(context)
      const centres = pieces.sync(context, pose)
      const wires = threads.sync(context, pose, centres)
      context.add(pieces.root)
      context.add(threads.root)
      machiCamera(context, pose)
      context.scene.userData.machiVictory = {
        fingerTips: wires.tips.map((tip) => tip.toArray()),
        trackingEnd: wires.trackingEnd.toArray(),
        marker: pose.mark.toArray(),
        segments: wires.count,
        controllingLength: wires.controllingLength,
        approach: pose.approach,
        cut: context.age >= MACHI_CUT,
        sutured: context.age >= 378 && context.age < MACHI_UNPICK,
        sectionCentres: centres.map((centre) => centre.toArray()),
        released: context.age >= MACHI_UNPICK,
      }
      context.defer(() => {
        delete context.scene.userData.machiVictory
      })
    },
    dispose() {
      threads.dispose()
      pieces.dispose()
    },
  }
}
