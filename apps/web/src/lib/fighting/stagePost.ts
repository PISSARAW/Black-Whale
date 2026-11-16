import type * as Three from 'three'

/**
 * What is done to the frame after a stage is drawn: the lamps bleed, and the
 * corners fall off.
 *
 * Deliberately not the visit's chain. That one is tuned for a first-person walk
 * through a dark ship — depth of field, motion blur, a grade that follows the
 * hour — and a duel is read from the side at a fixed distance, where the
 * fighters have to stay as crisp as their hit-boxes.
 */
const BLOOM_STRENGTH = 0.42
const BLOOM_RADIUS = 0.55
/** Above anything a fighter is drawn in: only fittings and glass bleed. */
const BLOOM_THRESHOLD = 0.96
const VIGNETTE = 0.34

const VIGNETTE_SHADER = {
  name: 'ClashVignette',
  uniforms: { tDiffuse: { value: null }, amount: { value: VIGNETTE } },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float amount;
    varying vec2 vUv;
    void main() {
      vec4 frame = texture2D(tDiffuse, vUv);
      vec2 offset = vUv - 0.5;
      float edge = smoothstep(0.28, 0.82, length(offset * vec2(1.0, 0.82)));
      gl_FragColor = vec4(frame.rgb * (1.0 - edge * amount), frame.a);
    }
  `,
}

/**
 * Makes the frame safe to blur.
 *
 * An aura shader that divides by nothing writes a pixel that is not a number.
 * Drawn straight to the canvas that pixel is one black dot; in a half-float
 * target the bloom spreads it over the whole arena, which then shows nothing
 * at all. Checked here once rather than in every shader that might do it.
 */
const SANITISE_SHADER = {
  name: 'ClashSanitise',
  uniforms: { tDiffuse: { value: null } },
  vertexShader: VIGNETTE_SHADER.vertexShader,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    varying vec2 vUv;
    void main() {
      vec3 frame = texture2D(tDiffuse, vUv).rgb;
      bool sound = frame.r == frame.r && frame.g == frame.g && frame.b == frame.b;
      gl_FragColor = vec4(sound ? clamp(frame, 0.0, 8.0) : vec3(0.0), 1.0);
    }
  `,
}

export interface StagePost {
  render: () => void
  resize: (width: number, height: number, ratio: number) => void
  dispose: () => void
}

interface PostOptions {
  samples?: number
  THREE: typeof Three
  renderer: Three.WebGLRenderer
  scene: Three.Scene
  camera: Three.Camera
}

export async function createStagePost(options: PostOptions): Promise<StagePost> {
  const { THREE, renderer, scene, camera } = options
  const [{ EffectComposer }, { UnrealBloomPass }, { ShaderPass }, { OutputPass }] =
    await Promise.all([
      import('three/examples/jsm/postprocessing/EffectComposer.js'),
      import('three/examples/jsm/postprocessing/UnrealBloomPass.js'),
      import('three/examples/jsm/postprocessing/ShaderPass.js'),
      import('three/examples/jsm/postprocessing/OutputPass.js'),
    ])
  // Resolve the selected MSAA once for the scene. Full-screen passes have no geometry
  // edges to antialias: multisampling their ping-pong targets wastes bandwidth.
  // Keep half-float through the entire chain so the same HDR values feed bloom.
  const input = new THREE.WebGLRenderTarget(1, 1, {
    type: THREE.HalfFloatType,
    samples: options.samples ?? 4,
  })
  const target = new THREE.WebGLRenderTarget(1, 1, {
    type: THREE.HalfFloatType,
    depthBuffer: false,
  })
  const composer = new EffectComposer(renderer, target)
  // A separate texture name prevents ShaderPass replacing the scene texture
  // with its ping-pong input. Sanitisation still precedes bloom, exactly once.
  const sanitisePass = new ShaderPass(SANITISE_SHADER, 'composerInput')
  sanitisePass.uniforms.tDiffuse.value = input.texture
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(1, 1),
    BLOOM_STRENGTH,
    BLOOM_RADIUS,
    BLOOM_THRESHOLD,
  )
  // These targets contain full-screen quads only; no depth attachment is read.
  const bloomTargets = [
    bloomPass.renderTargetBright,
    ...bloomPass.renderTargetsHorizontal,
    ...bloomPass.renderTargetsVertical,
  ]
  bloomTargets.forEach((buffer) => {
    buffer.depthBuffer = false
  })
  const vignettePass = new ShaderPass(VIGNETTE_SHADER)
  const outputPass = new OutputPass()
  const passes = [sanitisePass, bloomPass, vignettePass, outputPass]
  passes.forEach((pass) => composer.addPass(pass))
  return {
    render: () => {
      renderSceneInput({ renderer, scene, camera, target: input })
      composer.render()
    },
    resize: (width, height, ratio) => {
      composer.setPixelRatio(ratio)
      composer.setSize(width, height)
      input.setSize(width * ratio, height * ratio)
    },
    dispose: () => {
      passes.forEach((pass) => pass.dispose())
      composer.dispose()
      input.dispose()
    },
  }
}

/** RenderPass’s clear/restore semantics, with an MSAA target owned by the scene. */
function renderSceneInput(
  options: Omit<PostOptions, 'THREE'> & { target: Three.WebGLRenderTarget },
) {
  const { renderer, scene, camera, target } = options
  const previous = renderer.getRenderTarget()
  const autoClear = renderer.autoClear
  try {
    renderer.autoClear = false
    renderer.setRenderTarget(target)
    renderer.clear(renderer.autoClearColor, renderer.autoClearDepth, renderer.autoClearStencil)
    renderer.render(scene, camera)
  } finally {
    renderer.autoClear = autoClear
    renderer.setRenderTarget(previous)
  }
}
