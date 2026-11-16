import type { Graph } from '$lib/audio/ambient/mixer'
import { rush, startsAt, swept } from '$lib/audio/hatsu/synth'
import type { FighterSoundProfile, SoundMaterial } from './profiles'
import type { StageSoundProfile } from './stages'

const MATERIALS: Record<
  SoundMaterial,
  { cutoff: number; ring: number; decay: number; noise: number }
> = {
  steel: { cutoff: 3200, ring: 1280, decay: 0.18, noise: 0.07 },
  rubber: { cutoff: 1100, ring: 230, decay: 0.12, noise: 0.05 },
  paper: { cutoff: 4800, ring: 0, decay: 0.08, noise: 0.085 },
  flesh: { cutoff: 1650, ring: 0, decay: 0.07, noise: 0.1 },
  silk: { cutoff: 3600, ring: 0, decay: 0.12, noise: 0.04 },
  air: { cutoff: 2200, ring: 0, decay: 0.15, noise: 0.06 },
  wood: { cutoff: 1800, ring: 330, decay: 0.09, noise: 0.08 },
  machine: { cutoff: 2900, ring: 780, decay: 0.08, noise: 0.075 },
  glass: { cutoff: 4400, ring: 1900, decay: 0.35, noise: 0.035 },
}

export function materialStrike(
  g: Graph,
  options: { material: SoundMaterial; force: number; light?: boolean },
): void {
  const at = startsAt(g)
  const material = MATERIALS[options.material]
  const force = options.force
  rush(g, at, {
    peak: material.noise * force,
    duration: 0.024,
    release: material.decay,
    cutoff: material.cutoff,
    sweepTo: material.cutoff * 0.35,
    attack: 0.002,
  })
  if (!options.light)
    swept(g, at, {
      type: 'sine',
      from: 160 / Math.sqrt(force),
      to: 43,
      peak: 0.14 * force,
      duration: 0.085,
      attack: 0.002,
      release: 0.1,
    })
  if (material.ring)
    swept(g, at + 0.006, {
      type: 'sine',
      from: material.ring,
      to: material.ring * 0.88,
      peak: 0.025 * force,
      duration: 0.025,
      release: material.decay,
      wobble: options.material === 'rubber' ? 24 : 0,
      wobbleHz: 17,
    })
}

/** Air and a quiet voiced body: effort/pain without borrowed actor recordings. */
export function breath(
  g: Graph,
  options: { profile: FighterSoundProfile; pain?: boolean; force: number },
): void {
  const at = startsAt(g)
  const { profile, force } = options
  rush(g, at, {
    peak: 0.036 * force,
    cutoff: options.pain ? 900 : 580,
    sweepTo: 240,
    q: 1.1,
    duration: options.pain ? 0.13 : 0.065,
    attack: 0.012,
    release: 0.08,
  })
  swept(g, at, {
    type: 'triangle',
    from: profile.breath,
    to: profile.breath * (options.pain ? 0.58 : 0.8),
    peak: 0.016 * force,
    duration: 0.07,
    attack: 0.016,
    release: 0.09,
  })
}

export function fighterMotif(g: Graph, profile: FighterSoundProfile, triumph = false): void {
  const at = startsAt(g)
  profile.motif.forEach((interval, index) => {
    const hz = profile.root * 2 ** ((interval + Number(triumph) * 12) / 12)
    swept(g, at + index * profile.pace, {
      type: 'sine',
      from: hz,
      peak: 0.04,
      duration: 0.09,
      attack: 0.012,
      release: 0.22,
      send: 0.3,
    })
    rush(g, at + index * profile.pace, {
      peak: 0.009,
      cutoff: hz * 3,
      duration: 0.03,
      release: 0.08,
    })
  })
}

export function floorContact(
  g: Graph,
  options: { stage: StageSoundProfile; weight: number; landing?: boolean },
): void {
  const material: Record<StageSoundProfile['floor'], SoundMaterial> = {
    steel: 'steel',
    stone: 'wood',
    wood: 'wood',
    carpet: 'silk',
  }
  const force = options.weight * (options.landing ? 0.75 : 0.25)
  materialStrike(g, { material: material[options.stage.floor], force, light: !options.landing })
  const roots = { steel: 94, stone: 62, wood: 145, carpet: 78 }
  swept(g, startsAt(g), {
    type: 'sine',
    from: roots[options.stage.floor],
    to: 43,
    peak: 0.065 * force,
    duration: 0.045,
    release: 0.1,
  })
}

export function heartbeat(g: Graph, force = 1): void {
  const at = startsAt(g)
  for (const [offset, hz, strength] of [
    [0, 67, 1],
    [0.14, 49, 0.65],
  ]) {
    swept(g, at + offset, {
      type: 'sine',
      from: hz,
      to: hz * 0.62,
      peak: 0.11 * force * strength,
      duration: 0.065,
      attack: 0.006,
      release: 0.12,
    })
    rush(g, at + offset, { peak: 0.017 * force, cutoff: 230, duration: 0.03, release: 0.06 })
  }
}

export function watchTick(g: Graph, options: { pressure: number; alternate: boolean }): void {
  const at = startsAt(g)
  const strength = 0.018 + options.pressure * 0.04
  rush(g, at, {
    type: 'bandpass',
    cutoff: options.alternate ? 2600 : 1900,
    q: 4,
    peak: strength,
    duration: 0.006,
    attack: 0.001,
    release: 0.025,
  })
  swept(g, at, {
    type: 'sine',
    from: options.alternate ? 1350 : 1020,
    peak: strength * 0.6,
    duration: 0.004,
    release: 0.024,
    attack: 0.001,
  })
}
