import type { Graph } from '$lib/audio/ambient/mixer'
import { rush, startsAt, swept } from '$lib/audio/hatsu/synth'
import { shufflePhase } from '../fightShuffleStep'
import type { ArcadeFighter } from '../types'
import type { StageSoundProfile } from './stages'

const SURFACES = {
  steel: { heel: 188, grit: 3250, ring: 720, decay: 0.07 },
  stone: { heel: 151, grit: 2100, ring: 495, decay: 0.056 },
  wood: { heel: 174, grit: 1550, ring: 382, decay: 0.078 },
  carpet: { heel: 112, grit: 910, ring: 0, decay: 0.036 },
}
const SOLE = {
  step: { weight: 0.43, slide: 0.032, low: 1 },
  dash: { weight: 0.71, slide: 0.105, low: 1 },
  jump: { weight: 0.3, slide: 0.048, low: 1 },
  land: { weight: 0.96, slide: 0.044, low: 0.86 },
  fall: { weight: 1.16, slide: 0.074, low: 0.72 },
}

export function footPlant(before: ArcadeFighter, after: ArcadeFighter): number | undefined {
  if (after.pose !== 'walk' || after.y !== 0 || after.motion?.dash || before.y > 0) return
  if (Math.abs(after.x - before.x) < 0.01) return
  // Project both positions into the active orientation, as the rendered support leg does.
  const previous = Math.floor((shufflePhase(before) * before.facing * after.facing) / Math.PI)
  const contact = Math.floor(shufflePhase(after) / Math.PI)
  if (previous !== contact) return Math.abs(contact) % 4
}

export function footFoley(
  g: Graph,
  options: {
    floor: StageSoundProfile['floor']
    kind: keyof typeof SOLE
    weight: number
    take: number
  },
) {
  const surface = SURFACES[options.floor]
  const sole = SOLE[options.kind]
  const force = Math.min(1.45, sole.weight * options.weight)
  const heel = surface.heel * sole.low * [1, 0.91, 1.06, 0.96][options.take % 4]
  const at = startsAt(g)
  swept(g, at, {
    type: 'sine',
    from: heel,
    to: Math.max(47, heel * 0.41),
    peak: 0.17 * force,
    duration: 0.039,
    attack: 0.002,
    release: surface.decay,
  })
  rush(g, at + 0.006, {
    peak: 0.18 * force,
    cutoff: surface.grit,
    sweepTo: surface.grit * 0.39,
    duration: sole.slide,
    attack: 0.005,
    release: surface.decay * 0.62,
  })
  if (surface.ring)
    swept(g, at + 0.004, {
      type: 'triangle',
      from: surface.ring,
      peak: 0.035 * force,
      duration: 0.019,
      attack: 0.001,
      release: surface.decay,
    })
}
