import * as THREE from 'three'
import type { NobunagaContext } from './nobunagaTypes'
import type { NobunagaVictoryPose } from './nobunagaPose'
import { reachNobunagaHand } from './nobunagaPose'
import { NOBUNAGA_ENTRY, NOBUNAGA_CONTACT, NOBUNAGA_SHEATH } from './nobunagaTypes'
import { disposeVictoryObject, ease } from './resources'

function bladeGeometry() {
  const outline = new THREE.Shape()
  outline.moveTo(0, -0.018)
  outline.quadraticCurveTo(0.5, -0.013, 1, 0.045)
  outline.lineTo(0.91, 0.005)
  outline.quadraticCurveTo(0.5, -0.045, 0, -0.045)
  outline.closePath()
  return new THREE.ExtrudeGeometry(outline, { depth: 0.009, bevelEnabled: false }).translate(
    0,
    0,
    -0.0045,
  )
}
export function createNobunagaKatana() {
  const root = new THREE.Group(),
    sword = new THREE.Group(),
    sheath = new THREE.Group()
  root.name = 'nobunaga-drawn-katana'
  const steel = new THREE.MeshBasicMaterial({ color: 0xe1edf0 }),
    dark = new THREE.MeshBasicMaterial({ color: 0x16191c }),
    brass = new THREE.MeshBasicMaterial({ color: 0xa79458 })
  const blade = new THREE.Mesh(bladeGeometry(), steel)
  const guard = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.015, 12), brass)
  guard.rotation.z = Math.PI / 2
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.25, 12), dark)
  handle.rotation.z = Math.PI / 2
  handle.position.x = -0.14
  sword.add(blade, guard, handle)
  for (let i = 0; i < 8; i++) {
    const wrap = new THREE.Mesh(new THREE.TorusGeometry(0.025, 0.0025, 4, 10), brass)
    wrap.rotation.y = Math.PI / 2
    wrap.position.x = -0.03 - i * 0.03
    sword.add(wrap)
  }
  const saya = new THREE.Mesh(new THREE.CylinderGeometry(0.031, 0.023, 1, 12), dark)
  saya.rotation.z = Math.PI / 2
  saya.position.x = -0.5
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.031, 0.004, 5, 12), brass)
  mouth.rotation.y = Math.PI / 2
  sheath.add(saya, mouth)
  root.add(sword, sheath)
  return {
    root,
    sync(context: NobunagaContext, pose: NobunagaVictoryPose) {
      const { age, hero } = context
      hero.root.traverse((node) => {
        const guard =
          node instanceof THREE.Mesh &&
          node.geometry instanceof THREE.CylinderGeometry &&
          node.geometry.parameters.height === 0.012 &&
          node.geometry.parameters.radiusTop === 0.05
        if (node.name !== 'signature-katana' && !guard) return
        context.save(node)
        node.visible = false
      })
      const pull = ease((age - NOBUNAGA_ENTRY) / 3),
        swipe = ease((age - NOBUNAGA_ENTRY - 3) / (NOBUNAGA_CONTACT - NOBUNAGA_ENTRY - 3))
      const returnToMouth = ease((age - 450) / 36),
        insert = ease((age - 486) / (NOBUNAGA_SHEATH - 486))
      const clearance = Math.max(pull * (1 - swipe), returnToMouth * (1 - insert))
      const base = new THREE.Vector3(
        hero.root.position.x - 0.03,
        hero.root.position.y + hero.height * (0.52 + clearance * 0.12),
        hero.root.position.z + 0.18,
      )
      saya.scale.y = pose.length
      saya.position.x = -pose.length * 0.5
      const sheathTravel = Math.max(pull * (1 - swipe) * 0.6, returnToMouth * (1 - insert) * 0.5)
      sheath.position.copy(base).add(new THREE.Vector3(-pose.length * sheathTravel, 0, 0))
      const start = base
        .clone()
        .add(new THREE.Vector3(pose.length * 0.4 * pull, 0.04 * pull, 0.03 * pull))
      const target = base
        .clone()
        .add(new THREE.Vector3(pose.length * 0.5 * (1 - insert), -0.045 * (1 - insert), 0))
      sword.position.copy(start).lerp(pose.cutGuard, swipe).lerp(target, returnToMouth)
      const restQ = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(-1, 0, 0),
      )
      const cutQ = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(1, 0, 0),
        pose.direction,
      )
      sword.quaternion.copy(restQ).slerp(cutQ, swipe).slerp(restQ, returnToMouth)
      blade.scale.x = pose.length
      blade.visible = age > NOBUNAGA_ENTRY && age < NOBUNAGA_SHEATH
      root.updateWorldMatrix(true, true)
      const grip = sword.localToWorld(new THREE.Vector3(-0.13, 0, 0))
      const leftGrip = sheath.position.clone().add(new THREE.Vector3(-0.12, 0, 0))
      reachNobunagaHand(context, 'right', grip)
      reachNobunagaHand(context, 'left', leftGrip)
      const rightHand = hero.root
        .getObjectByName('hand-right')!
        .getWorldPosition(new THREE.Vector3())
      finishCutLunge(context, { hand: rightHand, pose, amount: swipe * (1 - returnToMouth) })
      rightHand.copy(hero.root.getObjectByName('hand-right')!.getWorldPosition(new THREE.Vector3()))
      const leftHand = hero.root.getObjectByName('hand-left')!.getWorldPosition(new THREE.Vector3())
      const toTip = new THREE.Vector3(pose.length + 0.13, 0.045, 0).applyQuaternion(
        sword.quaternion,
      )
      const aim = new THREE.Quaternion().setFromUnitVectors(
        toTip.normalize(),
        pose.contact.clone().sub(rightHand).normalize(),
      )
      sword.quaternion.premultiply(new THREE.Quaternion().slerp(aim, swipe * (1 - returnToMouth)))
      root.updateWorldMatrix(true, true)
      grip.copy(sword.localToWorld(new THREE.Vector3(-0.13, 0, 0)))
      sword.position.add(rightHand.clone().sub(grip))
      sheath.position.add(leftHand.clone().sub(leftGrip))
      root.updateWorldMatrix(true, true)
      const right = sword.localToWorld(new THREE.Vector3(-0.13, 0, 0)).distanceTo(rightHand)
      const left = sheath.position
        .clone()
        .add(new THREE.Vector3(-0.12, 0, 0))
        .distanceTo(leftHand)
      const tip = sword.localToWorld(new THREE.Vector3(pose.length, 0.045, 0))
      return {
        grip,
        tip,
        guard: sword.position.clone(),
        gripErrors: [right, left],
        contactError: tip.distanceTo(pose.contact),
        tipToMouth: tip.distanceTo(sheath.position),
        drawn: age >= NOBUNAGA_CONTACT && age < NOBUNAGA_SHEATH,
      }
    },
    dispose: () => disposeVictoryObject(root),
  }
}

/** Finish the supporting lunge, keeping the blade and both arm segments rigid. */
function finishCutLunge(
  { hero }: NobunagaContext,
  { hand, pose, amount }: { hand: THREE.Vector3; pose: NobunagaVictoryPose; amount: number },
): void {
  const delta = hand.clone().sub(pose.contact)
  const radius = Math.sqrt(Math.max(0, (pose.length + 0.13) ** 2 + 0.045 ** 2 - delta.y ** 2))
  delta.y = 0
  const distance = delta.length()
  if (distance < 0.001) return
  const travel = Math.max(-0.25, Math.min(0.25, radius - distance)) * amount
  hero.root.position.addScaledVector(delta, travel / distance)
  hero.root.updateWorldMatrix(true, true)
}
