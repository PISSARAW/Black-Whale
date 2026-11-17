import {
  CatmullRomCurve3,
  CircleGeometry,
  DoubleSide,
  Group,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  SphereGeometry,
  TorusGeometry,
  TubeGeometry,
  Vector3,
} from 'three'
import type { BufferGeometry } from 'three'
import type { VictoryContext } from './types'
import type { ShizukuVictoryPose } from './shizukuPose'
import {
  SHIZUKU_HIT,
  SHIZUKU_BLOOD,
  SHIZUKU_DEATH,
  SHIZUKU_CLEAN,
  SHIZUKU_BUTTON,
  SHIZUKU_RETURN,
} from './shizukuPose'
import { disposeVictoryObject, ease } from './resources'

export function createShizukuEffects() {
  const root = new Group()
  root.name = 'shizuku-clean-scene'
  const red = new MeshBasicMaterial({ color: 0x8f2940 })
  const stream: Mesh<BufferGeometry> = new Mesh(new SphereGeometry(0.001), red)
  stream.name = 'shizuku-stylized-blood-stream'
  const dust = new InstancedMesh(
    new SphereGeometry(1, 5, 4),
    new MeshBasicMaterial({ color: 0x9e9297 }),
    80,
  )
  dust.frustumCulled = false
  const marks = new InstancedMesh(new CircleGeometry(1, 12), red, 10)
  marks.frustumCulled = false
  const wound = new Mesh(new CircleGeometry(1, 12), red)
  wound.scale.set(0.008, 0.034, 1)
  const button = new Group()
  button.name = 'shizuku-last-object-button'
  const brass = new MeshBasicMaterial({ color: 0xd4bb7c, side: DoubleSide })
  button.add(
    new Mesh(new CircleGeometry(0.026, 18), brass),
    new Mesh(new TorusGeometry(0.026, 0.003, 6, 18), brass),
  )
  for (const sign of [-1, 1]) {
    const hole = new Mesh(
      new CircleGeometry(0.003, 8),
      new MeshBasicMaterial({ color: 0x443f39, side: DoubleSide }),
    )
    hole.position.set(sign * 0.008, 0, 0.001)
    button.add(hole)
  }
  root.add(stream, dust, marks, wound, button)
  const dummy = new Object3D()
  function blood(context: VictoryContext, pose: ShizukuVictoryPose, mouth: Vector3) {
    const { age } = context
    stream.visible = age >= SHIZUKU_BLOOD && age < SHIZUKU_DEATH
    if (stream.visible) {
      const curve = new CatmullRomCurve3([
        pose.wound,
        pose.wound
          .clone()
          .lerp(mouth, 0.4)
          .add(new Vector3(0, 0.06, 0.04)),
        mouth,
      ])
      stream.geometry.dispose()
      stream.geometry = new TubeGeometry(curve, 32, 0.007 + Math.sin(age * 0.3) * 0.0015, 6, false)
    }
    wound.visible = age >= SHIZUKU_HIT && age < SHIZUKU_DEATH
    wound.position.copy(pose.wound)
  }
  function cleanup(context: VictoryContext, pose: ShizukuVictoryPose, mouth: Vector3) {
    const { age } = context
    const cleaning = age >= SHIZUKU_CLEAN && age < 432
    dust.count = cleaning ? 80 : 0
    for (let i = 0; i < dust.count; i++) {
      const angle = i * 2.4,
        radius = 0.25 + (i % 11) * 0.08
      const start = new Vector3(
        pose.collapse.x + Math.cos(angle) * radius,
        0.025,
        pose.collapse.z + Math.sin(angle) * radius,
      )
      const t = ((age - SHIZUKU_CLEAN) * 0.025 + i / 80) % 1
      dummy.position.copy(start).lerp(mouth, t)
      dummy.position.y += Math.sin(t * Math.PI) * 0.15
      dummy.scale.setScalar(0.009 * (1 - t))
      dummy.updateMatrix()
      dust.setMatrixAt(i, dummy.matrix)
    }
    dust.instanceMatrix.needsUpdate = true
    marks.count = age >= SHIZUKU_DEATH && age < 432 ? 10 : 0
    const pull = ease((age - 384) / 48)
    for (let i = 0; i < marks.count; i++) {
      dummy.position.set(
        pose.collapse.x + Math.sin(i * 2.4) * 0.4,
        0.028,
        pose.collapse.z + Math.cos(i * 2.4) * 0.3,
      )
      dummy.position.lerp(mouth, pull)
      dummy.rotation.set(-Math.PI / 2, 0, i)
      dummy.scale.setScalar((0.014 + (i % 3) * 0.007) * (1 - pull))
      dummy.updateMatrix()
      marks.setMatrixAt(i, dummy.matrix)
    }
    marks.instanceMatrix.needsUpdate = true
  }
  function lastObject(context: VictoryContext, pose: ShizukuVictoryPose, mouth: Vector3) {
    const { age, hero } = context
    const fall = ease((age - SHIZUKU_HIT) / 54)
    const floor = new Vector3(context.centre + context.gap / 2 + 0.4, 0.035, 0.52)
    button.position.copy(pose.wound).lerp(floor, fall)
    button.position.y += Math.sin(fall * Math.PI) * 0.3
    button.quaternion.identity()
    button.rotation.x = (-fall * Math.PI) / 2
    const swallow = ease((age - 426) / (SHIZUKU_BUTTON - 426))
    if (age >= 426 && age < SHIZUKU_RETURN) button.position.copy(floor).lerp(mouth, swallow)
    if (age >= SHIZUKU_RETURN) {
      const palm = hero.root
        .getObjectByName('hand-left')!
        .getWorldPosition(new Vector3())
        .add(new Vector3(0, 0.015, 0.03))
      const returned = ease((age - SHIZUKU_RETURN) / 24)
      button.position.copy(mouth).lerp(palm, returned)
      button.position.y += Math.sin(returned * Math.PI) * 0.16
      button.rotation.set(age * 0.1 * (1 - returned), 0, 0)
    }
    button.visible =
      age >= SHIZUKU_HIT && (age < SHIZUKU_BUTTON || (age >= SHIZUKU_RETURN && age < 522))
    return {
      visible: button.visible,
      returned: age >= SHIZUKU_RETURN + 24,
      lastSwallowedFrame: SHIZUKU_BUTTON,
    }
  }
  return {
    root,
    sync(context: VictoryContext, pose: ShizukuVictoryPose, mouth: Vector3) {
      blood(context, pose, mouth)
      cleanup(context, pose, mouth)
      return { ...lastObject(context, pose, mouth), bloodVisible: stream.visible }
    },
    dispose: () => disposeVictoryObject(root),
  }
}
