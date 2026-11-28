import { Quaternion, Vector3 } from 'three'
import type { VictoryContext, VictoryDriver } from './types'
import { createCamillaAtmosphere } from './camillaAtmosphere'
import { createCamillaLighting } from './camillaLighting'
import { createCamillaVictoryCat } from './camillaCat'
import { camillaVictoryPose } from './camillaPose'
import { victoryShot } from './camera'
import { ease } from './resources'
import {
  CAMILLA_CONTACT,
  CAMILLA_DROP,
  CAMILLA_GRIP,
  CAMILLA_INHALE,
  CAMILLA_REVEAL,
  CAMILLA_RISE,
  CAMILLA_RISE_DURATION,
  CAMILLA_STILL,
  CAMILLA_TAIL_CHARGED,
} from './camillaTiming'

function camillaCamera(
  context: VictoryContext,
  pose: ReturnType<typeof camillaVictoryPose>,
  tip: Vector3,
) {
  const { age, centre, comfort, hero, camera } = context
  const { ratio, lips, handPosition } = pose
  const movement = comfort.camera ?? 1
  if (movement === 0) {
    victoryShot(context, {
      target: new Vector3(centre - 0.3, 1.38 * ratio, 0.1),
      offset: new Vector3(0, 0.04, 4),
      width: 5.6 * ratio,
      height: 3.4 * ratio,
    })
    return
  }
  if (age < CAMILLA_REVEAL) {
    // Cross the line of Camilla's fall. The paw and the rival separate in depth as we lower.
    const descent = ease((age - CAMILLA_CONTACT) / 80) * movement
    victoryShot(context, {
      target: new Vector3(centre - 0.26 - 0.52 * descent, (1.02 - 0.36 * descent) * ratio, 0.1),
      offset: new Vector3(0.64 - 2.44 * descent, 0.12 - 0.31 * descent, 3.78 - 0.44 * descent),
      width: (4.35 + 0.37 * descent) * ratio,
      height: (2.22 - 0.2 * descent) * ratio,
    })
    return
  }
  if (age < CAMILLA_TAIL_CHARGED) {
    // Arc around both paws as the rival is lifted. Let the camera settle when his legs do.
    const arc = ease((age - CAMILLA_REVEAL) / (CAMILLA_STILL - CAMILLA_REVEAL)) * movement
    const lift = ease((age - CAMILLA_GRIP) / 74)
    victoryShot(context, {
      target: new Vector3(
        pose.catX - (0.39 - 0.15 * arc) * ratio,
        (1.33 + 0.2 * lift) * ratio,
        0.22,
      ),
      offset: new Vector3(-1.63 + 3.25 * arc, 0.41 - 0.34 * arc, 4.4 - 0.56 * arc),
      width: (4.06 - 0.19 * arc) * ratio,
      height: (3.24 - 0.12 * arc) * ratio,
    })
    return
  }

  const rise = ease((age - CAMILLA_RISE) / CAMILLA_RISE_DURATION)
  const head = hero.head.getWorldPosition(new Vector3())
  const rotation = hero.head.getWorldQuaternion(new Quaternion())
  const descent = ease((age - CAMILLA_TAIL_CHARGED) / (CAMILLA_DROP - CAMILLA_TAIL_CHARGED))
  const tail = Math.min(1, (1 - descent) * 3)
  const portrait = ease((age - CAMILLA_INHALE + 9) / 24) * (1 - rise) * movement
  const target = lips.clone().lerp(handPosition, 0.22)
  target.y += 0.14
  target.lerp(lips.clone().lerp(tip, 0.47), tail)
  target.lerp(head.clone().add(new Vector3(0, -0.018, 0.055).applyQuaternion(rotation)), portrait)
  target.lerp(head.clone().add(new Vector3(0, -0.22, 0)), rise)

  const offset = new Vector3(-0.44, 0.85, 0.91)
    .lerp(new Vector3(-0.68, 0.37, 1.44), 1 - descent)
    .lerp(new Vector3(0.025, 0.015, 0.89).applyQuaternion(rotation), portrait)
    .lerp(new Vector3(-0.3, 0.1, 1.61), rise)
  victoryShot(context, {
    target,
    offset,
    width: 1.05 - portrait * 0.58 + 0.15 * rise + (0.2 + Math.abs(tip.x - lips.x)) * tail,
    height: 0.85 - portrait * 0.41 + 0.25 * rise + (0.2 + Math.abs(tip.y - lips.y)) * tail,
  })
  // Roll into the axis of the face, like the original portrait, while keeping the drop upright.
  camera.up.lerp(new Vector3(0, 1, 0).applyQuaternion(rotation), portrait).normalize()
  camera.lookAt(target)
  camera.updateMatrixWorld(true)
}
export function createCamillaVictory(): VictoryDriver {
  const cat = createCamillaVictoryCat()
  const lighting = createCamillaLighting()
  const atmosphere = createCamillaAtmosphere()
  return {
    update(context) {
      // The small scenic cats would compete with the apparition in this scene.
      for (const name of ['background-event:cat-prowl', 'background-object:cat']) {
        const prop = context.scenery.getObjectByName(name)
        if (!prop) continue
        context.save(prop)
        prop.visible = false
      }
      const pose = camillaVictoryPose(context)
      const effects = cat.sync(context, pose)
      camillaCamera(context, pose, effects.tip)
      lighting.sync(context, pose.lips.clone().lerp(pose.bodyContact, 0.55))
      context.add(cat.root)
      atmosphere.sync(context, pose)
      context.scene.userData.camillaVictory = {
        ...pose,
        contacts: effects.contacts,
        energyVisible: effects.energy,
        drop: effects.drop.toArray(),
        zetsu: context.state.catsNameFatality!.zetsu,
      }
      context.defer(() => {
        delete context.scene.userData.camillaVictory
      })
    },
    dispose() {
      atmosphere.dispose()
      lighting.dispose()
      cat.dispose()
    },
  }
}
