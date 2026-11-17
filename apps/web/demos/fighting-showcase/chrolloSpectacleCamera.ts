import {
  AdditiveBlending,
  CanvasTexture,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  Quaternion,
  Vector3,
} from 'three'
import type { Object3D, PerspectiveCamera, Scene } from 'three'

const smooth = (v: number) => {
  const t = Math.max(0, Math.min(1, v))
  return t * t * (3 - 2 * t)
}
export function createSunInsert() {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const c = canvas.getContext('2d')!
  c.strokeStyle = '#ffb36c'
  c.lineWidth = 14
  c.shadowColor = '#ff4822'
  c.shadowBlur = 22
  c.beginPath()
  c.arc(256, 256, 100, 0, Math.PI * 2)
  c.stroke()
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6
    c.beginPath()
    c.moveTo(256 + Math.cos(a) * 124, 256 + Math.sin(a) * 124)
    c.lineTo(256 + Math.cos(a) * 180, 256 + Math.sin(a) * 180)
    c.stroke()
  }
  return new Mesh(
    new PlaneGeometry(0.19, 0.19),
    new MeshBasicMaterial({
      map: new CanvasTexture(canvas),
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
      depthTest: false,
    }),
  )
}

export function spectacleCamera(
  camera: PerspectiveCamera,
  options: {
    scene: Scene
    head: Object3D
    hero: Object3D
    age: number
    sun: ReturnType<typeof createSunInsert>
  },
) {
  const { scene, head, hero, age, sun } = options
  const q = head.getWorldQuaternion(new Quaternion()),
    origin = head.getWorldPosition(new Vector3())
  const local = (v: Vector3) => v.applyQuaternion(q).add(origin)
  let shot: string
  if (age < 75) {
    shot = 'sun-mark'
    const targetHead = scene.getObjectByName('manga-head:hisoka')!
    const rotation = targetHead.getWorldQuaternion(new Quaternion())
    const target = targetHead.localToWorld(new Vector3(0, -0.5, 0.22))
    sun.position.copy(target)
    sun.quaternion.copy(rotation)
    sun.material.opacity = 0.7 + Math.sin(age * 0.16) * 0.2
    scene.add(sun)
    sun.updateMatrixWorld(true)
    camera.position
      .copy(target)
      .add(new Vector3(0.08, 0.06, 0.8 - smooth(age / 75) * 0.17).applyQuaternion(rotation))
    camera.up.set(0, 1, 0).applyQuaternion(rotation)
    camera.lookAt(target)
    hero.visible = false
  } else if (age < 180) {
    shot = age < 150 ? 'pages-and-bookmark' : 'book-snap'
    const t = smooth((age - 75) / 105)
    camera.position.copy(local(new Vector3(-0.23 + t * 0.32, -0.39, 1.1 - t * 0.1)))
    camera.up.set(0, 1, 0).applyQuaternion(q)
    camera.lookAt(local(new Vector3(0.08, -0.5, 0.2)))
  } else if (age < 420) {
    shot = age < 240 ? 'detonation' : 'orbit-and-exit'
    const orbit = smooth((age - 180) / 240)
    const wide = smooth((age - 235) / 45)
    camera.position.copy(
      local(new Vector3(-0.85 + orbit * 1.25, -0.1 + orbit * 0.12, 3.7 + wide * 0.9)),
    )
    const jolt = Math.exp(-(age - 180) / 16) * 0.045
    camera.position.add(
      new Vector3(Math.sin(age * 2.3), Math.cos(age * 1.9), 0).multiplyScalar(jolt),
    )
    camera.up.set(0, 1, 0).applyQuaternion(q)
    camera.lookAt(local(new Vector3(-0.38, -0.25 - wide * 0.55, -0.1)))
  } else {
    shot = 'last-look'
    const t = smooth((age - 420) / 180)
    camera.position.copy(local(new Vector3(0.28 - t * 0.23, 0.015, 2.0 - t * 0.5)))
    camera.up.set(0, 1, 0).applyQuaternion(q)
    camera.lookAt(local(new Vector3(-0.06, -0.08, 0.08)))
  }
  camera.updateMatrixWorld(true)
  return { shot, restore: () => scene.remove(sun) }
}
