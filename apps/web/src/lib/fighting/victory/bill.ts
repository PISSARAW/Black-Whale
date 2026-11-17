import { Vector3 } from 'three'
import type { VictoryContext, VictoryDriver } from './types'
import { billVictoryPose } from './billPose'
import { createBillVictoryPlant } from './billPlant'
import { victoryShot } from './camera'
import { visibleVictoryBounds } from './bodyBounds'

function billCamera(context: VictoryContext) {
  const { hero, victim, age } = context
  if (context.comfort.camera !== 0 && age >= 326 && age <= 342) {
    const target = hero.head
      .getWorldPosition(new Vector3())
      .lerp(victim.head.getWorldPosition(new Vector3()), 0.55)
      .add(new Vector3(0, -0.25, 0))
    victoryShot(context, { target, offset: new Vector3(-0.7, 0.15, 3), width: 1.85, height: 1.9 })
  } else if (context.comfort.camera === 0 || age < 420) {
    const bounds = visibleVictoryBounds(hero.root).union(visibleVictoryBounds(victim.root))
    const height = Math.max(hero.height, victim.height)
    victoryShot(context, {
      target:
        context.comfort.camera === 0
          ? new Vector3(context.centre + 0.8, height * 0.5, 0)
          : bounds.getCenter(new Vector3()),
      offset: new Vector3(0.45, 0.22, 6),
      width:
        context.comfort.camera === 0
          ? context.gap + victim.height + 4
          : bounds.getSize(new Vector3()).x + 0.95,
      height: height + 0.6,
    })
  } else {
    victoryShot(context, {
      target: hero.head.getWorldPosition(new Vector3()).add(new Vector3(0, -0.22, 0)),
      offset: new Vector3(0, 0.03, 2),
      width: 1.3,
      height: 1.4,
    })
  }
}
export function createBillVictory(): VictoryDriver {
  const plant = createBillVictoryPlant()
  return {
    update(context) {
      const pose = billVictoryPose(context)
      const bloom = plant.sync(context, pose)
      context.add(plant.root)
      billCamera(context)
      context.scene.userData.billVictory = {
        ...bloom,
        ...pose.native,
        palms: pose.palms.map((p) => p.toArray()),
        gripErrors: [pose.rightError, pose.leftError],
        fist: pose.fist.toArray(),
        contactError: pose.fist.distanceTo(pose.contact),
        floor: pose.fall?.floor,
        upY: pose.fall?.upY,
        roll: pose.fall?.roll,
        blockError: pose.blockError,
        hand: pose.hand.toArray(),
      }
      context.defer(() => {
        delete context.scene.userData.billVictory
      })
    },
    dispose: plant.dispose,
  }
}
