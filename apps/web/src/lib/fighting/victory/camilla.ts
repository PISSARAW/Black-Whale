import { Vector3 } from 'three'
import type { VictoryContext, VictoryDriver } from './types'
import { createCamillaVictoryCat } from './camillaCat'
import { camillaVictoryPose, camillaVictoryPortrait, CAMILLA_PORTRAIT } from './camillaPose'
import { victoryShot } from './camera'

function camillaCamera(context: VictoryContext, ratio: number) {
  const { age } = context
  if (age >= CAMILLA_PORTRAIT) {
    context.save(context.scenery)
    context.scenery.visible = false
    camillaVictoryPortrait(context)
    return
  }
  const target = new Vector3(context.centre + context.gap / 2, 1.45 * ratio, 0.35 * ratio)
  if (age >= 357 && context.comfort.camera !== 0)
    target.lerp(context.hero.head.getWorldPosition(new Vector3()), (age - 357) / 153)
  victoryShot(context, {
    target,
    offset: new Vector3(0.15, 0.12, 5),
    width: 2.8 * ratio,
    height: 3.25 * ratio,
  })
}
export function createCamillaVictory(): VictoryDriver {
  const cat = createCamillaVictoryCat()
  return {
    update(context) {
      const pose = camillaVictoryPose(context)
      const effects = cat.sync(context, pose)
      camillaCamera(context, pose.ratio)
      context.add(cat.root)
      context.scene.userData.camillaVictory = {
        compression: pose.compression,
        absorption: pose.absorption,
        contacts: effects.contacts,
        energyVisible: effects.energy,
        eyeOpeningFrame: 554,
        portraitFrozen: context.age >= CAMILLA_PORTRAIT,
        head: context.hero.head.matrixWorld.toArray(),
        ratio: pose.ratio,
      }
      context.defer(() => {
        delete context.scene.userData.camillaVictory
      })
    },
    dispose() {
      cat.dispose()
    },
  }
}
