import { Vector3 } from 'three'
import type { VictoryContext, VictoryDriver } from './types'
import { leorioVictoryPose, leorioRoofHeight, LEORIO_CEILING, LEORIO_LAUNCH } from './leorioPose'
import { createLeorioPunches } from './leorioPunches'
import { createLeorioRoof } from './leorioRoof'
import { createLeorioImpacts } from './leorioEffects'
import { victoryPortrait, victoryShot, victoryWide } from './camera'
import { ease } from './resources'

export function leorioVictoryCamera(context: VictoryContext) {
  const { age, hero, victim } = context
  if (age < 66 || age >= 480) {
    victoryPortrait(context)
    return
  }
  if (age >= 304 && age < 338) {
    const hand = hero.root.getObjectByName('hand-right')!.getWorldPosition(new Vector3())
    victoryShot(context, {
      target: hand.clone().add(new Vector3(0.15, 0.13, 0)),
      offset: new Vector3(0.2, 0.35, 2.8),
      width: 1.25,
      height: 1.1,
    })
    return
  }
  if (age >= 338) {
    const head = victim.head.getWorldPosition(new Vector3())
    const follow = ease((age - LEORIO_LAUNCH) / (LEORIO_CEILING - LEORIO_LAUNCH))
    const target = head.clone().add(new Vector3(0, -victim.height * 0.28 + follow * 0.12, 0))
    victoryShot(context, {
      target,
      offset: new Vector3(0.25, -0.22 - follow * 0.35, 4),
      width: victim.width + 1.8,
      height: victim.height + 0.95,
    })
    return
  }
  victoryWide(context)
}
export function createLeorioVictory(): VictoryDriver {
  const punches = createLeorioPunches(),
    roof = createLeorioRoof(),
    impacts = createLeorioImpacts()
  return {
    update(context) {
      const pose = leorioVictoryPose(context)
      punches.sync(context, pose)
      roof.sync(context, pose)
      impacts.sync(context, pose)
      context.add(punches.root)
      context.add(roof.root)
      context.add(impacts.root)
      leorioVictoryCamera(context)
      if (context.comfort.camera === 0) {
        victoryShot(context, {
          target: new Vector3(context.centre, pose.height * 0.5, 0),
          offset: new Vector3(0.2, 0.1, 6),
          width: context.gap + 2,
          height: leorioRoofHeight(context) + 0.8,
        })
      }
      context.scene.userData.leorioVictory = {
        launchFrame: LEORIO_LAUNCH,
        ceilingFrame: LEORIO_CEILING,
        roofHeight: pose.height,
        head: pose.head.toArray(),
        floorHand: pose.hand.toArray(),
        floor: pose.floor.toArray(),
        strikePower: pose.power,
        progress: pose.progress,
      }
      context.defer(() => {
        delete context.scene.userData.leorioVictory
      })
    },
    dispose() {
      punches.dispose()
      roof.dispose()
      impacts.dispose()
    },
  }
}
