import { DEATH_MATCH_BEATS, beatIndex, type DeathMatchBeat } from '../acts'
import type { DeathMatchState } from '../scenario'

/** The strategic layer: what the whole plan is doing now, read from the next canonical beat. */
export type ChrolloPhase =
  | 'prepare'
  | 'control-referee'
  | 'feint'
  | 'present'
  | 'observe'
  | 'detonate-referee'
  | 'vanish'
  | 'build-army'
  | 'disguise'
  | 'harass'
  | 'decoy'
  | 'charge-bomb'
  | 'broadcast'
  | 'encircle'
  | 'close-net'
  | 'aftermath'

const PHASE_OF: Partial<Record<DeathMatchBeat, ChrolloPhase>> = {
  'floor-masters-enter': 'prepare',
  'death-agreement': 'prepare',
  'referee-marked-black-voice': 'control-referee',
  'chrollo-feint-kick-flurry': 'feint',
  'abilities-presented': 'present',
  'first-explosion': 'detonate-referee',
  'chrollo-vanishes-crowd': 'vanish',
  'gallery-fake-copies': 'build-army',
  'convert-hands-disguise': 'disguise',
  'surprise-strike': 'harass',
  'fake-chrollo-decoy': 'decoy',
  'head-body-link-tracked': 'charge-bomb',
  'max-charge-during-feint': 'charge-bomb',
  'hand-destroyed': 'charge-bomb',
  'microphone-taken': 'broadcast',
  'collective-order': 'broadcast',
  'leg-destroyed': 'encircle',
  'puppet-wave': 'encircle',
  'net-closes': 'close-net',
  'final-explosion': 'close-net',
  'hisoka-buried': 'close-net',
  'hisoka-asphyxiated': 'close-net',
  'chrollo-declared-winner': 'aftermath',
  'rescue-arrives': 'aftermath',
  'troupe-gathers': 'aftermath',
  resuscitation: 'aftermath',
  'prosthetics-formed': 'aftermath',
  'machi-bound': 'aftermath',
}

/** Beats Hisoka drives: Chrollo keeps building in the background instead of waiting. */
const BACKGROUND: Partial<Record<DeathMatchBeat, ChrolloPhase>> = {
  // The driven referee goes at Hisoka; Chrollo follows it with the Sun.
  'hisoka-gum-to-referee': 'detonate-referee',
  'referee-throat-cut': 'detonate-referee',
  'hisoka-retreats-ceiling': 'vanish',
  'puppets-decapitated': 'harass',
  'head-hammer': 'harass',
  'double-head-counter': 'harass',
  'amputated-hostage': 'build-army',
  'crowd-launched': 'decoy',
  'fake-chrollo-crushed': 'decoy',
  'true-face-revealed': 'charge-bomb',
  'five-body-hammer': 'encircle',
  'hammer-breaks': 'encircle',
  'upper-level-escape': 'encircle',
  'reattach-attempt': 'encircle',
}

/**
 * The first beat after the furthest one reached. In the scripted mode it is the next
 * canonical beat; in the other modes a beat left behind no longer holds the plan back.
 */
export function frontierBeat(scenario: DeathMatchState): DeathMatchBeat | null {
  const settled = [...scenario.done, ...scenario.divergences]
  const furthest = settled.reduce((max, beat) => Math.max(max, beatIndex(beat)), -1)
  return DEATH_MATCH_BEATS[furthest + 1]?.id ?? null
}

export function chrolloPhase(scenario: DeathMatchState): ChrolloPhase {
  const beat = frontierBeat(scenario)
  if (!beat) return 'aftermath'
  return PHASE_OF[beat] ?? BACKGROUND[beat] ?? 'aftermath'
}

/** Phases from which Chrollo has left the ring for the stands for good. */
export function inCrowdPhase(phase: ChrolloPhase): boolean {
  return ![
    'prepare',
    'control-referee',
    'feint',
    'present',
    'observe',
    'detonate-referee',
  ].includes(phase)
}
