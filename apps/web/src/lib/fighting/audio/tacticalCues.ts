import type { Graph } from '$lib/audio/ambient/mixer'
import { rush, startsAt, swept } from '$lib/audio/hatsu/synth'
import type { FightImpact } from '../types'
import { playFightHatsu } from './hatsu'
import type { FightSoundEvent } from './events'
import type { TacticalSoundKind } from './tacticalEvents'
import { materialStrike } from './voices'

type Cue = (graph: Graph, event: FightSoundEvent) => void

function notes(graph: Graph, pitches: readonly number[], peak = 0.09) {
  pitches.forEach((from, index) =>
    swept(graph, startsAt(graph) + index * 0.052, {
      type: 'triangle',
      from,
      peak,
      duration: 0.047,
      attack: 0.002,
      release: 0.065,
    }),
  )
}

function scrape(graph: Graph, from: number, to: number) {
  rush(graph, startsAt(graph), {
    peak: 0.14,
    cutoff: from,
    sweepTo: to,
    duration: 0.13,
    attack: 0.004,
    release: 0.055,
  })
}

export const TACTICAL_CUES: Record<TacticalSoundKind, Cue> = {
  burst: (g) => {
    scrape(g, 280, 3100)
    notes(g, [156, 468, 936], 0.12)
  },
  'ko-clash': (g) => {
    materialStrike(g, { material: 'steel', force: 1.2 })
    notes(g, [260, 271, 131], 0.14)
  },
  breach: (g) => {
    materialStrike(g, { material: 'steel', force: 1.5 })
    scrape(g, 1700, 100)
  },
  'assist-entry': (g) => notes(g, [475, 670]),
  'assist-action': (g, event) => {
    notes(g, [665])
    playFightHatsu(g, event)
  },
  'assist-exit': (g) => scrape(g, 980, 250),
  'assist-interrupted': (g) => notes(g, [590, 165]),
  'assist-ready': (g) => notes(g, [440, 660, 990], 0.052),
  'nen-low': (g) => notes(g, [240, 242], 0.06),
  'nen-empty': (g) => notes(g, [240, 120], 0.075),
  'hatsu-ready': (g) => notes(g, [390, 580], 0.052),
  'charge-ready': (g) => notes(g, [520, 780, 1040], 0.055),
  refused: (g) => notes(g, [160, 160], 0.052),
  'health-low': (g) => notes(g, [125, 125, 125], 0.055),
}

export function tacticalImpact(g: Graph, impact: FightImpact) {
  if (impact.counterHit) notes(g, [720], 0.115)
  if (impact.punish) notes(g, [510, 300], 0.1)
  if (impact.antiAir) notes(g, [460, 920], 0.075)
  if (impact.wallSplat) {
    materialStrike(g, { material: 'steel', force: 0.95 })
    scrape(g, 1100, 260)
  }
}
