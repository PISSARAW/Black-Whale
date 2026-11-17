import {
  DoubleSide,
  Group,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PlaneGeometry,
  Vector3,
} from 'three'
import type { VictoryContext } from './types'
import type { kallutoVictoryPose } from './kallutoPose'
import { KALLUTO_ATTACH, KALLUTO_STORM } from './kallutoPose'
import { disposeVictoryObject, ease } from './resources'

export const KALLUTO_PAPERS = 12288
const random = (i: number) => {
  const n = Math.sin(i * 127.1 + 43.7) * 43758.5453
  return n - Math.floor(n)
}
export function createKallutoSwarm() {
  const root = new Group()
  root.name = 'kalluto-paper-tempest'
  const geometry = new PlaneGeometry(1, 1)
  const material = new MeshBasicMaterial({ color: 0xf5f0e6, side: DoubleSide })
  const field = new InstancedMesh(geometry, material, 8192)
  const blades = new InstancedMesh(geometry, material, 4096)
  field.frustumCulled = blades.frustumCulled = false
  field.name = 'kalluto-paper-ocean'
  blades.name = 'kalluto-cutting-serpents'
  const mark = new Mesh(new PlaneGeometry(0.045, 0.065), material)
  mark.name = 'kalluto-first-paper'
  root.add(field, blades, mark)
  const seeds = Array.from({ length: KALLUTO_PAPERS }, (_, i) => [
    random(i + 1),
    random(i + 752),
    random(i + 17031),
  ])
  const dummy = new Object3D()
  function ocean(context: VictoryContext, pose: ReturnType<typeof kallutoVictoryPose>) {
    const { age, hero } = context
    const reveal = ease((age - 162) / 84),
      attack = ease((age - KALLUTO_STORM) / 54)
    const release = ease((age - 450) / 90)
    field.count = Math.floor(8192 * reveal)
    const centre = new Vector3(hero.root.position.x, 1.7, -2).lerp(
      pose.target.clone().add(new Vector3(0, 0, -1.7)),
      attack,
    )
    for (let i = 0; i < field.count; i++) {
      const [u, v, w] = seeds[i],
        angle = u * Math.PI * 14 + age * (0.009 + v * 0.006)
      const radius = (1.6 + v * 3.3) * (0.3 + 0.7 * Math.sin(w * Math.PI)) * (1 - attack * 0.38)
      dummy.position.set(
        centre.x + Math.cos(angle) * radius,
        0.12 + w * (4.8 - attack * 1.7),
        centre.z + Math.sin(angle) * 1.4,
      )
      dummy.position.y = Math.max(0.03, dummy.position.y - release * (2 + w * 2.7))
      dummy.rotation.set(angle + v, age * 0.03 + w * 6, angle * 0.5)
      const size = (0.055 + u * 0.08) * (1 - release * 0.85)
      dummy.scale.set(size, size * (1.3 + v), 1)
      dummy.updateMatrix()
      field.setMatrixAt(i, dummy.matrix)
    }
    field.instanceMatrix.needsUpdate = true
  }
  function cutting(context: VictoryContext, pose: ReturnType<typeof kallutoVictoryPose>) {
    const { age, victim } = context
    const attack = ease((age - KALLUTO_STORM) / 30),
      settle = ease((age - 450) / 75)
    blades.count = age < KALLUTO_STORM ? 0 : Math.floor(4096 * attack)
    for (let i = 0; i < blades.count; i++) {
      const [u, v, w] = seeds[i + 8192],
        angle = age * (0.1 + v * 0.035) + u * Math.PI * 2
      const radius = 0.3 + v * (1.3 + settle * 2.5)
      dummy.position.set(
        pose.mark.x + Math.cos(angle) * radius,
        0.08 + w * victim.height,
        pose.mark.z + Math.sin(angle) * radius * 0.65,
      )
      dummy.position.y = Math.max(0.03, dummy.position.y - settle * w * victim.height)
      dummy.rotation.set(angle, angle * 0.7, angle + Math.PI / 3)
      const size = (0.026 + v * 0.045) * (1 - settle * 0.8)
      dummy.scale.set(size * (2 + attack), size, 1)
      dummy.updateMatrix()
      blades.setMatrixAt(i, dummy.matrix)
    }
    blades.instanceMatrix.needsUpdate = true
  }
  return {
    root,
    sync(context: VictoryContext, pose: ReturnType<typeof kallutoVictoryPose>) {
      const travel = ease((context.age - 30) / (KALLUTO_ATTACH - 30))
      mark.visible = context.age >= 30 && context.age < 450
      mark.position.copy(pose.origin).lerp(pose.mark, travel)
      mark.position.y += Math.sin(travel * Math.PI) * 0.08
      mark.rotation.set(0, 0, 0.3 * (1 - travel))
      ocean(context, pose)
      cutting(context, pose)
      return {
        paper: mark.position.clone(),
        attached: travel === 1,
        count: field.count + blades.count,
      }
    },
    dispose: () => disposeVictoryObject(root),
  }
}
