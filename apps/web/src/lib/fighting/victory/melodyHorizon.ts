import * as THREE from 'three'

export function melodySpringHorizon() {
  const root = new THREE.Group()
  root.name = 'melody-spring-horizon'
  const hillGeometry = new THREE.SphereGeometry(1, 32, 16)
  for (let i = 0; i < 4; i++) {
    const hill = new THREE.Mesh(
      hillGeometry,
      new THREE.MeshBasicMaterial({ color: i % 2 ? 0x9eb785 : 0x8fab77 }),
    )
    hill.position.set(-12 + i * 8, -0.8, -13 - (i % 2) * 2)
    hill.scale.set(10, 1.6 + (i % 2) * 0.7, 6)
    root.add(hill)
  }
  const sun = new THREE.Mesh(
    new THREE.SphereGeometry(1.4, 24, 16),
    new THREE.MeshBasicMaterial({ color: 0xffefd1 }),
  )
  sun.position.set(-6, 6, -17)
  root.add(sun)
  const cloudMaterial = new THREE.MeshBasicMaterial({ color: 0xfaf5e9 })
  for (let i = 0; i < 5; i++) {
    const cloud = new THREE.Mesh(hillGeometry, cloudMaterial)
    cloud.position.set(-11 + i * 5, 4.5 + (i % 2) * 1.5, -16)
    cloud.scale.set(2.4, 0.35, 0.5)
    root.add(cloud)
  }
  return root
}
