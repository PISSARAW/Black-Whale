import type { FightingStyle } from './fightStyles'
import type { FighterId } from './types'

type CompletionId = Extract<
  FighterId,
  | 'gidal'
  | 'longhi'
  | 'musse'
  | 'padaille'
  | 'tubeppa'
  | 'tyson'
  | 'sayird'
  | 'terebellum'
  | 'voconte'
  | 'yokotani'
>

interface StyleSpec {
  id: CompletionId
  names: [string, string]
  range: [number, number]
  chance: number
  threshold: number
}

const SPECS: readonly StyleSpec[] = [
  {
    id: 'gidal',
    names: ['Malédiction terminale', 'Terminal curse'],
    range: [8, 14],
    chance: 0.5,
    threshold: 0.52,
  },
  {
    id: 'longhi',
    names: ['Contrat coercitif', 'Coercive contract'],
    range: [10, 17],
    chance: 0.54,
    threshold: 0.4,
  },
  {
    id: 'musse',
    names: ['Pistolet et surveillance', 'Handgun and surveillance'],
    range: [5, 9],
    chance: 0.56,
    threshold: 0.34,
  },
  {
    id: 'padaille',
    names: ['Arsenal corporel', 'Body arsenal'],
    range: [5, 9],
    chance: 0.44,
    threshold: 0.64,
  },
  {
    id: 'tubeppa',
    names: ['Soutien chimique', 'Chemical support'],
    range: [11, 18],
    chance: 0.56,
    threshold: 0.36,
  },
  {
    id: 'tyson',
    names: ['Doctrine punitive', 'Punitive doctrine'],
    range: [13, 20],
    chance: 0.58,
    threshold: 0.3,
  },
  {
    id: 'sayird',
    names: ['Garde rapprochée', 'Close protection'],
    range: [14, 22],
    chance: 0.55,
    threshold: 0.32,
  },
  {
    id: 'terebellum',
    names: ['Transfert de dégâts', 'Damage transfer'],
    range: [7, 12],
    chance: 0.5,
    threshold: 0.52,
  },
  {
    id: 'voconte',
    names: ['Réseau de portes', 'Door network'],
    range: [9, 16],
    chance: 0.54,
    threshold: 0.42,
  },
  {
    id: 'yokotani',
    names: ['Défense judiciaire', 'Judicial defence'],
    range: [11, 18],
    chance: 0.58,
    threshold: 0.38,
  },
]

export const COMBAT_COMPLETION_STYLES = Object.fromEntries(
  SPECS.map((spec) => [spec.id, toStyle(spec)]),
) as Record<CompletionId, FightingStyle>

function toStyle(spec: StyleSpec): FightingStyle {
  const ranged = spec.range[1] >= 20
  return {
    id: spec.id,
    nameFr: spec.names[0],
    nameEn: spec.names[1],
    descriptionFr: `${spec.names[0]} : exploite ses conditions canoniques dans un duel tactique.`,
    descriptionEn: `${spec.names[1]}: uses its canonical conditions in a tactical duel.`,
    preferredRange: spec.range,
    retreatBelowHealth: 32,
    guardRange: spec.range[1] + 4,
    moveScale: 1,
    specialChance: spec.chance,
    heavyThreshold: spec.threshold,
    attacks: {
      light: { startup: ranged ? 0.82 : 0.74, targetZone: 'hands' },
      heavy: { damage: ranged ? 0.96 : 1.14, reach: ranged ? 1.2 : 1.6 },
      special: { startup: ranged ? 0.84 : 0.78, reach: ranged ? 4.2 : 3 },
      ranged: { startup: ranged ? 0.72 : 0.95 },
    },
  }
}
