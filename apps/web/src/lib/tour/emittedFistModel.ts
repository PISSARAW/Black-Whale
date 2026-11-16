import type { Material } from 'three'

/** Visit geometry for Remote Punch and Ripper Cyclotron; staging is owned by each mode. */
export function buildEmittedFist(THREE: typeof import('three'), material: Material) {
  const fist = new THREE.Group()
  const knuckles = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.75, 0.8), material)
  knuckles.name = 'emitted-knuckles'
  knuckles.position.y = 1.2
  const thumb = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.55), material)
  thumb.name = 'emitted-thumb'
  thumb.position.set(0.55, 1.15, 0.1)
  const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 1.6, 10), material)
  forearm.name = 'emitted-forearm'
  forearm.position.y = 0.2
  fist.add(knuckles, thumb, forearm)
  return fist
}
