import type { Graph } from '$lib/audio/ambient/mixer'
import { rush, startsAt, swept } from '$lib/audio/hatsu/synth'
import type { ProjectileShape } from '../types'
import type { FightSoundEvent } from './events'
import { weaponMovement } from './physicalFoley'

const TRAVEL: Record<
  Exclude<ProjectileShape, 'bullet'>,
  { air: number; end: number; duration: number }
> = {
  card: { air: 4800, end: 2100, duration: 0.064 },
  chain: { air: 2300, end: 670, duration: 0.13 },
  page: { air: 3500, end: 1950, duration: 0.1 },
  seed: { air: 1950, end: 900, duration: 0.072 },
  orb: { air: 1260, end: 440, duration: 0.145 },
  eye: { air: 1850, end: 710, duration: 0.12 },
  stone: { air: 1510, end: 480, duration: 0.087 },
  needle: { air: 5600, end: 2820, duration: 0.048 },
  'remote-fist': { air: 870, end: 310, duration: 0.108 },
}

export function projectileTravelFoley(g: Graph, event: FightSoundEvent) {
  const shape = event.shape ?? 'stone'
  if (shape === 'bullet') return
  const { air, end, duration } = TRAVEL[shape]
  rush(g, startsAt(g), {
    peak: 0.068,
    cutoff: air,
    sweepTo: end,
    duration,
    attack: 0.004,
    release: 0.045,
  })
  if (shape === 'chain') weaponMovement(g, { material: 'chain', take: event.take ?? 0, force: 0.8 })
  if (shape === 'page') weaponMovement(g, { material: 'paper', take: event.take ?? 0, force: 0.62 })
}

export function projectileInterceptionFoley(g: Graph, event: FightSoundEvent) {
  const at = startsAt(g)
  const pitch = event.terrain ? 840 : 560
  rush(g, at, {
    peak: 0.126,
    cutoff: event.terrain ? 2950 : 1650,
    sweepTo: 770,
    duration: 0.016,
    attack: 0.001,
    release: 0.048,
  })
  swept(g, at + 0.007, {
    type: 'triangle',
    from: pitch,
    to: pitch * 0.54,
    peak: 0.107,
    duration: 0.038,
    attack: 0.001,
    release: 0.079,
  })
  projectileImpactFoley(g, { shape: event.shape, take: event.take ?? 0, force: 0.56 })
}

export function projectileImpactFoley(
  g: Graph,
  event: { shape?: ProjectileShape; take: number; force: number },
) {
  if (!event.shape) return
  if (event.shape === 'chain' || event.shape === 'page') {
    weaponMovement(g, { ...event, material: event.shape === 'chain' ? 'chain' : 'paper' })
    return
  }
  const cutoff = event.shape === 'bullet' ? 3580 : TRAVEL[event.shape].air * 0.81
  rush(g, startsAt(g), {
    peak: 0.088 * event.force,
    cutoff,
    sweepTo: cutoff * 0.45,
    duration: 0.018,
    attack: 0.001,
    release: 0.039,
  })
}
