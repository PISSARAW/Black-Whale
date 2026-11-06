import type { NenTechniqueState } from '@black-whale/nen-engine'
import { refractionAmount } from './auraRefraction'
import type { SceneRuntime } from './TourRenderer'
import type { Vec2 } from './types'
import type { TourHourView } from './hourView'
import { applyGrade, LENS_DEFAULTS, LENS_OFF } from './postGrade'

/**
 * What the aperture closes to when the monkeys take sight.
 *
 * Not zero: the ship is still there and still lit — the bake is in the
 * vertices and cannot be switched off — and a black frame would say the deck
 * had gone rather than that the eye had. Two per cent leaves the brightest
 * filaments as a suggestion and nothing else.
 */
export const SEALED_EXPOSURE = 0.02

interface WalkEffectsFrame {
  calm: boolean
  nen: NenTechniqueState | null
  clock: number
  gyo: boolean
  tier: string
  delta: number
}

/** Reapply the visitor's exposure and the ship's optics before rendering a frame. */
export function updateWalkOptics(
  runtime: Pick<SceneRuntime, 'renderer' | 'grade' | 'refraction' | 'gyoFilter' | 'lensDirt'>,
  frame: WalkEffectsFrame & {
    hour: Pick<TourHourView, 'exposure' | 'grade'>
    exposure: number
    blinded: boolean
    outside: boolean | undefined
    lens: boolean
  },
): void {
  runtime.renderer.toneMappingExposure = frame.blinded
    ? SEALED_EXPOSURE
    : frame.exposure * (frame.outside ? Math.max(1.15, frame.hour.exposure) : frame.hour.exposure)
  applyGrade(runtime.grade, {
    grade: frame.hour.grade,
    clock: frame.clock,
    calm: frame.calm,
    lens: frame.lens ? LENS_DEFAULTS : LENS_OFF,
  })
  updateWalkPostEffects(runtime, frame)
}

/** Preserve temporal sampling across frames; animated concerts never accumulate. */
export class WalkTemporalState {
  private pointer: Vec2 = [0, 0]
  private yaw = 0
  private pitch = 0

  update(
    pass: SceneRuntime['taa'],
    frame: {
      at: Vec2
      yaw: number
      pitch: number
      concert: boolean
    },
  ): void {
    if (!pass) return
    const moved =
      Math.abs(frame.at[0] - this.pointer[0]) > 0.001 ||
      Math.abs(frame.at[1] - this.pointer[1]) > 0.001 ||
      Math.abs(frame.yaw - this.yaw) > 0.001 ||
      Math.abs(frame.pitch - this.pitch) > 0.001
    pass.accumulate = !moved && !frame.concert
    this.pointer = [frame.at[0], frame.at[1]]
    this.yaw = frame.yaw
    this.pitch = frame.pitch
  }
}

/** Per-frame optical controls, shared by the normal walk and concert return. */
export function updateWalkPostEffects(
  runtime: Pick<SceneRuntime, 'refraction' | 'gyoFilter' | 'lensDirt'>,
  frame: WalkEffectsFrame,
): void {
  const { refraction, gyoFilter, lensDirt } = runtime
  if (refraction) {
    refraction.uniforms.uAmount.value = frame.calm ? 0 : refractionAmount(frame.nen)
    refraction.uniforms.uTime.value = frame.clock
  }
  if (gyoFilter) gyoFilter.enabled = frame.gyo
  if (lensDirt) {
    const targetIntensity = ['T3', 'T4', 'T5'].includes(frame.tier) ? 1.5 : 0
    lensDirt.uniforms.dirtIntensity.value +=
      (targetIntensity - lensDirt.uniforms.dirtIntensity.value) * frame.delta * 2.0
  }
}
