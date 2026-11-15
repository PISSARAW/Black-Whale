import type { FightingStyle } from './fightStyles'
import type { FighterId } from './types'

type FourthWaveId = Extract<
  FighterId,
  'cluck' | 'beyond' | 'fugetsu' | 'kacho' | 'luzurus' | 'momoze' | 'salesale' | 'zhanglei'
>

export const FOURTH_WAVE_STYLES: Record<FourthWaveId, FightingStyle> = {
  cluck: make('cluck', ['Essaim tactique', 'Tactical flock'], {
    range: [14, 21],
    chance: 0.56,
    attacks: {
      light: { startup: 0.74 },
      heavy: { reach: 1.35 },
      special: { startup: 0.8, active: 1.3, reach: 4.2 },
      ranged: { startup: 0.7 },
    },
  }),
  beyond: make('beyond', ['Pression sacrificielle', 'Sacrificial pressure'], {
    range: [6, 10],
    chance: 0.44,
    attacks: {
      light: { damage: 1.12 },
      heavy: { damage: 1.28, knockback: 1.25 },
      special: { startup: 1.02, damage: 1.22, reach: 3 },
      ranged: {},
    },
  }),
  fugetsu: make('fugetsu', ['Passage magique', 'Magical passage'], {
    range: [10, 17],
    chance: 0.54,
    attacks: {
      light: { startup: 0.72, recovery: 0.8 },
      heavy: { startup: 0.88 },
      special: { startup: 0.68, recovery: 0.9, reach: 3.8 },
      ranged: {},
    },
  }),
  kacho: make('kacho', ['Duo protecteur', 'Protective duet'], {
    range: [9, 15],
    chance: 0.52,
    attacks: {
      light: { recovery: 0.8 },
      heavy: { damage: 1.04 },
      special: { startup: 0.72, recovery: 0.92, reach: 3.2 },
      ranged: {},
    },
  }),
  luzurus: make('luzurus', ['Appât du désir', 'Desire bait'], {
    range: [12, 19],
    chance: 0.56,
    attacks: {
      light: { targetZone: 'hands' },
      heavy: { reach: 1.4 },
      special: { startup: 0.82, active: 1.35, reach: 4 },
      ranged: {},
    },
  }),
  momoze: make('momoze', ['Contrôle parasitaire', 'Parasitic control'], {
    range: [11, 18],
    chance: 0.58,
    attacks: {
      light: { damage: 0.82 },
      heavy: { recovery: 0.92 },
      special: { startup: 0.78, recovery: 1.05, reach: 4 },
      ranged: {},
    },
  }),
  salesale: make('salesale', ['Brume d’influence', 'Influence haze'], {
    range: [13, 21],
    chance: 0.6,
    attacks: {
      light: { recovery: 0.86 },
      heavy: { damage: 1.06 },
      special: { startup: 0.9, active: 1.5, reach: 4.3 },
      ranged: {},
    },
  }),
  zhanglei: make('zhanglei', ['Capital gardien', 'Guardian capital'], {
    range: [8, 13],
    chance: 0.48,
    attacks: {
      light: { damage: 1.04 },
      heavy: { damage: 1.14 },
      special: { startup: 0.86, damage: 1.08, reach: 3 },
      ranged: {},
    },
  }),
}

function make(
  id: FourthWaveId,
  names: [string, string],
  options: { range: [number, number]; chance: number; attacks: FightingStyle['attacks'] },
): FightingStyle {
  return {
    id,
    nameFr: names[0],
    nameEn: names[1],
    descriptionFr: `${names[0]} : transforme son Hatsu en plan de duel distinct et lisible.`,
    descriptionEn: `${names[1]}: turns the Hatsu into a distinct and readable duel plan.`,
    preferredRange: options.range,
    retreatBelowHealth: 32,
    guardRange: options.range[1] + 4,
    moveScale: 1,
    specialChance: options.chance,
    heavyThreshold: 0.46,
    attacks: options.attacks,
  }
}
