import { NEN_PRESENTATION } from '@black-whale/nen-engine'
import { soundedFrom } from '$lib/audio/space'
import { withHatsuAudioGraph, type Graph } from '$lib/audio/ambient/mixer'
import {
  chainRings,
  foldPaper,
  raiseTheSun,
  strikeAGong,
  stretchTheGum,
  tearAPage,
  wakeTheMachine,
} from '$lib/audio/hatsuSounds'
import { rush, startsAt, swept } from '$lib/audio/hatsu/synth'
import type { FightState, MoveSlot } from '../types'
import type { FightSoundEvent, FightSoundKind } from './events'
import { playFightHatsu } from './hatsu'
import { fightCueMix } from './cueMix'
import type { FightMix } from './mixer'
import { FIGHTER_SOUNDS } from './profiles'
import { combatPressure } from './stages'
import { isKurapikaGoldenHeavy, kurapikaGoldenHeavyAudioAccent } from '../kurapikaGoldenHeavyImpact'
import { fightImpactPunctuation } from '../fightImpactPunctuation'
import { breath, fighterMotif, floorContact, heartbeat, materialStrike, watchTick } from './voices'
import { bodyContact, moveMaterial, weaponMovement } from './physicalFoley'
import { footFoley } from './footFoley'
import {
  projectileImpactFoley,
  projectileInterceptionFoley,
  projectileTravelFoley,
} from './projectileFoley'
import { tacticalImpact, TACTICAL_CUES } from './tacticalCues'
import { playEasterEggSound } from './easterEggs'

interface Cue {
  g: Graph
  mix: FightMix
  event: FightSoundEvent
  state: FightState
}

const profileFor = ({ event, state }: Cue) => {
  const profile = FIGHTER_SOUNDS[event.fighter ?? 'kurapika']
  if (event.side && state[event.side].biscuitTrueForm)
    return { ...profile, weight: 1.85, breath: 92 }
  return profile
}

const CUES: Record<Exclude<FightSoundKind, keyof typeof TACTICAL_CUES>, (cue: Cue) => void> = {
  intro: introCue,
  start: startCue,
  finish: finishCue,
  clock: clockCue,
  watch: watchCue,
  score: ({ g, event }) => metallic(g, { root: 520 + (event.value ?? 1) * 90, force: 0.25 }),
  stage: stageCue,
  windup: () => {},
  swing: swingCue,
  hatsu: ({ g, event }) => playFightHatsu(g, event),
  projectile: projectileCue,
  'projectile-intercept': ({ g, event }) => projectileInterceptionFoley(g, event),
  impact: impactCue,
  guard: ({ g }) =>
    rush(g, startsAt(g), { peak: 0.022, cutoff: 1200, sweepTo: 500, duration: 0.065 }),
  step: (cue) => movementCue(cue, 'step'),
  dash: (cue) => movementCue(cue, 'dash'),
  jump: (cue) => movementCue(cue, 'jump'),
  land: (cue) => movementCue(cue, 'land'),
  fall: (cue) => movementCue(cue, 'fall'),
  crouch: ({ g }) => materialStrike(g, { material: 'silk', force: 0.35, light: true }),
  charge: ({ g }) =>
    rush(g, startsAt(g), {
      peak: 0.025,
      cutoff: 300,
      sweepTo: 1100,
      duration: 0.25,
      attack: 0.06,
      release: 0.1,
    }),
  wakeup: (cue) => breath(cue.g, { profile: profileFor(cue), force: 0.9 }),
  'throw-tech': ({ g }) => {
    materialStrike(g, { material: 'flesh', force: 0.7 })
    metallic(g, { root: 740, force: 0.4 })
  },
  nen: nenCue,
  'emperor-on': emperorCue,
  'emperor-off': ({ g }) => {
    heartbeat(g, 0.5)
    rush(g, startsAt(g), { peak: 0.045, cutoff: 1200, sweepTo: 90, duration: 0.45 })
  },
  heartbeat: ({ g, event }) => heartbeat(g, 0.5 + Math.min(0.4, (event.value ?? 0) / 10800)),
  armour: ({ g }) => {
    foldPaper()
    metallic(g, { root: 180, force: 1.1 })
  },
  sun: ({ event }) => raiseTheSun(event.value),
  transform: (cue) => {
    floorContact(cue.g, { stage: cue.mix.profile, weight: 2.2, landing: true })
    breath(cue.g, { profile: { ...profileFor(cue), breath: 92 }, force: 2 })
  },
  projection: projectionCue,
  page: () => tearAPage(),
  gum: () => stretchTheGum(),
  seal: ({ g }) =>
    rush(g, startsAt(g), { peak: 0.075, cutoff: 1500, sweepTo: 60, duration: 0.24, release: 0.12 }),
  lsdf: ({ g, event }) => {
    wakeTheMachine()
    metallic(g, { root: 330 + (event.value ?? 1) * 80, force: 0.4 })
  },
  effect: effectCue,
  'easter-egg': ({ g, event }) => playEasterEggSound(g, event),
}

