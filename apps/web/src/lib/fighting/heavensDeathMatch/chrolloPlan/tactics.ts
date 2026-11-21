import type { ChrolloPage } from '../../chrolloBook'
import type { PuppetOrder, Spectator } from '../crowd/types'
import { living } from '../crowd/types'
import { puppetCensus } from '../puppets/census'
import { headsOf } from '../crowd/heads'
import { FULL_SUN_CHARGE, isBomb } from '../puppets/pipeline'
import type { Vec3 } from '../stands/geometry'
import { arenaGraph } from '../stands/navigation'
import { chrolloPhase, inCrowdPhase, type ChrolloPhase } from './phases'
import {
  COMMENTATOR_BOOTH,
  REFEREE_ID,
  distance,
  hisokaSees,
  hisokaBusy,
  hisokaSeesChrollo,
  type DeathMatchWorld,
} from './world'

/** The tactical layer's output: one gesture of the plan, with the pages it needs. */
export type ChrolloIntent =
  | { kind: 'hold' }
  | { kind: 'move'; to: Vec3 }
  | { kind: 'retreat'; to: Vec3 }
  | { kind: 'feint-kicks' }
  | { kind: 'present-abilities' }
  | { kind: 'surprise-strike' }
  | { kind: 'take-microphone' }
  | { kind: 'black-voice'; target: string }
  | { kind: 'copy'; target: string }
  | { kind: 'mark-sun'; target: string }
  | { kind: 'mark-moon'; target: string }
  | { kind: 'stamp'; target: string }
  | { kind: 'convert-hands'; target: string }
  | { kind: 'charge-sun'; targets: string[] }
  | { kind: 'detonate'; target: string }
  /** The body tied to the head Hisoka holds: body and head go off together. */
  | { kind: 'detonate-linked'; target: string }
  | { kind: 'drive-trigger'; target: string }
  | { kind: 'order'; order: PuppetOrder }
  | { kind: 'order-one'; target: string; order: PuppetOrder }
  | { kind: 'throw'; target: string; at: Vec3 }

export const SAFE_DISTANCE = 3.2
export const TOUCH = 0.9
/** Visible puppets the first assault shows; the reserve grows behind Hisoka. */
export const VISIBLE_ARMY = 25
export const RESERVE_ARMY = 125
const FINAL_BOMBS = 12

export const PAGES_FOR: Partial<Record<ChrolloIntent['kind'], readonly ChrolloPage[]>> = {
  'black-voice': ['black-voice'],
  copy: ['gallery-fake', 'sun-and-moon'],
  'mark-sun': ['sun-and-moon'],
  'mark-moon': ['sun-and-moon'],
  stamp: ['order-stamp', 'sun-and-moon'],
  // Gallery Fake stays under the bookmark: changing faces must not end the copies.
  'convert-hands': ['convert-hands', 'gallery-fake'],
  'charge-sun': ['sun-and-moon'],
  detonate: ['sun-and-moon'],
  'detonate-linked': ['sun-and-moon'],
}

type Tactic = (world: DeathMatchWorld) => ChrolloIntent

/** The closest living body Chrollo would pick, in one pass. */
function nearest(
  world: DeathMatchWorld,
  keep: (spectator: Spectator) => boolean,
): Spectator | undefined {
  let best: Spectator | undefined
  let bestDistance = Infinity
  for (const spectator of world.crowd.spectators) {
    if (!living(spectator) || !keep(spectator)) continue
    const gap = distance(spectator.at, world.chrollo.at)
    if (gap < bestDistance) [best, bestDistance] = [spectator, gap]
  }
  return best
}

/** Go and touch someone: move until in reach, then act. */
function reach(
  world: DeathMatchWorld,
  target: Spectator | undefined,
  act: (id: string) => ChrolloIntent,
): ChrolloIntent {
  if (!target) return { kind: 'hold' }
  return distance(target.at, world.chrollo.at) <= TOUCH
    ? act(target.id)
    : { kind: 'move', to: target.at }
}

function crowdAround(world: DeathMatchWorld, at: Vec3): number {
  let count = 0
  for (const spectator of world.crowd.spectators) {
    if (count >= 6) break
    if (living(spectator) && Math.abs(spectator.at.z - at.z) < 2 && distance(spectator.at, at) < 2)
      count += 1
  }
  return count
}

