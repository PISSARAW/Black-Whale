import * as THREE from 'three'
import { buildGrimmelArrow } from '../../tour/emittedHatsuModels'
import { ease, disposeVictoryObject } from './resources'
import { HALKENBURG_IMPACT, HALKENBURG_RELEASE } from './halkenburgPose'
import type { VictoryContext } from './types'
import type { halkenburgVictoryPose } from './halkenburgPose'

export type HalkenburgPose = ReturnType<typeof halkenburgVictoryPose>
function bowLimb(material: THREE.Material) {
  return new THREE.Mesh(
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.08, -0.78, 0),
        new THREE.Vector3(0.12, -0.55, 0),
        new THREE.Vector3(0, -0.17, 0),
        new THREE.Vector3(0, 0.17, 0),
        new THREE.Vector3(0.12, 0.55, 0),
        new THREE.Vector3(-0.08, 0.78, 0),
      ]),
      60,
      0.022,
      8,
    ),
    material,
  )
}
export function createHalkenburgBow() {
  const root = new THREE.Group(),
    bow = new THREE.Group()
  root.name = 'halkenburg-grimmel-cinematic'
  const gold = new THREE.MeshBasicMaterial({ color: 0xffdf99 })
  bow.add(bowLimb(gold))
  const string = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(Array.from({ length: 3 }, () => new THREE.Vector3())),
    new THREE.LineBasicMaterial({ color: 0xfff5d5 }),
  )
  const arrow = buildGrimmelArrow(THREE, new THREE.MeshBasicMaterial({ color: 0xf5ead1 }))
  arrow.name = 'halkenburg-released-arrow'
  arrow.scale.setScalar(0.65)
  const trail = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.055, 1, 12),
    new THREE.MeshBasicMaterial({
      color: 0xf4deaa,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  )
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.88, 1, 80),
    new THREE.MeshBasicMaterial({
      color: 0xffeac2,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  )
  root.add(bow, string, arrow, trail, ring)
  const line = new THREE.Vector3(0, 0, 1),
    up = new THREE.Vector3(0, 1, 0)
  return {
    root,
    sync(context: VictoryContext, pose: HalkenburgPose) {
      const { age } = context,
        { grip, direction, nock, target } = pose
      bow.visible = age >= 66
      bow.position.copy(grip)
      const side = direction.clone().cross(up).normalize(),
        vertical = side.clone().cross(direction).normalize()
      bow.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(direction, vertical, side))
      bow.scale.setScalar(0.35 + ease((age - 66) / 45) * 0.65)
      bow.updateWorldMatrix(true, true)
      const tips = [-1, 1].map((sign) => bow.localToWorld(new THREE.Vector3(-0.08, sign * 0.78, 0)))
      const taut = age < HALKENBURG_RELEASE ? nock : grip.clone().addScaledVector(direction, -0.08)
      const points = string.geometry.getAttribute('position')
      ;[tips[0], taut, tips[1]].forEach((p, i) => points.setXYZ(i, p.x, p.y, p.z))
      points.needsUpdate = true
      string.visible = bow.visible
      arrow.visible = age >= 100 && age < 354
      arrow.quaternion.setFromUnitVectors(line.clone().negate(), direction)
      const start =
        age < HALKENBURG_RELEASE
          ? nock.clone().addScaledVector(direction, 0.52)
          : grip.clone().addScaledVector(direction, -0.06)
      const flight = Math.max(
        0,
        (age - HALKENBURG_RELEASE) / (HALKENBURG_IMPACT - HALKENBURG_RELEASE),
      )
      const contact = target.clone().addScaledVector(direction, -0.78)
      arrow.position.copy(start).lerp(contact, Math.min(1, flight))
      if (age > HALKENBURG_IMPACT)
        arrow.position.addScaledVector(direction, (age - HALKENBURG_IMPACT) * 0.23)
      const tip = arrow.position.clone().addScaledVector(direction, 0.78)
      trail.visible = age >= HALKENBURG_RELEASE && age < 354
      trail.position.copy(grip).lerp(tip, 0.5)
      trail.quaternion.setFromUnitVectors(up, direction)
      trail.scale.y = grip.distanceTo(tip)
      trail.material.opacity = 0.5 * (1 - ease((age - 334) / 20))
      const impact = age - HALKENBURG_IMPACT
      ring.visible = impact >= 0 && impact < 36
      ring.position.copy(target)
      ring.quaternion.copy(context.camera.quaternion)
      ring.scale.setScalar(0.05 + Math.max(0, impact) * 0.075)
      ring.material.opacity = Math.max(0, 0.8 * (1 - impact / 36))
      return { tip, contact: age === HALKENBURG_IMPACT ? tip.distanceTo(target) : null }
    },
    dispose() {
      disposeVictoryObject(root)
    },
  }
}
