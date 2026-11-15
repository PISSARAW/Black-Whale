import type { AttackKind, FightNenZone, FighterId } from './types'

export interface AttackTuning {
  startup?: number
  active?: number
  recovery?: number
  damage?: number
  hitstun?: number
  blockstun?: number
  knockback?: number
  lunge?: number
  reach?: number
  bottom?: number
  top?: number
  targetZone?: FightNenZone
  auraZone?: FightNenZone
}

export interface FightingStyle {
  id: FighterId
  nameFr: string
  nameEn: string
  descriptionFr: string
  descriptionEn: string
  preferredRange: readonly [number, number]
  retreatBelowHealth: number
  guardRange: number
  moveScale: number
  specialChance: number
  heavyThreshold: number
  attacks: Record<AttackKind, AttackTuning>
}

const STYLES: Record<FighterId, FightingStyle> = {
  kurapika: {
    id: 'kurapika',
    nameFr: 'Contre tactique',
    nameEn: 'Tactical counter',
    descriptionFr: 'Contrôle la moyenne distance, observe puis punit avec précision.',
    descriptionEn: 'Controls mid-range, observes, then punishes with precision.',
    preferredRange: [8, 12],
    retreatBelowHealth: 24,
    guardRange: 20,
    moveScale: 1,
    specialChance: 0.3,
    heavyThreshold: 0.5,
    attacks: {
      light: { startup: 0.8, recovery: 0.9, damage: 0.9, reach: 1, targetZone: 'hands' },
      heavy: { recovery: 0.9, reach: 1.2, targetZone: 'torso' },
      special: { startup: 0.88, recovery: 1.05, reach: 1.5, targetZone: 'torso' },
    },
  },
  hisoka: {
    id: 'hisoka',
    nameFr: 'Voltige trompeuse',
    nameEn: 'Deceptive acrobatics',
    descriptionFr: 'Mobile et imprévisible, attire l’adversaire avant de frapper très vite.',
    descriptionEn: 'Mobile and unpredictable, luring rivals in before striking quickly.',
    preferredRange: [7, 11],
    retreatBelowHealth: 30,
    guardRange: 12,
    moveScale: 1.12,
    specialChance: 0.36,
    heavyThreshold: 0.34,
    attacks: {
      light: { startup: 0.7, recovery: 0.82, damage: 0.85, reach: 1.6, targetZone: 'head' },
      heavy: { startup: 0.82, recovery: 0.9, lunge: 1.2, reach: 1.4, targetZone: 'head' },
      special: { startup: 0.78, damage: 0.92, reach: 2.5, knockback: 0.75 },
    },
  },
  chrollo: {
    id: 'chrollo',
    nameFr: 'Stratège de zone',
    nameEn: 'Control strategist',
    descriptionFr: 'Patient, maintient l’espace et privilégie les ouvertures sûres.',
    descriptionEn: 'Patiently maintains space and commits only to safe openings.',
    preferredRange: [11, 16],
    retreatBelowHealth: 36,
    guardRange: 22,
    moveScale: 0.92,
    specialChance: 0.42,
    heavyThreshold: 0.54,
    attacks: {
      light: { startup: 0.9, recovery: 0.85, reach: 1.1, targetZone: 'hands' },
      heavy: {
        startup: 0.9,
        recovery: 1.08,
        damage: 1.08,
        bottom: 3.2,
        top: 10,
        targetZone: 'torso',
        auraZone: 'hands',
      },
      special: { startup: 1.08, damage: 1.12, recovery: 1.12, reach: 2 },
    },
  },
  morena: {
    id: 'morena',
    nameFr: 'Influence à distance',
    nameEn: 'Ranged influence',
    descriptionFr: 'Refuse l’échange frontal et use de l’espace pour imposer Contagion.',
    descriptionEn: 'Avoids direct exchanges and uses space to impose Contagion.',
    preferredRange: [14, 22],
    retreatBelowHealth: 48,
    guardRange: 16,
    moveScale: 1.04,
    specialChance: 0.5,
    heavyThreshold: 0.3,
    attacks: {
      light: { startup: 0.92, recovery: 0.8, damage: 0.82, reach: 0.8, targetZone: 'hands' },
      heavy: { startup: 0.88, damage: 0.9, reach: 1.7, bottom: 0.4, top: 5.8 },
      special: { startup: 1.18, active: 1.35, recovery: 0.9, damage: 0.86, reach: 4 },
    },
  },
  benjamin: {
    id: 'benjamin',
    nameFr: 'Assaut militaire',
    nameEn: 'Military assault',
    descriptionFr: 'Avance sans relâche et transforme chaque ouverture en impact massif.',
    descriptionEn: 'Advances relentlessly and turns every opening into a massive impact.',
    preferredRange: [5, 7],
    retreatBelowHealth: 0,
    guardRange: 10,
    moveScale: 0.94,
    specialChance: 0.2,
    heavyThreshold: 0.78,
    attacks: {
      light: { startup: 1.08, damage: 1.18, knockback: 1.15, targetZone: 'torso' },
      heavy: {
        startup: 1.16,
        recovery: 1.12,
        damage: 1.38,
        hitstun: 1.2,
        knockback: 1.35,
        bottom: 3.8,
        top: 11,
        targetZone: 'torso',
        auraZone: 'hands',
      },
      special: { startup: 1.12, damage: 1.25, knockback: 1.3, targetZone: 'torso' },
    },
  },
  tserriednich: {
    id: 'tserriednich',
    nameFr: 'Contre prédictif',
    nameEn: 'Predictive counter',
    descriptionFr: 'Attend le geste adverse, se replace et frappe dans le temps mort.',
    descriptionEn: 'Waits for the rival’s move, repositions, and strikes during recovery.',
    preferredRange: [9, 15],
    retreatBelowHealth: 32,
    guardRange: 24,
    moveScale: 1.06,
    specialChance: 0.45,
    heavyThreshold: 0.42,
    attacks: {
      light: { startup: 0.76, recovery: 0.92, damage: 0.88, targetZone: 'head' },
      heavy: {
        startup: 0.86,
        recovery: 1.08,
        damage: 1.04,
        bottom: 2.2,
        top: 9.4,
        targetZone: 'torso',
      },
      special: { startup: 0.72, recovery: 1.2, damage: 0.95, targetZone: 'head' },
    },
  },
}

export function fightingStyle(id: FighterId): FightingStyle {
  return STYLES[id]
}

interface MovementSituation {
  gap: number
  health: number
}

/** -1 retreats, 0 holds the line, 1 advances. */
export function styleMovement(id: FighterId, situation: MovementSituation): -1 | 0 | 1 {
  const style = fightingStyle(id)
  const [minimum, maximum] = style.preferredRange
  if (situation.gap < minimum) return -1
  if (situation.health <= style.retreatBelowHealth && situation.gap < maximum) return -1
  return situation.gap > maximum ? 1 : 0
}

interface GuardSituation {
  gap: number
  threatened: boolean
}

export function shouldStyleGuard(id: FighterId, situation: GuardSituation): boolean {
  return situation.threatened && situation.gap <= fightingStyle(id).guardRange
}

interface AttackSituation {
  canSpecial: boolean
  inRange: boolean
  roll: number
}

export function chooseStyleAttack(id: FighterId, situation: AttackSituation): AttackKind | null {
  const style = fightingStyle(id)
  if (situation.canSpecial && situation.roll < style.specialChance) return 'special'
  if (!situation.inRange) return null
  return situation.roll < style.heavyThreshold ? 'heavy' : 'light'
}
