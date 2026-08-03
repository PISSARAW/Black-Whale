import { hatsuAudioGraph } from '../ambient'

import { rush, startsAt, swept } from './synth'

export interface HatsuAudioSignature {
  lowHz: number
  highHz: number
  noise: number
  pulses: number
}

export function hatsuAudioSignature(abilityId: string): HatsuAudioSignature {
  let hash = 2166136261
  for (let index = 0; index < abilityId.length; index += 1) {
    hash ^= abilityId.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  const unsigned = hash >>> 0
  const lowHz = 72 + (unsigned & 0xff)
  const interval = 180 + ((unsigned >>> 8) & 0x1ff)
  return {
    lowHz,
    highHz: lowHz + interval,
    noise: ((unsigned >>> 17) & 0x7f) / 127,
    pulses: 2 + ((unsigned >>> 24) & 0x03),
  }
}

export function playHatsuActivationSignature(abilityId: string): void {
  const g = hatsuAudioGraph()
  if (!g) return
  const signature = hatsuAudioSignature(abilityId)
  const at = startsAt(g)
  for (let pulse = 0; pulse < signature.pulses; pulse += 1) {
    swept(g, at + pulse * 0.075, {
      type: pulse % 2 ? 'triangle' : 'sine',
      from: signature.lowHz,
      to: signature.highHz,
      peak: 0.045,
      duration: 0.09,
      release: 0.12,
      send: 0.25,
    })
  }
  if (signature.noise > 0.2) {
    rush(g, at, {
      peak: 0.018 * signature.noise,
      duration: 0.18,
      cutoff: signature.highHz * 2,
      sweepTo: signature.lowHz * 2,
      release: 0.1,
    })
  }
}