/** A crowded place in the stands, as far from Hisoka as the hall allows. */
export function hidingSpot(world: DeathMatchWorld): Vec3 {
  let best = world.chrollo.at
  let bestScore = -Infinity
  for (const node of arenaGraph().nodes.values()) {
    if (!node.id.startsWith('tier:')) continue
    const crowded = crowdAround(world, node.at)
    const score = distance(node.at, world.hisoka.at) + crowded * 2
    if (score > bestScore) [best, bestScore] = [node.at, score]
  }
  return best
}

const anyHuman = (spectator: Spectator) =>
  spectator.nature === 'human' && spectator.id !== REFEREE_ID
const unseenHuman = (world: DeathMatchWorld) => (spectator: Spectator) =>
  spectator.nature === 'human' && spectator.id !== REFEREE_ID && !hisokaSees(world, spectator.at)

function buildArmy(world: DeathMatchWorld): ChrolloIntent {
  const census = puppetCensus(world.crowd)
  if (census.copies >= VISIBLE_ARMY + RESERVE_ARMY)
    return { kind: 'retreat', to: hidingSpot(world) }
  const unmarked = nearest(
    world,
    (spectator) => spectator.nature === 'copy' && !spectator.marks.sun,
  )
  // Two copies in three receive the Sun while Gallery Fake is still open: they outlive it.
  if (unmarked && census.sunMarked * 3 < census.copies * 2)
    return reach(world, unmarked, (target) => ({ kind: 'mark-sun', target }))
  // The first puppets are shown to Hisoka; the reserve is made where he cannot look.
  const base = census.copies < VISIBLE_ARMY ? anyHuman : unseenHuman(world)
  const copied = new Set(world.crowd.spectators.map((spectator) => spectator.copyOf))
  const source = nearest(world, (spectator) => base(spectator) && !copied.has(spectator.id))
  return reach(world, source, (target) => ({ kind: 'copy', target }))
}

/** The body whose head hangs from Hisoka's gum, if it bears the Sun. */
export function linkedBody(world: DeathMatchWorld): Spectator | undefined {
  const head = headsOf(world.crowd).find((entry) => !entry.spent && entry.tiedTo)
  if (!head) return undefined
  return world.crowd.spectators.find(
    (spectator) => spectator.id === head.bodyId && spectator.marks.sun,
  )
}

function chargeBomb(world: DeathMatchWorld): ChrolloIntent {
  // He knows which body each head belongs to: he charges that one while feigning the hit.
  const linked = linkedBody(world)
  if (linked) {
    if (linked.marks.sunCharge < FULL_SUN_CHARGE)
      return { kind: 'charge-sun', targets: [linked.id] }
    const trigger = world.crowd.spectators.find(
      (spectator) => living(spectator) && spectator.marks.moon && spectator.marks.blackVoice,
    )
    if (trigger)
      return distance(trigger.at, linked.at) <= TOUCH
        ? { kind: 'detonate-linked', target: linked.id }
        : { kind: 'drive-trigger', target: trigger.id }
    const carrier = nearest(
      world,
      (spectator) =>
        spectator.id !== REFEREE_ID &&
        spectator.id !== linked.id &&
        spectator.nature !== 'copy',
    )
    if (!carrier) return { kind: 'hold' }
    if (!carrier.marks.moon)
      return reach(world, carrier, (target) => ({ kind: 'mark-moon', target }))
    return reach(world, carrier, (target) => ({ kind: 'black-voice', target }))
  }
  const marked = world.crowd.spectators.filter(
    (spectator) => living(spectator) && spectator.marks.sun,
  )
  const ready = marked.find(
    (spectator) =>
      spectator.marks.sunCharge >= FULL_SUN_CHARGE &&
      distance(spectator.at, world.hisoka.at) <= 1.2,
  )
  if (ready) return { kind: 'detonate', target: ready.id }
  const charging = marked
    .filter((spectator) => spectator.marks.sunCharge < FULL_SUN_CHARGE)
    .map((spectator) => spectator.id)
  return charging.length ? { kind: 'charge-sun', targets: charging } : buildArmy(world)
}

