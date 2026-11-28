import type { VictoryDriver } from './types'
import { bonolenovVictoryPose } from './bonolenovPose'
import { createBonolenovCostume } from './bonolenovCostume'
import { createVictoryJupiter } from './bonolenovJupiter'
import { createBonolenovEffects } from './bonolenovEffects'
import { createBonolenovFloor } from './bonolenovFloor'
import { bonolenovCamera } from './bonolenovCamera'
import timing from './bonolenovTiming.json'

export function createBonolenovVictory(): VictoryDriver {
  const costume = createBonolenovCostume()
  const jupiter = createVictoryJupiter()
  const effects = createBonolenovEffects()
  const floor = createBonolenovFloor()
  return {
    update(context) {
      const pose = bonolenovVictoryPose(context)
      const planet = jupiter.sync(context, pose)
      if ((context.comfort.camera ?? 1) > 0 && context.age < timing.wide)
        context.victim.root.visible = false
      const equipment = costume.sync(context)
      const impactX = context.centre + context.gap / 2 + 2.1
      floor.sync(context, planet, impactX)
      effects.sync(context, impactX)
      const shot = bonolenovCamera(context, { planet, pose, impactX })
      context.add(floor.root)
      context.add(costume.root)
      context.add(jupiter.root)
      context.add(effects.root)
      context.scene.userData.bonolenovVictory = {
        ...planet,
        shot,
        centre: planet.centre.toArray(),
        contact: pose.contact.toArray(),
        spearTip: equipment.spearTip.toArray(),
        grip: equipment.grip.toArray(),
        rivalX: pose.victimX,
        crushed: pose.crush,
      }
      context.defer(() => {
        delete context.scene.userData.bonolenovVictory
      })
    },
    dispose() {
      costume.dispose()
      jupiter.dispose()
      effects.dispose()
      floor.dispose()
    },
  }
}
