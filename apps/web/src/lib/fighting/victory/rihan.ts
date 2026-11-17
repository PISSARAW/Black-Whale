import type { VictoryDriver } from './types'
import { rihanPlan, RIHAN_TIMING } from './rihanPlan'
import { rihanPose } from './rihanPose'
import { createRihanPrey } from './rihanPrey'
import { createRihanCreature } from './rihanCreature'
import { createRihanExecution } from './rihanExecution'
import { rihanCamera } from './rihanCamera'

export function createRihanVictory(): VictoryDriver {
  const prey = createRihanPrey(),
    creature = createRihanCreature(),
    execution = createRihanExecution()
  return {
    update(context) {
      const plan = rihanPlan(context.state[context.frame.loser].id)
      const pose = rihanPose(context)
      const meal = prey.sync(context, pose, plan)
      const beast = creature.sync(context, { pose, prey: meal, plan })
      const shot = execution.sync(context, pose)
      rihanCamera(context, { pose, maw: meal.maw, plan })
      context.scene.userData.rihanVictory = {
        ...pose,
        ...meal,
        ...beast,
        ...shot,
        prey: plan.prey,
        predationDamage: 0,
        enemyZetsu: false,
        ownSealHours: plan.prey && context.age >= RIHAN_TIMING.consumed ? 48 : 0,
      }
      context.defer(() => {
        delete context.scene.userData.rihanVictory
      })
    },
    dispose() {
      prey.dispose()
      creature.dispose()
      execution.dispose()
    },
  }
}
