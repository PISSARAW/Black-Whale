import { FIGHT_FPS } from '../../fightClock'
import { DEATH_MATCH_BEATS, beatIndex, type DeathMatchBeat } from '../acts'
import { puppetCensus, puppetCount } from '../puppets/census'
import { FULL_SUN_CHARGE, isBomb } from '../puppets/pipeline'
import type { Blast } from '../stands/damage'
import type { ChrolloOutcome } from './execute'
import type { ChrolloDecision } from './tactics'
import { linkedBody } from './tactics'
import type { HisokaIntent } from '../hisokaPlan/tactics'
import { headsOf } from '../crowd/heads'
import { BURIED } from '../wounds'
import { BALCONY } from '../stands/geometry'
import { RESCUE_DELAY_FRAMES } from '../verdict'
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
  /** Hisoka's composite move this frame, when his plan plays him. */
  hisoka: HisokaIntent | null
  chrolloHit: boolean
  decision: ChrolloDecision
}

const engineDid = (kind: string) => (_: DeathMatchWorld, facts: FrameFacts) =>
  facts.outcome.engineIntent?.kind === kind

const hisokaDid = (kind: string) => (_: DeathMatchWorld, facts: FrameFacts) =>
  facts.hisoka?.kind === kind

const falseChrolloDead = (world: DeathMatchWorld) =>
  world.crowd.spectators.some(
    (spectator) =>
      spectator.face === 'chrollo' && spectator.nature === 'copy' && spectator.posture === 'dead',
  )

/** Chrollo charges the very body whose head hangs from Hisoka's gum. */
function trackedLink(world: DeathMatchWorld, facts: FrameFacts): boolean {
  const intent = facts.decision.intent
  const linked = linkedBody(world)
  return Boolean(linked) && intent.kind === 'charge-sun' && intent.targets.includes(linked!.id)
}

const referee = (world: DeathMatchWorld) =>
  world.crowd.spectators.find((spectator) => spectator.id === REFEREE_ID)

/** What the plan can see happen by itself. Hisoka's own beats come from his side, not here. */
const OBSERVERS: readonly [DeathMatchBeat, Observer][] = [
  ['floor-masters-enter', () => true],
  ['death-agreement', (world) => world.crowd.frame >= 2 * FIGHT_FPS],
  ['referee-marked-black-voice', (world) => Boolean(referee(world)?.marks.blackVoice)],
  ['chrollo-feint-kick-flurry', engineDid('feint-kicks')],
  ['abilities-presented', engineDid('present-abilities')],
  ['hisoka-gum-to-referee', (world) => world.hisoka.gumAnchors.includes(REFEREE_ID)],
  ['referee-throat-cut', (world) => referee(world)?.posture === 'dead'],
  ['first-explosion', (world) => referee(world)?.cause === 'blast'],
  ['hisoka-retreats-ceiling', (world) => world.hisoka.at.y > 8],
  [
    'chrollo-vanishes-crowd',
    (world) => world.scenario.done.includes('first-explosion') && chrolloHidden(world),
  ],
  ['gallery-fake-copies', (world) => puppetCensus(world.crowd).copies >= ARMY_SHOWN],
  ['convert-hands-disguise', (world) => world.chrollo.disguisedAs !== null],
  ['surprise-strike', engineDid('surprise-strike')],
  ['puppets-decapitated', (world) => headsOf(world.crowd).length > 0],
  ['head-hammer', hisokaDid('swing')],
  ['double-head-counter', (_, facts) => facts.chrolloHit],
  ['amputated-hostage', (world) => world.hisoka.hostage !== null],
  ['crowd-launched', hisokaDid('launch-crowd')],
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
  ['fake-chrollo-crushed', falseChrolloDead],
  ['true-face-revealed', falseChrolloDead],
  ['head-body-link-tracked', trackedLink],
  [
    'max-charge-during-feint',
    (world) =>
      world.crowd.spectators.some(
        (spectator) => spectator.marks.sun && spectator.marks.sunCharge >= FULL_SUN_CHARGE,
      ),
  ],
  ['hand-destroyed', (world) => world.hisoka.wounds.leftFingers >= 4],
  ['microphone-taken', (world) => world.chrollo.microphone],
  [
    'collective-order',
    (world) =>
      world.chrollo.microphone &&
      world.crowd.spectators.some((spectator) => spectator.order === 'surround-hisoka'),
  ],
  ['five-body-hammer', (world) => world.hisoka.hammer.length >= 5],
  ['hammer-breaks', (world) => world.hisoka.hammerSwung && world.hisoka.hammer.length === 0],
  ['upper-level-escape', (world) => world.hisoka.at.y >= BALCONY.y - 0.2],
  ['leg-destroyed', (world) => world.hisoka.wounds.rightLowerLeg],
  ['reattach-attempt', (world) => world.hisoka.reattached],
  ['puppet-wave', (world) => puppetCount(puppetCensus(world.crowd)) >= PUPPET_WAVE],
  [
    'net-closes',
    (world) =>
      world.crowd.spectators.filter(
        (spectator) => isBomb(spectator) && distance(spectator.at, world.hisoka.at) <= 3,
      ).length >= NET_BOMBS,
  ],
  ['final-explosion', (_, facts) => facts.blasts.length >= FINAL_BLASTS],
  ['hisoka-buried', (world) => world.hisoka.wounds.compression >= BURIED],
  ['hisoka-asphyxiated', (world) => world.hisoka.wounds.cause === 'asphyxia'],
  ['chrollo-declared-winner', (world) => world.hisoka.wounds.cause === 'asphyxia'],
  [
    'rescue-arrives',
    (world) => (world.hisoka.wounds.deadFor ?? -1) >= RESCUE_DELAY_FRAMES,
  ],
  ['troupe-gathers', (world) => world.scenario.done.includes('rescue-arrives')],
  [
    'resuscitation',
    (world) =>
      world.scenario.done.includes('troupe-gathers') && world.hisoka.wounds.cause === null,
  ],
  ['prosthetics-formed', (world) => world.hisoka.prosthetics],
  ['machi-bound', (world) => world.hisoka.machiBound],
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
