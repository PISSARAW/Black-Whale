import type { RosterFighterId } from './rosterChoreography'
import type { MoveSlot } from './types'

type RouteSlots = readonly [
  readonly MoveSlot[],
  readonly MoveSlot[],
  readonly MoveSlot[],
  readonly MoveSlot[],
]

/** Confirm, low, punish, air. Physical routes leave personal Hatsu preparations intact. */
export const ROSTER_COMBAT_ROUTES: Record<
  Exclude<RosterFighterId, 'kurapika' | 'hisoka' | 'chrollo' | 'benjamin'>,
  RouteSlots
> = {
  tserriednich: [
    ['standingLight', 'standingHeavy', 'forwardHeavy'],
    ['lowLight', 'forwardLight', 'standingHeavy'],
    ['backHeavy', 'forwardHeavy'],
    ['airLight', 'airHeavy'],
  ],
  feitan: [
    ['standingLight', 'standingHeavy', 'forwardLight'],
    ['lowLight', 'forwardLight', 'forwardHeavy'],
    ['backHeavy', 'forwardHeavy'],
    ['airLight', 'airHeavy'],
  ],
  saiyu: [
    ['standingLight', 'standingHeavy', 'forwardHeavy'],
    ['lowLight', 'forwardLight', 'standingHeavy'],
    ['backHeavy', 'forwardLight'],
    ['airLight', 'airHeavy'],
  ],
  theta: [
    ['standingLight', 'standingHeavy', 'forwardHeavy'],
    ['lowLight', 'forwardLight', 'standingHeavy'],
    ['backHeavy', 'forwardHeavy'],
    ['airLight', 'airHeavy'],
  ],
  biscuit: [
    ['standingLight', 'standingHeavy', 'forwardHeavy'],
    ['lowLight', 'forwardLight', 'standingHeavy'],
    ['backHeavy', 'forwardHeavy'],
    ['airLight', 'airHeavy'],
  ],
  phinks: [
    ['standingLight', 'standingHeavy', 'forwardHeavy'],
    ['lowLight', 'forwardLight', 'standingHeavy'],
    ['backHeavy', 'forwardHeavy'],
    ['airLight', 'airHeavy'],
  ],
  franklin: [
    ['standingLight', 'standingHeavy', 'forwardHeavy'],
    ['lowLight', 'forwardLight', 'standingHeavy'],
    ['backHeavy', 'forwardHeavy'],
    ['airLight', 'airHeavy'],
  ],
  machi: [
    ['standingLight', 'standingHeavy', 'forwardLight'],
    ['lowLight', 'forwardLight', 'forwardHeavy'],
    ['backHeavy', 'forwardHeavy'],
    ['airLight', 'airHeavy'],
  ],
  illumi: [
    ['standingLight', 'standingHeavy', 'forwardHeavy'],
    ['lowLight', 'forwardLight', 'standingHeavy'],
    ['backHeavy', 'forwardHeavy'],
    ['airLight', 'airHeavy'],
  ],
  kalluto: [
    ['standingLight', 'standingHeavy', 'forwardLight'],
    ['lowLight', 'forwardLight', 'forwardHeavy'],
    ['backHeavy', 'forwardHeavy'],
    ['airLight', 'airHeavy'],
  ],
  bonolenov: [
    ['standingLight', 'standingHeavy', 'forwardHeavy'],
    ['lowLight', 'forwardLight', 'standingHeavy'],
    ['backHeavy', 'forwardHeavy'],
    ['airLight', 'airHeavy'],
  ],
  shizuku: [
    ['standingLight', 'standingHeavy', 'forwardHeavy'],
    ['lowLight', 'forwardLight', 'standingHeavy'],
    ['backHeavy', 'forwardLight'],
    ['airLight', 'airHeavy'],
  ],
  hinrigh: [
    ['standingLight', 'standingHeavy', 'forwardHeavy'],
    ['lowLight', 'forwardLight', 'standingHeavy'],
    ['backHeavy', 'forwardHeavy'],
    ['airLight', 'airHeavy'],
  ],
  mizaistom: [
    ['standingLight', 'standingHeavy', 'forwardLight'],
    ['lowLight', 'forwardLight', 'forwardHeavy'],
    ['backHeavy', 'forwardHeavy'],
    ['airLight', 'airHeavy'],
  ],
  leorio: [
    ['standingLight', 'standingHeavy', 'forwardHeavy'],
    ['lowLight', 'forwardLight', 'standingHeavy'],
    ['backHeavy', 'forwardHeavy'],
    ['airLight', 'airHeavy'],
  ],
  hanzo: [
    ['standingLight', 'standingHeavy', 'forwardLight'],
    ['lowLight', 'forwardLight', 'forwardHeavy'],
    ['backHeavy', 'forwardHeavy'],
    ['airLight', 'airHeavy'],
  ],
  rihan: [
    ['standingLight', 'standingHeavy', 'forwardHeavy'],
    ['lowLight', 'forwardLight', 'standingHeavy'],
    ['backHeavy', 'forwardHeavy'],
    ['airLight', 'airHeavy'],
  ],
  zakuro: [
    ['standingLight', 'standingHeavy', 'forwardLight'],
    ['lowLight', 'forwardLight', 'forwardHeavy'],
    ['backHeavy', 'forwardHeavy'],
    ['airLight', 'airHeavy'],
  ],
  melody: [
    ['standingLight', 'standingHeavy', 'forwardLight'],
    ['lowLight', 'forwardLight', 'forwardHeavy'],
    ['backHeavy', 'forwardHeavy'],
    ['airLight', 'airHeavy'],
  ],
  basho: [
    ['standingLight', 'standingHeavy', 'forwardHeavy'],
    ['lowLight', 'forwardLight', 'standingHeavy'],
    ['backHeavy', 'forwardHeavy'],
    ['airLight', 'airHeavy'],
  ],
  camilla: [
    ['standingLight', 'standingHeavy', 'forwardLight'],
    ['lowLight', 'forwardLight', 'forwardHeavy'],
    ['backHeavy', 'forwardHeavy'],
    ['airLight', 'airHeavy'],
  ],
  halkenburg: [
    ['standingLight', 'standingHeavy', 'forwardHeavy'],
    ['lowLight', 'forwardLight', 'standingHeavy'],
    ['backHeavy', 'forwardHeavy'],
    ['airLight', 'airHeavy'],
  ],
  gel: [
    ['standingLight', 'standingHeavy', 'forwardLight'],
    ['lowLight', 'forwardLight', 'forwardHeavy'],
    ['backHeavy', 'forwardHeavy'],
    ['airLight', 'airHeavy'],
  ],
  lynch: [
    ['standingLight', 'standingHeavy', 'forwardHeavy'],
    ['lowLight', 'forwardLight', 'standingHeavy'],
    ['backHeavy', 'forwardHeavy'],
    ['airLight', 'airHeavy'],
  ],
  luini: [
    ['standingLight', 'standingHeavy', 'forwardLight'],
    ['lowLight', 'forwardLight', 'forwardHeavy'],
    ['backHeavy', 'forwardHeavy'],
    ['airLight', 'airHeavy'],
  ],
  bill: [
    ['standingLight', 'standingHeavy', 'forwardHeavy'],
    ['lowLight', 'forwardLight', 'standingHeavy'],
    ['backHeavy', 'forwardHeavy'],
    ['airLight', 'airHeavy'],
  ],
  furykov: [
    ['standingLight', 'standingHeavy', 'forwardHeavy'],
    ['lowLight', 'forwardLight', 'standingHeavy'],
    ['backHeavy', 'forwardHeavy'],
    ['airLight', 'airHeavy'],
  ],
  cluck: [
    ['standingLight', 'standingHeavy', 'forwardLight'],
    ['lowLight', 'forwardLight', 'forwardHeavy'],
    ['backHeavy', 'forwardHeavy'],
    ['airLight', 'airHeavy'],
  ],
  beyond: [
    ['standingLight', 'standingHeavy', 'forwardHeavy'],
    ['lowLight', 'forwardLight', 'standingHeavy'],
    ['backHeavy', 'forwardHeavy'],
    ['airLight', 'airHeavy'],
  ],
  longhi: [
    ['standingLight', 'standingHeavy', 'forwardLight'],
    ['lowLight', 'forwardLight', 'forwardHeavy'],
    ['backHeavy', 'forwardHeavy'],
    ['airLight', 'airHeavy'],
  ],
  musse: [
    ['standingLight', 'standingHeavy', 'forwardHeavy'],
    ['lowLight', 'forwardLight', 'standingHeavy'],
    ['backHeavy', 'forwardHeavy'],
    ['airLight', 'airHeavy'],
  ],
  padaille: [
    ['standingLight', 'standingHeavy', 'forwardLight'],
    ['lowLight', 'forwardLight', 'forwardHeavy'],
    ['backHeavy', 'forwardHeavy'],
    ['airLight', 'airHeavy'],
  ],
  sayird: [
    ['standingLight', 'standingHeavy', 'forwardHeavy'],
    ['lowLight', 'forwardLight', 'standingHeavy'],
    ['backHeavy', 'forwardHeavy'],
    ['airLight', 'airHeavy'],
  ],
  terebellum: [
    ['standingLight', 'standingHeavy', 'forwardHeavy'],
    ['lowLight', 'forwardLight', 'standingHeavy'],
    ['backHeavy', 'forwardHeavy'],
    ['airLight', 'airHeavy'],
  ],
  voconte: [
    ['standingLight', 'standingHeavy', 'forwardHeavy'],
    ['lowLight', 'forwardLight', 'standingHeavy'],
    ['backHeavy', 'forwardHeavy'],
    ['airLight', 'airHeavy'],
  ],
  yokotani: [
    ['standingLight', 'standingHeavy', 'forwardHeavy'],
    ['lowLight', 'forwardLight', 'standingHeavy'],
    ['backHeavy', 'forwardHeavy'],
    ['airLight', 'airHeavy'],
  ],
}
