import type { FighterDefinition, FighterId } from '../types'
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
  /** Visit likeness drawn for the kameo body (`tour/humanProfiles.ts`). */
  modelId: string
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
    modelId: 'prince-tubeppa',
    role: 'soin',
    abilityId: 'tubeppa-guardian-synthesis',
    chapterId: 'ch-386',
  }),
  marayam: support({
    id: 'marayam',
    name: 'Marayam',
    modelId: 'prince-marayam',
    role: 'defense',
    abilityId: 'marayam-guardian-isolation',
    chapterId: 'ch-390',
  }),
  zhanglei: support({
    id: 'zhanglei',
    name: 'Zhang Lei',
    modelId: 'prince-zhanglei',
    role: 'boost',
    abilityId: 'zhanglei-guardian-coins',
    chapterId: 'ch-395',
  }),
  morena: {
    ...support({
      id: 'morena',
      name: 'Morena',
      modelId: 'morena-prudo',
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
      modelId: 'prince-luzurus',
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
      modelId: 'prince-salesale',
      role: 'zone',
      abilityId: 'salesale-guardian-smoke',
      chapterId: 'ch-386',
    }),
    // The smoke spreads around the kameo rather than through a strike.
    delivery: { kind: 'reach', range: 16 },
  },
}

type SupportCanon = Pick<
  KameoDefinition,
  'id' | 'name' | 'modelId' | 'role' | 'abilityId' | 'chapterId'
>

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

/** The body a kameo is drawn with; undefined for every other character. */
export function kameoAppearance(
  id: FighterId,
): Pick<FighterDefinition, 'modelId' | 'modelRole'> | undefined {
  if (!isKameoId(id)) return undefined
  const modelId = KAMEO_CATALOGUE[id].modelId
  return { modelId, modelRole: modelId === 'morena-prudo' ? 'morena' : 'fighter' }
}
