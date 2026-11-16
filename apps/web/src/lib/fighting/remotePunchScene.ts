import {
  REMOTE_PUNCH_HEIGHT,
  REMOTE_PUNCH_RISE_FRAMES,
  REMOTE_PUNCH_VISIBLE_FRAMES,
} from './remotePunchTiming'
import type { ProjectileSceneOptions } from './projectileScene'
import type { FightProjectile } from './types'

interface PunchVisual {
  root: import('three').Group
  fist: import('three').Group
  trace: import('three').Mesh
  exit: import('three').Mesh
}

/** A pale emitted fist, not a teleported sleeve or a free-flying aura ball. */
export function createRemotePunchScene(options: ProjectileSceneOptions) {
  const visuals = new Map<number, PunchVisual>()
  return {
    sync(projectiles: FightProjectile[]) {
      const punches = projectiles.filter((projectile) => projectile.remotePunch)
      const active = new Set(punches.map((projectile) => projectile.id))
      for (const projectile of punches) {
        const visual = visuals.get(projectile.id) ?? buildPunch(options)
        visuals.set(projectile.id, visual)
        posePunch(visual, projectile, options)
      }
      for (const [id, visual] of visuals) {
        if (active.has(id)) continue
        options.scene.remove(visual.root)
        visuals.delete(id)
      }
    },
    dispose() {
      for (const visual of visuals.values()) options.scene.remove(visual.root)
      visuals.clear()
    },
  }
}

function buildPunch(options: ProjectileSceneOptions): PunchVisual {
  const { THREE, geometry } = options
  const root = new THREE.Group()
  const fist = new THREE.Group()
  const material = options.glow(0xbcecff, 0.88)
  const box = geometry(new THREE.BoxGeometry(1, 1, 1))
  const part = (size: number[], at: number[]) => {
    const mesh = new THREE.Mesh(box, material)
    mesh.scale.set(size[0], size[1], size[2])
    mesh.position.set(at[0], at[1], at[2])
    fist.add(mesh)
  }
  part([0.22, 0.95, 0.23], [0, -0.475, 0])
  part([0.38, 0.3, 0.3], [0, 0, 0])
  for (let finger = 0; finger < 4; finger++)
    part([0.085, 0.13, 0.32], [-0.14 + finger * 0.093, 0.2, 0])
  part([0.12, 0.24, 0.24], [0.23, -0.02, 0.06])
  const trace = new THREE.Mesh(box, options.glow(0x76c9ec, 0.3))
  const exit = new THREE.Mesh(
    geometry(new THREE.RingGeometry(0.16, 0.21, 24)),
    options.glow(0xbcecff, 0.65),
  )
  exit.rotation.x = -Math.PI / 2
  root.add(fist, trace, exit)
  options.scene.add(root)
  return { root, fist, trace, exit }
}

function posePunch(
  visual: PunchVisual,
  projectile: FightProjectile,
  options: ProjectileSceneOptions,
) {
  const remote = projectile.remotePunch!
  const emerging = projectile.age - remote.travelFrames
  const origin = options.worldX(remote.originX)
  const target = options.worldX(remote.targetX)
  const current = options.worldX(projectile.x)
  // The thin trace is a presentation cue on the surface; its underground phase cannot hit.
  visual.trace.visible = emerging < 0
  visual.trace.position.set((origin + current) / 2, 0.012, 0)
  visual.trace.scale.set(Math.max(0.02, Math.abs(current - origin)), 0.018, 0.045)
  visual.exit.position.set(target, 0.018, 0)
  visual.exit.scale.setScalar(emerging < 0 ? 0.65 : 1.2)
  visual.fist.visible = emerging >= 0
  const retract = Math.max(0, (emerging - 8) / (REMOTE_PUNCH_VISIBLE_FRAMES - 8))
  const rise = Math.min(1, Math.max(0, emerging / REMOTE_PUNCH_RISE_FRAMES)) * (1 - retract)
  visual.fist.position.set(target, 0.04 + options.worldY(REMOTE_PUNCH_HEIGHT) * rise, 0.12)
  visual.fist.scale.set(1, Math.max(0.05, rise), 1)
}
