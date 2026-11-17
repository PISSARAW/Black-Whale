import * as THREE from 'three'
import type { VictoryContext, VictoryDriver } from './types'
import { saiyuVictoryPose, SAIYU_IMPACT } from './saiyuPose'
import { createSaiyuVictoryStaff } from './saiyuStaff'
import { createSaiyuVictorySeals } from './saiyuSeals'
import { createSaiyuPerception } from './saiyuPerception'
import { victoryPortrait, victoryShot } from './camera'
import { visibleVictoryBounds } from './bodyBounds'
import { disposeVictoryObject, ease } from './resources'

function saiyuWide(context: VictoryContext, staff: THREE.Object3D) {
  const { hero, victim } = context
  const bounds = visibleVictoryBounds(hero.root)
    .union(visibleVictoryBounds(victim.root))
    .union(visibleVictoryBounds(staff))
  const fixed = context.comfort.camera === 0
  victoryShot(context, {
    target: fixed
      ? new THREE.Vector3(
          context.centre + 0.65,
          Math.max(hero.height, victim.height) * 0.5 + 0.8,
          0,
        )
      : bounds.getCenter(new THREE.Vector3()),
    offset: new THREE.Vector3(0.2, 0.3, 7),
    width: fixed ? context.gap + victim.height + 4 : bounds.getSize(new THREE.Vector3()).x + 1.2,
    height: fixed
      ? Math.max(hero.height, victim.height) + 2.8
      : bounds.getSize(new THREE.Vector3()).y + 0.7,
  })
}
function saiyuSenseCamera(context: VictoryContext) {
  const { age, victim } = context
  const q = victim.head.getWorldQuaternion(new THREE.Quaternion())
  if (age >= 234)
    victoryShot(context, {
      target: victim.head.localToWorld(new THREE.Vector3(0, -0.035, 0.06)),
      offset: new THREE.Vector3(0.04, 0, 1.6).applyQuaternion(q),
      width: 0.65,
      height: 0.65,
    })
  else if (age >= 162 && age < 216)
    victoryShot(context, {
      target: victim.head.localToWorld(new THREE.Vector3(0, 0, 0.04)),
      offset: new THREE.Vector3(0.45, 0.02, 1.4).applyQuaternion(q),
      width: 0.9,
      height: 0.85,
    })
  else victoryPortrait(context, victim)
}
function saiyuCamera(context: VictoryContext, staff: THREE.Object3D) {
  const { age, hero } = context
  if (context.comfort.camera === 0 || (age >= 282 && age < 438)) saiyuWide(context, staff)
  else if (age < 42 || age >= 438) victoryPortrait(context)
  else if (age >= 78 && age < 282) saiyuSenseCamera(context)
  else
    victoryShot(context, {
      target: hero.head.getWorldPosition(new THREE.Vector3()),
      offset: new THREE.Vector3(0, 0.05, 3),
      width: 2.2,
      height: 2,
    })
}
export function createSaiyuVictory(): VictoryDriver {
  const staff = createSaiyuVictoryStaff(),
    seals = createSaiyuVictorySeals(),
    perception = createSaiyuPerception()
  const root = new THREE.Group()
  root.name = 'saiyu-final-impact'
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1, 0.012, 8, 64),
    new THREE.MeshBasicMaterial({ color: 0xd9bc76, transparent: true, opacity: 0.6 }),
  )
  ring.rotation.x = -Math.PI / 2
  root.add(ring)
  return {
    update(context) {
      const pose = saiyuVictoryPose(context)
      const weapon = staff.sync(context, pose)
      saiyuCamera(context, staff.root)
      const contacts = seals.sync(context, pose)
      const mouthOpening = perception.sync(context)
      const t = (context.age - SAIYU_IMPACT) / 36
      root.visible = t >= 0 && t < 1 && context.comfort.flashes
      ring.position.set(context.centre + context.gap * 0.5, 0.025, pose.contact.z)
      ring.scale.setScalar(0.1 + ease(t) * 2.3)
      ring.material.opacity = 0.6 * (1 - ease(t))
      context.add(staff.root)
      context.add(seals.root)
      context.add(root)
      context.add(perception.root)
      context.scene.userData.saiyuVictory = {
        seals: contacts,
        staffTip: weapon.tip.toArray(),
        contact: pose.contact.toArray(),
        contactError: weapon.contactError,
        grips: weapon.errors,
        length: weapon.length,
        floor: pose.fall?.floor,
        upY: pose.fall?.upY,
        blind: context.age >= 90 && context.age < 360,
        mouthOpening,
      }
      context.defer(() => {
        delete context.scene.userData.saiyuVictory
      })
    },
    dispose() {
      staff.dispose()
      seals.dispose()
      perception.dispose()
      disposeVictoryObject(root)
    },
  }
}
