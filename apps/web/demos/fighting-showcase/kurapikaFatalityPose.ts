import { Box3, Quaternion, Vector3 } from 'three'
import type { Object3D, Scene } from 'three'
import { reachCinematicHand } from './cinematicArmReach'

const ease = (v: number) => {
  const t = Math.max(0, Math.min(1, v))
  return t * t * (3 - 2 * t)
}

const restFigures = new WeakMap<Object3D, Vector3>()

export function stageKurapikaFatality(scene: Scene, age: number) {
  const head = scene.getObjectByName('kurapika-head')!
  const enemyHead = scene.getObjectByName('manga-head:chrollo-lucilfer')!
  const hero = scene.children.find((node) => node.getObjectByName(head.name) === head)!
  const victim = scene.children.find((node) => node.getObjectByName(enemyHead.name) === enemyHead)!
  const restores: Array<() => void> = []
  const save = (node: Object3D) => {
    const p = node.position.clone(),
      q = node.quaternion.clone(),
      scale = node.scale.clone(),
      v = node.visible
    restores.push(() => {
      node.position.copy(p)
      node.quaternion.copy(q)
      node.scale.copy(scale)
      node.visible = v
    })
  }
  for (const root of [hero, victim]) {
    save(root)
    const h = root === hero ? head : enemyHead
    const chest = root.getObjectByName('fight-chest')!
    for (const node of [chest, chest.parent!, h]) {
      save(node)
      node.rotation.set(0, 0, 0)
    }
    const figure = chest.parent!
    const rest = restFigures.get(figure) ?? figure.position.clone()
    restFigures.set(figure, rest)
    figure.position.copy(rest)
    chest.position.set(0, 0, 0)
    for (const side of ['left', 'right'])
      for (const joint of ['shoulder', 'elbow', 'hand', 'hip', 'knee']) {
        const node = root.getObjectByName(`${joint}-${side}`)!
        save(node)
        node.rotation.set(0, 0, 0)
      }
    root.traverse((node) => {
      if (node.name.startsWith('nen-')) {
        save(node)
        node.visible = false
      }
    })
  }
  const lift = ease((age - 150) / 65) * 0.95
  const fall = ease((age - 285) / 45)
  const snap = ease((age - 235) / 20)
  const sign = hero.position.x < victim.position.x ? 1 : -1
  victim.position.x += sign * 0.7
  victim.position.y = lift * (1 - fall) + 0.17 * fall
  const yaw = victim.quaternion.clone()
  victim.quaternion.copy(
    new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), -sign * fall * 1.53).multiply(yaw),
  )
  const struggle = age > 150 && age < 250 ? Math.sin(age * 0.18) * 0.08 : 0
  enemyHead.rotation.set(0.13 + snap * 0.25, struggle, snap * 0.28)
  for (const [side, direction] of [
    ['left', 1],
    ['right', -1],
  ] as const) {
    victim.getObjectByName(`shoulder-${side}`)!.rotation.set(0.03, 0, direction * -0.1)
    victim.getObjectByName(`elbow-${side}`)!.rotation.x = -0.15
    victim.getObjectByName(`hip-${side}`)!.rotation.x = 0.12 + struggle * direction
    victim.getObjectByName(`knee-${side}`)!.rotation.x = 0.23 + fall * (direction > 0 ? 0.25 : 0.05)
  }
  if (age < 75 || age >= 360) victim.visible = false
  if (age >= 90 && age < 200) hero.visible = false
  hero.updateWorldMatrix(true, true)
  victim.updateWorldMatrix(true, true)
  const feet = ['left', 'right'].map((side) => hero.getObjectByName(`knee-${side}`)!.children[1])
  hero.position.y -= Math.min(...feet.map((foot) => new Box3().setFromObject(foot).min.y)) - 0.015
  hero.updateWorldMatrix(true, true)
  const rotation = head.getWorldQuaternion(new Quaternion()),
    origin = head.getWorldPosition(new Vector3())
  const local = (v: Vector3) => v.applyQuaternion(rotation).add(origin)
  const handError = reachCinematicHand(hero, {
    side: 'right',
    target: local(new Vector3(0.2, -0.52 + snap * 0.09, 0.36 - snap * 0.18)),
    pole: local(new Vector3(0.47, -0.53, 0.18)),
  })
  hero.getObjectByName('hand-right')!.scale.y *= 1 - snap * 0.12
  head.rotation.set(0, 0, 0)
  hero.updateWorldMatrix(true, true)
  return {
    hero,
    victim,
    head,
    lift: victim.position.y,
    snap,
    fall,
    handError,
    restore: () => {
      restores.reverse().forEach((restore) => restore())
      hero.updateWorldMatrix(true, true)
      victim.updateWorldMatrix(true, true)
    },
  }
}