function broadcast(world: DeathMatchWorld): ChrolloIntent {
  if (!world.chrollo.microphone)
    return distance(world.chrollo.at, COMMENTATOR_BOOTH) <= TOUCH
      ? { kind: 'take-microphone' }
      : { kind: 'move', to: COMMENTATOR_BOOTH }
  const unstamped = nearest(
    world,
    (spectator) => spectator.nature === 'copy' && !spectator.marks.stamped,
  )
  if (unstamped) return reach(world, unstamped, (target) => ({ kind: 'stamp', target }))
  return { kind: 'order', order: 'surround-hisoka' }
}

/** Copies marked and stamped together before the next batch: the stamp closes Gallery Fake. */
export const ASSAULT_BATCH = 20
/** Living puppets the last assault needs before the order to explode is given. */
export const ASSAULT_ARMY = 110

const awayFromHisoka = (world: DeathMatchWorld) => (spectator: Spectator) =>
  distance(spectator.at, world.hisoka.at) > SAFE_DISTANCE + 1

/** A body thrown across the gum lines interrupts what Hisoka anchored. */
function throwAcrossGum(world: DeathMatchWorld): ChrolloIntent | null {
  if (!world.hisoka.gumAnchors.length) return null
  const body = nearest(world, anyHuman)
  return body && distance(body.at, world.chrollo.at) <= TOUCH
    ? { kind: 'throw', target: body.id, at: world.hisoka.at }
    : null
}

/** The next step of the bomb line: Sun, then stamp by batch, then the Moon. */
function arm(world: DeathMatchWorld): ChrolloIntent | null {
  const far = awayFromHisoka(world)
  const copy = (spectator: Spectator) => spectator.nature === 'copy' && far(spectator)
  const sunless = nearest(world, (spectator) => copy(spectator) && !spectator.marks.sun)
  if (sunless) return reach(world, sunless, (target) => ({ kind: 'mark-sun', target }))
  const waiting = world.crowd.spectators.filter(
    (spectator) => living(spectator) && copy(spectator) && !spectator.marks.stamped,
  )
  const total = puppetCensus(world.crowd).copies
  if (waiting.length && (waiting.length >= ASSAULT_BATCH || total >= ASSAULT_ARMY))
    return reach(
      world,
      nearest(world, (spectator) => waiting.includes(spectator)),
      (target) => ({
        kind: 'stamp',
        target,
      }),
    )
  const moonless = nearest(
    world,
    (spectator) => copy(spectator) && spectator.marks.stamped && !spectator.marks.moon,
  )
  return moonless ? reach(world, moonless, (target) => ({ kind: 'mark-moon', target })) : null
}

/** One charged bomb at his feet before the last assault: the blast that takes his leg. */
function legBlast(world: DeathMatchWorld): ChrolloIntent | null {
  if (world.hisoka.wounds.rightLowerLeg) return null
  const bomb = nearestTo(world, world.hisoka.at, isBomb)
  if (!bomb || distance(bomb.at, world.hisoka.at) > 3) return null
  if (distance(bomb.at, world.hisoka.at) > 1.2)
    return bomb.order === 'charge' ? null : { kind: 'order-one', target: bomb.id, order: 'charge' }
  return bomb.marks.sunCharge >= FULL_SUN_CHARGE
    ? { kind: 'detonate', target: bomb.id }
    : { kind: 'charge-sun', targets: [bomb.id] }
}

function nearestTo(
  world: DeathMatchWorld,
  from: Vec3,
  keep: (spectator: Spectator) => boolean,
): Spectator | undefined {
  let best: Spectator | undefined
  let bestDistance = Infinity
  for (const spectator of world.crowd.spectators) {
    if (!keep(spectator)) continue
    const gap = distance(spectator.at, from)
    if (gap < bestDistance) [best, bestDistance] = [spectator, gap]
  }
  return best
}

function encircle(world: DeathMatchWorld): ChrolloIntent {
  const step = throwAcrossGum(world) ?? legBlast(world) ?? arm(world)
  if (step) return step
  const census = puppetCensus(world.crowd)
  if (census.copies >= ASSAULT_ARMY && census.bombs >= FINAL_BOMBS)
    return { kind: 'order', order: 'explode-near-hisoka' }
  const copied = new Set(world.crowd.spectators.map((spectator) => spectator.copyOf))
  const source = nearest(
    world,
    (spectator) => unseenHuman(world)(spectator) && !copied.has(spectator.id),
  )
  return reach(world, source, (target) => ({ kind: 'copy', target }))
}

