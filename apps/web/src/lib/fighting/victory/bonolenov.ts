import { Vector3 } from 'three'
import type { VictoryContext, VictoryDriver } from './types'
import { bonolenovVictoryPose } from './bonolenovPose'
import { createBonolenovCostume } from './bonolenovCostume'
import { createVictoryJupiter } from './bonolenovJupiter'
import { createBonolenovEffects } from './bonolenovEffects'
import { victoryShot } from './camera'

function bonolenovCamera(context: VictoryContext, radius: number) {
  const { hero, victim, age } = context
  if (context.comfort.camera === 0 || (age >= 210 && age < 474)) {
    victoryShot(context, {
      target: new Vector3(context.centre + 0.8, radius, 0),
      offset: new Vector3(0.1, 0.35, 8),
      width: context.gap + radius * 2 + 4.2,
      height: radius * 2 + 0.8,
    })
    return
  }
  if (age < 54 || age >= 498) {
    const target = hero.head.getWorldPosition(new Vector3())
    target.y -= age < 54 ? hero.height * 0.24 : -0.03
    victoryShot(context, { target, offset: new Vector3(0.1, 0.02, 2), width: 1.15, height: 1.2 })
    return
  }
  victoryShot(context, {
    target: new Vector3((hero.root.position.x + victim.root.position.x) / 2, hero.height * 0.55, 0),
    offset: new Vector3(0.1, 0.1, 5),
    width: context.gap + 3,
    height: Math.max(hero.height + 1.5, victim.height + 0.8),
  })
}
export function createBonolenovVictory(): VictoryDriver {
  const costume = createBonolenovCostume(),
    jupiter = createVictoryJupiter(),
    effects = createBonolenovEffects()
  return {
    update(context) {
      const pose = bonolenovVictoryPose(context)
      const planet = jupiter.sync(context, pose)
      const equipment = costume.sync(context)
      effects.sync(context, pose)
      bonolenovCamera(context, planet.radius)
      context.add(costume.root)
      context.add(jupiter.root)
      context.add(effects.root)
      context.scene.userData.bonolenovVictory = {
        ...planet,
        centre: planet.centre.toArray(),
        contact: pose.contact.toArray(),
        spearTip: equipment.spearTip.toArray(),
        grip: equipment.grip.toArray(),
        tap: pose.tap,
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
    },
  }
}
