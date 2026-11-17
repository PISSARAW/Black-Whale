import type { VictoryDriver } from './types'
import { lynchPose } from './lynchPose'
import { lynchCamera } from './lynchCamera'
import { createLynchReply } from './lynchReply'
import { createLynchImpacts } from './lynchImpacts'

export function createLynchVictory(): VictoryDriver {
  const reply = createLynchReply(),
    impacts = createLynchImpacts()
  return {
    update(source) {
      const context = { ...source, age: Math.round(source.age * 1e6) / 1e6 }
      const pose = lynchPose(context)
      lynchCamera(context, pose)
      const answer = reply.sync(context, pose),
        impact = impacts.sync(context, pose)
      context.scene.userData.lynchVictory = { ...pose, ...answer, ...impact }
      context.defer(() => {
        delete context.scene.userData.lynchVictory
      })
    },
    dispose() {
      reply.dispose()
      impacts.dispose()
    },
  }
}
