import type * as Three from 'three'
import type { Ship, TierPlan } from './blueprint'
import { DINING_VISIT_SPACES } from './diningVisit'
import {
  CASINO_LOWER_HALL,
  CASINO_SPACE,
  CASINO_STAIR_LANDING,
  CASINO_STAIR_ROOM,
} from './casinoLayout'
import { isCasinoSpiralLink } from './casinoSpiralLayout'
import { EYE_HEIGHT } from './sceneOptics'
import { standingSurface } from './standingSurface'
import type { BuiltTierView, TierRoomView } from './TierView'
import type { SceneRuntime } from './TourRenderer'
import type { Space, Vec2 } from './types'
import { visibleSpaces } from './visibility'

interface Landing {
  space: Space
  at: Vec2
}

interface Warmup {
  THREE: typeof Three
  runtime: SceneRuntime
  ship: Ship
  readDeck: (tierId: string) => BuiltTierView | undefined
  buildSteps: (tierId: string) => Generator<void, BuiltTierView>
  cacheDeck: (tierId: string, built: BuiltTierView) => void
  canPrepare: (tierId: string) => boolean
  prepareActors?: (space: Space) => Generator<Three.Object3D | undefined, void>
  readPlan: (tierId: string) => TierPlan
}

function pairedLandings(ship: Ship): readonly Landing[] {
  const { passage, landing } = DINING_VISIT_SPACES
  const link = ship.links.find(
    ({ kind, from, to, retractable }) =>
      kind === 'stair' && from === passage && to === landing && !retractable,
  )
  const upper = ship.spaces.get(passage)
  const lower = ship.spaces.get(landing)
  if (!link || !upper || !lower) return []
  return [
    { space: upper, at: link.at },
    { space: lower, at: link.atTo ?? link.at },
  ]
}

const CASINO_APPROACH = new Set([
  'tier-1-c-port-corridor',
  CASINO_SPACE,
  CASINO_STAIR_ROOM,
  CASINO_STAIR_LANDING,
  CASINO_LOWER_HALL,
])

function casinoLandings(ship: Ship): Landing[] {
  const link = ship.links.find(isCasinoSpiralLink)
  if (!link?.atTo) return []
  return [
    { space: ship.spaces.get(link.from)!, at: [link.at[0] - 0.55, link.at[1]] },
    { space: ship.spaces.get(link.to)!, at: [link.atTo[0] - 0.55, link.atTo[1]] },
  ]
}

function roomObjects(room: TierRoomView): Three.Object3D[] {
  const objects: Three.Object3D[] = [
    room.mesh,
    room.edges,
    room.seams,
    room.patterns,
    room.fittings,
  ]
  if (room.panes) objects.push(room.panes)
  if (room.motes) objects.push(room.motes)
  return objects
}

function warmScene({ THREE, runtime }: Warmup): Three.Scene {
  const scene = new THREE.Scene()
  scene.fog = runtime.scene.fog
  scene.environment = runtime.scene.environment
  for (const object of runtime.scene.children) {
    if ((object as Three.Light).isLight) scene.add(object.clone())
  }
  return scene
}

/** Draw a single room offscreen and leave its hierarchy in the live deck. */
function warmObjects(draw: {
  options: Warmup
  scene: Three.Scene
  camera: Three.Camera
  target: Three.WebGLRenderTarget
  objects: Three.Object3D[]
}): void {
  const { options, scene, camera, target, objects } = draw
  const { renderer } = options.runtime
  const previous = renderer.getRenderTarget()
  const original = objects.map((object) => ({
    object,
    parent: object.parent,
    visible: object.visible,
  }))
  const culling = new Map<Three.Object3D, boolean>()
  try {
    for (const object of objects) {
      object.visible = true
      scene.add(object)
      object.traverseVisible((node) => {
        culling.set(node, node.frustumCulled)
        node.frustumCulled = false
      })
    }
    renderer.setRenderTarget(target)
    renderer.render(scene, camera)
  } finally {
    renderer.setRenderTarget(previous)
    for (const { object, parent, visible } of original) {
      scene.remove(object)
      parent?.add(object)
      object.visible = visible
    }
    for (const [node, wasCulled] of culling) node.frustumCulled = wasCulled
  }
}

function compileActor(draw: {
  renderer: Three.WebGLRenderer
  scene: Three.Scene
  camera: Three.Camera
  target: Three.WebGLRenderTarget
  actor: Three.Object3D
}): () => boolean {
  const { renderer, scene, camera, target, actor } = draw
  const gl = renderer.getContext()
  const extension = gl.getExtension('KHR_parallel_shader_compile') as {
    COMPLETION_STATUS_KHR: number
  } | null
  const known = new Set(renderer.info.programs)
  const previous = renderer.getRenderTarget()
  try {
    renderer.setRenderTarget(target)
    // Submit the links with the same target and lights as the offscreen draw.
    renderer.compile(actor, camera, scene)
  } finally {
    renderer.setRenderTarget(previous)
  }

  const linking = renderer.info.programs?.filter((program) => !known.has(program)) ?? []
  let frames = 0
  // Poll in the render loop so closing the scene cancels the work immediately.
  // In a context without parallel shader polling, leave a few frames for the driver.
  return () => {
    if (!linking.length || gl.isContextLost()) return true
    frames += 1
    if (!extension) return frames >= 5
    return (
      frames >= 15 ||
      linking.every(({ program }) =>
        gl.getProgramParameter(program as WebGLProgram, extension.COMPLETION_STATUS_KHR),
      )
    )
  }
}

