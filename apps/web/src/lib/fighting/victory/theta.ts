import type { VictoryDriver } from './types'
import { thetaVictoryPose } from './thetaPose'
import { createThetaGun } from './thetaGun'
import { thetaCamera } from './thetaCamera'

export function createThetaVictory(): VictoryDriver {
  const pistol = createThetaGun()
  return {
    update(context) {
      for (const name of ['theta-physical-handgun', 'theta-holstered-handgun']) {
        const native = context.hero.root.getObjectByName(name)
        if (native) {
          context.save(native)
          native.visible = false
        }
      }
      const pose = thetaVictoryPose(context)
      const weapon = pistol.sync(context, pose)
      thetaCamera(context, { hand: pose.hand, casing: weapon.casing })
      context.scene.userData.thetaVictory = {
        ...pose,
        ...weapon,
        physicalWeapon: true,
        inventedHatsu: false,
      }
      context.defer(() => {
        delete context.scene.userData.thetaVictory
      })
    },
    dispose: () => pistol.dispose(),
  }
}
