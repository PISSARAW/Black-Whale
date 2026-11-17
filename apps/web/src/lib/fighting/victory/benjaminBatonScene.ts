import {
  AdditiveBlending,
  BoxGeometry,
  BufferGeometry,
  CatmullRomCurve3,
  CylinderGeometry,
  Group,
  InstancedMesh,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  Quaternion,
  SphereGeometry,
  TorusGeometry,
  TubeGeometry,
  Vector3,
} from 'three'
import type { VictoryContext } from './types'
import { localToHead } from './pose'
import { ease } from './resources'

function soldierEcho() {
  const root = new Group()
  root.name = 'benjamin-fallen-soldier-echo'
  const aura = new MeshBasicMaterial({
    color: 0xd9c797,
    transparent: true,
    opacity: 0.2,
    blending: AdditiveBlending,
    depthWrite: false,
  })
  const part = (geometry: import('three').BufferGeometry, point: [number, number, number]) => {
    const mesh = new Mesh(geometry, aura)
    mesh.position.set(...point)
    root.add(mesh)
    return mesh
  }
  part(new BoxGeometry(0.38, 0.55, 0.19), [0, 1.12, 0])
  part(new SphereGeometry(0.12, 14, 10), [0, 1.61, 0])
  part(new CylinderGeometry(0.15, 0.14, 0.08, 16), [0, 1.72, 0])
  for (const side of [-1, 1]) {
    part(new CylinderGeometry(0.055, 0.045, 0.65, 8), [side * 0.105, 0.53, 0])
    const arm = part(new CylinderGeometry(0.045, 0.035, 0.55, 8), [side * 0.26, 1.12, 0.06])
    arm.rotation.z = side * 0.2
    part(new BoxGeometry(0.08, 0.09, 0.055), [side * 0.31, 0.82, 0.06])
  }
  return { root, aura }
}
function remembranceTag() {
  const root = new Group()
  root.name = 'benjamin-baton-remembrance-tags'
  const metal = new MeshBasicMaterial({ color: 0xbba16c })
  const engraving = new MeshBasicMaterial({ color: 0x393125 })
  for (const sign of [-1, 1]) {
    const tag = new Group()
    tag.position.set(sign * 0.041, sign * 0.018, 0)
    tag.rotation.z = sign * 0.13
    const plate = new Mesh(new BoxGeometry(0.067, 0.105, 0.009), metal)
    tag.add(plate)
    for (let i = 0; i < 3; i++) {
      const stroke = new Mesh(new BoxGeometry(0.04 - i * 0.006, 0.004, 0.001), engraving)
      stroke.position.set(0, 0.018 - i * 0.014, 0.0055)
      tag.add(stroke)
    }
    const hole = new Mesh(new TorusGeometry(0.009, 0.002, 5, 12), metal)
    hole.position.set(0, 0.04, 0.007)
    tag.add(hole)
    root.add(tag)
  }
  const chain = new Mesh(
    new TubeGeometry(
      new CatmullRomCurve3([
        new Vector3(-0.1, 0.22, -0.13),
        new Vector3(-0.11, 0.17, -0.025),
        new Vector3(-0.07, 0.075, 0.008),
        new Vector3(0, 0.045, 0.008),
        new Vector3(0.07, 0.075, 0.008),
        new Vector3(0.11, 0.17, -0.025),
        new Vector3(0.1, 0.22, -0.13),
        new Vector3(0, 0.23, -0.21),
        new Vector3(-0.1, 0.22, -0.13),
      ]),
      64,
      0.0022,
      5,
    ),
    metal,
  )
  root.add(chain)
  return root
}
export function createBenjaminBatonScene() {
  const root = new Group(),
    ghost = soldierEcho(),
    tags = remembranceTag()
  root.name = 'benjamin-cinematic-inheritance'
  const thread = new Line(
    new BufferGeometry().setFromPoints(Array.from({ length: 40 }, () => new Vector3())),
    new LineBasicMaterial({
      color: 0xfce2a5,
      transparent: true,
      opacity: 0.5,
      blending: AdditiveBlending,
      depthWrite: false,
    }),
  )
  const motes = new InstancedMesh(
    new SphereGeometry(0.008, 5, 4),
    new MeshBasicMaterial({
      color: 0xffdd94,
      transparent: true,
      opacity: 0.85,
      blending: AdditiveBlending,
      depthWrite: false,
    }),
    48,
  )
  motes.frustumCulled = false
  root.add(ghost.root, tags, thread, motes)
  const dummy = new Object3D()
  return {
    root,
    sync(options: { context: VictoryContext; palm: Vector3 }) {
      const { context, palm } = options,
        { hero, age } = context
      const transfer = ease((age - 130) / 88),
        reveal = ease((age - 62) / 44)
      tags.position.copy(localToHead(hero, new Vector3(0, -0.38, 0.18)))
      tags.quaternion.copy(hero.head.getWorldQuaternion(new Quaternion()))
      tags.rotation.z += Math.sin(age / 32) * 0.035
      tags.scale.setScalar(1 + (age < 220 ? Math.sin(age / 14) * 0.012 : 0))
      ghost.root.visible = age >= 62 && age < 224
      const origin = new Vector3(hero.root.position.x - 0.5, 0, -0.42)
      const ghostScale = hero.height / 1.9
      ghost.root.position.copy(origin).lerp(palm, transfer)
      ghost.root.scale.setScalar(ghostScale * Math.max(0.002, 1 - transfer * 0.96))
      ghost.root.rotation.y = hero.root.rotation.y
      ghost.aura.opacity = reveal * (1 - transfer) * 0.26
      const source = origin.clone().add(new Vector3(0.25, hero.height * 0.66, 0))
      const arc = (t: number) =>
        source
          .clone()
          .lerp(palm, t)
          .add(new Vector3(0, Math.sin(t * Math.PI) * 0.25, Math.sin(t * Math.PI) * 0.12))
      thread.visible = age >= 96 && age < 225
      const positions = thread.geometry.getAttribute('position')
      for (let i = 0; i < 40; i++) {
        const point = arc(i / 39)
        positions.setXYZ(i, point.x, point.y, point.z)
      }
      positions.needsUpdate = true
      thread.geometry.computeBoundingSphere()
      motes.visible = age >= 96 && age < 238
      for (let i = 0; i < 48; i++) {
        const progress = ((age - 96) / 70 + i / 48) % 1
        dummy.position
          .copy(arc(progress))
          .add(new Vector3(Math.sin(i * 2.4) * 0.035, Math.cos(i * 3) * 0.035, 0))
        dummy.scale.setScalar((1 - ease((age - 214) / 24)) * (0.5 + (i % 3) * 0.25))
        dummy.updateMatrix()
        motes.setMatrixAt(i, dummy.matrix)
      }
      motes.instanceMatrix.needsUpdate = true
    },
  }
}
