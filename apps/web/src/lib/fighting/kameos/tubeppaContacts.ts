import type { HumanMotion } from '$lib/tour/humanAnimation'
import { placeSupportHand } from './supportHandContact'
import { KAMEO_CATALOGUE } from './catalogue'
import type { KameoSlot } from './types'

/** Final contact follows the real head after its expressive turn, in either orientation. */
export function tubeppaGlassesMotion(slot: KameoSlot): HumanMotion | undefined {
  if (slot.phase !== 'entering') return
  const progress = Math.min(1, Math.max(0, slot.phaseFrames / KAMEO_CATALOGUE.tubeppa.timing.enter))
  const strength = Math.sin(progress * Math.PI) ** 2
  return (human) => placeSupportHand({ human, target: [0.116, -0.025, 0.214], strength })
}
