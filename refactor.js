const fs = require('fs');
const path = require('path');

const tourDir = path.join('apps', 'web', 'src', 'lib', 'components', 'tour');

const ctxCode = import type * as THREE from 'three'
import type { Vec2 } from '\\/tour/types'

export interface TourRenderContext {
  delta: number
  clock: number
  blinded: boolean
  sealedExposure: number
  comfortExposure: number
  hourViewExposure: number
  hourViewGrade: any
  calmWalk: boolean
  shownNen: any
  gyoMode: boolean
  currentTierId: string
  picker: THREE.Raycaster
  reticle: THREE.Vector2
  camera: THREE.PerspectiveCamera
  intersectables: THREE.Object3D[]
  focusDistanceState: { focusDistance: number }
  pointer: Vec2
  yaw: number
  pitch: number
  eyeHeight: number
  ground: number
  authoredEyeHeight: number | null
}
;

fs.writeFileSync(path.join(tourDir, 'TourRenderContext.ts'), ctxCode);

const pipelineCode = import type { applyGrade, LENS_DEFAULTS, LENS_OFF } from '\\/tour/postGrade'
import { refractionAmount } from '\\/tour/auraRefraction'
import type { SceneRuntime } from '\\/tour/TourRenderer'
import type { TourRenderContext } from './TourRenderContext'

export class TourPostProcessPipeline {
  constructor(private runtime: SceneRuntime, private applyGradeFn: typeof applyGrade, private defaults: typeof LENS_DEFAULTS, private off: typeof LENS_OFF) {}

  update(ctx: TourRenderContext) {
    if (this.runtime.depthOfField) {
      ctx.picker.setFromCamera(ctx.reticle, ctx.camera)
      const hits = ctx.picker.intersectObjects(ctx.intersectables, true)
      const targetDistance = hits.length > 0 ? hits[0].distance : 100.0
      ctx.focusDistanceState.focusDistance += (targetDistance - ctx.focusDistanceState.focusDistance) * Math.min(1, ctx.delta * 5)
      this.runtime.depthOfField.uniforms.focus.value = ctx.focusDistanceState.focusDistance
    }

    if (this.runtime.motionBlur) {
      this.runtime.motionBlur.update(ctx.camera, ctx.delta)
    }

    this.runtime.renderer.toneMappingExposure = ctx.blinded
      ? ctx.sealedExposure
      : ctx.comfortExposure * ctx.hourViewExposure
    
    this.applyGradeFn(this.runtime.grade, {
      grade: ctx.hourViewGrade,
      clock: ctx.clock,
      calm: ctx.calmWalk,
      lens: this.runtime.quality.lens ? this.defaults : this.off,
    })

    if (this.runtime.refraction) {
      this.runtime.refraction.uniforms.uAmount.value = ctx.calmWalk ? 0 : refractionAmount(ctx.shownNen)
      this.runtime.refraction.uniforms.uTime.value = ctx.clock
    }

    if (this.runtime.gyoFilter) {
      this.runtime.gyoFilter.enabled = ctx.gyoMode
    }

    if (this.runtime.lensDirt) {
      const isLowerDeck = ['T3', 'T4', 'T5'].includes(ctx.currentTierId)
      const targetIntensity = isLowerDeck ? 1.5 : 0.0
      this.runtime.lensDirt.uniforms.dirtIntensity.value +=
        (targetIntensity - this.runtime.lensDirt.uniforms.dirtIntensity.value) * ctx.delta * 2.0
    }
  }
}
;

fs.writeFileSync(path.join(tourDir, 'TourPostProcessPipeline.ts'), pipelineCode);

const cameraCode = import type { TourRenderContext } from './TourRenderContext'

export class TourCameraController {
  update(ctx: TourRenderContext) {
    ctx.camera.position.set(ctx.pointer[0], ctx.ground + (ctx.authoredEyeHeight ?? ctx.eyeHeight), ctx.pointer[1])
    ctx.camera.rotation.set(0, 0, 0)
    ctx.camera.rotateY(ctx.yaw)
    ctx.camera.rotateX(ctx.pitch)
  }
}
;

fs.writeFileSync(path.join(tourDir, 'TourCameraController.ts'), cameraCode);

let svelteCode = fs.readFileSync(path.join(tourDir, 'TourScene.svelte'), 'utf8');