export function playFightSound(mix: FightMix, event: FightSoundEvent, state: FightState): void {
  const { channel, priority } = fightCueMix(event)
  const g = mix.event(event.x, channel, priority)
  if (!g) return
  g.timeOffset = event.delay
  soundedFrom(null, () => withHatsuAudioGraph(g, () => playCue({ g, mix, event, state })))
}

function playCue(cue: Cue): void {
  const { g, event } = cue
  if (event.kind in TACTICAL_CUES) TACTICAL_CUES[event.kind as keyof typeof TACTICAL_CUES](g, event)
  else CUES[event.kind as keyof typeof CUES](cue)
}

function metallic(g: Graph, options: { root: number; force: number }): void {
  const at = startsAt(g)
  for (const ratio of [1, 2.34, 3.71])
    swept(g, at, {
      type: 'sine',
      from: options.root * ratio,
      peak: (0.045 * options.force) / ratio,
      duration: 0.012,
      attack: 0.002,
      release: 0.4 / ratio,
    })
}

function introCue({ mix, state }: Cue): void {
  for (const side of ['player', 'opponent'] as const) {
    const fighter = state[side]
    const g = mix.event(fighter.x, 'music')
    if (g) fighterMotif(g, FIGHTER_SOUNDS[fighter.id])
  }
}

function startCue({ g, mix }: Cue): void {
  floorContact(g, { stage: mix.profile, weight: 1.7, landing: true })
  metallic(g, { root: 290, force: 1 })
}

function finishCue({ g, event, mix }: Cue): void {
  const at = startsAt(g)
  if (event.value === 1) {
    // The watch's two bells, after its escapement stops at zero.
    for (let ring = 0; ring < 5; ring++) {
      for (const ratio of [1, 1.53, 2.71])
        swept(g, at + ring * 0.11, {
          type: 'sine',
          from: 720 * ratio,
          peak: 0.065 / ratio,
          duration: 0.025,
          attack: 0.002,
          release: 0.55,
        })
    }
  } else floorContact(g, { stage: mix.profile, weight: 2, landing: true })
  if (event.fighter) fighterMotif(g, FIGHTER_SOUNDS[event.fighter], true)
}

function clockCue({ g, state, event }: Cue): void {
  const pressure = combatPressure(state)
  watchTick(g, { pressure, alternate: (event.value ?? 0) % 2 === 0 })
  if (pressure > 0.4) heartbeat(g, pressure * 0.2)
}

function watchCue({ g }: Cue): void {
  const at = startsAt(g)
  for (let turn = 0; turn < 9; turn++)
    rush(g, at + turn * 0.025, {
      peak: 0.035,
      cutoff: 2200 + turn * 80,
      duration: 0.008,
      release: 0.02,
      q: 4,
    })
  metallic(g, { root: 1600, force: 0.3 })
}

function swingCue(cue: Cue): void {
  const { g, event } = cue
  const profile = profileFor(cue)
  const motion = SWINGS[event.slot ?? 'standingLight']
  const at = startsAt(g)
  rush(g, at, {
    peak: 0.05 * profile.weight * motion.force,
    cutoff: motion.from,
    sweepTo: motion.to,
    duration: motion.duration,
    attack: 0.016,
    release: 0.05,
  })
  weaponMovement(g, {
    material: moveMaterial(event.moveId),
    force: motion.force * 0.66,
    take: cue.state.frame % 4,
  })
}

