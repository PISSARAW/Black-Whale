import type { DeathMatchBeat } from '../acts'
import { frontierBeat } from '../chrolloPlan/phases'
import type { DeathMatchState } from '../scenario'

/** What Hisoka is doing in the canonical fight, read from the scenario frontier. */
export type HisokaPhase =
  | 'prepare'
  | 'duel'
  | 'gum-referee'
  | 'cut-referee'
  | 'ceiling'
  | 'search'
  | 'decapitate'
  | 'head-hammer'
  | 'double-head'
  | 'hostage'
  | 'launch-crowd'
  | 'trap-fake'
  | 'five-body-hammer'
  | 'upper-level'
  | 'reattach'
  | 'last-stand'
  | 'down'
  | 'resuscitate'
  | 'prosthetics'
  | 'bind-machi'

const PHASE_OF: Partial<Record<DeathMatchBeat, HisokaPhase>> = {
  'floor-masters-enter': 'prepare',
  'death-agreement': 'prepare',
  'referee-marked-black-voice': 'duel',
  'chrollo-feint-kick-flurry': 'duel',
  'abilities-presented': 'duel',
  'hisoka-gum-to-referee': 'gum-referee',
  'referee-throat-cut': 'cut-referee',
  'first-explosion': 'duel',
  'hisoka-retreats-ceiling': 'ceiling',
  'puppets-decapitated': 'decapitate',
  'head-hammer': 'head-hammer',
  'double-head-counter': 'double-head',
  'amputated-hostage': 'hostage',
  'crowd-launched': 'launch-crowd',
  'fake-chrollo-crushed': 'trap-fake',
  'true-face-revealed': 'trap-fake',
  'head-body-link-tracked': 'head-hammer',
  'max-charge-during-feint': 'head-hammer',
  'hand-destroyed': 'head-hammer',
  'five-body-hammer': 'five-body-hammer',
  'hammer-breaks': 'five-body-hammer',
  'leg-destroyed': 'five-body-hammer',
  'upper-level-escape': 'upper-level',
  'reattach-attempt': 'reattach',
  'puppet-wave': 'last-stand',
  'net-closes': 'last-stand',
  'final-explosion': 'last-stand',
  'hisoka-buried': 'down',
  'hisoka-asphyxiated': 'down',
  'chrollo-declared-winner': 'down',
  'rescue-arrives': 'down',
  'troupe-gathers': 'down',
  resuscitation: 'resuscitate',
  'prosthetics-formed': 'prosthetics',
  'machi-bound': 'bind-machi',
}

export function hisokaPhase(scenario: DeathMatchState): HisokaPhase {
  const beat = frontierBeat(scenario)
  if (!beat) return 'down'
  return PHASE_OF[beat] ?? (scenario.survival.hisoka === 'fighting' ? 'search' : 'down')
}
