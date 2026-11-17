import { Vector3 } from 'three'
import type { VictoryContext, VictoryDriver } from './types'
import { halkenburgVictoryPose, HALKENBURG_IMPACT, HALKENBURG_RELEASE } from './halkenburgPose'
import { createHalkenburgBow } from './halkenburgBow'
import { createHalkenburgCohort } from './halkenburgCohort'
import { createHalkenburgTransfer } from './halkenburgSpirit'
import { victoryActorShot, victoryPortrait, victoryShot } from './camera'

function halkenburgDrawCamera(context: VictoryContext) {
  const { hero, age } = context
  if (age < 246) {
    const target = hero.head
      .getWorldPosition(new Vector3())
      .add(new Vector3(0.2, -hero.height * 0.2, 0))
    victoryShot(context, {
      target,
      offset: new Vector3(0.3, 0.1, 3.8),
      width: 2.8,
      height: hero.height * 0.95,
    })
    return
  }
  const hand = hero.root.getObjectByName('hand-right')!.getWorldPosition(new Vector3())
  victoryShot(context, {
    target: hand.clone().add(new Vector3(0.15, 0.1, 0)),
    offset: new Vector3(0.4, 0.05, 2.8),
    width: 1.3,
    height: 1.1,
  })
}
function halkenburgCamera(context: VictoryContext) {
  const { age, hero, victim } = context
  if (age < 66 || age >= 480) {
    victoryPortrait(context)
    return
  }
  if (age >= 132 && age < 300) {
    halkenburgDrawCamera(context)
    return
  }
  if (age >= 324 && age < 450) {
    if (age >= 404) victoryPortrait(context, victim)
    else victoryActorShot(context, victim)
    return
  }
  const height = Math.max(hero.height, victim.height)
  victoryShot(context, {
    target: new Vector3(context.centre - 0.55, height * 0.52, 0),
    offset: new Vector3(0.15, 0.25, 6),
    width: context.gap + 3.5,
    height: height + 0.5,
  })
}
export function createHalkenburgVictory(): VictoryDriver {
  const bow = createHalkenburgBow(),
    cohort = createHalkenburgCohort(),
    transfer = createHalkenburgTransfer()
  return {
    update(context) {
      const pose = halkenburgVictoryPose(context)
      halkenburgCamera(context)
      const arrow = bow.sync(context, pose)
      cohort.sync(context, pose)
      transfer.sync(context, pose)
      context.add(cohort.root)
      context.add(bow.root)
      context.add(transfer.root)
      context.scene.userData.halkenburgVictory = {
        releaseFrame: HALKENBURG_RELEASE,
        impactFrame: HALKENBURG_IMPACT,
        supporters: 3,
        charge: pose.charge,
        grip: pose.grip.toArray(),
        nock: pose.nock.toArray(),
        tip: arrow.tip.toArray(),
        target: pose.target.toArray(),
        contactError: arrow.contact,
        kneel: pose.kneel,
      }
      context.defer(() => {
        delete context.scene.userData.halkenburgVictory
      })
    },
    dispose() {
      bow.dispose()
      cohort.dispose()
      transfer.dispose()
    },
  }
}
