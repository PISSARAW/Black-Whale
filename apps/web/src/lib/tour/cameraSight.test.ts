import { BoxGeometry, Mesh, MeshBasicMaterial, PerspectiveCamera, Vector3 } from 'three'
import { describe, expect, it } from 'vitest'
import { CameraSight } from './cameraSight'

function box(x: number, y: number, z: number, height = 1) {
  const mesh = new Mesh(new BoxGeometry(1, height, 1), new MeshBasicMaterial())
  mesh.position.set(x, y, z)
  mesh.updateMatrixWorld()
  return mesh
}

describe('camera sight', () => {
  it('drops both visibility and aim behind cover and restores them when it moves', () => {
    const camera = new PerspectiveCamera(60, 1, 0.1, 30)
    camera.updateMatrixWorld()
    const sight = new CameraSight(camera)
    const target = box(0, 0, -5)
    const cover = box(0, 0, -2)
    expect(sight.sees(target.position, target, [cover])).toBe(false)
    expect(sight.aimsAt(target, [cover])).toBe(false)
    cover.position.x = 2
    cover.updateMatrixWorld()
    expect(sight.sees(target.position, target, [cover])).toBe(true)
    expect(sight.aimsAt(target, [cover])).toBe(true)
  })

  it('distinguishes an exposed head from a covered point of aim', () => {
    const camera = new PerspectiveCamera(60, 1, 0.1, 30)
    camera.updateMatrixWorld()
    const sight = new CameraSight(camera)
    const target = box(0, 0, -5, 3)
    const cover = box(0, -0.5, -2, 1.5)
    expect(sight.sees(new Vector3(0, 1.3, -5), target, [cover])).toBe(true)
    expect(sight.aimsAt(target, [cover])).toBe(false)
    camera.rotateY(Math.PI)
    camera.updateMatrixWorld()
    expect(sight.sees(target.position, target, [])).toBe(false)
  })
})
