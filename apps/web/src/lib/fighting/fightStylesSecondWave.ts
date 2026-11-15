import type { FightingStyle } from './fightStyles'
import type { FighterId } from './types'

type SecondWaveId = Extract<
  FighterId,
  'shizuku' | 'hinrigh' | 'mizaistom' | 'leorio' | 'hanzo' | 'rihan' | 'zakuro' | 'melody'
>

export const SECOND_WAVE_STYLES: Record<SecondWaveId, FightingStyle> = {
  shizuku: style('shizuku', ['Nettoyage brutal', 'Brutal cleanup'], {
    preferredRange: [7, 11],
    specialChance: 0.45,
    heavyThreshold: 0.55,
    moveScale: 1.02,
    attacks: {
      light: { startup: 0.82, reach: 1.3, targetZone: 'hands' },
      heavy: { damage: 1.14, reach: 1.6, targetZone: 'torso' },
      special: { startup: 0.92, damage: 1.08, reach: 2.4 },
      ranged: {},
    },
  }),
  hinrigh: style('hinrigh', ['Arsenal vivant', 'Living arsenal'], {
    preferredRange: [10, 16],
    specialChance: 0.5,
    heavyThreshold: 0.45,
    moveScale: 1.04,
    attacks: {
      light: { startup: 0.8, recovery: 0.84 },
      heavy: { reach: 1.5 },
      special: { startup: 0.86, active: 1.2, reach: 3.2 },
      ranged: { recovery: 0.84 },
    },
  }),
  mizaistom: style('mizaistom', ['Arbitre de zone', 'Zone arbiter'], {
    preferredRange: [11, 17],
    specialChance: 0.54,
    heavyThreshold: 0.38,
    moveScale: 0.98,
    attacks: {
      light: { targetZone: 'hands' },
      heavy: { damage: 1.08, targetZone: 'torso' },
      special: { startup: 0.78, recovery: 1.05, reach: 4, targetZone: 'torso' },
      ranged: {},
    },
  }),
  leorio: style('leorio', ['Boxe émissive', 'Emissive boxing'], {
    preferredRange: [8, 13],
    specialChance: 0.48,
    heavyThreshold: 0.5,
    moveScale: 1.02,
    attacks: {
      light: { startup: 0.84, damage: 1.05 },
      heavy: { damage: 1.16, knockback: 1.18 },
      special: { startup: 0.8, damage: 1.12, reach: 4.4 },
      ranged: { startup: 0.78 },
    },
  }),
  hanzo: style('hanzo', ['Ninjutsu mobile', 'Mobile ninjutsu'], {
    preferredRange: [7, 12],
    specialChance: 0.46,
    heavyThreshold: 0.42,
    moveScale: 1.18,
    attacks: {
      light: { startup: 0.66, recovery: 0.76, damage: 0.88 },
      heavy: { startup: 0.8, recovery: 0.9 },
      special: { startup: 0.7, recovery: 0.88, reach: 2.8 },
      ranged: { startup: 0.72 },
    },
  }),
  rihan: style('rihan', ['Contre analytique', 'Analytical counter'], {
    preferredRange: [10, 15],
    specialChance: 0.52,
    heavyThreshold: 0.44,
    moveScale: 0.96,
    attacks: {
      light: { recovery: 0.88 },
      heavy: { startup: 0.94, damage: 1.12 },
      special: { startup: 1.05, damage: 1.15, reach: 3.3 },
      ranged: { recovery: 0.96 },
    },
  }),
  zakuro: style('zakuro', ['Entrave sanguine', 'Blood restraint'], {
    preferredRange: [10, 17],
    specialChance: 0.5,
    heavyThreshold: 0.4,
    moveScale: 1.06,
    attacks: {
      light: { startup: 0.76, targetZone: 'hands' },
      heavy: { reach: 1.4 },
      special: { startup: 0.84, active: 1.25, reach: 3.8 },
      ranged: { startup: 0.76 },
    },
  }),
  melody: style('melody', ['Tempo apaisant', 'Soothing tempo'], {
    preferredRange: [14, 21],
    specialChance: 0.58,
    heavyThreshold: 0.24,
    moveScale: 0.94,
    attacks: {
      light: { damage: 0.78, recovery: 0.82 },
      heavy: { damage: 0.9, reach: 1.2 },
      special: { startup: 0.82, active: 1.4, recovery: 0.92, reach: 4.2 },
      ranged: {},
    },
  }),
}

interface StyleOptions {
  preferredRange: [number, number]
  specialChance: number
  heavyThreshold: number
  moveScale: number
  attacks: FightingStyle['attacks']
}

function style(id: SecondWaveId, names: [string, string], options: StyleOptions): FightingStyle {
  const { preferredRange } = options
  return {
    id,
    nameFr: names[0],
    nameEn: names[1],
    descriptionFr: description(id, 'fr'),
    descriptionEn: description(id, 'en'),
    preferredRange,
    retreatBelowHealth: 30,
    guardRange: preferredRange[1] + 4,
    moveScale: options.moveScale,
    specialChance: options.specialChance,
    heavyThreshold: options.heavyThreshold,
    attacks: options.attacks,
  }
}

function description(id: SecondWaveId, language: 'fr' | 'en'): string {
  const fr = `Adapte son Hatsu au duel pour contrôler le rythme et punir les ouvertures de l’adversaire.`
  const en = `Adapts this Hatsu to control the duel's tempo and punish the opponent's openings.`
  return language === 'fr' ? `${id}: ${fr}` : `${id}: ${en}`
}
