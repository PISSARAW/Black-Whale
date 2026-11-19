import type * as Three from 'three'
import { MODEL_POSES, avatarPoseProgress } from './fighterAvatarPose'
import { fightMove } from './fightMoves'
import type { ArcadeFighter } from './types'

/**
 * Still portraits of fighters, drawn through ONE shared offscreen WebGL context.
 *
 * Browsers cap live WebGL contexts (~16). A roster mounting one renderer per
 * portrait blows past it in a single tick, the browser kills the oldest
 * contexts, and the portraits come out blank. Here every snapshot waits its
 * turn on a single renderer, released once the queue has been idle a moment.
 */

export interface PreviewSnapshotRequest {
  fighter: ArcadeFighter
  width: number
  height: number
  /** Checked before drawing: an unmounted portrait skips its turn. */
  cancelled?: () => boolean
}

type ThreeModule = typeof Three

const IDLE_RELEASE_MS = 1500

let renderer: Three.WebGLRenderer | null = null
let queue: Promise<unknown> = Promise.resolve()
let pending = 0
let idleTimer: ReturnType<typeof setTimeout> | null = null

function sharedRenderer(THREE: ThreeModule): Three.WebGLRenderer {
  if (renderer && !renderer.getContext().isContextLost()) return renderer
  renderer?.dispose()
  renderer = new THREE.WebGLRenderer({
    canvas: document.createElement('canvas'),
    alpha: true,
    antialias: false,
    powerPreference: 'low-power',
    preserveDrawingBuffer: true,
  })
  renderer.setClearColor(0x000000, 0)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  return renderer
}

function releaseWhenIdle() {
  if (idleTimer) clearTimeout(idleTimer)
  idleTimer = setTimeout(() => {
    idleTimer = null
    if (pending > 0 || !renderer) return
    const context = renderer.getContext()
    renderer.dispose()
    if (!context.isContextLost()) context.getExtension('WEBGL_lose_context')?.loseContext()
    renderer = null
  }, IDLE_RELEASE_MS)
}

async function draw(request: PreviewSnapshotRequest): Promise<string | null> {
  if (request.cancelled?.()) return null
  const THREE = await import('three')
  const [{ buildFightFigure }, { fightBodyMotion }, { disposeMountedVisitHatsu }] =
    await Promise.all([
      import('./fighterFigure'),
      import('./fightBodyMotion'),
      import('./visitHatsuModel'),
    ])
  if (request.cancelled?.()) return null

  const { fighter } = request
  const width = Math.max(1, request.width)
  const height = Math.max(1, request.height)
  const gl = sharedRenderer(THREE)
  gl.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25))
  gl.setSize(width, height, false)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(24, width / height, 0.1, 20)
  camera.position.set(0, 1.05, 5.2)
  camera.lookAt(0, 0.92, 0)

  const materials = new Map<string, Three.MeshBasicMaterial>()
  const glow = (colour: number, opacity: number) => {
    const key = `${colour}:${opacity}`
    let material = materials.get(key)
    if (!material) {
      material = new THREE.MeshBasicMaterial({
        color: colour,
        opacity,
        transparent: opacity < 1,
        depthWrite: opacity >= 1,
      })
      materials.set(key, material)
    }
    return material
  }

  const model = buildFightFigure({ THREE, glow, fighter })
  model.root.scale.setScalar(0.9)
  model.root.rotation.y = -0.28
  scene.add(model.root)
  try {
    const progress = avatarPoseProgress(fighter, 0)
    model.animate(performance.now() / 1000, MODEL_POSES[fighter.pose], {
      motion: fightBodyMotion({
        fighter,
        seconds: 0,
        progress,
        fallback: fightMove(fighter, progress),
      }),
      transitionKey: `${fighter.pose}:${fighter.attack?.moveId ?? ''}`,
      transitionSeconds: 0,
    })
    gl.render(scene, camera)
    return gl.domElement.toDataURL('image/webp', 0.9)
  } finally {
    scene.remove(model.root)
    disposeMountedVisitHatsu(model.root)
    // Geometries live in humanFigure's shared cache: only the materials are ours.
    materials.forEach((material) => material.dispose())
  }
}

/** Renders one still portrait; resolves `null` when cancelled before its turn. */
export function snapshotFighterPreview(request: PreviewSnapshotRequest): Promise<string | null> {
  pending += 1
  if (idleTimer) clearTimeout(idleTimer)
  const turn = queue.then(() => draw(request))
  queue = turn.catch(() => undefined)
  return turn.finally(() => {
    pending -= 1
    if (pending === 0) releaseWhenIdle()
  })
}
