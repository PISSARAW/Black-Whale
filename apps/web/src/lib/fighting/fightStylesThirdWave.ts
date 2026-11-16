import type { FightingStyle } from './fightStyles'
import type { FighterId } from './types'

type ThirdWaveId = Extract<
  FighterId,
  'basho' | 'camilla' | 'halkenburg' | 'gel' | 'lynch' | 'luini' | 'bill' | 'furykov'
>

export const THIRD_WAVE_STYLES: Record<ThirdWaveId, FightingStyle> = {
  basho: make('basho', ['Haïku incendiaire', 'Incendiary haiku'], {
    range: [10, 16],
    specialChance: 0.5,
    attacks: {
      light: { targetZone: 'hands' },
      heavy: { damage: 1.08 },
      special: { startup: 0.95, damage: 1.15, reach: 3.5 },
      ranged: {},
    },
  }),
  camilla: make('camilla', ['Contre félin', 'Feline counter'], {
    range: [8, 13],
    specialChance: 0.52,
    attacks: {
      light: { startup: 0.82 },
      heavy: { damage: 1.06 },
      special: { startup: 0.72, recovery: 1.15, reach: 2.8 },
      ranged: {},
    },
  }),
  halkenburg: make('halkenburg', ['Flèche collective', 'Collective arrow'], {
    range: [16, 24],
    specialChance: 0.58,
    attacks: {
      light: { recovery: 0.86 },
      heavy: { damage: 1.12 },
      special: { startup: 1.15, active: 1.3, damage: 1.28, reach: 4.8 },
      ranged: { startup: 0.72 },
    },
  }),
  gel: make('gel', ['Allonge serpentine', 'Serpentine reach'], {
    range: [9, 15],
    specialChance: 0.48,
    attacks: {
      light: { reach: 1.8, targetZone: 'hands' },
      heavy: { reach: 2.2 },
      special: { startup: 0.8, reach: 4, targetZone: 'torso' },
      ranged: {},
    },
  }),
  lynch: make('lynch', ['Interrogatoire brutal', 'Brutal interrogation'], {
    range: [5, 8],
    specialChance: 0.42,
    attacks: {
      light: { startup: 0.7, damage: 1.05 },
      heavy: { damage: 1.2 },
      special: { startup: 0.74, damage: 1.16, reach: 2.2 },
      ranged: {},
    },
  }),
  luini: make('luini', ['Assaut spatial', 'Spatial assault'], {
    range: [7, 12],
    specialChance: 0.54,
    attacks: {
      light: { startup: 0.66, recovery: 0.78 },
      heavy: { startup: 0.82 },
      special: { startup: 0.68, recovery: 0.9, reach: 3.4 },
      ranged: {},
    },
  }),
  bill: make('bill', ['Croissance tenace', 'Tenacious growth'], {
    range: [8, 13],
    specialChance: 0.46,
    attacks: {
      light: { recovery: 0.84 },
      heavy: { damage: 1.08, knockback: 1.1 },
      special: { startup: 0.86, recovery: 0.9, reach: 2.6 },
      ranged: {},
    },
  }),
  furykov: make('furykov', ['Discipline militaire', 'Military discipline'], {
    range: [6, 10],
    specialChance: 0.44,
    attacks: {
      light: { startup: 0.7, recovery: 0.76 },
      heavy: { startup: 0.84, damage: 1.14 },
      special: { startup: 0.76, damage: 1.1, reach: 2.4 },
      ranged: {},
    },
  }),
}

interface StyleOptions {
  range: [number, number]
  specialChance: number
  attacks: FightingStyle['attacks']
}

function make(id: ThirdWaveId, names: [string, string], options: StyleOptions): FightingStyle {
  const { range, specialChance, attacks } = options
  return {
    id,
    nameFr: names[0],
    nameEn: names[1],
    descriptionFr: `${names[0]} : impose un plan de combat propre à son Hatsu canonique.`,
    descriptionEn: `${names[1]}: imposes a combat plan built around the canonical Hatsu.`,
    preferredRange: range,
    retreatBelowHealth: 30,
    guardRange: range[1] + 4,
    moveScale: 1,
    specialChance,
    heavyThreshold: 0.48,
    attacks,
  }
}