svelteCode = svelteCode.replace(
  "import TourSoundControls from './TourSoundControls.svelte'",
  "import TourSoundControls from './TourSoundControls.svelte'\n  import { TourPostProcessPipeline } from './TourPostProcessPipeline'\n  import { TourCameraController } from './TourCameraController'"
);

svelteCode = svelteCode.replace(
  "} = runtime\n      const portals",
  "} = runtime\n      const pipeline = new TourPostProcessPipeline(runtime, applyGrade, LENS_DEFAULTS, LENS_OFF)\n      const cameraController = new TourCameraController()\n      const portals"
);

// We need to replace the big block of post process inside tick
const blockToReplace = \        // The aperture. Written here rather than watched, for the same reason
        // the field of view is: the panel is a store and this loop is outside
        // Svelte's reactivity, and one number a frame is not a cost.
        renderer.toneMappingExposure = blinded
          ? SEALED_EXPOSURE
          : \\.exposure * hourView.exposure
        // The grade the hour asks for, and the clock the grain and the corners
        // breathe on. Three numbers and a float: see \pplyGrade\.
        applyGrade(grade, {
          grade: hourView.grade,
          clock,
          calm: calmWalk,
          lens: quality.lens ? LENS_DEFAULTS : LENS_OFF,
        })

        // The air bending around the aura. Zero unless there is aura out, and
        // zero outright for a visitor whose system asks for less movement: a
        // swimming picture is movement, whatever it is a picture of.
        if (refraction) {
          refraction.uniforms.uAmount.value = calmWalk ? 0 : refractionAmount(shownNen)
          refraction.uniforms.uTime.value = clock
        }

        // Gyo mode toggles the custom filter pass
        if (gyoFilter) {
          gyoFilter.enabled = gyoMode
        }

        // Lens dirt is only present in the lower decks (T3, T4, T5)
        if (lensDirt) {
          const isLowerDeck = ['T3', 'T4', 'T5'].includes(currentTierId)
          // 1.5 intensity for lower decks, 0.0 for clean upper decks
          const targetIntensity = isLowerDeck ? 1.5 : 0.0
          // Smoothly interpolate the intensity to avoid hard pop when taking the elevator/stairs
          lensDirt.uniforms.dirtIntensity.value +=
            (targetIntensity - lensDirt.uniforms.dirtIntensity.value) * delta * 2.0
        }\;

svelteCode = svelteCode.replace(blockToReplace, \        const intersectables: import('three').Object3D[] = []
        if (visible) intersectables.push(visible.root)
        for (const s of Object.values(solids)) {
          if (s) intersectables.push(s.mesh)
        }
        const focusDistanceState = { focusDistance }

        const ctx = {
          delta, clock, blinded, sealedExposure: SEALED_EXPOSURE, comfortExposure: \\.exposure, 
          hourViewExposure: hourView.exposure, hourViewGrade: hourView.grade, calmWalk, shownNen, 
          gyoMode, currentTierId, picker, reticle: RETICLE, camera, intersectables, focusDistanceState,
          pointer, yaw, pitch, eyeHeight, ground, authoredEyeHeight
        }
        pipeline.update(ctx)
        // cameraController.update(ctx) // Uncomment to enable camera control
        focusDistance = focusDistanceState.focusDistance\);

const depthOfFieldBlock = \        if (depthOfField) {
          picker.setFromCamera(RETICLE, camera)
          const intersectables: import('three').Object3D[] = []
          if (visible) intersectables.push(visible.root)
          for (const s of Object.values(solids)) {
            if (s) intersectables.push(s.mesh)
          }
          const hits = picker.intersectObjects(intersectables, true)
          const targetDistance = hits.length > 0 ? hits[0].distance : 100.0
          focusDistance += (targetDistance - focusDistance) * Math.min(1, delta * 5)
          depthOfField.uniforms.focus.value = focusDistance
        }

        if (motionBlur) {
          motionBlur.update(camera, delta)
        }\;

svelteCode = svelteCode.replace(depthOfFieldBlock, \        // Note: depthOfField and motionBlur moved to TourPostProcessPipeline.update\);

fs.writeFileSync(path.join(tourDir, 'TourScene.svelte'), svelteCode);
console.log('Refactor complete');
