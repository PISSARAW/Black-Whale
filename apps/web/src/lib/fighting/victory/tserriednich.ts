import { MeshBasicMaterial } from 'three'
import type { VictoryDriver } from './types'
import { revealFutureEyes } from './tserriednichFace'
import { tserriednichVictoryPose, tserriednichVictoryCamera } from './tserriednichPose'
import { createFutureEchoes } from './tserriednichEchoes'
import { createFutureExecution } from './tserriednichExecution'
import { createTserriednichLikeness } from './tserriednichLikeness'
import { createVictorySmile } from './smile'

/** Cosmetic reconstruction after the real verdict; no forecast damage reaches the engine. */
export function createTserriednichVictory(): VictoryDriver {
  const eyes = new MeshBasicMaterial({ color: 0xcba867 })
  const likeness = createTserriednichLikeness(),
    smile = createVictorySmile()
  const echoes = createFutureEchoes(),
    execution = createFutureExecution()
  return {
    update(context) {
      const pose = tserriednichVictoryPose(context)
      likeness.apply(context)
      revealFutureEyes(context, eyes)
      if (
        context.state[context.frame.loser].id === 'hisoka' &&
        context.age >= 232 &&
        context.age < 286
      )
        smile.apply({ ...context, age: 500, hero: context.victim })
      tserriednichVictoryCamera(context)
      echoes.sync({ context, ...pose })
      execution.sync({ context, ...pose })
      context.add(echoes.root)
      context.add(execution.root)
      context.scene.userData.futureVictory = {
        phase: pose.phase,
        physicalDivergence: true,
        forecastSeconds: 10,
        actual: context.hero.root.position.toArray(),
        perceived: pose.origin.toArray(),
      }
      context.defer(() => {
        delete context.scene.userData.futureVictory
      })
    },
    dispose() {
      eyes.dispose()
      echoes.dispose()
      execution.dispose()
      likeness.dispose()
      smile.dispose()
    },
  }
}
