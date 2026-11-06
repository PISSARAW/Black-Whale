import type { NenTechniqueState } from '@black-whale/nen-engine'
import { refractionAmount } from './auraRefraction'
import type { SceneRuntime } from './TourRenderer'

/** Per-frame optical controls, shared by the normal walk and concert return. */
export function updateWalkPostEffects(
  runtime: Pick<SceneRuntime, 'refraction' | 'gyoFilter' | 'lensDirt'>,
  frame: {
    calm: boolean
    nen: NenTechniqueState | null
    clock: number
    gyo: boolean
    tier: string
    delta: number
  },
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
