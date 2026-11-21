import { TRUSS } from '../../heavensArenaLayout'
import { headsOf } from '../crowd/heads'
import { living, type DetachedHead, type HisokaLimb, type Spectator } from '../crowd/types'
import { BALCONY, type Vec3 } from '../stands/geometry'
import { REFEREE_ID, distance, hisokaSeesChrollo, type DeathMatchWorld } from '../chrolloPlan/world'
import { hisokaPhase, type HisokaPhase } from './phases'

/** One composite move of Hisoka's, executed on the hall by `executeHisoka`. */
export type HisokaIntent =
  | { kind: 'hold' }
  | { kind: 'move'; to: Vec3 }
  | { kind: 'scan' }
  | { kind: 'gum'; target: string }
  | { kind: 'cut'; target: string }
  | { kind: 'decapitate'; target: string }
  | { kind: 'tie-head'; head: string; limb: HisokaLimb }
  | { kind: 'launch-head'; head: string; at: Vec3 }
  | { kind: 'swing'; target: string }
  | { kind: 'hostage'; target: string }
  | { kind: 'launch-crowd'; targets: string[] }
  | { kind: 'crush'; target: string }
  | { kind: 'hammer-gather'; target: string }
  | { kind: 'hammer-swing'; target: string }
  | { kind: 'reattach' }
  | { kind: 'program-resuscitation' }
  | { kind: 'resuscitate' }
  | { kind: 'form-prosthetics' }
  | { kind: 'bind-machi' }

export const REACH = 1.3
/** Frames between two swings of a head or of the hammer. */
export const SWING_EVERY = 20
const CROWD_LAUNCH = 5

type Tactic = (world: DeathMatchWorld) => HisokaIntent

function nearestTo(
  world: DeathMatchWorld,
  keep: (spectator: Spectator) => boolean,
): Spectator | undefined {
  let best: Spectator | undefined
  let bestDistance = Infinity
  for (const spectator of world.crowd.spectators) {
    if (!keep(spectator)) continue
    const gap = distance(spectator.at, world.hisoka.at)
    if (gap < bestDistance) [best, bestDistance] = [spectator, gap]
  }
  return best
}

const attacking = (spectator: Spectator) => living(spectator) && Boolean(spectator.order)
const swingReady = (world: DeathMatchWorld) =>
  world.crowd.frame - world.hisoka.lastSwing >= SWING_EVERY
const inReach = (world: DeathMatchWorld, body?: Spectator): body is Spectator =>
  Boolean(body) && distance(body!.at, world.hisoka.at) <= REACH

/** Any puppet on him loses its head first: the reflex under every phase. */
function cutAttacker(world: DeathMatchWorld): HisokaIntent | null {
  const puppet = nearestTo(world, (spectator) => attacking(spectator) && !spectator.headless)
  return inReach(world, puppet) ? { kind: 'decapitate', target: puppet.id } : null
}

function reachThen(world: DeathMatchWorld, body: Spectator | undefined, act: HisokaIntent) {
  if (!body) return { kind: 'scan' } as const
  return distance(body.at, world.hisoka.at) <= REACH ? act : { kind: 'move', to: body.at }
}

const referee = (world: DeathMatchWorld) =>
  world.crowd.spectators.find((spectator) => spectator.id === REFEREE_ID)

function looseHead(world: DeathMatchWorld): DetachedHead | undefined {
  return headsOf(world.crowd).find(
    (head) => !head.spent && !head.tiedTo && distance(head.at, world.hisoka.at) < 2.5,
  )
}
const tiedHead = (world: DeathMatchWorld, limb: HisokaLimb) =>
  headsOf(world.crowd).find((head) => !head.spent && head.tiedTo === limb)

function headHammer(world: DeathMatchWorld): HisokaIntent {
  const held = tiedHead(world, 'left-hand')
  if (!held) {
    const head = looseHead(world)
    return head
      ? { kind: 'tie-head', head: head.id, limb: 'left-hand' }
      : (cutAttacker(world) ?? { kind: 'scan' })
  }
  const puppet = nearestTo(world, attacking)
  if (puppet && distance(puppet.at, world.hisoka.at) < 1.8 && swingReady(world))
    return { kind: 'swing', target: puppet.id }
  return cutAttacker(world) ?? { kind: 'scan' }
}

/** Two heads on two limbs: the first is dodged, the second finds Chrollo. */
function doubleHead(world: DeathMatchWorld): HisokaIntent {
  const hand = tiedHead(world, 'left-hand')
  const foot = tiedHead(world, 'left-foot')
  const head = looseHead(world)
  if (!hand && head) return { kind: 'tie-head', head: head.id, limb: 'left-hand' }
  if (!foot && head) return { kind: 'tie-head', head: head.id, limb: 'left-foot' }
  if (!foot) return cutAttacker(world) ?? { kind: 'scan' }
  if (!swingReady(world)) return { kind: 'scan' }
  // The head tied to the hand makes Chrollo dodge; the second, tied to the leg, lands.
  return hand
    ? {
        kind: 'launch-head',
        head: hand.id,
        at: { ...world.chrollo.at, x: world.chrollo.at.x + 2 },
      }
    : { kind: 'launch-head', head: foot.id, at: world.chrollo.at }
}

