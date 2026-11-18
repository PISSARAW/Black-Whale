import * as T from 'three'
import type { VictoryContext } from './types'
import type { LuiniPose } from './luiniPose'
import { disposeVictoryObject, ease } from './resources'

function aperture() {
  const root = new T.Group()
  const dark = new T.Mesh(
    new T.CircleGeometry(0.5, 48),
    new T.MeshBasicMaterial({ color: 0x050b17, side: T.DoubleSide }),
  )
  const edge = new T.Mesh(
    new T.TorusGeometry(0.5, 0.012, 8, 48),
    new T.MeshBasicMaterial({ color: 0x8abbe0, transparent: true, opacity: 0.8 }),
  )
  root.add(dark, edge)
  root.rotation.y = Math.PI / 2
  return { root, edge }
}
function openness(age: number, interval: [number, number]) {
  return ease((age - interval[0]) / 12) * (1 - ease((age - interval[1]) / 12))
}
export function createLuiniPortals() {
  const root = new T.Group(),
    a = aperture(),
    b = aperture()
  root.name = 'luini-owner-only-passages'
  root.add(a.root, b.root)
  return {
    sync(context: VictoryContext, pose: LuiniPose) {
      const { age } = context,
        h = pose.layout.height
      const openingA = Math.max(openness(age, [72, 132]), openness(age, [222, 270]))
      const openingB = Math.max(openness(age, [108, 168]), openness(age, [210, 246]))
      for (const [p, x, amount] of [
        [a, pose.layout.a - 0.4, openingA],
        [b, pose.layout.b, openingB],
      ] as const) {
        p.root.position.set(x, h / 2, 0)
        p.root.scale.set(h * 0.5 * amount, h * amount, 1)
        p.root.visible = amount > 0.001 && pose.track.portalsAllowed
        p.edge.visible = context.comfort.flashes
      }
      context.add(root)
      return {
        ownerOnly: true,
        victimTransported: false,
        portalDamage: 0,
        activePortals: Number(a.root.visible) + Number(b.root.visible),
        bodyCount: 1,
      }
    },
    dispose: () => disposeVictoryObject(root),
  }
}
