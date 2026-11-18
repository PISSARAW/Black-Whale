import * as T from 'three'
import type { VictoryContext } from './types'
import type { ZakuroPose } from './zakuroPose'
import { disposeVictoryObject, ease } from './resources'

function eyedDrop() {
  const root = new T.Group(),
    eye = new T.Group()
  const body = new T.Mesh(
    new T.SphereGeometry(0.075, 16, 10),
    new T.MeshBasicMaterial({ color: 0x9c173e }),
  )
  body.scale.set(1, 0.85, 1)
  const white = new T.Mesh(
    new T.SphereGeometry(0.04, 12, 8),
    new T.MeshBasicMaterial({ color: 0xf6e7e0 }),
  )
  const pupil = new T.Mesh(
    new T.SphereGeometry(0.018, 10, 8),
    new T.MeshBasicMaterial({ color: 0x120a12 }),
  )
  pupil.position.z = 0.037
  eye.position.set(0, 0.015, 0.059)
  eye.add(white, pupil)
  root.add(body, eye)
  return { root, eye }
}
export function createZakuroDrops() {
  const root = new T.Group(),
    drops = [eyedDrop(), eyedDrop(), eyedDrop()],
    final = eyedDrop()
  root.name = 'zakuro-own-blood-scouts'
  root.add(...drops.map((d) => d.root), final.root)
  return {
    sync(context: VictoryContext, pose: ZakuroPose) {
      const { age, hero, victim } = context
      const travel = ease((age - 54) / 78),
        recall = ease((age - 144) / 36)
      drops.forEach((drop, i) => {
        const endpoint = new T.Vector3(
          victim.root.position.x + (i - 1) * 0.18,
          0.075,
          i === 1 ? -0.18 : 0.26,
        )
        const start = pose.wound
          .clone()
          .lerp(new T.Vector3(hero.root.position.x + 0.22, 0.075, 0.25), ease((age - 48) / 18))
        drop.root.position.copy(start).lerp(endpoint, travel).lerp(pose.wound, recall)
        drop.root.position.y += Math.sin(Math.PI * travel) * 0.045
        drop.root.scale.setScalar(Math.max(0.001, ease((age - 48 - i * 3) / 12) * (1 - recall)))
        drop.root.visible = age >= 48 && age < 180
        drop.eye.rotation.y = Math.sin(age * 0.08 + i) * 0.28
      })
      final.root.visible = age >= 468
      final.root.position.copy(pose.finger)
      final.root.scale.setScalar(ease((age - 468) / 18))
      const blink = Math.sin(Math.PI * Math.max(0, Math.min(1, (age - 546) / 18)))
      final.eye.scale.y = 1 - blink * 0.95
      context.add(root)
      return {
        scouts: age >= 54 && age < 180 ? 3 : 0,
        scoutAttack: false,
        enemyBloodControlled: false,
        recalled: recall === 1,
        wink: blink,
      }
    },
    dispose: () => disposeVictoryObject(root),
  }
}
