import type { FightPreparation } from './preparationTypes'
import type { FightSide, FighterId } from './types'

/**
 * Biohazard only transforms what was really packed before the fight. Each item
 * keeps its own limits: two pairs of handcuffs, one camera, one gun with its
 * six loaded rounds, one transmitter with its paired receiver. Nothing is
 * conjured, reloaded or given a function the original object did not have.
 */
export type HinrighKitItem = 'handcuffs' | 'camera' | 'firearm' | 'transmitter'
export type HinrighKit = Partial<Record<FightSide, HinrighKitItem[]>>

/** A small kit: three of the four items. Duel tuning, not a quantity from the manga. */
export const HINRIGH_KIT_SLOTS = 3
export const HINRIGH_KIT_USERS: readonly FighterId[] = ['hinrigh', 'chrollo', 'kurapika']
export const HINRIGH_KIT_ITEMS: readonly { id: HinrighKitItem; fr: string; en: string }[] = [
  {
    id: 'handcuffs',
    fr: 'Deux paires de menottes · oiseaux qui se referment',
    en: 'Two pairs of handcuffs · birds that lock shut',
  },
  {
    id: 'camera',
    fr: 'Caméra · chat qui observe et enregistre',
    en: 'Camera · cat that watches and records',
  },
  {
    id: 'firearm',
    fr: 'Arme chargée de six balles · serpent sans recharge',
    en: 'Gun loaded with six rounds · snake, no reload',
  },
  {
    id: 'transmitter',
    fr: 'Émetteur et son récepteur · huître toujours traçable',
    en: 'Transmitter and its receiver · oyster still traceable',
  },
]
const ITEM_IDS = HINRIGH_KIT_ITEMS.map((entry) => entry.id)
export function hinrighKitFor(
  preparation: FightPreparation | undefined,
  side: FightSide,
): readonly HinrighKitItem[] | undefined {
  return preparation?.hinrighKit?.[side]
}

/** `undefined` when absent, `null` when malformed, otherwise a copied valid kit. */
export function parseHinrighKit(value: unknown): HinrighKit | undefined | null {
  if (value === undefined) return undefined
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const entries = Object.entries(value as Record<string, unknown>)
  const kit: HinrighKit = {}
  for (const [side, items] of entries) {
    if ((side !== 'player' && side !== 'opponent') || !validItems(items)) return null
    kit[side] = [...items]
  }
  return kit
}
function validItems(items: unknown): items is HinrighKitItem[] {
  return (
    Array.isArray(items) &&
    items.length <= HINRIGH_KIT_SLOTS &&
    new Set(items).size === items.length &&
    items.every((item) => ITEM_IDS.includes(item))
  )
}
