/** Browser-owned renderer shell around the tour's Three.js scene. */
import type * as Three from 'three'

export interface SceneRuntime {
  renderer: Three.WebGLRenderer
  scene: Three.Scene
  fog: Three.FogExp2
  camera: Three.PerspectiveCamera
  composer: any // Typed as any to avoid static import of EffectComposer
  renderTarget?: Three.WebGLRenderTarget
}

function isHighEndGPU(renderer: Three.WebGLRenderer, coarse: boolean): boolean {
  if (coarse) return false;
  
  const gl = renderer.getContext();
  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  if (debugInfo) {
    const rendererStr = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)?.toLowerCase() || '';
    const lowEnd = ['mali', 'adreno', 'intel', 'hd graphics', 'uhd graphics', 'powervr'];
    for (const gpu of lowEnd) {
      if (rendererStr.includes(gpu)) {
        return false;
      }
    }
  }
  return true;
}

export async function createSceneRuntime(
  THREE: typeof Three,
  canvas: HTMLCanvasElement,
  options: { coarse: boolean; fov: number; viewDistance: number },
): Promise<SceneRuntime> {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !options.coarse })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
  renderer.setClearColor(0x050505)
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1

  const scene = new THREE.Scene()
  const fog = new THREE.FogExp2(0x050505, 0.02)
  scene.fog = fog
  const camera = new THREE.PerspectiveCamera(options.fov, 1, 0.1, options.viewDistance)

  const { EffectComposer } = await import('three/examples/jsm/postprocessing/EffectComposer.js')
  const { RenderPass } = await import('three/examples/jsm/postprocessing/RenderPass.js')
  const { UnrealBloomPass } = await import('three/examples/jsm/postprocessing/UnrealBloomPass.js')

  let renderTarget: Three.WebGLRenderTarget | undefined
  if (isHighEndGPU(renderer, options.coarse)) {
    const size = renderer.getSize(new THREE.Vector2())
    renderTarget = new THREE.WebGLRenderTarget(size.width || 1024, size.height || 1024, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.HalfFloatType
    })
    renderTarget.depthTexture = new THREE.DepthTexture(size.width || 1024, size.height || 1024)
    renderTarget.depthTexture.type = THREE.UnsignedIntType
  }
  
  const composer = new EffectComposer(renderer, renderTarget)
  const renderPass = new RenderPass(scene, camera)
  composer.addPass(renderPass)

  if (isHighEndGPU(renderer, options.coarse)) {
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.8, // strength
      0.4, // radius
      1.0  // threshold
    )
    composer.addPass(bloomPass)
  }

  return { renderer, scene, fog, camera, composer, renderTarget }
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
