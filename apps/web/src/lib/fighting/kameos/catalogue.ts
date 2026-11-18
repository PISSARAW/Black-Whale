import type { FighterId } from '../types'
import type { KameoId } from './types'

export type KameoRole = 'soin' | 'defense' | 'boost' | 'attaque' | 'piege' | 'zone'

/**
 * How the support Hatsu reaches its target. `ally`: the leader receives the existing
 * onTrigger effect. `reach`: the opposing leader receives the existing onImpact effect
 * when within range. `trap`: a trap is left on the floor and springs on contact.
 */
export type KameoDelivery =
  | { kind: 'ally' }
  | { kind: 'reach'; range: number }
  | { kind: 'trap'; radius: number; lifetimeFrames: number }

/** Frames of one stay on stage; the effect lands on the first frame after `startup`. */
export interface KameoTiming {
  enter: number
  startup: number
  recovery: number
  leave: number
}

export interface KameoDefinition {
  id: KameoId & FighterId
  name: string
  role: KameoRole
  /** Canon ability in `data/abilities/abilities.json`. */
  abilityId: string
  /** First chapter where the ability is visible, for the spoiler cap. */
  chapterId: string
  delivery: KameoDelivery
  timing: KameoTiming
  cooldownFrames: number
  /** Aura spent from the kameo's own body; a body without it cannot act. */
  auraCost: number
}

// Game tuning, not canon: one stay lasts about a second, then ten seconds of cooldown.
const STAY: KameoTiming = { enter: 18, startup: 12, recovery: 24, leave: 18 }
const COOLDOWN = 600
const COST = 20

export const KAMEO_CATALOGUE: Readonly<Record<KameoId, KameoDefinition>> = {
  tubeppa: support({
    id: 'tubeppa',
    name: 'Tubeppa',
    role: 'soin',
    abilityId: 'tubeppa-guardian-synthesis',
    chapterId: 'ch-386',
  }),
  marayam: support({
    id: 'marayam',
    name: 'Marayam',
    role: 'defense',
    abilityId: 'marayam-guardian-isolation',
    chapterId: 'ch-390',
  }),
  zhanglei: support({
    id: 'zhanglei',
    name: 'Zhang Lei',
    role: 'boost',
    abilityId: 'zhanglei-guardian-coins',
    chapterId: 'ch-395',
  }),
  morena: {
    ...support({
      id: 'morena',
      name: 'Morena',
      role: 'attaque',
      abilityId: 'contagion',
      chapterId: 'ch-375',
    }),
    // Contagion passes through saliva: the kameo must reach the target.
    delivery: { kind: 'reach', range: 9 },
  },
  luzurus: {
    ...support({
      id: 'luzurus',
      name: 'Luzurus',
      role: 'piege',
      abilityId: 'luzurus-guardian-desire-trap',
      chapterId: 'ch-386',
    }),
    delivery: { kind: 'trap', radius: 5, lifetimeFrames: 300 },
  },
  salesale: {
    ...support({
      id: 'salesale',
      name: 'Salé-salé',
      role: 'zone',
      abilityId: 'salesale-guardian-smoke',
      chapterId: 'ch-386',
    }),
    // The smoke spreads around the kameo rather than through a strike.
    delivery: { kind: 'reach', range: 16 },
  },
}

type SupportCanon = Pick<KameoDefinition, 'id' | 'name' | 'role' | 'abilityId' | 'chapterId'>

function support(canon: SupportCanon): KameoDefinition {
  return {
    ...canon,
    delivery: { kind: 'ally' },
    timing: STAY,
    cooldownFrames: COOLDOWN,
    auraCost: COST,
  }
}

export const KAMEO_IDS = Object.keys(KAMEO_CATALOGUE) as KameoId[]

export function isKameoId(id: string): id is KameoId {
  return Object.hasOwn(KAMEO_CATALOGUE, id)
}

export function kameoDefinition(id: KameoId): KameoDefinition {
  return KAMEO_CATALOGUE[id]
}