const NEXT_FRAME = Symbol('next frame')
type LandingSteps = Generator<void | typeof NEXT_FRAME, void>

function* warmLanding(options: Warmup, { space, at }: Landing): LandingSteps {
  let built = options.readDeck(space.tierId)
  if (!built) {
    built = yield* options.buildSteps(space.tierId)
    options.cacheDeck(space.tierId, built)
    built = options.readDeck(space.tierId)
  }
  if (!built) return

  const plan = options.readPlan(space.tierId)
  const visible = visibleSpaces(plan, space.id, options.runtime.quality.viewDepth)
  const scene = warmScene(options)
  const camera = options.runtime.camera.clone()
  camera.position.set(at[0], standingSurface(plan, at, space) + EYE_HEIGHT, at[1])
  const target = new options.THREE.WebGLRenderTarget(8, 8, {
    type: options.runtime.composer.readBuffer.texture.type,
  })
  try {
    for (const room of built.rooms.filter(({ spaceId }) => visible.has(spaceId))) {
      yield
      warmObjects({ options, scene, camera, target, objects: roomObjects(room) })
    }
    if (built.lampAir) {
      yield
      warmObjects({ options, scene, camera, target, objects: [built.lampAir] })
    }
    for (const actor of options.prepareActors?.(space) ?? []) {
      yield
      if (!actor) continue
      const linked = compileActor({
        renderer: options.runtime.renderer,
        scene,
        camera,
        target,
        actor,
      })
      yield NEXT_FRAME
      while (!linked()) yield NEXT_FRAME
      warmObjects({ options, scene, camera, target, objects: [actor] })
    }
  } finally {
    target.dispose()
  }
}

interface Crossing {
  from: string
  to: string
  valid: () => boolean
  arrive: () => void
}

// The first few frames belong entirely to the visitor and their first input.
const FIRST_INPUT_WINDOW_MS = 240
const SLICE_MS = 4
const FRAME_WORK_LIMIT_MS = 11

/** Prepare connected landings in bounded slices after the first visible frames. */
export function prepareStairLandings(options: Warmup) {
  const landings = pairedLandings(options.ship)
  const spiral = casinoLandings(options.ship)
  const complete = new Set<string>()
  const jobs = new Map<string, LandingSteps>()
  let enteredAt = 0
  let lastTier = ''
  let lastProgress = 0
  let pending: Crossing | null = null

  const eligible = (landing: Landing) => {
    const id = landing.space.tierId
    return !complete.has(id) && options.canPrepare(id)
  }

  const finish = (tierId: string) => {
    complete.add(tierId)
    jobs.delete(tierId)
  }

  function nextLanding(tierId: string, spaceId?: string | null): Landing | undefined {
    if (pending) return landings.find(({ space }) => space.id === pending?.to)
    if (spaceId && CASINO_APPROACH.has(spaceId)) {
      return spiral.find((landing) => landing.space.tierId !== tierId && eligible(landing))
    }
    if (!landings.some(({ space }) => space.tierId === tierId)) return
    return (
      landings.find((landing) => landing.space.tierId !== tierId && eligible(landing)) ??
      landings.find(eligible)
    )
  }

  function advance(landing: Landing, frameStarted: number) {
    const id = landing.space.tierId
    if (!eligible(landing)) return
    let steps = jobs.get(id)
    if (!steps) {
      steps = warmLanding(options, landing)
      jobs.set(id, steps)
    }
    const deadline = Math.min(frameStarted + FRAME_WORK_LIMIT_MS, performance.now() + SLICE_MS)
    try {
      const nearSpiral = spiral.includes(landing)
      let mustProgress = Boolean((pending || nearSpiral) && frameStarted - lastProgress >= 64)
      while (mustProgress || performance.now() < deadline) {
        mustProgress = false
        lastProgress = frameStarted
        const step = steps.next()
        if (step.done) {
          finish(id)
          break
        }
        if (step.value === NEXT_FRAME) break
      }
    } catch (error) {
      finish(id)
      console.warn('Unable to warm the stair landing.', error)
    }
  }

  return {
    frame(tierId: string, frameStarted: number, spaceId?: string | null) {
      if (tierId !== lastTier) {
        lastTier = tierId
        enteredAt = frameStarted
      }
      if (pending && !pending.valid()) pending = null
      const landing = nextLanding(tierId, spaceId)
      // Commit a deferred crossing on the following frame, after the last upload.
      if (pending && landing && !eligible(landing)) {
        const { arrive } = pending
        pending = null
        arrive()
        return
      }
      if (landing && (pending || frameStarted - enteredAt >= FIRST_INPUT_WINDOW_MS)) {
        advance(landing, frameStarted)
      }
    },
    cross(crossing: Crossing): boolean {
      const landing = landings.find(({ space }) => space.id === crossing.to)
      const other = landings.find(({ space }) => space.id !== crossing.to)
      if (!landing || other?.space.id !== crossing.from || !eligible(landing)) return false
      pending = crossing
      return true
    },
    dispose() {
      for (const steps of jobs.values()) steps.return()
      jobs.clear()
      pending = null
    },
  }
}
