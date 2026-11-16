import { scalePose, type FightPose } from './fightPose'
import {
  AIR_PUNCH,
  AIR_SLASH,
  BACK_WHIP,
  CHARGE,
  CROSS,
  DIVE_KICK,
  DOUBLE_PALM,
  FRONT_KICK,
  HIGH_KICK,
  HOOK,
  JAB,
  LOW_JAB,
  LOW_KICK,
  OVERHEAD,
  PALM_PUSH,
  SLASH,
  SPIN_KICK,
  strikeTimeline,
  SWEEP,
  THRUST,
  UPPERCUT,
  type Gesture,
} from './fightGestures'
import type { MoveTimeline } from './keyPoseTimeline'
import type { FighterId, MoveSlot } from './types'

/**
 * Every move of every fighter, drawn from the gesture library until it gets
 * its own keys (`keyPosesKurapika.ts`, `keyPosesHisoka.ts`).
 *
 * A fighter fights in one of five families, each mapping the fifteen move
 * slots to gestures: a striker throws hands, a kicker leads with the legs, a
 * blade cuts in arcs, a caster pushes Nen out with open palms, a brute swings
 * wide and heavy. The family is a reading of how the manga shows them fight,
 * not a rule of the game: it changes no frame, box or damage.
 */
export type FightFamily = 'striker' | 'kicker' | 'blade' | 'caster' | 'brute'

const FAMILIES: Partial<Record<FighterId, FightFamily>> = {
  chrollo: 'blade',
  feitan: 'blade',
  machi: 'blade',
  hanzo: 'blade',
  shizuku: 'blade',
  gel: 'blade',
  bonolenov: 'kicker',
  zakuro: 'kicker',
  franklin: 'caster',
  illumi: 'caster',
  kalluto: 'caster',
  theta: 'caster',
  melody: 'caster',
  basho: 'caster',
  halkenburg: 'caster',
  camilla: 'caster',
  benjamin: 'brute',
  phinks: 'brute',
  biscuit: 'brute',
  beyond: 'brute',
  hinrigh: 'brute',
}

export function fightFamily(id: FighterId): FightFamily {
  return FAMILIES[id] ?? 'striker'
}

type SlotGestures = Record<Exclude<MoveSlot, 'throw' | 'finisher'>, Gesture>

const STRIKER: SlotGestures = {
  standingLight: JAB,
  standingHeavy: UPPERCUT,
  lowLight: LOW_JAB,
  lowHeavy: SWEEP,
  airLight: AIR_PUNCH,
  airHeavy: DIVE_KICK,
  forwardLight: CROSS,
  forwardHeavy: HOOK,
  backHeavy: BACK_WHIP,
  neutralSpecial: PALM_PUSH,
  forwardSpecial: CHARGE,
  downSpecial: OVERHEAD,
  backSpecial: SPIN_KICK,
}

const GESTURES: Record<FightFamily, SlotGestures> = {
  striker: STRIKER,
  kicker: {
    ...STRIKER,
    standingHeavy: HIGH_KICK,
    lowLight: LOW_KICK,
    forwardLight: FRONT_KICK,
    forwardHeavy: SPIN_KICK,
    neutralSpecial: HIGH_KICK,
  },
  blade: {
    ...STRIKER,
    standingLight: SLASH,
    standingHeavy: OVERHEAD,
    airLight: AIR_SLASH,
    forwardLight: THRUST,
    forwardHeavy: SLASH,
    neutralSpecial: SLASH,
    forwardSpecial: THRUST,
  },
  caster: {
    ...STRIKER,
    neutralSpecial: DOUBLE_PALM,
    forwardSpecial: PALM_PUSH,
    downSpecial: DOUBLE_PALM,
    backSpecial: PALM_PUSH,
  },
  brute: {
    ...STRIKER,
    standingHeavy: OVERHEAD,
    forwardLight: HOOK,
    forwardHeavy: CHARGE,
    neutralSpecial: DOUBLE_PALM,
  },
}

/** How far a family swings: a brute overcommits, a caster barely moves its feet. */
const AMPLITUDE: Record<FightFamily, number> = {
  striker: 1,
  kicker: 1,
  blade: 1,
  caster: 0.9,
  brute: 1.15,
}

/** Reach, grab on the active frames, turn the hips and throw. */
const REACH: FightPose = {
  root: [0, 0, 0.08],
  body: [0.15, 0, 0],
  leadShoulder: [-0.8, 0, -0.1],
  rearShoulder: [-0.9, 0, 0.1],
  leadElbow: [1.2, 0, 0],
  rearElbow: [1.4, 0, 0],
}

const TOSS: FightPose = {
  body: [-0.1, 0, 0.1],
  chest: [0, 0.9, 0],
  leadShoulder: [-0.5, 0, 0.4],
  rearShoulder: [-1.3, 0, 0],
  leadElbow: [0.8, 0, 0],
  rearElbow: [1.2, 0, 0],
  rearKnee: [0.3, 0, 0],
}

function throwTimeline(amount: number): MoveTimeline {
  return [
    { phase: 'startup', at: 0.5, ease: 'out', pose: scalePose({ chest: [0, -0.2, 0] }, amount) },
    { phase: 'active', at: 0, ease: 'snap', pose: scalePose(REACH, amount) },
    { phase: 'recovery', at: 0.15, ease: 'out', pose: scalePose(REACH, amount) },
    { phase: 'recovery', at: 0.45, ease: 'snap', pose: scalePose(TOSS, amount) },
    { phase: 'recovery', at: 0.7, ease: 'out', pose: scalePose({ chest: [0, 0.4, 0] }, amount) },
  ]
}

/** A finisher lands three blows on its active window: lead, rear, then rising. */
function finisherTimeline(family: FightFamily, amount: number): MoveTimeline {
  const [first, second, last] =
    family === 'kicker'
      ? [FRONT_KICK, SPIN_KICK, HIGH_KICK]
      : family === 'blade'
        ? [SLASH, THRUST, OVERHEAD]
        : [JAB, CROSS, UPPERCUT]
  const pose = (made: FightPose) => scalePose(made, amount * 1.1)
  return [
    { phase: 'startup', at: 0.6, ease: 'out', pose: pose(first.windup) },
    { phase: 'active', at: 0, ease: 'snap', pose: pose(first.contact) },
    { phase: 'active', at: 0.33, ease: 'snap', pose: pose(second.contact) },
    { phase: 'active', at: 0.66, ease: 'out', pose: pose(last.windup) },
    { phase: 'active', at: 0.8, ease: 'snap', pose: pose(last.contact) },
    { phase: 'recovery', at: 0.4, ease: 'out', pose: pose(last.follow ?? last.contact) },
  ]
}

const CACHE = new Map<string, MoveTimeline>()

export function archetypeTimeline(id: FighterId, slot: MoveSlot): MoveTimeline {
  const family = fightFamily(id)
  const key = `${family}:${slot}`
  const held = CACHE.get(key)
  if (held) return held
  const amount = AMPLITUDE[family]
  const made =
    slot === 'throw'
      ? throwTimeline(amount)
      : slot === 'finisher'
        ? finisherTimeline(family, amount)
        : strikeTimeline(GESTURES[family][slot], amount)
  CACHE.set(key, made)
  return made
}
