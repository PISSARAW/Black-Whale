import {
  CylinderGeometry,
  Group,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  Vector3,
} from 'three'
import type { VictoryContext } from './types'
import type { MachiVictoryPose } from './machiPose'
import { MACHI_CAPTURE, MACHI_STITCH, MACHI_UNPICK } from './machiPose'
import { disposeVictoryObject, ease } from './resources'

export function machiFingerTips(context: VictoryContext) {
  return [0, 1, 2, 3, 4].map((i) => {
    const hand = context.hero.root.getObjectByName(i % 2 ? 'hand-left' : 'hand-right')!
    const finger = Math.floor(i / 2),
      length = [0.044, 0.055, 0.051][finger]
    return hand.localToWorld(new Vector3((finger - 1.5) * 0.019, -0.014 - length, 0))
  })
}
export function createMachiVictoryThreads() {
  const root = new Group()
  root.name = 'machi-finger-connected-threads'
  const material = new MeshBasicMaterial({ color: 0xffbce5 })
  const wire = new InstancedMesh(new CylinderGeometry(1, 1, 1, 6), material, 2048)
  wire.frustumCulled = false
  const needle = new Mesh(
    new CylinderGeometry(0.0035, 0.001, 0.09, 8),
    new MeshBasicMaterial({ color: 0xd7dfed }),
  )
  root.add(wire, needle)
  const dummy = new Object3D(),
    up = new Vector3(0, 1, 0)
  let count = 0
  function segment(a: Vector3, b: Vector3, radius = 0.0028) {
    if (count >= 2048) return
    const delta = b.clone().sub(a)
    dummy.position.copy(a).lerp(b, 0.5)
    dummy.quaternion.setFromUnitVectors(up, delta.clone().normalize())
    dummy.scale.set(radius, Math.max(0.00001, delta.length()), radius)
    dummy.updateMatrix()
    wire.setMatrixAt(count++, dummy.matrix)
  }
  function curve(points: Vector3[], radius = 0.0028) {
    for (let i = 1; i < points.length; i++) segment(points[i - 1], points[i], radius)
  }
  function capture(context: VictoryContext, pose: MachiVictoryPose, tips: Vector3[]) {
    const { age, victim } = context
    const targets = [
      ...pose.joints,
      victim.head.getWorldPosition(new Vector3()).add(new Vector3(0, -0.18, 0)),
    ]
    const reveal = ease((age - MACHI_CAPTURE) / 42),
      release = ease((age - MACHI_UNPICK) / 12)
    if (!reveal || release === 1) return
    targets.forEach((target, i) => {
      curve(
        Array.from({ length: 17 }, (_, j) =>
          tips[i]
            .clone()
            .lerp(target, j / 16)
            .add(new Vector3(0, -Math.sin((j / 16) * Math.PI) * (1 - reveal) * 0.2, 0)),
        ),
      )
    })
    const neck = targets[4]
    curve(
      Array.from({ length: 65 }, (_, i) => {
        const angle = (i / 64) * Math.PI * 4
        return neck
          .clone()
          .add(new Vector3(Math.cos(angle) * 0.075, (i / 64) * 0.015, Math.sin(angle) * 0.075))
      }),
    )
    const radius = victim.width * 0.63 + 0.035
    curve([
      tips[2],
      ...Array.from({ length: 161 }, (_, i) => {
        const t = i / 160,
          angle = t * Math.PI * 12
        return new Vector3(
          pose.centre.x + Math.cos(angle) * radius,
          pose.body.min.y + victim.height * (0.18 + t * 0.64),
          pose.centre.z + Math.sin(angle) * radius * 0.7,
        )
      }).slice(0, Math.max(2, Math.floor(161 * reveal))),
    ])
    const floor = pose.centre.clone().setY(0.035)
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2
      const anchor = floor.clone().add(new Vector3(Math.cos(angle) * 2.1, 0, Math.sin(angle) * 1.5))
      segment(anchor, pose.joints[i % 4], 0.0018 * reveal)
    }
  }
  function sutures(context: VictoryContext, pose: MachiVictoryPose, centres: Vector3[]) {
    const sewing = ease((context.age - MACHI_STITCH) / 54),
      release = ease((context.age - MACHI_UNPICK) / 12)
    if (!sewing || !centres.length || release === 1) return
    const width = pose.seamWidth
    for (let band = 1; band <= 3; band++) {
      const y = (centres[band - 1].y + centres[band].y) * 0.5
      const points = Array.from(
        { length: 33 },
        (_, i) =>
          new Vector3(
            pose.centre.x - width + (width * 2 * i) / 32,
            y + (i % 2 ? 0.04 : -0.04),
            pose.seamFront,
          ),
      )
      const visible = points.slice(0, Math.max(2, Math.floor(points.length * sewing)))
      curve([machiFingerTips(context)[band % 2], ...visible], 0.0032)
    }
  }
  return {
    root,
    sync(context: VictoryContext, pose: MachiVictoryPose, centres: Vector3[]) {
      count = 0
      const tips = machiFingerTips(context)
      needle.visible = context.age >= 210 && context.age < MACHI_UNPICK
      needle.position.copy(tips[1])
      needle.quaternion.setFromUnitVectors(up, tips[0].clone().sub(tips[1]).normalize())
      const tracking = ease(context.age / 42)
      const end = tips[0].clone().lerp(pose.mark, tracking)
      if (context.age < MACHI_UNPICK) segment(tips[0], end, 0.0022)
      capture(context, pose, tips)
      sutures(context, pose, centres)
      if (context.age >= 390 && context.age < MACHI_UNPICK) {
        curve(
          Array.from({ length: 49 }, (_, i) =>
            pose.grips[0]
              .clone()
              .lerp(pose.grips[1], i / 48)
              .add(new Vector3(0, Math.sin((i / 48) * Math.PI * 8) * 0.017, 0)),
          ),
        )
      }
      wire.count = count
      wire.instanceMatrix.needsUpdate = true
      return {
        count,
        tips,
        trackingEnd: end,
        controllingLength: tips[0].distanceTo(pose.joints[0]),
      }
    },
    dispose: () => disposeVictoryObject(root),
  }
}
