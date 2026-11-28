import type { CombatFighter } from '../combatRoutes'
import type { MoveSlot } from '../types'

interface ComboRoutes {
  ground: readonly MoveSlot[]
  support: readonly MoveSlot[]
  preCall?: boolean
  align?: boolean
}

/** Native routes measured against main's tiered grammar; these declarations change no move data. */
export const KAMEO_ROSTER_ROUTES: Record<CombatFighter, ComboRoutes> = {
  kurapika: {
    ground: ['backHeavy', 'standingLight', 'forwardLight'],
    support: ['backHeavy', 'standingLight', 'forwardHeavy'],
  },
  hisoka: {
    ground: ['standingLight', 'forwardLight', 'standingHeavy', 'forwardLight'],
    support: ['standingLight', 'forwardLight', 'standingHeavy', 'backHeavy'],
    preCall: true,
    align: true,
  },
  chrollo: {
    ground: ['standingLight', 'standingHeavy', 'backHeavy', 'forwardLight'],
    support: ['standingLight', 'standingHeavy', 'backHeavy', 'lowHeavy'],
    preCall: true,
  },
  benjamin: {
    ground: ['standingLight', 'standingHeavy', 'forwardLight'],
    support: ['backHeavy', 'standingLight', 'lowHeavy'],
  },
  tserriednich: {
    ground: ['standingLight', 'standingHeavy', 'forwardLight'],
    support: ['standingLight', 'standingHeavy', 'backHeavy', 'forwardHeavy'],
  },
  feitan: {
    ground: ['standingLight', 'standingHeavy', 'forwardLight', 'backHeavy', 'forwardLight'],
    support: ['standingLight', 'standingHeavy', 'forwardLight', 'backHeavy', 'forwardHeavy'],
    preCall: true,
  },
  saiyu: {
    ground: ['standingLight', 'forwardLight', 'standingHeavy', 'forwardLight'],
    support: ['lowLight', 'forwardLight', 'standingHeavy', 'forwardHeavy'],
    preCall: true,
  },
  theta: {
    ground: ['standingLight', 'forwardLight', 'standingHeavy', 'forwardLight'],
    support: ['standingLight', 'forwardLight', 'standingHeavy', 'backHeavy', 'forwardHeavy'],
  },
  biscuit: {
    ground: ['standingLight', 'forwardLight', 'standingHeavy', 'forwardLight'],
    support: ['lowLight', 'forwardLight', 'standingHeavy', 'forwardHeavy'],
    preCall: true,
  },
  phinks: {
    ground: ['standingLight', 'forwardLight', 'standingHeavy', 'standingLight'],
    support: ['standingLight', 'forwardLight', 'standingHeavy', 'lowHeavy'],
    preCall: true,
  },
  franklin: {
    ground: ['standingLight', 'standingHeavy', 'forwardLight'],
    support: ['standingLight', 'forwardLight', 'standingHeavy', 'forwardHeavy'],
  },
  machi: {
    ground: ['standingLight', 'standingHeavy', 'backHeavy', 'forwardLight'],
    support: ['standingLight', 'standingHeavy', 'backHeavy', 'forwardHeavy'],
    preCall: true,
  },
  illumi: {
    ground: ['standingLight', 'forwardLight', 'standingHeavy', 'forwardLight'],
    support: ['standingLight', 'forwardLight', 'standingHeavy', 'backHeavy', 'forwardHeavy'],
  },
  kalluto: {
    ground: ['standingLight', 'forwardLight', 'backHeavy', 'forwardLight'],
    support: ['standingLight', 'standingHeavy', 'forwardLight', 'backHeavy', 'forwardHeavy'],
  },
  bonolenov: {
    ground: ['standingHeavy', 'backHeavy', 'forwardLight'],
    support: ['standingLight', 'forwardLight', 'standingHeavy', 'lowHeavy'],
    preCall: true,
    align: true,
  },
  shizuku: {
    ground: ['standingLight', 'standingHeavy', 'forwardLight'],
    support: ['standingLight', 'forwardLight', 'standingHeavy', 'forwardHeavy'],
  },
  hinrigh: {
    ground: ['standingLight', 'forwardLight', 'standingHeavy', 'forwardLight'],
    support: ['standingLight', 'forwardLight', 'standingHeavy', 'backHeavy', 'forwardHeavy'],
  },
  mizaistom: {
    ground: ['standingLight', 'standingHeavy', 'forwardLight'],
    support: ['standingLight', 'standingHeavy', 'backHeavy', 'forwardHeavy'],
  },
  leorio: {
    ground: ['standingLight', 'standingHeavy', 'forwardLight'],
    support: ['standingLight', 'forwardLight', 'standingHeavy', 'forwardHeavy'],
  },
  hanzo: {
    ground: ['standingLight', 'forwardLight', 'backHeavy', 'forwardLight'],
    support: ['standingLight', 'standingHeavy', 'forwardLight', 'backHeavy', 'forwardHeavy'],
  },
  rihan: {
    ground: ['standingLight', 'standingHeavy', 'forwardLight'],
    support: ['standingLight', 'standingHeavy', 'backHeavy', 'forwardHeavy'],
  },
  zakuro: {
    ground: ['standingLight', 'standingHeavy', 'backHeavy', 'forwardLight'],
    support: ['standingLight', 'standingHeavy', 'backHeavy', 'forwardHeavy'],
    preCall: true,
  },
  melody: {
    ground: ['standingLight', 'standingHeavy', 'backHeavy', 'forwardLight'],
    support: ['standingLight', 'standingHeavy', 'backHeavy', 'forwardLight', 'forwardHeavy'],
  },
  basho: {
    ground: ['standingLight', 'standingHeavy', 'forwardLight'],
    support: ['standingLight', 'standingHeavy', 'backHeavy', 'forwardHeavy'],
  },
  camilla: {
    ground: ['standingLight', 'standingHeavy', 'forwardLight'],
    support: ['standingLight', 'standingHeavy', 'backHeavy', 'forwardLight', 'forwardHeavy'],
  },
  halkenburg: {
    ground: ['standingLight', 'standingHeavy', 'forwardLight'],
    support: ['standingLight', 'standingHeavy', 'backHeavy', 'forwardHeavy'],
  },
  gel: {
    ground: ['standingLight', 'standingHeavy', 'backHeavy', 'forwardLight'],
    support: ['standingLight', 'standingHeavy', 'backHeavy', 'forwardHeavy'],
    preCall: true,
  },
  lynch: {
    ground: ['standingLight', 'forwardLight', 'standingHeavy', 'standingLight'],
    support: ['standingLight', 'forwardLight', 'standingHeavy', 'backHeavy', 'forwardHeavy'],
  },
  luini: {
    ground: ['standingLight', 'standingHeavy', 'backHeavy', 'forwardLight'],
    support: ['standingLight', 'standingHeavy', 'backHeavy', 'forwardLight', 'forwardHeavy'],
  },
  bill: {
    ground: ['standingLight', 'standingHeavy', 'forwardLight'],
    support: ['standingLight', 'standingHeavy', 'backHeavy', 'forwardHeavy'],
  },
  furykov: {
    ground: ['standingLight', 'standingHeavy', 'forwardLight'],
    support: ['standingLight', 'standingHeavy', 'backHeavy', 'forwardHeavy'],
  },
  cluck: {
    ground: ['standingLight', 'standingHeavy', 'backHeavy', 'forwardLight'],
    support: ['standingLight', 'standingHeavy', 'backHeavy', 'forwardLight', 'forwardHeavy'],
  },
  beyond: {
    ground: ['standingLight', 'standingHeavy', 'forwardLight'],
    support: ['standingLight', 'forwardLight', 'standingHeavy', 'forwardHeavy'],
  },
  longhi: {
    ground: ['standingLight', 'standingHeavy', 'backHeavy', 'forwardLight'],
    support: ['standingLight', 'standingHeavy', 'backHeavy', 'forwardHeavy'],
    preCall: true,
  },
  musse: {
    ground: ['standingLight', 'forwardLight', 'standingHeavy', 'forwardLight'],
    support: ['standingLight', 'forwardLight', 'standingHeavy', 'backHeavy', 'forwardHeavy'],
  },
  padaille: {
    ground: ['standingLight', 'standingHeavy', 'forwardLight'],
    support: ['standingLight', 'standingHeavy', 'forwardLight'],
    preCall: true,
    align: true,
  },
  sayird: {
    ground: ['standingLight', 'forwardLight', 'standingHeavy', 'standingLight'],
    support: ['standingLight', 'forwardLight', 'standingHeavy', 'backHeavy', 'forwardHeavy'],
  },
  terebellum: {
    ground: ['standingLight', 'standingHeavy', 'forwardLight'],
    support: ['standingLight', 'standingHeavy', 'backHeavy', 'forwardHeavy'],
  },
  voconte: {
    ground: ['standingLight', 'forwardLight', 'standingHeavy', 'standingLight'],
    support: ['standingLight', 'forwardLight', 'standingHeavy', 'backHeavy', 'forwardHeavy'],
  },
  yokotani: {
    ground: ['standingLight', 'standingHeavy', 'forwardLight'],
    support: ['standingLight', 'forwardLight', 'standingHeavy', 'backHeavy', 'forwardHeavy'],
  },
}
