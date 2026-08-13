/** Browser-owned renderer shell around the tour's Three.js scene. */
import type * as Three from 'three'
import { assemblePostChain } from './postChain'
import type { PostPass } from './postTypes'
import type { FrameMeter } from './frameBudget'
import { frameReading, reportQualityTier, startFrameMeter } from './frameBudgetFeed'
import {
  detectTier,
  qualityProfile,
  resolveTier,
  type QualityProfile,
  type QualitySetting,
} from './quality'

export interface SceneRuntime {
  renderer: Three.WebGLRenderer
  scene: Three.Scene
  fog: Three.FogExp2
  camera: Three.PerspectiveCamera
  composer: any // Typed as any to avoid static import of EffectComposer
  renderTarget?: Three.WebGLRenderTarget
  /** What this machine is spending, and what the visitor asked for. */
  quality: QualityProfile
  /**
   * The light shafts, or `null` off the two decks that have a window.
   *
   * Handed back rather than hidden inside the composer because the walk has to
   * write its source every frame: the pass knows how to march towards a window,
   * and only the scene knows where the window is on screen.
   */
  shafts: PostPass | null
  /**
   * The air bending around the aura, or `null` on the `low` palier.
   *
   * Handed back for the same reason as the shafts: the pass knows how to bend a
   * frame and only the walk knows how much aura is out. See
   * `$lib/tour/auraRefraction`.
   */
  refraction: PostPass | null
  /**
   * The grade, or `null` where the palier has none.
   *
   * Handed back for the reason the shafts are: the pass knows what a contrast
   * and a vignette are, and only the walk knows what hour it is — and the hour
   * moves all three of its numbers. See `applyGrade` and `$lib/tour/regime`.
   */
  grade: PostPass | null
  /**
   * The Gyo filter pass, toggled on/off to see Nen elements.
   */
  gyoFilter: PostPass | null
  /**
   * The Depth of Field pass, updated with autofocus distance.
   */
  depthOfField: PostPass | null
  /**
   * The Motion Blur pass, updated with camera transforms.
   */
  motionBlur: any | null
  /**
   * Screen Space Reflections pass.
   */
  ssr: any | null
}

/** What the driver says, before the visitor is asked. */
function gpuName(renderer: Three.WebGLRenderer): string | null {
  const gl = renderer.getContext()
  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
  if (!debugInfo) return null
  return (gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) as string | null) ?? null
}

/**
 * The half-float target, and the depth texture the aura reads.
 *
 * Only on `high`: it is twice the bytes per pixel of the composer's default,
 * and what it buys — emissive values above 1 surviving the bloom, and a depth
 * buffer for `NenSceneAura` to intersect against — are both `high`-only
 * effects. On `low` the composer allocates its own and nothing asks it for
 * depth.
 */
function createHighTierTarget(
  THREE: typeof Three,
  renderer: Three.WebGLRenderer,
): Three.WebGLRenderTarget {
  const size = renderer.getSize(new THREE.Vector2())
  const width = size.width || 1024
  const height = size.height || 1024
  const target = new THREE.WebGLRenderTarget(width, height, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
    type: THREE.HalfFloatType,
  })
  target.depthTexture = new THREE.DepthTexture(width, height)
  target.depthTexture.type = THREE.UnsignedIntType
  return target
}

export async function createSceneRuntime(
  THREE: typeof Three,
  canvas: HTMLCanvasElement,
  options: {
    coarse: boolean
    fov: number
    nearPlane: number
    viewDistance: number
    quality: QualitySetting
  },
): Promise<SceneRuntime> {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !options.coarse })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
  renderer.setClearColor(0x050505)
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1

  const scene = new THREE.Scene()
  const fog = new THREE.FogExp2(0x050505, 0.02)
  scene.fog = fog
  // Both planes handed in: a depth buffer is spread by the ratio between them,
  // so the near one is not a detail the renderer gets to pick on its own.
  const camera = new THREE.PerspectiveCamera(
    options.fov,
    1,
    options.nearPlane,
    options.viewDistance,
  )

  const quality = qualityProfile({
    tier: resolveTier(
      options.quality,
      detectTier({ renderer: gpuName(renderer), coarse: options.coarse }),
    ),
    coarse: options.coarse,
  })

  // What the frame budget will be weighed against, said once, here: this is the
  // moment the palier stops being a request and becomes a fact about a machine.
  reportQualityTier(quality.tier)

  const { EffectComposer } = await import('three/examples/jsm/postprocessing/EffectComposer.js')
  const { RenderPass } = await import('three/examples/jsm/postprocessing/RenderPass.js')

  let renderTarget: Three.WebGLRenderTarget | undefined
  if (quality.tier === 'high') renderTarget = createHighTierTarget(THREE, renderer)

  const composer = new EffectComposer(renderer, renderTarget)
  composer.addPass(new RenderPass(scene, camera))

  // Everything after the room itself, in the order a picture is made — see
  // `$lib/tour/postChain`, which owns the argument for each place in it.
  const chain = await assemblePostChain(composer, { THREE, camera, quality, renderTarget, renderer, scene })

  return { renderer, scene, fog, camera, composer, renderTarget, quality, ...chain }
}

