import { Vector3 } from 'three'
import type { VictoryContext, VictoryDriver } from './types'
import { createBiscuitVictoryForms } from './biscuitForms'
import { biscuitVictoryPose } from './biscuitPose'
import { createBiscuitVictoryCookie } from './biscuitCookie'
import { createBiscuitVictoryEffects } from './biscuitEffects'
import { victoryPortrait, victoryShot } from './camera'
import { visibleVictoryBounds } from './bodyBounds'

function biscuitCamera(context: VictoryContext) {
  const { age, hero, victim } = context
  if (context.comfort.camera === 0) {
    victoryShot(context, {
      target: new Vector3(context.centre + 1, 1.15, 0),
      offset: new Vector3(0.2, 0.25, 6),
      width: context.gap + 6.3 + victim.height,
      height: Math.max(3.6, victim.height + 1.5),
    })
  } else if (age < 96 || (age >= 450 && age < 492)) {
    victoryShot(context, {
      target: new Vector3(hero.root.position.x - 0.2, 1.02, 0.08),
      offset: new Vector3(0.12, 0.25, 2),
      width: 1.85,
      height: 1.65,
    })
  } else if (age >= 492) {
    victoryPortrait(context)
  } else {
    const bounds = visibleVictoryBounds(hero.root).union(visibleVictoryBounds(victim.root))
    const size = bounds.getSize(new Vector3())
    victoryShot(context, {
      target: bounds.getCenter(new Vector3()),
      offset: new Vector3(0.25, 0.25, 5),
      width: size.x + 1.3,
      height: Math.max(size.y + 0.8, 2.6),
    })
  }
}
export function createBiscuitVictory(): VictoryDriver {
  const forms = createBiscuitVictoryForms(),
    cookie = createBiscuitVictoryCookie(),
    effects = createBiscuitVictoryEffects()
  return {
    update(context) {
      const form = forms.sync(context)
      const pose = biscuitVictoryPose(context)
      const treatment = cookie.sync(context, pose)
      effects.sync(context, pose)
      context.add(cookie.root)
      context.add(effects.root)
      biscuitCamera(context)
      context.scene.userData.biscuitVictory = {
        ...form,
        cookie: treatment.active,
        treatmentErrors: treatment.errors,
        rightError: pose.rightError,
        contactError: pose.fist.distanceTo(pose.contact),
        fist: pose.fist.toArray(),
        contact: pose.contact.toArray(),
        flight: pose.flight,
        landing: pose.landing,
        impactFrame: 330,
        airborneY: pose.airborneY,
        fallProgress: pose.progress,
        floor: pose.floor,
        upY: pose.upY,
        roll: pose.roll,
        landingFrame: pose.landingFrame,
      }
      context.defer(() => {
        delete context.scene.userData.biscuitVictory
      })
    },
    dispose() {
      forms.dispose()
      cookie.dispose()
      effects.dispose()
    },
  }
}
