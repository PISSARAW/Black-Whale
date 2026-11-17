import type { VictoryDriver } from './types'
import { mizaistomPose } from './mizaistomPose'
import { createMizaistomProps } from './mizaistomProps'
import { createMizaistomPanel } from './mizaistomPanel'
import { mizaistomCamera } from './mizaistomCamera'

export function createMizaistomVictory(): VictoryDriver {
  const props = createMizaistomProps(),
    panel = createMizaistomPanel()
  return {
    update(context) {
      const pose = mizaistomPose(context)
      const objects = props.sync(context, pose)
      const impact = panel.sync(context, pose)
      mizaistomCamera(context, pose)
      context.scene.userData.mizaistomVictory = {
        ...pose,
        ...objects,
        ...impact,
        restraintDamage: 0,
        redCardExecution: false,
      }
      context.defer(() => {
        delete context.scene.userData.mizaistomVictory
      })
    },
    dispose() {
      props.dispose()
      panel.dispose()
    },
  }
}
