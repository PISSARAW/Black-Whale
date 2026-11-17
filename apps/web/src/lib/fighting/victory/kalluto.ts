import { Vector3 } from 'three'
import type { VictoryContext, VictoryDriver } from './types'
import { kallutoVictoryPose } from './kallutoPose'
import { createKallutoSwarm } from './kallutoSwarm'
import { createKallutoShredding } from './kallutoShred'
import { createKallutoTaunt } from './kallutoLaugh'
import { victoryActorShot, victoryPortrait, victoryShot } from './camera'

function stormWide(context: VictoryContext) {
  victoryShot(context, {
    target: new Vector3(context.centre, 2.25, -0.5),
    offset: new Vector3(0.2, 0.3, 8),
    width: context.gap + 8,
    height: 5.2,
  })
}
function kallutoEarlyCamera(context: VictoryContext, pose: ReturnType<typeof kallutoVictoryPose>) {
  if (context.age < 42 || context.age >= 162) {
    victoryActorShot(context, context.hero)
    return
  }
  if (context.age < 96) {
    victoryShot(context, {
      target: pose.mark,
      offset: new Vector3(0.08, 0.04, 2),
      width: 0.85,
      height: 0.75,
    })
    return
  }
  victoryPortrait(context, context.victim)
}
function kallutoCamera(context: VictoryContext, pose: ReturnType<typeof kallutoVictoryPose>) {
  const { age } = context
  if (context.comfort.camera === 0 || (age >= 222 && age < 294) || (age >= 450 && age < 510)) {
    stormWide(context)
    return
  }
  if (age >= 510) {
    victoryPortrait(context)
    return
  }
  if (age < 222) {
    kallutoEarlyCamera(context, pose)
    return
  }
  victoryShot(context, {
    target: pose.target,
    offset: new Vector3(0.12, 0.08, 4),
    width: Math.max(1.8, context.victim.width + 1.1),
    height: context.victim.height + 0.65,
  })
}
export function createKallutoVictory(): VictoryDriver {
  const swarm = createKallutoSwarm(),
    shredding = createKallutoShredding(),
    taunt = createKallutoTaunt()
  return {
    update(context) {
      const pose = kallutoVictoryPose(context)
      taunt.sync(context, pose.laugh)
      context.add(taunt.root)
      const storm = swarm.sync(context, pose)
      const progress = shredding.sync(context, pose)
      kallutoCamera(context, pose)
      context.add(swarm.root)
      context.add(shredding.root)
      context.scene.userData.kallutoVictory = {
        marker: storm.paper.toArray(),
        attachment: pose.mark.toArray(),
        attached: storm.attached,
        paperCount: storm.count,
        laugh: pose.laugh,
        shredding: progress,
      }
      context.defer(() => {
        delete context.scene.userData.kallutoVictory
      })
    },
    dispose() {
      taunt.dispose()
      swarm.dispose()
      shredding.dispose()
    },
  }
}
