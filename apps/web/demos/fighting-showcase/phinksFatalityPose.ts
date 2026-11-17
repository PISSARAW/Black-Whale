import { Quaternion, Vector3 } from 'three'
import type { Object3D, Scene } from 'three'
import { reachCinematicHand } from './cinematicArmReach'
import { cinematicEase } from './cinematicEase'

export function stagePhinks(scene: Scene, age: number) {
  const head = scene.getObjectByName('manga-head:phinks-magcub')!
  const victimHead = scene.getObjectByName('kurapika-head')!
  const hero = scene.children.find((n) => n.getObjectByName(head.name) === head)!
  const victim = scene.children.find((n) => n.getObjectByName(victimHead.name) === victimHead)!
  const restores: Array<() => void> = []
  const save = (n: Object3D) => {
    const p = n.position.clone(),
      q = n.quaternion.clone(),
      v = n.visible
    restores.push(() => {
      n.position.copy(p)
      n.quaternion.copy(q)
      n.visible = v
    })
  }
  for (const root of [hero, victim]) {
    save(root)
    const chest = root.getObjectByName('fight-chest')!,
      h = root === hero ? head : victimHead
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
  const strike = cinematicEase((age - 246) / 24),
    settle = cinematicEase((age - 350) / 70)
  hero.position.set(-0.65 + strike * 0.3, 0, 0)
  hero.rotation.set(0, 1.15 * (1 - settle), 0)
  victim.position.set(0.43, 0, 0)
  victim.rotation.set(0, -1.15, -cinematicEase((age - 270) / 36) * 0.18)
  const turns = Math.max(0, Math.min(6, (age - 36) / 32))
  const shoulder = hero.getObjectByName('shoulder-right')!
  const elbow = hero.getObjectByName('elbow-right')!
  shoulder.rotation.x = -turns * Math.PI * 2
  elbow.rotation.x = -0.16
  const headPosition = () => head.getWorldPosition(new Vector3())
  hero.updateWorldMatrix(true, true)
  let handError = 0
  if (age >= 228) {
    const q = head.getWorldQuaternion(new Quaternion()),
      origin = headPosition()
    const local = (v: Vector3) => v.applyQuaternion(q).add(origin)
    const hand = local(new Vector3(0.24, -0.35, -0.22)).lerp(new Vector3(0.3, 1.29, -0.01), strike)
    hand.lerp(local(new Vector3(0.24, -0.65, 0.07)), settle)
    handError = reachCinematicHand(hero, {
      side: 'right',
      target: hand,
      pole: local(new Vector3(0.53, -0.4, -0.35)),
    })
  }
  const headQ = head.getWorldQuaternion(new Quaternion()),
    origin = headPosition()
  const local = (v: Vector3) => v.applyQuaternion(headQ).add(origin)
  reachCinematicHand(hero, {
    side: 'left',
    target: local(new Vector3(-0.24, -0.4 - settle * 0.25, 0.22 - settle * 0.13)),
    pole: local(new Vector3(-0.45, -0.4, 0.15)),
  })
  for (const side of ['left', 'right']) {
    victim.getObjectByName(`shoulder-${side}`)!.rotation.set(-0.5, 0, side === 'left' ? -0.2 : 0.2)
    victim.getObjectByName(`elbow-${side}`)!.rotation.x = -0.9
  }
  if (age >= 270) {
    victim.position.x += cinematicEase((age - 270) / 65) * 1.1
    victimHead.rotation.x = 0.2
  }
  if (age >= 350) victim.visible = false
  hero.updateWorldMatrix(true, true)
  victim.updateWorldMatrix(true, true)
  return {
    hero,
    victim,
    head,
    turns,
    handError,
    fist: hero.getObjectByName('hand-right')!.getWorldPosition(new Vector3()),
    shoulder: shoulder.getWorldPosition(new Vector3()),
    restore: () => {
      restores.reverse().forEach((r) => r())
      hero.updateWorldMatrix(true, true)
      victim.updateWorldMatrix(true, true)
    },
  }
}
