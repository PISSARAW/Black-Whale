import { Vector3 } from 'three'
import type { VictoryContext, VictoryDriver, VictoryShot, GunPose } from './types'
import { createFranklinBarrageEffects } from './gunEffects'
import { createFranklinSmoke } from './gunSmoke'
import { franklinVictoryPose } from './franklinPose'
import { disposeVictoryObject } from './resources'
import { victoryActorShot, victoryPortrait, victoryShot, victoryWide } from './camera'

function franklinVictoryCamera(context: VictoryContext, pose: GunPose) {
  const { age } = context
  if (age >= 420) {
    victoryPortrait(context)
    return
  }
  if (age < 75) {
    victoryShot(context, {
      target: pose.muzzles[7],
      offset: pose.directions[7]
        .clone()
        .multiplyScalar(0.55)
        .add(new Vector3(0, 0.015, 0.01)),
      width: 0.3,
      height: 0.25,
    })
    return
  }
  if (age >= 276 && age < 350) {
    victoryActorShot(context, context.victim)
    return
  }
  victoryWide(context)
}
export function createFranklinVictory(): VictoryDriver {
  const shots: VictoryShot[] = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    emission: 156 + i * 4.45,
    impact: 174 + i * 4.45,
    nativeFrame: 0,
  }))
  const bullets = createFranklinBarrageEffects(shots),
    smoke = createFranklinSmoke()
  return {
    update(context) {
      const pose = franklinVictoryPose(context)
      franklinVictoryCamera(context, pose)
      bullets.sync({ pose, age: context.age, flashes: context.comfort.flashes })
      smoke.sync({ ...pose, camera: context.camera, age: context.age })
      context.add(bullets.root)
      context.add(smoke.root)
    },
    dispose() {
      disposeVictoryObject(bullets.root)
      disposeVictoryObject(smoke.root)
    },
  }
}
