import { Quaternion, Vector3 } from 'three'
import type { VictoryContext, VictoryDriver } from './types'
import { createHisokaFearFace } from './hisokaFearFace'
import { createHisokaFearAura } from './hisokaFearAura'
import { createHisokaFearVictim } from './hisokaFearVictim'
import { hisokaFearPose, HISOKA_FEAR_DEATH } from './hisokaFearPose'
import { victoryShot } from './camera'
import { visibleVictoryBounds } from './bodyBounds'

function fearPortrait(context: VictoryContext, victim = false) {
  const actor = victim ? context.victim : context.hero
  const centre = actor.head.getWorldPosition(new Vector3()),
    q = actor.root.getWorldQuaternion(new Quaternion())
  const push = victim ? 0 : Math.max(0, Math.min(1, (context.age - 240) / 84))
  victoryShot(context, {
    target: centre.clone().add(new Vector3(0, victim ? -0.1 : -0.065, 0.07).applyQuaternion(q)),
    offset: new Vector3(0, victim ? 0.02 : -0.08, 0.8).applyQuaternion(q),
    width: victim ? 0.75 : 0.64 - push * 0.14,
    height: victim ? 0.88 : 0.72 - push * 0.2,
  })
}
function fearWide(context: VictoryContext) {
  const bounds = visibleVictoryBounds(context.hero.root).union(
    visibleVictoryBounds(context.victim.root),
  )
  victoryShot(context, {
    target: bounds.getCenter(new Vector3()),
    offset: new Vector3(0.3, 0.25, 6),
    width: bounds.getSize(new Vector3()).x + 1,
    height: Math.max(context.hero.height, context.victim.height) + 0.6,
  })
}
const fearVictimShot = (age: number) =>
  (age >= 120 && age < 180) || (age >= 348 && age < HISOKA_FEAR_DEATH)
const fearFaceShot = (age: number) =>
  (age >= 180 && age < 282) || (age >= 324 && age < 348) || age >= 504
function fearStillCamera(context: VictoryContext) {
  const height = Math.max(context.hero.height, context.victim.height)
  victoryShot(context, {
    target: new Vector3(context.centre + 0.2, height * 0.5, 0),
    offset: new Vector3(0.3, 0.25, 6),
    width: context.gap + context.hero.width + context.victim.width + context.victim.height + 1.2,
    height: height + 0.6,
  })
}
function fearCamera(context: VictoryContext) {
  const { age } = context
  if (context.comfort.camera === 0) {
    fearStillCamera(context)
    return
  }
  if (fearVictimShot(age)) {
    fearPortrait(context, true)
    return
  }
  if (fearFaceShot(age)) {
    fearPortrait(context)
    return
  }
  fearWide(context)
}
export function createHisokaVictory(): VictoryDriver {
  const face = createHisokaFearFace(),
    aura = createHisokaFearAura(),
    victim = createHisokaFearVictim()
  return {
    update(context) {
      const pose = hisokaFearPose(context),
        expression = face.apply(context),
        pressure = aura.sync(context)
      context.add(aura.root)
      victim.apply(context)
      fearCamera(context)
      context.scene.userData.hisokaFearVictory = {
        ...expression,
        ...pressure,
        floor: pose.fall?.floor,
        upY: pose.fall?.upY,
        roll: pose.fall?.roll,
        death: context.age >= HISOKA_FEAR_DEATH,
        panic: pose.panic,
        retreat: pose.retreat,
        tremor: pose.tremor,
        gesture: pose.gesture,
        handErrors: pose.handErrors,
      }
      context.defer(() => {
        delete context.scene.userData.hisokaFearVictory
      })
    },
    dispose() {
      face.dispose()
      aura.dispose()
      victim.dispose()
    },
  }
}