function launchCrowd(world: DeathMatchWorld): HisokaIntent {
  const anchored = world.hisoka.gumAnchors.filter((id) =>
    world.crowd.spectators.some((spectator) => spectator.id === id && living(spectator)),
  )
  if (anchored.length >= CROWD_LAUNCH) return { kind: 'launch-crowd', targets: anchored }
  const body = nearestTo(
    world,
    (spectator) => living(spectator) && !spectator.gum && spectator.id !== REFEREE_ID,
  )
  return body && distance(body.at, world.hisoka.at) < 4
    ? { kind: 'gum', target: body.id }
    : { kind: 'scan' }
}

function trapFake(world: DeathMatchWorld): HisokaIntent {
  const fake = nearestTo(
    world,
    (spectator) => living(spectator) && spectator.face === 'chrollo' && spectator.nature === 'copy',
  )
  if (!fake) return cutAttacker(world) ?? { kind: 'scan' }
  if (fake.gum) return { kind: 'crush', target: fake.id }
  if (!fake.gum && distance(fake.at, world.hisoka.at) < 8) return { kind: 'gum', target: fake.id }
  return { kind: 'scan' }
}

function fiveBodyHammer(world: DeathMatchWorld): HisokaIntent {
  const { hammer } = world.hisoka
  if (hammer.length < 5 && !world.hisoka.hammerSwung) {
    const body = nearestTo(
      world,
      (spectator) =>
        spectator.posture !== 'vanished' &&
        spectator.posture !== 'evacuated' &&
        !hammer.includes(spectator.id) &&
        spectator.id !== REFEREE_ID,
    )
    return body && distance(body.at, world.hisoka.at) < 4
      ? { kind: 'hammer-gather', target: body.id }
      : { kind: 'scan' }
  }
  const puppet = nearestTo(world, attacking)
  if (hammer.length && puppet && distance(puppet.at, world.hisoka.at) < 2.8 && swingReady(world))
    return { kind: 'hammer-swing', target: puppet.id }
  return cutAttacker(world) ?? { kind: 'scan' }
}

const TACTICS: Record<HisokaPhase, Tactic> = {
  prepare: () => ({ kind: 'hold' }),
  duel: () => ({ kind: 'hold' }),
  'gum-referee': (world) => reachThen(world, referee(world), { kind: 'gum', target: REFEREE_ID }),
  'cut-referee': (world) => reachThen(world, referee(world), { kind: 'cut', target: REFEREE_ID }),
  ceiling: () => ({ kind: 'move', to: { x: 0, y: TRUSS.y - 1.8, z: TRUSS.z } }),
  search: (world) => cutAttacker(world) ?? { kind: 'scan' },
  decapitate: (world) => cutAttacker(world) ?? { kind: 'scan' },
  'head-hammer': headHammer,
  'double-head': doubleHead,
  hostage: (world) => {
    const puppet = nearestTo(
      world,
      (spectator) => attacking(spectator) && spectator.nature === 'copy',
    )
    return inReach(world, puppet) ? { kind: 'hostage', target: puppet.id } : { kind: 'scan' }
  },
  'launch-crowd': launchCrowd,
  'trap-fake': trapFake,
  'five-body-hammer': fiveBodyHammer,
  'upper-level': () => ({
    kind: 'move',
    to: { x: 0, y: BALCONY.y, z: (BALCONY.zFront + BALCONY.zBack) / 2 },
  }),
  reattach: (world) =>
    world.hisoka.wounds.rightLowerLeg && !world.hisoka.reattached
      ? { kind: 'reattach' }
      : { kind: 'scan' },
  'last-stand': (world) =>
    world.hisoka.resuscitationProgrammed
      ? (cutAttacker(world) ?? { kind: 'move', to: { x: 0, y: 0, z: 0 } })
      : { kind: 'program-resuscitation' },
  down: () => ({ kind: 'hold' }),
  resuscitate: (world) =>
    world.hisoka.resuscitationProgrammed ? { kind: 'resuscitate' } : { kind: 'hold' },
  prosthetics: (world) =>
    world.hisoka.prosthetics ? { kind: 'hold' } : { kind: 'form-prosthetics' },
  'bind-machi': (world) => (world.hisoka.machiBound ? { kind: 'hold' } : { kind: 'bind-machi' }),
}

export interface HisokaDecision {
  phase: HisokaPhase
  intent: HisokaIntent
}

export function decideHisoka(world: DeathMatchWorld): HisokaDecision {
  const phase = hisokaPhase(world.scenario)
  if (world.hisoka.wounds.cause && phase !== 'resuscitate')
    return { phase, intent: { kind: 'hold' } }
  return { phase, intent: TACTICS[phase](world) }
}

/** When Chrollo shows himself, Hisoka looks at him; otherwise his gaze sweeps the stands. */
export function hisokaGaze(world: DeathMatchWorld): { x: number; z: number } {
  if (hisokaSeesChrollo(world) || world.chrollo.withdrawal > 0) {
    const dx = world.chrollo.at.x - world.hisoka.at.x
    const dz = world.chrollo.at.z - world.hisoka.at.z
    const length = Math.hypot(dx, dz) || 1
    return { x: dx / length, z: dz / length }
  }
  const angle = Math.atan2(world.hisoka.facing.z, world.hisoka.facing.x) + 0.02
  return { x: Math.cos(angle), z: Math.sin(angle) }
}