export interface SceneResize {
  apply: () => void
  dispose: () => void
}
interface ResizeOptions {
  THREE: typeof Three
  container: HTMLElement
  runtime: SceneRuntime
  targets: () => Iterable<Three.WebGLRenderTarget | undefined>
}

/** Coalesce resize bursts and keep portal targets in screen-space. */
export function observeSceneResize(options: ResizeOptions): SceneResize {
  const { THREE, container, runtime, targets } = options
  let pending = 0
  const measure = new THREE.Vector2()
  const apply = () => {
    pending = 0
    const { clientWidth, clientHeight } = container
    if (!clientWidth || !clientHeight) return
    runtime.renderer.setSize(clientWidth, clientHeight, false)
    runtime.camera.aspect = clientWidth / clientHeight
    runtime.camera.updateProjectionMatrix()
    const { width, height } = runtime.renderer.getSize(measure)
    runtime.composer.setSize(width, height)
    for (const target of targets()) {
      target?.setSize(Math.max(2, Math.round(width)), Math.max(2, Math.round(height)))
    }
  }
  const observer = new ResizeObserver(() => {
    if (!pending) pending = requestAnimationFrame(apply)
  })
  observer.observe(container)
  return {
    apply,
    dispose: () => {
      if (pending) cancelAnimationFrame(pending)
      observer.disconnect()
    },
  }
}

export function disposeSceneRuntime(runtime: SceneRuntime): void {
  runtime.renderer.dispose()
  runtime.renderer.forceContextLoss()
}

/**
 * The same frame, with a clock and a counter round it.
 *
 * `info.autoReset` has to go off and the reset has to be ours, and that is not
 * a detail: three.js clears `info.render` at the top of every `render()` call,
 * so read as it comes it reports the *last* draw of the frame rather than the
 * frame. A tour frame is several draws — the portal panes, the composer chain,
 * and up to two corner insets — and counting only the last of them would say a
 * room costs a fraction of what it costs, which is the exact failure this
 * instrument exists to stop being possible.
 */
function meteredFrame(
  renderer: Three.WebGLRenderer,
  frame: (time: number) => void,
  meter: FrameMeter,
): (time: number) => void {
  const info = renderer.info
  info.autoReset = false
  return (time: number) => {
    meter.begin(time)
    info.reset()
    frame(time)
    const reading = meter.end(performance.now(), {
      calls: info.render.calls,
      triangles: info.render.triangles,
      geometries: info.memory.geometries,
      textures: info.memory.textures,
      programs: info.programs?.length ?? 0,
    })
    if (reading) frameReading.set(reading)
  }
}

/** Run the expensive frame loop only while the tour canvas is visible. */
export function animateVisibleScene(options: {
  container: HTMLElement
  renderer: Three.WebGLRenderer
  frame: (time: number) => void
  onResume: () => void
}): () => void {
  const { container, renderer, frame, onResume } = options
  // Null unless this page was asked to measure, and then the walk runs exactly
  // the callback it always ran. See `$lib/tour/frameBudgetFeed`.
  const meter = startFrameMeter()
  const run = meter ? meteredFrame(renderer, frame, meter) : frame
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        onResume()
        // The gap the canvas spent off screen is not a slow frame.
        meter?.resume()
        renderer.setAnimationLoop(run)
      } else {
        renderer.setAnimationLoop(null)
      }
    },
    { threshold: 0 },
  )
  observer.observe(container)
  renderer.setAnimationLoop(run)
  return () => {
    renderer.setAnimationLoop(null)
    observer.disconnect()
    if (meter) frameReading.set(null)
  }
}

/** Render a secondary camera without disturbing the main viewport state. */
export function renderSceneInset(options: {
  runtime: Pick<SceneRuntime, 'renderer' | 'scene'>
  lens: Three.PerspectiveCamera
  corner: 'top' | 'bottom'
  measure: Three.Vector2
}): void {
  const { runtime, lens, corner, measure } = options
  const { renderer, scene } = runtime
  const { width, height } = renderer.getSize(measure)
  const boxWidth = Math.round(Math.min(320, width * 0.3))
  const boxHeight = Math.round(boxWidth * 0.62)
  const pad = 12
  const box: [number, number, number, number] = [
    width - boxWidth - pad,
    corner === 'top' ? height - boxHeight - pad : pad,
    boxWidth,
    boxHeight,
  ]
  lens.aspect = boxWidth / boxHeight
  lens.updateProjectionMatrix()
  renderer.setViewport(...box)
  renderer.setScissor(...box)
  renderer.setScissorTest(true)
  renderer.autoClear = false
  renderer.clear(true, true, false)
  renderer.render(scene, lens)
  renderer.autoClear = true
  renderer.setScissorTest(false)
}
