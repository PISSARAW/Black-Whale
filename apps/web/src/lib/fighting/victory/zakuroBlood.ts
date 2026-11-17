import * as T from 'three'
import type { VictoryContext } from './types'
import type { ZakuroPose } from './zakuroPose'
import { disposeVictoryObject, ease } from './resources'

export function createZakuroBlood() {
  const root = new T.Group()
  const material = new T.MeshBasicMaterial({ color: 0x8e1232 })
  const ropes = Array.from({ length: 4 }, () => new T.Mesh(new T.BufferGeometry(), material))
  const cuffGeometry = new T.TorusGeometry(0.075, 0.025, 8, 20)
  const cuffs = Array.from({ length: 4 }, () => new T.Mesh(cuffGeometry, material))
  const wound = new T.Mesh(new T.SphereGeometry(0.022, 10, 8), material)
  root.name = 'zakuro-finite-own-blood'
  root.add(...ropes, ...cuffs, wound)
  return {
    sync(context: VictoryContext, pose: ZakuroPose) {
      const { age } = context
      const deploy = ease((age - 180) / 48),
        recall = ease((age - 420) / 48)
      const endpoints = [...pose.ankles, ...pose.wrists]
      const lengths = endpoints.map((p) => p.distanceTo(pose.wound) + 0.5)
      const radius = Math.max(
        0.009,
        Math.min(0.032, Math.sqrt(0.014 / lengths.reduce((a, b) => a + b, 0))),
      )
      ropes.forEach((rope, i) => {
        const end = endpoints[i].clone().lerp(pose.wound, recall)
        const points = Array.from({ length: 25 }, (_, n) => {
          const t = n / 24
          const point = pose.wound.clone().lerp(end, t * deploy)
          const coil = Math.max(0, (t - 0.78) / 0.22)
          const arc = Math.sin(Math.PI * t) * 0.12 * (i % 2 ? 1 : -1)
          point.z += arc + Math.sin(coil * Math.PI * 4) * 0.065 * deploy * (1 - recall)
          point.y += Math.cos(coil * Math.PI * 4) * 0.04 * deploy * (1 - recall)
          return point
        })
        rope.geometry.dispose()
        rope.geometry = new T.TubeGeometry(
          new T.CatmullRomCurve3(points),
          40,
          radius * (1 - recall * 0.7),
          7,
          false,
        )
        rope.visible = age >= 180 && age < 468
        cuffs[i].position.copy(end)
        cuffs[i].scale.setScalar(deploy * (1 - recall))
        cuffs[i].visible = age >= 210 && age < 468
      })
      wound.position.copy(pose.wound)
      wound.visible = age >= 24
      context.add(root)
      return {
        finiteSupply: true,
        enemyZetsu: false,
        ownBloodOnly: true,
        radius,
        recalledBlood: recall === 1,
      }
    },
    dispose: () => disposeVictoryObject(root),
  }
}
