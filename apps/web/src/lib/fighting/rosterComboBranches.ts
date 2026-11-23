import type { ComboOpening } from './comboOpenings'
import type { RosterFighterId } from './rosterChoreography'
import type { FighterId, MoveSlot } from './types'

type RosterOpening = Exclude<ComboOpening, 'whiff-punish'>

type PhysicalFollowup = 'standingHeavy' | 'forwardHeavy' | 'backHeavy' | 'lowHeavy' | 'forwardLight'
type PhysicalBranch = {
  slot: PhysicalFollowup
  reward: 'advance' | 'sweep' | 'quick' | 'heavy'
  advance: true
}

const REWARDS: Record<PhysicalFollowup, PhysicalBranch['reward']> = {
  standingHeavy: 'advance',
  forwardHeavy: 'heavy',
  backHeavy: 'heavy',
  lowHeavy: 'sweep',
  forwardLight: 'quick',
}

function physical(slot: PhysicalFollowup): PhysicalBranch {
  return { slot, reward: REWARDS[slot], advance: true }
}

function routes(
  tip: PhysicalFollowup,
  antiAir: PhysicalFollowup,
  corner: PhysicalFollowup,
): Record<RosterOpening, PhysicalBranch> {
  return {
    tip: physical(tip),
    'anti-air': physical(antiAir),
    'corner-counter':
      corner === 'standingHeavy'
        ? { slot: corner, reward: 'heavy', advance: true }
        : physical(corner),
  }
}

// Each player has a second physical choice even when their Nen or equipment is unavailable.
const ROSTER_BRANCHES = {
  kurapika: routes('standingHeavy', 'backHeavy', 'lowHeavy'),
  hisoka: routes('lowHeavy', 'forwardLight', 'lowHeavy'),
  chrollo: routes('forwardLight', 'backHeavy', 'forwardLight'),
  benjamin: routes('standingHeavy', 'backHeavy', 'forwardHeavy'),
  tserriednich: routes('backHeavy', 'forwardLight', 'standingHeavy'),
  feitan: routes('backHeavy', 'backHeavy', 'lowHeavy'),
  saiyu: routes('lowHeavy', 'forwardLight', 'standingHeavy'),
  theta: routes('lowHeavy', 'forwardLight', 'standingHeavy'),
  biscuit: routes('standingHeavy', 'backHeavy', 'forwardHeavy'),
  phinks: routes('standingHeavy', 'backHeavy', 'forwardHeavy'),
  franklin: routes('standingHeavy', 'backHeavy', 'forwardHeavy'),
  machi: routes('lowHeavy', 'forwardLight', 'forwardLight'),
  illumi: routes('lowHeavy', 'forwardLight', 'standingHeavy'),
  kalluto: routes('standingHeavy', 'forwardLight', 'lowHeavy'),
  bonolenov: routes('backHeavy', 'forwardLight', 'forwardHeavy'),
  shizuku: routes('standingHeavy', 'backHeavy', 'forwardHeavy'),
  hinrigh: routes('standingHeavy', 'backHeavy', 'lowHeavy'),
  mizaistom: routes('standingHeavy', 'forwardLight', 'lowHeavy'),
  leorio: routes('standingHeavy', 'backHeavy', 'standingHeavy'),
  hanzo: routes('lowHeavy', 'forwardLight', 'lowHeavy'),
  rihan: routes('backHeavy', 'forwardLight', 'standingHeavy'),
  zakuro: routes('lowHeavy', 'forwardLight', 'lowHeavy'),
  melody: routes('lowHeavy', 'forwardLight', 'forwardLight'),
  basho: routes('standingHeavy', 'backHeavy', 'forwardHeavy'),
  camilla: routes('backHeavy', 'forwardLight', 'standingHeavy'),
  halkenburg: routes('standingHeavy', 'backHeavy', 'forwardHeavy'),
  gel: routes('standingHeavy', 'forwardLight', 'lowHeavy'),
  lynch: routes('standingHeavy', 'forwardLight', 'standingHeavy'),
  luini: routes('backHeavy', 'forwardLight', 'forwardLight'),
  bill: routes('lowHeavy', 'forwardLight', 'lowHeavy'),
  furykov: routes('backHeavy', 'backHeavy', 'forwardLight'),
  cluck: routes('lowHeavy', 'forwardLight', 'lowHeavy'),
  beyond: routes('standingHeavy', 'backHeavy', 'forwardHeavy'),
  longhi: routes('lowHeavy', 'backHeavy', 'standingHeavy'),
  musse: routes('standingHeavy', 'forwardLight', 'lowHeavy'),
  padaille: routes('standingHeavy', 'backHeavy', 'forwardHeavy'),
  sayird: routes('backHeavy', 'forwardLight', 'lowHeavy'),
  terebellum: routes('standingHeavy', 'backHeavy', 'forwardHeavy'),
  voconte: routes('backHeavy', 'forwardLight', 'lowHeavy'),
  yokotani: routes('standingHeavy', 'forwardLight', 'lowHeavy'),
} satisfies Record<RosterFighterId, ReturnType<typeof routes>>

const PHYSICAL_BRANCHES: Partial<Record<FighterId, Record<RosterOpening, PhysicalBranch>>> =
  ROSTER_BRANCHES

export function rosterPhysicalBranch(
  id: FighterId,
  opening: ComboOpening,
): PhysicalBranch | undefined {
  // The same advancing strikes that cover tip distance can bridge a retreat.
  if (opening === 'whiff-punish') return PHYSICAL_BRANCHES[id]?.tip
  return PHYSICAL_BRANCHES[id]?.[opening]
}

type TechniqueBranch = {
  slot: Extract<MoveSlot, 'neutralSpecial' | 'forwardSpecial' | 'downSpecial' | 'finisher'>
  reward: 'technique'
}

function technique(slot: TechniqueBranch['slot']): readonly TechniqueBranch[] {
  return [{ slot, reward: 'technique' }]
}

// Only contact techniques confirmed in this opening are offered. Admission stays in the moveset.
export const ROSTER_TECHNIQUE_BRANCHES: Partial<
  Record<FighterId, Partial<Record<ComboOpening, readonly TechniqueBranch[]>>>
> = {
  benjamin: { tip: technique('neutralSpecial') },
  saiyu: { 'anti-air': technique('forwardSpecial') },
  theta: { 'corner-counter': technique('downSpecial') },
  biscuit: { 'anti-air': technique('finisher') },
  machi: { 'corner-counter': technique('forwardSpecial') },
  shizuku: { 'corner-counter': technique('forwardSpecial') },
  gel: { 'anti-air': technique('forwardSpecial') },
  padaille: { 'corner-counter': technique('downSpecial') },
}
