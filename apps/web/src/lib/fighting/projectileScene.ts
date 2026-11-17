import { gyoSight, perceivesProjectile } from './nenPerception'
import { isBodyguardBullet } from './bodyguardFirearms'
import type { ArcadeFighter, FightProjectile } from './types'
import { createRemotePunchScene } from './remotePunchScene'
import { createJupiterScene } from './jupiterScene'

export interface ProjectileSceneOptions {
  THREE: typeof import('three')
  scene: import('three').Scene
  glow: (colour: number, opacity: number) => import('three').MeshBasicMaterial
  geometry: <T extends import('three').BufferGeometry>(made: T) => T
  worldX: (value: number) => number
  worldY: (value: number) => number
}

export interface ProjectileScene {
  sync: (projectiles: FightProjectile[], seconds: number, observer?: ArcadeFighter) => void
  dispose: () => void
}

export function createProjectileScene(options: ProjectileSceneOptions): ProjectileScene {
  const { THREE, scene } = options
  const thetaMetals = new Map<number, import('three').MeshBasicMaterial>()
  const stones = new Map<number, import('three').MeshStandardMaterial>()
  const shapes = new Map<string, import('three').BufferGeometry>()
  const handgunMetal = (colour: number) => {
    const material = thetaMetals.get(colour) ?? new THREE.MeshBasicMaterial({ color: colour })
    thetaMetals.set(colour, material)
    return material
  }
  const stoneMaterial = (colour: number) => {
    const material =
      stones.get(colour) ??
      new THREE.MeshStandardMaterial({ color: colour, roughness: 0.94, metalness: 0 })
    stones.set(colour, material)
    return material
  }
  const shapeFor = (projectile: FightProjectile) => {
    const key = handgunBullet(projectile) ? 'handgun' : projectile.shape
    const shape = shapes.get(key) ?? projectileGeometry(options, projectile)
    shapes.set(key, shape)
    return shape
  }
  const meshes = new Map<number, import('three').Mesh>()
  const remotePunches = createRemotePunchScene(options)
  const jupiter = createJupiterScene(options)

  const build = (projectile: FightProjectile) => {
    const colour = Number.parseInt(projectile.colour.slice(1), 16)
    const material = handgunBullet(projectile)
      ? handgunMetal(colour)
      : projectile.shape === 'stone'
        ? stoneMaterial(colour)
        : options.glow(colour, 1)
    const mesh = new THREE.Mesh(shapeFor(projectile), material)
    mesh.name = `fight-projectile:${projectile.id}`
    if (projectile.shuCharged) {
      const aura = new THREE.Mesh(mesh.geometry, options.glow(0xffe1a3, 0.4))
      aura.scale.setScalar(1.2)
      mesh.add(aura)
      mesh.userData.shuAura = aura
    }
    scene.add(mesh)
    meshes.set(projectile.id, mesh)
    return mesh
  }

  const sync = (projectiles: FightProjectile[], seconds: number, observer?: ArcadeFighter) => {
    const visible = projectiles.filter(
      (shot) => !observer || shot.owner === 'player' || perceivesProjectile(observer, shot),
    )
    remotePunches.sync(visible)
    jupiter.sync(visible, seconds)
    const active = new Set(projectiles.map((projectile) => projectile.id))
    for (const projectile of projectiles) {
      if (projectile.remotePunch || projectile.jupiter) continue
      const mesh = meshes.get(projectile.id) ?? build(projectile)
      mesh.visible = visible.includes(projectile)
      syncShuAura(mesh, projectile, observer)
      mesh.position.set(options.worldX(projectile.x), options.worldY(projectile.y), 0.32)
      mesh.rotation.x = ['orb', 'stone'].includes(projectile.shape) ? seconds * 4 : 0
      mesh.rotation.z = handgunBullet(projectile)
        ? -Math.PI / 2
        : projectile.shape === 'card'
          ? seconds * 8
          : seconds * 2
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
      remotePunches.dispose()
      jupiter.dispose()
      thetaMetals.forEach((material) => material.dispose())
      thetaMetals.clear()
      stones.forEach((material) => material.dispose())
      stones.clear()
      shapes.clear()
      for (const mesh of meshes.values()) scene.remove(mesh)
      meshes.clear()
    },
  }
}

function shuVisible(projectile: FightProjectile, observer?: ArcadeFighter): boolean {
  return !observer || projectile.owner === 'player' || !projectile.concealed || gyoSight(observer)
}

function syncShuAura(
  mesh: import('three').Mesh,
  projectile: FightProjectile,
  observer?: ArcadeFighter,
) {
  const aura = mesh.userData.shuAura as import('three').Mesh | undefined
  if (aura) aura.visible = Boolean(projectile.shuCharged) && shuVisible(projectile, observer)
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
  if (handgunBullet(projectile)) return geometry(new THREE.CapsuleGeometry(0.016, 0.08, 3, 7))
  if (projectile.shape === 'bullet') return geometry(new THREE.CapsuleGeometry(0.055, 0.3, 3, 7))
  if (projectile.shape === 'stone') {
    const stone = new THREE.DodecahedronGeometry(0.24, 0)
    stone.scale(1.2, 0.86, 0.95)
    stone.rotateZ(0.35)
    return geometry(stone)
  }
  return geometry(new THREE.IcosahedronGeometry(0.24, 1))
}

function handgunBullet(projectile: FightProjectile): boolean {
  return isBodyguardBullet(projectile)
}
