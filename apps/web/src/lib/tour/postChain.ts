/**
 * The order the passes go in, and the argument for each place in it.
 *
 * Lifted out of `createSceneRuntime` when the occlusion pass and the colour
 * conversion arrived and pushed that function past the complexity bound. It is
 * a better home than the one it left anyway: building a renderer, sizing a
 * camera and choosing a palier are three questions about a *machine*, and the
 * order of a post chain is one question about a *picture*. They were only ever
 * in the same function because they happen at the same moment.
 *
 * The chain, and what each position is for:
 *
 *   RenderPass  the room, lit by the bake, into a linear buffer
 *   occlusion   the junctions the bake could not see — before any light spills
 *   shafts      light through a window, before the thing that blooms light
 *   bloom       what a source does to the air around it
 *   refraction  the air bending round an aura
 *   grade       the hour: contrast, saturation, vignette, and the lens
 *   gyo         the Nen filter, which overrides the picture rather than joins it
 *   output      linear working values turned into a picture — off by default
 *   SMAA        the anti-aliasing, on the final image rather than a middle one
 *
 * `RenderPass` itself stays with the runtime: it is not conditional on
 * anything, and it is the one pass that needs the scene.
 */
import type * as Three from 'three'
import type { Pass } from 'three/examples/jsm/postprocessing/Pass.js'
import { LENS_DEFAULTS, LENS_OFF, createGradePass } from './postGrade'
import { createGyoPass } from './gyoFilter'
import { createRefractionPass } from './auraRefraction'
import { createShaftPass } from './godRays'
import { createOcclusionPass } from './ambientOcclusion'
import { createDepthOfFieldPass } from './depthOfField'
import { createOutputPass, wantsColourManagement } from './outputPass'
import type { PostPass } from './postTypes'
import type { QualityProfile } from './quality'

/**
 * The only thing this file needs a composer to be.
 *
 * Structural rather than `EffectComposer` itself, for the reason `PostPass` is
 * a type-only re-export: naming the class would put a deep `three/examples`
 * path in a module that otherwise imports every pass lazily, and assembling a
 * chain is exactly one verb — adding a pass to it.
 */
type PassChain = { addPass: (pass: Pass) => void }

/** The passes the walk has to write to every frame, handed back by name. */
export interface PostChain {
  shafts: PostPass | null
  refraction: PostPass | null
  grade: PostPass | null
  gyoFilter: PostPass | null
  depthOfField: PostPass | null
}

export interface PostChainBuild {
  THREE: typeof Three
  camera: Three.PerspectiveCamera
  quality: QualityProfile
  /** The half-float target, on the palier that has one. Carries the depth. */
  renderTarget?: Three.WebGLRenderTarget
}

/**
 * What happens to the room before anything happens to the frame.
 *
 * The dividing line is real rather than tidy: everything here is still a
 * statement about light in a space — where it is blocked, where it comes in,
 * what it does to the air around a source — and it all has to be settled before
 * the frame is treated as a photograph of anything.
 */
async function addRoomEffects(
  composer: PassChain,
  build: PostChainBuild,
): Promise<PostPass | null> {
  const { THREE, camera, quality, renderTarget } = build

  // First of the effects, and it has to be: occlusion is a property of the
  // room's own light, so it belongs before anything that spills that light
  // around — a corner darkened after the bloom is a corner the bloom already
  // filled in. It reads the depth `RenderPass` just wrote, which is why it is
  // conditioned on the target that carries one rather than on the palier alone.
  if (quality.occlusion && renderTarget?.depthTexture) {
    composer.addPass(await createOcclusionPass({ camera, depth: renderTarget.depthTexture }))
  }

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

  return shafts
}

/**
 * What happens to the frame once the room in it is settled.
 *
 * From here down nothing is a claim about the ship: an aura bends the air a
 * camera is looking through, an hour grades an exposure, a lens costs what
 * looking through it costs, and the last two convert and smooth what is by then
 * a picture.
 */
async function addFrameEffects(
  composer: PassChain,
  build: PostChainBuild,
): Promise<Omit<PostChain, 'shafts'>> {
  const { quality } = build

  // After the bloom and before the grade. Before the bloom, the halo would be
  // bent and the light it throws would not, which reads as the aura sliding off
  // its own glow; after the grade, the vignette would be swimming at the corners
  // of the screen, and the vignette is the frame rather than the room.
  let refraction: PostPass | null = null
  if (quality.auraDistortion) {
    refraction = await createRefractionPass()
    composer.addPass(refraction)
  }

  let depthOfField: PostPass | null = null
  if (quality.dof && build.renderTarget?.depthTexture) {
    depthOfField = await createDepthOfFieldPass({
      camera: build.camera,
      depth: build.renderTarget.depthTexture,
    })
    composer.addPass(depthOfField)
  }

  // The lens artefacts ride inside the grade rather than in a pass of their
  // own — see `LENS_DEFAULTS` — so a palier without the taps still gets the
  // vignette and the curve, at exactly the cost it had before.
  let grade: PostPass | null = null
  if (quality.grade) {
    grade = await createGradePass(quality.lens ? LENS_DEFAULTS : LENS_OFF)
    composer.addPass(grade)
  }

  // Gyo Filter is added after grade so it overrides the final colors with its effect.
  const gyoFilter = await createGyoPass()
  composer.addPass(gyoFilter)

  // Before the anti-aliasing and after everything else: the conversion is what
  // turns the walk's linear working values into the picture, and SMAA is meant
  // to smooth the picture rather than the values behind it. Off unless the visit
  // asked — see `$lib/tour/outputPass` for why a correction ships switched off.
  if (wantsColourManagement(window.location.search)) {
    composer.addPass(await createOutputPass())
  }

  /**
   * Last, and the reason SMAA is in the chain at all.
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

  return { refraction, grade, gyoFilter, depthOfField }
}

/** The whole chain, in order, on a composer that already has its `RenderPass`. */
export async function assemblePostChain(
  composer: PassChain,
  build: PostChainBuild,
): Promise<PostChain> {
  const shafts = await addRoomEffects(composer, build)
  const frame = await addFrameEffects(composer, build)
  return { shafts, ...frame }
}