const SWINGS: Record<MoveSlot, { from: number; to: number; duration: number; force: number }> = {
  standingLight: { from: 700, to: 2600, duration: 0.045, force: 0.7 },
  standingHeavy: { from: 400, to: 1800, duration: 0.09, force: 1.3 },
  lowLight: { from: 480, to: 1600, duration: 0.055, force: 0.7 },
  lowHeavy: { from: 260, to: 1400, duration: 0.14, force: 1.2 },
  airLight: { from: 1200, to: 3200, duration: 0.065, force: 0.8 },
  airHeavy: { from: 1500, to: 350, duration: 0.16, force: 1.4 },
  forwardLight: { from: 900, to: 3000, duration: 0.07, force: 0.9 },
  forwardHeavy: { from: 500, to: 2200, duration: 0.12, force: 1.5 },
  backHeavy: { from: 1800, to: 400, duration: 0.13, force: 1.2 },
  neutralSpecial: { from: 350, to: 2400, duration: 0.12, force: 1.1 },
  forwardSpecial: { from: 600, to: 3800, duration: 0.1, force: 1.25 },
  downSpecial: { from: 900, to: 220, duration: 0.16, force: 0.8 },
  backSpecial: { from: 2400, to: 500, duration: 0.13, force: 0.8 },
  throw: { from: 700, to: 220, duration: 0.18, force: 1.2 },
  finisher: { from: 200, to: 3500, duration: 0.2, force: 1.8 },
}

function projectileCue({ g, event }: Cue): void {
  const at = startsAt(g)
  if (event.shape === 'bullet') {
    // One crack per projectile; no prerecorded burst keeps firing after interruption.
    rush(g, at, {
      type: 'highpass',
      peak: 0.12,
      cutoff: 2600,
      sweepTo: 900,
      duration: 0.018,
      attack: 0.001,
      release: 0.055,
    })
    swept(g, at, {
      type: 'sine',
      from: 160,
      to: 48,
      peak: 0.15,
      duration: 0.045,
      release: 0.06,
      attack: 0.002,
    })
    return
  }
  projectileTravelFoley(g, event)
}

function movementCue(cue: Cue, kind: Parameters<typeof footFoley>[1]['kind']): void {
  footFoley(cue.g, {
    floor: cue.mix.profile.floor,
    weight: profileFor(cue).weight,
    kind,
    take: cue.event.take ?? cue.state.frame % 4,
  })
}

function impactCue(cue: Cue): void {
  const { g, event } = cue
  const impact = event.impact
  if (!impact) return
  if (impact.avoided || impact.invulnerable) {
    rush(g, startsAt(g), { peak: 0.035, cutoff: 2600, sweepTo: 500, duration: 0.09 })
    return
  }
  if (impact.parried) {
    metallic(g, { root: 940, force: 1.4 })
    return
  }
  const material = moveMaterial(event.moveId)
  bodyContact(g, { impact, material })
  projectileImpactFoley(g, {
    shape: event.shape,
    take: impact.sequence,
    force: impact.blocked ? 0.6 : 1,
  })
  if (impact.blocked) {
    punctuateImpactAudio(cue)
    goldenHeavyImpactAudio(cue, true)
    return
  }
  const force = Math.min(1.8, 0.7 + impact.damage / 28)
  weaponMovement(g, { material, take: impact.sequence, force: force * 0.46 })
  tacticalImpact(g, impact)
  impactAccent(cue)
  punctuateImpactAudio(cue)
  goldenHeavyImpactAudio(cue, false)
}

function punctuateImpactAudio({ g, event }: Cue): void {
  const accent = fightImpactPunctuation(event.impact!)
  if (accent.rank < 2) return
  swept(g, startsAt(g), {
    type: 'sine',
    from: accent.thumpHz,
    to: accent.thumpHz * 0.52,
    peak: 0.028 + accent.rank * 0.014,
    duration: 0.07 + accent.rank * 0.025,
    attack: 0.001,
    release: 0.06,
  })
  if (accent.crack > 0)
    rush(g, startsAt(g), {
      type: 'highpass',
      peak: 0.035 * accent.crack,
      cutoff: 2800,
      sweepTo: 900,
      duration: 0.018,
      attack: 0.001,
      release: 0.045,
    })
}

function goldenHeavyImpactAudio({ g, event }: Cue, blocked: boolean): void {
  if (!isKurapikaGoldenHeavy(event.moveId)) return
  const accent = kurapikaGoldenHeavyAudioAccent(blocked)
  swept(g, startsAt(g), {
    type: 'sine',
    from: accent.thumpFrom,
    to: accent.thumpTo,
    peak: accent.thumpPeak,
    duration: accent.duration,
    attack: 0.001,
    release: blocked ? 0.045 : 0.08,
  })
  metallic(g, { root: 740, force: accent.chainForce })
}

function impactAccent({ g, event }: Cue): void {
  const impact = event.impact!
  if (impact.critical) metallic(g, { root: 310, force: 0.8 })
  if (impact.transfer) {
    swept(g, startsAt(g), { type: 'sine', from: 240, to: 50, peak: 0.12, duration: 0.2 })
  }
}

