import type { ProjectileSceneOptions } from './projectileScene'
import type { FightProjectile } from './types'

/** A banded planet at the same scale as its collision volume, rather than an aura bullet. */
export function createJupiterScene(options: ProjectileSceneOptions) {
  const { THREE, scene, geometry } = options
  const material = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false })
  const planets = new Map<number, import('three').Mesh>()
  const build = (shot: FightProjectile) => {
    const sphere = new THREE.SphereGeometry(1, 32, 24)
    const positions = sphere.getAttribute('position')
    const colors: number[] = []
    for (let vertex = 0; vertex < positions.count; vertex++) {
      const y = positions.getY(vertex)
      const band = Math.floor((y + 1) * 9) % 3
      const color = new THREE.Color([0xdac398, 0xb97950, 0xe5d4b4][band])
      colors.push(color.r, color.g, color.b)
    }
    sphere.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    const mesh = new THREE.Mesh(geometry(sphere), material)
    mesh.name = `bonolenov-jupiter:${shot.id}`
    scene.add(mesh)
    planets.set(shot.id, mesh)
    return mesh
  }
  return {
    sync(shots: readonly FightProjectile[], seconds: number) {
      const active = new Set<number>()
      for (const shot of shots.filter((projectile) => projectile.jupiter)) {
        active.add(shot.id)
        const mesh = planets.get(shot.id) ?? build(shot)
        mesh.position.set(options.worldX(shot.x), options.worldY(shot.y), 0)
        mesh.scale.set(
          Math.abs(options.worldX(shot.width) - options.worldX(0)),
          Math.abs(options.worldY(shot.height) - options.worldY(0)),
          Math.abs(options.worldX(shot.width) - options.worldX(0)),
        )
        mesh.rotation.y = seconds * 0.8
      }
      for (const [id, mesh] of planets)
        if (!active.has(id)) {
          scene.remove(mesh)
          planets.delete(id)
        }
    },
    dispose() {
      for (const mesh of planets.values()) scene.remove(mesh)
      planets.clear()
      material.dispose()
    },
  }
}
