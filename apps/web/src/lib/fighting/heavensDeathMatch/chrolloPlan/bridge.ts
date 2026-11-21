import { FIGHT_FPS } from '../../fightClock'
import { DEATH_MATCH_BEATS, beatIndex, type DeathMatchBeat } from '../acts'
import { living } from '../crowd/types'
import { puppetCensus, puppetCount } from '../puppets/census'
import { FULL_SUN_CHARGE, isBomb } from '../puppets/pipeline'
import type { Blast } from '../stands/damage'
import type { ChrolloOutcome } from './execute'
import { frontierBeat } from './phases'
import { REFEREE_ID, chrolloHidden, distance, type DeathMatchWorld } from './world'

/** Thresholds at which the world shows a canonical beat; estimates, like the chapter ranges. */
export const ARMY_SHOWN = 20
export const PUPPET_WAVE = 100
export const NET_BOMBS = 10
export const FINAL_BLASTS = 5

type Observer = (world: DeathMatchWorld, frame: FrameFacts) => boolean

export interface FrameFacts {
  outcome: ChrolloOutcome
  blasts: readonly Blast[]
}

const engineDid = (kind: string) => (_: DeathMatchWorld, facts: FrameFacts) =>
  facts.outcome.engineIntent?.kind === kind

const referee = (world: DeathMatchWorld) =>
  world.crowd.spectators.find((spectator) => spectator.id === REFEREE_ID)

/** What the plan can see happen by itself. Hisoka's own beats come from his side, not here. */
const OBSERVERS: readonly [DeathMatchBeat, Observer][] = [
  ['floor-masters-enter', () => true],
  ['death-agreement', (world) => world.crowd.frame >= 2 * FIGHT_FPS],
  ['referee-marked-black-voice', (world) => Boolean(referee(world)?.marks.blackVoice)],
  ['chrollo-feint-kick-flurry', engineDid('feint-kicks')],
  ['abilities-presented', engineDid('present-abilities')],
  ['first-explosion', (world) => referee(world)?.cause === 'blast'],
  [
    'chrollo-vanishes-crowd',
    (world) => world.scenario.done.includes('first-explosion') && chrolloHidden(world),
  ],
  ['gallery-fake-copies', (world) => puppetCensus(world.crowd).copies >= ARMY_SHOWN],
  ['convert-hands-disguise', (world) => world.chrollo.disguisedAs !== null],
  ['surprise-strike', engineDid('surprise-strike')],
  [
    'fake-chrollo-decoy',
    (world) =>
      world.crowd.spectators.some(
        (spectator) =>
          spectator.face === 'chrollo' &&
          spectator.nature === 'copy' &&
          spectator.order === 'charge',
      ),
  ],
  [
    'max-charge-during-feint',
    (world) =>
      world.crowd.spectators.some(
        (spectator) => living(spectator) && spectator.marks.sunCharge >= FULL_SUN_CHARGE,
      ),
  ],
  ['microphone-taken', (world) => world.chrollo.microphone],
  [
    'collective-order',
    (world) =>
      world.chrollo.microphone &&
      world.crowd.spectators.some((spectator) => spectator.order === 'surround-hisoka'),
  ],
  ['puppet-wave', (world) => puppetCount(puppetCensus(world.crowd)) >= PUPPET_WAVE],
  [
    'net-closes',
    (world) =>
      world.crowd.spectators.filter(
        (spectator) => isBomb(spectator) && distance(spectator.at, world.hisoka.at) <= 3,
      ).length >= NET_BOMBS,
  ],
  ['final-explosion', (_, facts) => facts.blasts.length >= FINAL_BLASTS],
]

/**
 * The furthest beat the hall may show now: the frontier, past any beat only Hisoka can
 * play, up to the next one Chrollo or the arena plays. The plan never runs ahead of itself.
 */
export function observationHorizon(world: DeathMatchWorld): number {
  const frontier = frontierBeat(world.scenario)
  if (!frontier) return -1
  let index = beatIndex(frontier)
  while (DEATH_MATCH_BEATS[index]?.actor === 'hisoka') index += 1
  return index
}

/** Beats the world shows this frame; the scenario still decides whether each is accepted. */
export function observedBeats(world: DeathMatchWorld, facts: FrameFacts): DeathMatchBeat[] {
  const horizon = observationHorizon(world)
  return OBSERVERS.filter(
    ([beat, seen]) =>
      beatIndex(beat) <= horizon && !world.scenario.done.includes(beat) && seen(world, facts),
  ).map(([beat]) => beat)
}
