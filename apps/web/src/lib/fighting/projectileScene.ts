import type { FightProjectile } from './types'

interface ProjectileSceneOptions {
  THREE: typeof import('three')
  scene: import('three').Scene
  glow: (colour: number, opacity: number) => import('three').MeshBasicMaterial
  geometry: <T extends import('three').BufferGeometry>(made: T) => T
  worldX: (value: number) => number
  worldY: (value: number) => number
}

export interface ProjectileScene {
  sync: (projectiles: FightProjectile[], seconds: number) => void
  dispose: () => void
}

export function createProjectileScene(options: ProjectileSceneOptions): ProjectileScene {
  const { THREE, scene } = options
  const meshes = new Map<number, import('three').Mesh>()

  const build = (projectile: FightProjectile) => {
    const colour = Number.parseInt(projectile.colour.slice(1), 16)
    const material =
      projectile.shape === 'stone'
        ? new THREE.MeshStandardMaterial({ color: colour, roughness: 0.94, metalness: 0 })
        : options.glow(colour, 1)
    const mesh = new THREE.Mesh(projectileGeometry(options, projectile), material)
    scene.add(mesh)
    meshes.set(projectile.id, mesh)
    return mesh
  }

  const sync = (projectiles: FightProjectile[], seconds: number) => {
    const active = new Set(projectiles.map((projectile) => projectile.id))
    for (const projectile of projectiles) {
      const mesh = meshes.get(projectile.id) ?? build(projectile)
      mesh.position.set(options.worldX(projectile.x), options.worldY(projectile.y), 0.32)
      mesh.rotation.x = ['orb', 'stone'].includes(projectile.shape) ? seconds * 4 : 0
      mesh.rotation.z = projectile.shape === 'card' ? seconds * 8 : seconds * 2
    }
    for (const [id, mesh] of meshes) {
      if (active.has(id)) continue
      scene.remove(mesh)
      meshes.delete(id)
    }
  }

  return {
    sync,
    dispose: () => {
      for (const mesh of meshes.values()) scene.remove(mesh)
      meshes.clear()
    },
  }
}

function projectileGeometry(
  options: ProjectileSceneOptions,
  projectile: FightProjectile,
): import('three').BufferGeometry {
  const { THREE, geometry } = options
  if (projectile.shape === 'card') return geometry(new THREE.BoxGeometry(0.28, 0.42, 0.025))
  if (projectile.shape === 'chain') return geometry(new THREE.CapsuleGeometry(0.07, 0.62, 3, 7))
  if (projectile.shape === 'page') return geometry(new THREE.PlaneGeometry(0.4, 0.5))
  if (projectile.shape === 'seed') return geometry(new THREE.OctahedronGeometry(0.22, 0))
  if (projectile.shape === 'eye') return geometry(new THREE.TorusGeometry(0.2, 0.065, 5, 12))
  if (projectile.shape === 'bullet') return geometry(new THREE.CapsuleGeometry(0.055, 0.3, 3, 7))
  if (projectile.shape === 'stone') {
    const stone = new THREE.DodecahedronGeometry(0.24, 0)
    stone.scale(1.2, 0.86, 0.95)
    stone.rotateZ(0.35)
    return geometry(stone)
  }
  return geometry(new THREE.IcosahedronGeometry(0.24, 1))
}
