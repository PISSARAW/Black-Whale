import { Matrix4, Quaternion, Vector3 } from 'three'
import { positionFranklinFingers } from './franklinFingertipRig'
import type { Object3D, Scene } from 'three'
import { reachCinematicHand } from './cinematicArmReach'
import { cinematicEase } from './cinematicEase'

export function stageFranklin(scene: Scene, age: number, shock = 0) {
  const head = scene.getObjectByName('manga-head:franklin-bordeau')!
  const enemyHead = scene.getObjectByName('kurapika-head')!
  const hero = scene.children.find((n) => n.getObjectByName(head.name) === head)!
  const victim = scene.children.find((n) => n.getObjectByName(enemyHead.name) === enemyHead)!
  const restores: Array<() => void> = []
  const save = (n: Object3D) => {
    const p = n.position.clone(),
      q = n.quaternion.clone(),
      scale = n.scale.clone(),
      v = n.visible
    restores.push(() => {
      n.position.copy(p)
      n.quaternion.copy(q)
      n.scale.copy(scale)
      n.visible = v
    })
  }
  for (const root of [hero, victim]) {
    save(root)
    const chest = root.getObjectByName('fight-chest')!,
      h = root === hero ? head : enemyHead
    for (const n of [chest, chest.parent!, h]) {
      save(n)
      n.rotation.set(0, 0, 0)
    }
    chest.position.set(0, 0, 0)
    for (const side of ['left', 'right'])
      for (const name of ['shoulder', 'elbow', 'hand', 'hip', 'knee']) {
        const node = root.getObjectByName(`${name}-${side}`)!
        save(node)
        node.rotation.set(0, 0, 0)
      }
    root.traverse((n) => {
      if (n.name.startsWith('nen-')) {
        save(n)
        n.visible = false
      }
    })
  }
  const settle = cinematicEase((age - 370) / 50),
    raising = cinematicEase((age - 72) / 65)
  hero.position.set(-1.35, 0, 0)
  hero.rotation.set(0, 1.25 * (1 - settle), 0)
  victim.position.set(1.35, 0, 0)
  victim.rotation.set(0, -1.15, 0)
  const firing = age >= 156 && age < 350
  const recoil = firing ? Math.sin(age * 2.5) * 0.009 : 0
  victim.position.x += firing ? Math.max(0, (age - 156) / 194) * 0.3 : age >= 350 ? 0.3 : 0
  const fall = cinematicEase((age - 350) / 35)
  victim.position.y = fall * 0.18
  victim.rotation.z = -fall * 1.5 + (firing ? -0.055 - shock * 0.065 : 0)
  enemyHead.rotation.x = firing ? 0.1 + shock * 0.09 : fall * 0.12
  victim.getObjectByName('fight-chest')!.rotation.x = firing ? -0.06 + Math.sin(age * 2) * 0.025 : 0
  hero.updateWorldMatrix(true, true)
  victim.updateWorldMatrix(true, true)
  const target = new Vector3(victim.position.x - 0.04, 1.25, 0)
  const muzzles: Vector3[] = [],
    directions: Vector3[] = [],
    hands: Object3D[] = []
  let handError = 0
  for (const side of ['left', 'right'] as const) {
    const shoulder = hero.getObjectByName(`shoulder-${side}`)!.getWorldPosition(new Vector3())
    const forward = new Vector3(0, 0, 1).applyQuaternion(hero.quaternion)
    const reach = (0.28 + raising * 0.24) * (1 - settle) + settle * 0.15
    const handTarget = shoulder.clone().addScaledVector(forward, reach)
    handTarget.y -= (0.34 - raising * 0.2) * (1 - settle) + settle * 0.6
    handTarget.x -= recoil
    const pole = shoulder.clone().add(new Vector3(-0.05, -0.4, side === 'left' ? 0.45 : -0.45))
    handError = Math.max(handError, reachCinematicHand(hero, { side, target: handTarget, pole }))
    const hand = hero.getObjectByName(`hand-${side}`)!
    const direction = target.clone().sub(hand.getWorldPosition(new Vector3())).normalize()
    const row = new Vector3(0, 1, 0).cross(direction).normalize()
    const y = direction.clone().negate(),
      z = row.clone().cross(y).normalize()
    const world = new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(row, y, z))
    hand.quaternion.copy(hand.parent!.getWorldQuaternion(new Quaternion()).invert().multiply(world))
    hand.updateWorldMatrix(true, true)
    hands.push(hand)
    const fingers = positionFranklinFingers({
      hand,
      side,
      target,
      opening: cinematicEase(age / 65) * (1 - settle),
      save,
    })
    muzzles.push(...fingers.muzzles)
    directions.push(...fingers.directions)
  }
  for (const side of ['left', 'right']) {
    victim.getObjectByName(`shoulder-${side}`)!.rotation.z = firing
      ? (side === 'left' ? -1 : 1) * (0.08 + shock * 0.08)
      : 0
    victim.getObjectByName(`elbow-${side}`)!.rotation.x = firing ? -0.12 - shock * 0.1 : -fall * 0.1
  }
  if (age >= 420) victim.visible = false
  hero.updateWorldMatrix(true, true)
  victim.updateWorldMatrix(true, true)
  return {
    hero,
    victim,
    head,
    hands,
    target,
    muzzles,
    directions,
    handError,
    fall,
    restore: () => {
      restores.reverse().forEach((r) => r())
      hero.updateWorldMatrix(true, true)
      victim.updateWorldMatrix(true, true)
    },
  }
}
