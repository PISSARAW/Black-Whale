import type { VictoryDriver } from './types'
import { luiniPose } from './luiniPose'
import { luiniCamera } from './luiniCamera'
import { createLuiniRoom } from './luiniRoom'
import { createLuiniPortals } from './luiniPortals'
import { createLuiniBlade } from './luiniBlade'

export function createLuiniVictory(): VictoryDriver {
  const room = createLuiniRoom(),
    portals = createLuiniPortals(),
    blade = createLuiniBlade()
  return {
    update(source) {
      const context = { ...source, age: Math.round(source.age * 1e6) / 1e6 }
      const pose = luiniPose(context)
      const anchor = room.sync(context, pose),
        passages = portals.sync(context, pose),
        weapon = blade.sync(context, pose)
      luiniCamera(context, pose)
      context.scene.userData.luiniVictory = { ...pose, ...anchor, ...passages, ...weapon }
      context.defer(() => {
        delete context.scene.userData.luiniVictory
      })
    },
    dispose() {
      room.dispose()
      portals.dispose()
      blade.dispose()
    },
  }
}
