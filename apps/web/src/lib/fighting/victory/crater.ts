import {
  BoxGeometry,
  BufferGeometry,
  CircleGeometry,
  Color,
  DoubleSide,
  Group,
  InstancedMesh,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  RingGeometry,
  Vector3,
} from 'three'

export function createCinematicCrater() {
  const root = new Group()
  root.name = 'cinematic-shattered-arena'
  const basin = new Mesh(
    new CircleGeometry(1.7, 32),
    new MeshBasicMaterial({ color: 0x191519, side: DoubleSide }),
  )
  basin.rotation.x = -Math.PI / 2
  basin.position.set(0.48, 0.018, 0)
  const lip = new Mesh(
    new RingGeometry(1.45, 1.85, 24),
    new MeshBasicMaterial({ color: 0x584e47, side: DoubleSide }),
  )
  lip.rotation.x = -Math.PI / 2
  lip.position.copy(basin.position)
  lip.position.y += 0.002
  root.add(basin, lip)
  const slabs = new InstancedMesh(
    new BoxGeometry(1, 1, 1),
    new MeshBasicMaterial({ color: 0x75695c }),
    110,
  )
  slabs.frustumCulled = false
  for (let i = 0; i < 110; i++) slabs.setColorAt(i, new Color().setScalar(0.55 + (i % 6) * 0.075))
  root.add(slabs)
  const points: Vector3[] = []
  for (let i = 0; i < 22; i++) {
    const a = i * 2.39996
    let previous = new Vector3(0, 0.025, 0)
    for (let j = 1; j <= 6; j++) {
      const p = new Vector3(
        Math.cos(a + Math.sin(i * j) * 0.05) * j * 0.55,
        0.025,
        Math.sin(a) * j * 0.48,
      )
      points.push(previous, p)
      previous = p
    }
  }
  const cracks = new LineSegments(
    new BufferGeometry().setFromPoints(points),
    new LineBasicMaterial({ color: 0x17151a }),
  )
  cracks.position.x = 0.48
  root.add(cracks)
  const dummy = new Object3D()
  return {
    root,
    sync(age: number) {
      const t = Math.max(0, (age - 240) / 60),
        open = Math.min(1, t * 12)
      basin.visible = age >= 240
      lip.visible = age >= 240
      cracks.visible = age >= 240
      basin.scale.setScalar(open)
      lip.scale.setScalar(open)
      cracks.scale.setScalar(open)
      for (let i = 0; i < 110; i++) {
        const a = i * 2.39996,
          r = 0.4 + (i % 9) * 0.17,
          speed = 0.6 + (i % 7) * 0.3
        const hover =
          Math.max(0, Math.min(1, (age - 110) / 100)) *
          (0.08 + Math.sin(i * 3 + age * 0.025) * 0.035)
        const y = age < 240 ? hover : Math.max(0, t * (1.5 + (i % 5) * 0.6) - 2.8 * t * t)
        const radius = r + Math.min(t, 1.5) * speed
        dummy.position.set(0.48 + Math.cos(a) * radius, 0.045 + y, Math.sin(a) * radius * 0.65)
        dummy.rotation.set((i % 4) * 0.2 + t * ((i % 3) + 1), i * 0.9, Math.sin(i) * 0.2 + t)
        const size = age < 110 ? 0 : i < 40 ? 0.15 + (i % 4) * 0.055 : 0.025 + (i % 5) * 0.013
        dummy.scale.set(size * 1.5, size * 0.45, size)
        dummy.updateMatrix()
        slabs.setMatrixAt(i, dummy.matrix)
      }
      slabs.instanceMatrix.needsUpdate = true
    },
  }
}
