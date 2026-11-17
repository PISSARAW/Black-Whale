import { Quaternion, Vector3 } from 'three'
import type { VictoryContext, VictoryDriver } from './types'
import type { VoconteVictoryPose } from './vocontePose'
import { voconteVictoryPose } from './vocontePose'
import { createVoconteFrames } from './voconteFrames'
import { victoryShot } from './camera'
import { createVoconteEffects } from './voconteEffects'
import { clearVoconteView } from './voconteView'

function wide(context: VictoryContext, pose: VoconteVictoryPose) {
  victoryShot(context, {
    target: new Vector3(
      context.centre + 0.6,
      (pose.layout.elevation + pose.layout.height) * 0.5,
      0,
    ),
    offset: new Vector3(2.8, 1, 9),
    width: 10.5,
    height: pose.layout.elevation + pose.layout.height + 1.4,
  })
}
function camera(context: VictoryContext, pose: VoconteVictoryPose) {
  const { age, hero, victim } = context
  if (context.comfort.camera === 0) return wide(context, pose)
  if (age < 156) {
    const target = new Vector3(pose.layout.a - 0.35, Math.max(hero.height, victim.height) * 0.55, 0)
    return victoryShot(context, {
      target,
      offset: new Vector3(-0.5, 0.3, 4),
      width: 3,
      height: Math.max(hero.height, victim.height) + 0.4,
    })
  }
  if (age < 204)
    return victoryShot(context, {
      target: pose.face.clone().add(new Vector3(0, -0.25, 0)),
      offset: new Vector3(2, 0.3, 3.5),
      width: 1.8,
      height: 2,
    })
  if (age < 270) return wide(context, pose)
  const landing = pose.landingFrame ?? 600
  if (age < landing + 24) return flightShot(context, pose, landing)
  if (age < 420) return wide(context, pose)
  return portrait(context)
}
function flightShot(context: VictoryContext, pose: VoconteVictoryPose, landing: number) {
  const age = context.age
  return victoryShot(context, {
    target:
      age < landing - 8
        ? pose.face.clone().add(new Vector3(0, -0.5, 0))
        : pose.fall!.landingPoint.clone().add(new Vector3(0, 0.2, 0)),
    offset: age < landing - 8 ? new Vector3(2, 0.3, 5) : new Vector3(0.5, 4, 3),
    width: 3.5,
    height: 3.2,
  })
}
function portrait(context: VictoryContext) {
  const { hero, age } = context
  const q = hero.head.getWorldQuaternion(new Quaternion())
  return victoryShot(context, {
    target: hero.head.getWorldPosition(new Vector3()).add(new Vector3(0, age < 486 ? -0.3 : 0, 0)),
    offset: new Vector3(0.1, 0.03, 2.3).applyQuaternion(q),
    width: age < 486 ? 1.8 : 1.3,
    height: age < 486 ? 1.9 : 1.4,
  })
}
export function createVoconteVictory(): VictoryDriver {
  const props = createVoconteFrames(),
    effects = createVoconteEffects()
  return {
    update(context) {
      const fog = context.scene.fog
      context.scene.fog = null
      context.defer(() => {
        context.scene.fog = fog
      })
      const pose = voconteVictoryPose(context),
        audit = props.sync(context, pose)
      camera(context, pose)
      clearVoconteView(context)
      effects.sync(context, pose)
      context.scene.userData.voconteVictory = {
        ...audit,
        grips: pose.grips,
        passage: pose.track.passage,
        hidden: pose.track.hidden,
        heroPassage: pose.heroTrack.passage,
        heroHidden: pose.heroTrack.hidden,
        elevation: pose.layout.elevation,
        victimY: context.victim.root.position.y,
        heroY: context.hero.root.position.y,
        floor: pose.fall?.floor,
        landingFrame: pose.landingFrame,
        landed: pose.fall?.landing ?? false,
      }
      context.defer(() => {
        delete context.scene.userData.voconteVictory
      })
    },
    dispose() {
      props.dispose()
      effects.dispose()
    },
  }
}
