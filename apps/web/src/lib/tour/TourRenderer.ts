/** Browser-owned renderer shell around the tour's Three.js scene. */
import type * as Three from 'three'
import { createGradePass } from './postGrade'
import { createRefractionPass } from './auraRefraction'
import { createShaftPass } from './godRays'
import type { PostPass } from './postTypes'
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
}

/** What the driver says, before the visitor is asked. */
function gpuName(renderer: Three.WebGLRenderer): string | null {
  const gl = renderer.getContext()
  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
  if (!debugInfo) return null
  return (gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) as string | null) ?? null
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

  const { EffectComposer } = await import('three/examples/jsm/postprocessing/EffectComposer.js')
  const { RenderPass } = await import('three/examples/jsm/postprocessing/RenderPass.js')

  /**
   * The half-float target, and the depth texture the aura reads.
   *
   * Only on `high`: it is twice the bytes per pixel of the composer's default,
   * and what it buys — emissive values above 1 surviving the bloom, and a depth
   * buffer for `NenSceneAura` to intersect against — are both `high`-only
   * effects. On `low` the composer allocates its own and nothing asks it for
   * depth.
   */
  let renderTarget: Three.WebGLRenderTarget | undefined
  if (quality.tier === 'high') {
    const size = renderer.getSize(new THREE.Vector2())
    renderTarget = new THREE.WebGLRenderTarget(size.width || 1024, size.height || 1024, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.HalfFloatType,
    })
    renderTarget.depthTexture = new THREE.DepthTexture(size.width || 1024, size.height || 1024)
    renderTarget.depthTexture.type = THREE.UnsignedIntType
  }

  const composer = new EffectComposer(renderer, renderTarget)
  composer.addPass(new RenderPass(scene, camera))

  // Ahead of the bloom on purpose: a shaft is light, and light on this ship
  // blooms. Added after it, the shafts would be the one bright thing in the
  // frame with a hard edge on it.
  let shafts: PostPass | null = null
  if (quality.godRays) {
    shafts = await createShaftPass()
    composer.addPass(shafts)
  }

  if (quality.bloom) {
    const { UnrealBloomPass } = await import('three/examples/jsm/postprocessing/UnrealBloomPass.js')
    composer.addPass(
      new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        0.8, // strength
        0.4, // radius
        1.0, // threshold
      ),
    )
  }

  // After the bloom and before the grade. Before the bloom, the halo would be
  // bent and the light it throws would not, which reads as the aura sliding off
  // its own glow; after the grade, the vignette would be swimming at the corners
  // of the screen, and the vignette is the frame rather than the room.
  let refraction: PostPass | null = null
  if (quality.auraDistortion) {
    refraction = await createRefractionPass()
    composer.addPass(refraction)
  }

  if (quality.grade) composer.addPass(await createGradePass())

  /**
   * Last, and the reason the whole file changed.
   *
   * `EffectComposer` renders into an offscreen target, and the `antialias: true`
   * the canvas was built with only ever applied to the default framebuffer — so
   * from the day the composer went in, the machines running the *most* effects
   * have been the ones running with no anti-aliasing at all, and the gold
   * outlines that carry the whole reading of a deck have been crawling. SMAA is
   * that AA, put back where the frame actually is. Last in the chain because it
   * is the final image it has to smooth, not an intermediate one.
   */
  if (quality.smaa) {
    const { SMAAPass } = await import('three/examples/jsm/postprocessing/SMAAPass.js')
    composer.addPass(new SMAAPass())
  }

  return { renderer, scene, fog, camera, composer, renderTarget, quality, shafts, refraction }
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

/** Run the expensive frame loop only while the tour canvas is visible. */
export function animateVisibleScene(options: {
  container: HTMLElement
  renderer: Three.WebGLRenderer
  frame: (time: number) => void
  onResume: () => void
}): () => void {
  const { container, renderer, frame, onResume } = options
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        onResume()
        renderer.setAnimationLoop(frame)
      } else {
        renderer.setAnimationLoop(null)
      }
    },
    { threshold: 0 },
  )
  observer.observe(container)
  renderer.setAnimationLoop(frame)
  return () => {
    renderer.setAnimationLoop(null)
    observer.disconnect()
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