function nenCue({ g, event }: Cue): void {
  const technique = event.technique ?? 'ten'
  const { sound, envelope } = NEN_PRESENTATION[technique]
  const at = startsAt(g)
  const closing = technique === 'zetsu' || technique === 'in'
  rush(g, at, {
    peak: (closing ? 0.025 : 0.04) + sound.noise * 0.06,
    cutoff: closing ? 1400 : Math.max(300, sound.lowHz * 3),
    sweepTo: closing ? 65 : Math.min(1800, sound.highHz * 2),
    duration: Math.min(0.45, envelope.attack + 0.1),
    attack: 0.035,
    release: 0.16,
  })
  if (closing || technique === 'gyo') return
  swept(g, at, {
    type: 'sine',
    from: sound.lowHz,
    to: sound.lowHz * 0.72,
    peak: 0.05 * sound.volume,
    duration: 0.18,
    attack: 0.035,
    release: 0.2,
  })
}

function emperorCue({ g }: Cue): void {
  chainRings()
  heartbeat(g, 1.2)
  const at = startsAt(g)
  for (const ratio of [1, 1.05946, 2])
    swept(g, at, {
      type: 'sine',
      from: 146.83 * ratio,
      to: 293.66 * ratio,
      peak: 0.04 / ratio,
      duration: 0.6,
      attack: 0.08,
      release: 0.5,
    })
  rush(g, at, { peak: 0.09, cutoff: 100, sweepTo: 1600, duration: 0.4, attack: 0.08, release: 0.3 })
}

function projectionCue({ g, event }: Cue): void {
  rush(g, startsAt(g), {
    peak: 0.075,
    cutoff: event.value ? 400 : 2100,
    sweepTo: event.value ? 2100 : 120,
    duration: 0.3,
    attack: 0.06,
    release: 0.13,
  })
}

function effectCue({ g, event }: Cue): void {
  if (event.moveId === 'gong') {
    strikeAGong(event.value)
    return
  }
  // A condition settling on the target, quieter than the technique that cast it.
  const root = event.moveId === 'future' ? 90 : 190
  swept(g, startsAt(g), {
    type: 'sine',
    from: root,
    to: root * 0.65,
    peak: 0.025,
    duration: 0.16,
    release: 0.2,
  })
  rush(g, startsAt(g), { peak: 0.018, cutoff: 1400, sweepTo: 400, duration: 0.1 })
}

function stageCue({ g, mix, state, event }: Cue): void {
  const at = startsAt(g)
  const step = event.value ?? 0
  const profile = mix.profile
  const interval = profile.motif[step % profile.motif.length]
  const hz = Math.max(65, profile.droneHz * 2) * 2 ** (interval / 12)
  const pressure = combatPressure(state)
  // A sparse, authored ostinato sits below the fight; the room supplies its percussion.
  swept(g, at, {
    type: 'sine',
    from: hz,
    peak: 0.018 + pressure * 0.018,
    duration: 0.17,
    attack: 0.03,
    release: 0.7,
  })
  const room = mix.event(event.x, 'ambience', 0)
  if (room) stageAccent(room, mix, step)
}

function stageAccent(g: Graph, mix: FightMix, step: number): void {
  const at = startsAt(g)
  const accent = mix.profile.accent
  const accents: Record<typeof accent, () => void> = {
    hull: () => metallic(g, { root: 75, force: 0.35 }),
    crowd: () =>
      rush(g, at, { peak: 0.027, cutoff: 650, duration: 0.5, attack: 0.2, release: 0.4 }),
    crystal: () => metallic(g, { root: 1400 + (step % 3) * 170, force: 0.2 }),
    chips: () => {
      for (let i = 0; i < 3; i++)
        rush(g, at + i * 0.055, { peak: 0.018, cutoff: 2600, q: 4, duration: 0.008, release: 0.04 })
    },
    sea: () =>
      rush(g, at, {
        peak: 0.027,
        cutoff: 700,
        sweepTo: 230,
        duration: 0.8,
        attack: 0.35,
        release: 0.5,
      }),
    projector: () => {
      for (let i = 0; i < 6; i++)
        rush(g, at + i * 0.042, { peak: 0.012, cutoff: 1700, duration: 0.006, release: 0.015 })
    },
    gavel: () => materialStrike(g, { material: 'wood', force: 0.2, light: true }),
    ritual: () => metallic(g, { root: 130, force: 0.4 }),
    pipes: () => metallic(g, { root: 440, force: 0.2 }),
  }
  accents[accent]()
}