function detonateReferee(world: DeathMatchWorld): ChrolloIntent {
  const referee = world.crowd.spectators.find((spectator) => spectator.id === REFEREE_ID)
  // Alive or already cut down by Hisoka, the referee goes off until he has.
  if (!referee || referee.cause === 'blast') return { kind: 'retreat', to: hidingSpot(world) }
  if (!referee.marks.sun) return reach(world, referee, (target) => ({ kind: 'mark-sun', target }))
  return { kind: 'detonate', target: REFEREE_ID }
}

/** Puppets keep Hisoka's hands full; Chrollo slips behind him for the blow. */
function harass(world: DeathMatchWorld): ChrolloIntent {
  if (hisokaBusy(world)) {
    const { at, facing } = world.hisoka
    return { kind: 'move', to: { ...at, x: at.x - facing.x, z: at.z - facing.z } }
  }
  const idle = nearest(
    world,
    (spectator) =>
      spectator.nature === 'copy' && spectator.marks.sun && spectator.order !== 'charge',
  )
  if (!idle) return buildArmy(world)
  if (!idle.marks.stamped) return reach(world, idle, (target) => ({ kind: 'stamp', target }))
  return { kind: 'order-one', target: idle.id, order: 'charge' }
}

/** A copy wearing Chrollo's face, stamped and sent at Hisoka: the false Chrollo. */
function decoy(world: DeathMatchWorld): ChrolloIntent {
  const fake = nearest(
    world,
    (spectator) => spectator.nature === 'copy' && spectator.face === 'chrollo',
  )
  if (!fake)
    return reach(
      world,
      nearest(world, (spectator) => spectator.nature === 'copy'),
      (target) => ({ kind: 'convert-hands', target }),
    )
  if (!fake.marks.stamped) return reach(world, fake, (target) => ({ kind: 'stamp', target }))
  return fake.order === 'charge'
    ? buildArmy(world)
    : { kind: 'order-one', target: fake.id, order: 'charge' }
}

const TACTICS: Record<ChrolloPhase, Tactic> = {
  prepare: () => ({ kind: 'hold' }),
  'control-referee': (world) =>
    reach(
      world,
      nearest(world, (spectator) => spectator.id === REFEREE_ID),
      (target) => ({ kind: 'black-voice', target }),
    ),
  feint: () => ({ kind: 'feint-kicks' }),
  present: () => ({ kind: 'present-abilities' }),
  observe: (world) => ({
    kind: 'retreat',
    to: { ...world.chrollo.at, x: world.hisoka.at.x + SAFE_DISTANCE + 1 },
  }),
  'detonate-referee': detonateReferee,
  vanish: (world) => ({ kind: 'retreat', to: hidingSpot(world) }),
  'build-army': buildArmy,
  disguise: (world) =>
    reach(world, nearest(world, unseenHuman(world)), (target) => ({
      kind: 'convert-hands',
      target,
    })),
  harass,
  decoy,
  'charge-bomb': chargeBomb,
  broadcast,
  encircle,
  'close-net': (world) => ({
    kind: 'order',
    order: world.scenario.done.includes('final-explosion')
      ? 'pile-on-hisoka'
      : 'explode-near-hisoka',
  }),
  aftermath: () => ({ kind: 'hold' }),
}

/**
 * The reflexes above every phase: never trade blows head-on, strike only a busy Hisoka
 * from out of his sight, and fall back into the crowd at once.
 */
function reflex(world: DeathMatchWorld, phase: ChrolloPhase): ChrolloIntent | null {
  if (!inCrowdPhase(phase)) return null
  const gap = distance(world.chrollo.at, world.hisoka.at)
  if (world.chrollo.withdrawal > 0 && gap < SAFE_DISTANCE * 2)
    return { kind: 'retreat', to: hidingSpot(world) }
  const opening = hisokaBusy(world) && !hisokaSeesChrollo(world)
  if (opening && gap <= 1.5) return { kind: 'surprise-strike' }
  if (gap < SAFE_DISTANCE && !opening) return { kind: 'retreat', to: hidingSpot(world) }
  return null
}

export interface ChrolloDecision {
  phase: ChrolloPhase
  intent: ChrolloIntent
}

export function decideChrollo(world: DeathMatchWorld): ChrolloDecision {
  const phase = chrolloPhase(world.scenario)
  return { phase, intent: reflex(world, phase) ?? TACTICS[phase](world) }
}
