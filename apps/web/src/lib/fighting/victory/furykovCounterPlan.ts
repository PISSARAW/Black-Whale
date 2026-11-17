import type { FighterId } from '../types'
import { fighterDefinition } from '../roster'

export type FurykovCounterKind = 'sever' | 'intercept' | 'pierce' | 'reach'
const LINKS: readonly FighterId[] = ['hisoka', 'machi']
const PROJECTILES: readonly FighterId[] = [
  'franklin',
  'illumi',
  'kalluto',
  'musse',
  'leorio',
]
const ARMOUR: readonly FighterId[] = [
  'biscuit',
  'phinks',
  'benjamin',
  'bonolenov',
  'beyond',
]
const DESIGNS = {
  sever: {
    nameFr: 'Coupe-liens',
    nameEn: 'Threadbreaker',
    tacticFr: 'Sectionner les liens de Nen',
    tacticEn: 'Sever Nen tethers',
    length: 0.92,
  },
  intercept: {
    nameFr: 'Lame-bouclier',
    nameEn: 'Shieldblade',
    tacticFr: 'Intercepter les projectiles',
    tacticEn: 'Intercept projectiles',
    length: 0.82,
  },
  pierce: {
    nameFr: 'Poinçon de rupture',
    nameEn: 'Guardbreaker',
    tacticFr: 'Concentrer la pénétration',
    tacticEn: 'Concentrate penetration',
    length: 0.86,
  },
  reach: {
    nameFr: 'Lame d’allonge',
    nameEn: 'Outreach blade',
    tacticFr: 'Frapper hors de la prise adverse',
    tacticEn: 'Strike beyond the opponent’s grasp',
    length: 1,
  },
} as const
function counterKind(target: FighterId): FurykovCounterKind {
  if (LINKS.includes(target)) return 'sever'
  if (PROJECTILES.includes(target)) return 'intercept'
  if (ARMOUR.includes(target)) return 'pierce'
  return 'reach'
}
/** User-authored scenario: bespoke designs, with all analysis and fabrication finished beforehand. */
export function furykovCounterPlan(target: FighterId) {
  const kind = counterKind(target),
    definition = fighterDefinition(target)
  return {
    kind,
    ...DESIGNS[kind],
    target,
    targetName: definition.name,
    targetAbility: definition.specialFr,
    preparedBeforeFight: true,
    decipherComplete: true,
    fabricationComplete: true,
    fictionalWeaponDesign: true,
    universalNenCancellation: false,
  }
}
export type FurykovCounterPlan = ReturnType<typeof furykovCounterPlan>
export const FURYKOV_COUNTER_PARRY = 216
export const FURYKOV_COUNTER_HITS = [276, 336, 414] as const
