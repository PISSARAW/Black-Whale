import type { VictoryDriver } from './types'
import { zakuroPose } from './zakuroPose'
import { createZakuroDrops } from './zakuroDrops'
import { createZakuroBlood } from './zakuroBlood'
import { createZakuroInfusion } from './zakuroInfusion'
import { createZakuroImpact } from './zakuroImpact'
import { zakuroCamera } from './zakuroCamera'

export function createZakuroVictory(): VictoryDriver {
  const drops = createZakuroDrops(),
    blood = createZakuroBlood(),
    infusion = createZakuroInfusion(),
    impact = createZakuroImpact()
  return {
    update(context) {
      const pose = zakuroPose(context)
      const scouting = drops.sync(context, pose)
      const supply = blood.sync(context, pose)
      const kit = infusion.sync(context, pose)
      impact.sync(context)
      zakuroCamera(context, pose)
      context.scene.userData.zakuroVictory = {
        ...pose,
        ...scouting,
        ...supply,
        ...kit,
        impacts: Number(context.age >= 324) + Number(context.age >= 396),
      }
      context.defer(() => {
        delete context.scene.userData.zakuroVictory
      })
    },
    dispose() {
      drops.dispose()
      blood.dispose()
      infusion.dispose()
      impact.dispose()
    },
  }
}
