import { Vector3 } from 'three'
import type { VictoryContext, VictoryDriver } from './types'
import { createHanzoVictoryDouble } from './hanzoDouble'
import { hanzoSleepingPose, hanzoDoublePose, HANZO_RELEASE, HANZO_RETURN } from './hanzoPose'
import type { hanzoDoublePose as DoublePose } from './hanzoPose'
import { createHanzoPartition } from './hanzoPartition'
import { visibleVictoryBounds } from './bodyBounds'
import { victoryPortrait, victoryShot } from './camera'
import { ease } from './resources'
import type { VictoryActor } from './types'

function hanzoCamera(
  context: VictoryContext,
  double: VictoryActor,
  pose: ReturnType<typeof DoublePose>,
) {
  const { age, hero, victim } = context
  if (context.comfort.camera === 0) {
    const height = Math.max(hero.height, victim.height)
    victoryShot(context, {
      target: new Vector3(context.centre + 0.4, height * 0.55, 0),
      offset: new Vector3(1.5, 0.5, 7),
      width: context.gap + victim.height + 3.5,
      height: height + 1.4,
    })
  } else if (age >= 516) victoryPortrait(context)
  else if (age >= 198 && age < HANZO_RELEASE)
    victoryShot(context, {
      target: pose.neck,
      offset: new Vector3(-0.3, 0.12, 3),
      width: Math.max(1.55, victim.width + 1.1),
      height: 1.65,
    })
  else if (age < 72) {
    const head = hero.head.getWorldPosition(new Vector3())
    victoryShot(context, {
      target: head.add(new Vector3(0, -0.15, 0)),
      offset: new Vector3(0.3, 0.15, 2),
      width: 1.25,
      height: 1.4,
    })
  } else {
    const bounds = visibleVictoryBounds(hero.root).union(visibleVictoryBounds(victim.root))
    if (double.root.visible) bounds.union(visibleVictoryBounds(double.root))
    bounds.expandByPoint(new Vector3(context.centre - 0.2, 2.2, -0.13))
    const size = bounds.getSize(new Vector3())
    victoryShot(context, {
      target: bounds.getCenter(new Vector3()),
      offset: new Vector3(1.8, 0.45, 6),
      width: size.x + 1.2,
      height: size.y + 0.9,
    })
  }
}
function doubleOpacity(context: VictoryContext, grip: number, crossing: boolean) {
  const appear = ease((context.age - 72) / 24) * (1 - ease((context.age - 450) / 18))
  const flicker = context.comfort.flashes && crossing ? 0.04 * Math.sin(context.age * 0.8) : 0
  const strength = grip > 0.9 ? 1 : crossing ? 0.3 : 0.48
  return appear * (strength + flicker)
}
export function createHanzoVictory(): VictoryDriver {
  const apparition = createHanzoVictoryDouble(),
    partition = createHanzoPartition()
  return {
    update(context) {
      const sleeping = hanzoSleepingPose(context)
      const double = apparition.get(context)
      const pose = hanzoDoublePose(context, double, sleeping.body)
      double.root.visible = context.age >= 72 && context.age < HANZO_RETURN
      const bounds = visibleVictoryBounds(double.root)
      const wallX = context.centre - 0.2
      const crossing =
        double.root.visible &&
        bounds.min.x <= wallX + 0.06 &&
        bounds.max.x >= wallX - 0.06 &&
        pose.grip < 0.01
      apparition.style(doubleOpacity(context, pose.grip, crossing), crossing)
      partition.sync(context, double.head.getWorldPosition(new Vector3()), crossing)
      context.add(partition.root)
      context.add(double.root)
      hanzoCamera(context, double, pose)
      context.scene.userData.hanzoVictory = {
        body: sleeping.body.toArray(),
        asleep: sleeping.asleep,
        double: double.root.position.toArray(),
        doubleVisible: double.root.visible,
        grip: pose.grip,
        gripErrors: pose.errors,
        crossing,
        wallX,
        returnToBody: pose.returnToBody,
        floor: pose.fall?.floor,
        upY: pose.fall?.upY,
        roll: pose.fall?.roll,
      }
      context.defer(() => {
        delete context.scene.userData.hanzoVictory
      })
    },
    dispose() {
      apparition.dispose()
      partition.dispose()
    },
  }
}
