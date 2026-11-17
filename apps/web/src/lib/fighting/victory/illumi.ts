import { Vector3 } from 'three'
import type { VictoryContext, VictoryDriver } from './types'
import type { IllumiVictoryPose } from './illumiPose'
import { illumiVictoryPose } from './illumiPose'
import { createIllumiVictoryNeedles } from './illumiNeedles'
import { victoryPortrait, victoryShot } from './camera'
import { visibleVictoryBounds } from './bodyBounds'
import { illumiVictorySpeech } from './illumiSpeech'

function illumiWide(context: VictoryContext) {
  const { hero, victim } = context
  const bounds = visibleVictoryBounds(hero.root).union(visibleVictoryBounds(victim.root))
  const size = bounds.getSize(new Vector3())
  const reduced = context.comfort.camera === 0
  victoryShot(context, {
    target: reduced
      ? new Vector3(
          context.centre + victim.height * 0.35,
          Math.max(hero.height, victim.height) * 0.5,
          0,
        )
      : bounds.getCenter(new Vector3()),
    offset: new Vector3(1.8, 0.25, 5),
    width: reduced ? context.gap + victim.height + 2.8 : size.x + 1,
    height: Math.max(hero.height, victim.height) + 0.8,
  })
}
function illumiCamera(context: VictoryContext, pose: IllumiVictoryPose) {
  const { age, victim } = context
  if (context.comfort.camera === 0 || (age >= 150 && age < 258) || (age >= 318 && age < 516)) {
    illumiWide(context)
    return
  }
  if (age < 54 || age >= 516) {
    victoryPortrait(context)
    return
  }
  const rear = age < 150
  victoryShot(context, {
    target: (rear ? pose.rear.point : pose.front.point)
      .clone()
      .add(new Vector3(0, -victim.height * 0.08, 0)),
    offset: rear ? new Vector3(0.8, 0.15, -2) : new Vector3(0.5, 0.08, 2),
    width: Math.max(0.9, victim.height * 0.55),
    height: Math.max(0.9, victim.height * 0.55),
  })
}
export function createIllumiVictory(): VictoryDriver {
  const needles = createIllumiVictoryNeedles()
  return {
    update(context) {
      const pose = illumiVictoryPose(context)
      const pins = needles.sync(context, pose)
      illumiVictorySpeech(context)
      illumiCamera(context, pose)
      context.add(needles.root)
      context.scene.userData.illumiVictory = {
        ...pins,
        grip: pose.grip.toArray(),
        gripErrors: [pose.rightError, pose.leftError],
        dead: pose.dead,
        fall: pose.fall,
        kneel: pose.kneel,
        bow: pose.bow,
      }
      context.defer(() => {
        delete context.scene.userData.illumiVictory
      })
    },
    dispose: needles.dispose,
  }
}
