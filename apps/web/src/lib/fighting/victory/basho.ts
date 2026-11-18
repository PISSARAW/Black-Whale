import type { VictoryDriver } from './types'
import { bashoPose } from './bashoPose'
import { bashoCamera } from './bashoCamera'
import { createBashoPaper } from './bashoPaper'
import { createBashoFire } from './bashoFire'

export function createBashoVictory(): VictoryDriver {
  const paper = createBashoPaper(),
    fire = createBashoFire()
  return {
    update(source) {
      const context = { ...source, age: Math.round(source.age * 1e6) / 1e6 }
      const pose = bashoPose(context)
      bashoCamera(context, pose)
      const writing = paper.sync(context, pose),
        burn = fire.sync(context, pose)
      context.scene.userData.bashoVictory = { ...pose, ...writing, ...burn }
      context.defer(() => {
        delete context.scene.userData.bashoVictory
      })
    },
    dispose() {
      paper.dispose()
      fire.dispose()
    },
  }
}
