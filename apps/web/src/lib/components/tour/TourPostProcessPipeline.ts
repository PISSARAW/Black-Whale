import { applyGrade, LENS_DEFAULTS, LENS_OFF } from '$lib/tour/postGrade'
import { refractionAmount } from '$lib/tour/auraRefraction'
import type { SceneRuntime } from '$lib/tour/TourRenderer'
import type { TourRenderContext } from './TourRenderContext'

export class TourPostProcessPipeline {
  constructor(private runtime: SceneRuntime) {}

  private updateFocusAndBlur(ctx: TourRenderContext) {
    if (this.runtime.depthOfField) {
      ctx.picker.setFromCamera(ctx.reticle, ctx.camera)
      const hits = ctx.picker.intersectObjects(ctx.intersectables, true)
      const targetDistance = hits.length > 0 ? hits[0].distance : 100.0
      ctx.focusDistanceState.focusDistance +=
        (targetDistance - ctx.focusDistanceState.focusDistance) * Math.min(1, ctx.delta * 5)
      this.runtime.depthOfField.uniforms.focus.value = ctx.focusDistanceState.focusDistance
    }

    if (this.runtime.motionBlur) {
      this.runtime.motionBlur.update(ctx.camera, ctx.delta)
    }
  }

  update(ctx: TourRenderContext) {
    this.updateFocusAndBlur(ctx)

    this.runtime.renderer.toneMappingExposure = ctx.blinded
      ? ctx.sealedExposure
      : ctx.comfortExposure * ctx.hourViewExposure

    applyGrade(this.runtime.grade, {
      grade: ctx.hourViewGrade,
      clock: ctx.clock,
      calm: ctx.calmWalk,
      lens: this.runtime.quality.lens ? LENS_DEFAULTS : LENS_OFF,
    })

    if (this.runtime.refraction) {
      this.runtime.refraction.uniforms.uAmount.value = ctx.calmWalk
        ? 0
        : refractionAmount(ctx.shownNen)
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
