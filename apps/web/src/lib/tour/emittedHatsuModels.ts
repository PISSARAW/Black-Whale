import type { Material } from 'three'

/** Exact visitor flash geometry; timing, scale and illumination belong to the scene. */
export function buildGrimmelArrow(THREE: typeof import('three'), material: Material) {
  const arrow = new THREE.Group()
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.6, 6), material)
  shaft.name = 'grimmel-shaft'
  shaft.rotation.x = Math.PI / 2
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.4, 6), material)
  head.name = 'grimmel-head'
  head.rotation.x = -Math.PI / 2
  head.position.z = -1
  arrow.add(shaft, head)
  return arrow
}

export function buildRisingSun(THREE: typeof import('three'), material: Material) {
  const sun = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 16), material)
  sun.name = 'rising-sun-core'
  return sun
}
