import { attackData, attackPhase } from './frameData'
import { FEITAN_FINAL_REVERSAL, PERSONAL_SIGNATURE_MOVES } from './personalSignatureMoves'
import type { EffectSceneOptions } from './fighterEffectScene'
import type { ArcadeFighter, FightSide } from './types'
import type { BufferGeometry, Vector3 } from 'three'

interface Trace {
  id: string
  frame: number
  edges: BladeEdge[]
}

interface BladeEdge {
  tip: Vector3
  base: Vector3
}

const ARC_SEGMENTS = 5
const VERTICES_PER_SEGMENT = 6

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
  const reversal = new THREE.MeshBasicMaterial({
    color: '#e6f3ff',
    transparent: true,
    opacity: 0.87,
    vertexColors: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    fog: false,
  })
  const traces = new Map<FightSide, Trace>()
  const models = new Map<FightSide, import('three').Mesh>()
  for (const side of ['player', 'opponent'] as const) {
    const geometry = new THREE.BufferGeometry()
    const capacity = ARC_SEGMENTS * VERTICES_PER_SEGMENT
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(capacity * 3), 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(capacity * 4), 4))
    geometry.setDrawRange(0, 0)
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
      const finalCut = attack.moveId === FEITAN_FINAL_REVERSAL
      const edge = bladeEdge(THREE, blade, finalCut)
      const edges = nextEdges(previous, { id: attack.moveId, frame: attack.frame, finalCut, edge })
      mesh.material = finalCut ? reversal : material
      mesh.visible = edges.length > 1
      if (mesh.visible) writeArc(mesh.geometry, edges)
      traces.set(side, { id: attack.moveId!, frame: attack.frame, edges })
    },
    dispose() {
      models.forEach((mesh) => {
        mesh.geometry.dispose()
        scene.remove(mesh)
      })
      material.dispose()
      reversal.dispose()
      models.clear()
      traces.clear()
    },
  }
}

function cutting(actor: ArcadeFighter): boolean {
  if (!actor.attack || actor.attack.variant === 'throw') return false
  const signature = PERSONAL_SIGNATURE_MOVES[actor.attack.moveId ?? '']?.material === 'blade'
  if (signature) {
    const { startup, active } = attackData(actor.attack.kind, actor)
    const lead = actor.attack.moveId === FEITAN_FINAL_REVERSAL ? 5 : 2
    return actor.attack.frame >= startup - lead && actor.attack.frame < startup + active
  }
  if (!['heavy', 'special'].includes(actor.attack.kind)) return false
  const frames = attackData(actor.attack.kind, actor)
  return frames.damage > 0 && attackPhase(actor) === 'active'
}

function repeatedTrace(previous: Trace | undefined, actor: ArcadeFighter): boolean {
  return previous?.frame === actor.attack!.frame && previous.id === actor.attack!.moveId
}

function bladeEdge(
  THREE: EffectSceneOptions['THREE'],
  blade: import('three').Object3D,
  finalCut: boolean,
): BladeEdge {
  blade.updateWorldMatrix(true, false)
  return {
    tip: blade.localToWorld(new THREE.Vector3(0, -0.95, 0)),
    base: blade.localToWorld(new THREE.Vector3(0, finalCut ? -0.4 : -0.15, 0)),
  }
}

function nextEdges(
  previous: Trace | undefined,
  strike: {
    id?: string
    frame: number
    finalCut: boolean
    edge: BladeEdge
  },
): BladeEdge[] {
  if (!previous || previous.id !== strike.id || previous.frame >= strike.frame) return [strike.edge]
  return [...previous.edges.slice(strike.finalCut ? -ARC_SEGMENTS : -1), strike.edge]
}

/** Follow the last blade positions, tapering toward the hilt and the oldest sample. */
function writeArc(geometry: BufferGeometry, edges: readonly BladeEdge[]) {
  const vertices = geometry.getAttribute('position')
  const colors = geometry.getAttribute('color')
  const segments = edges.length - 1
  for (let index = 0; index < segments; index++) {
    const from = edges[index]
    const to = edges[index + 1]
    const fade = (index + 0.2) / segments
    const solid = (index + 1) / segments
    const points = [from.base, from.tip, to.tip, from.base, to.tip, to.base]
    const alpha = [fade * 0.35, fade, solid, fade * 0.35, solid, solid * 0.35]
    points.forEach((point, offset) => {
      const vertex = index * VERTICES_PER_SEGMENT + offset
      vertices.setXYZ(vertex, point.x, point.y, point.z)
      colors.setXYZW(vertex, 1, 1, 1, alpha[offset])
    })
  }
  vertices.needsUpdate = true
  colors.needsUpdate = true
  geometry.setDrawRange(0, segments * VERTICES_PER_SEGMENT)
}
