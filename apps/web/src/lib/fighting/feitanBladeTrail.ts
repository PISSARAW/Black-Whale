import { attackData, attackPhase } from './frameData'
import type { EffectSceneOptions } from './fighterEffectScene'
import type { ArcadeFighter, FightSide } from './types'
import type { Vector3 } from 'three'

interface Trace {
  id: string
  frame: number
  tip: Vector3
  base: Vector3
}

/** A short shutter trace of the real blade arc; no projectile or collision geometry. */
export function createFeitanBladeTrail(options: EffectSceneOptions) {
  const { THREE, scene } = options
  const material = new THREE.MeshBasicMaterial({
    color: '#f4f7fb',
    transparent: true,
    opacity: 0.46,
    depthWrite: false,
    side: THREE.DoubleSide,
    fog: false,
  })
  const traces = new Map<FightSide, Trace>()
  const models = new Map<FightSide, import('three').Mesh>()
  for (const side of ['player', 'opponent'] as const) {
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(18), 3))
    const mesh = new THREE.Mesh(geometry, material)
    mesh.name = `feitan-blade-trace:${side}`
    mesh.visible = false
    mesh.frustumCulled = false
    scene.add(mesh)
    models.set(side, mesh)
  }

  return {
    drop(side: FightSide) {
      models.get(side)!.visible = false
      traces.delete(side)
    },
    hide() {
      models.forEach((mesh) => {
        mesh.visible = false
      })
      traces.clear()
    },
    sync(actor: ArcadeFighter, blade: import('three').Object3D, side: FightSide) {
      const mesh = models.get(side)!
      if (!cutting(actor) || !blade.visible || options.comfort?.().flashes === false) {
        mesh.visible = false
        traces.delete(side)
        return
      }
      const attack = actor.attack!
      const previous = traces.get(side)
      if (repeatedTrace(previous, actor)) return
      blade.updateWorldMatrix(true, false)
      const tip = blade.localToWorld(new THREE.Vector3(0, -0.95, 0))
      const base = blade.localToWorld(new THREE.Vector3(0, -0.15, 0))
      mesh.visible = Boolean(
        previous && previous.id === attack.moveId && previous.frame < attack.frame,
      )
      if (mesh.visible) {
        const points = [previous!.base, previous!.tip, tip, previous!.base, tip, base]
        const attribute = mesh.geometry.getAttribute('position')
        points.forEach((point, index) => attribute.setXYZ(index, point.x, point.y, point.z))
        attribute.needsUpdate = true
      }
      traces.set(side, { id: attack.moveId!, frame: attack.frame, base, tip })
    },
    dispose() {
      models.forEach((mesh) => {
        mesh.geometry.dispose()
        scene.remove(mesh)
      })
      material.dispose()
      models.clear()
      traces.clear()
    },
  }
}

function cutting(actor: ArcadeFighter): boolean {
  if (!actor.attack || actor.attack.variant === 'throw') return false
  if (!['heavy', 'special'].includes(actor.attack.kind)) return false
  const frames = attackData(actor.attack.kind, actor)
  return frames.damage > 0 && attackPhase(actor) === 'active'
}

function repeatedTrace(previous: Trace | undefined, actor: ArcadeFighter): boolean {
  return previous?.frame === actor.attack!.frame && previous.id === actor.attack!.moveId
}
