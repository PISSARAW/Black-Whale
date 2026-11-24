import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import { placeThirdPersonCamera, thirdPersonHeading } from './TourCameraPlacement'

describe('third-person combat camera', () => {
  it('locks the walking heading onto each side of a target', () => {
    expect(thirdPersonHeading([0, 0], [0, -5])).toBeCloseTo(0)
    expect(thirdPersonHeading([0, 0], [5, 0])).toBeCloseTo(-Math.PI / 2)
  })

  it('stands behind the fighter shoulder and looks back at the opponent', () => {
    const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 100)
    placeThirdPersonCamera({
      camera,
      at: [0, 0],
      eye: 1.65,
      yaw: 0,
      pitch: 0,
      roll: 0,
      pullback: 3.6,
      ground: 0,
      thirdPerson: { target: [0, -5], distance: 3.6, shoulder: 0.48, lockOn: true },
    })

    expect(camera.position.x).toBeCloseTo(0.48)
    expect(camera.position.z).toBeCloseTo(3.6)
    const forward = camera.getWorldDirection(new THREE.Vector3())
    const toTarget = new THREE.Vector3(0, 1.05, -5).sub(camera.position).normalize()
    expect(forward.dot(toTarget)).toBeCloseTo(1)
  })
})
