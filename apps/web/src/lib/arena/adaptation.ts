import type { ArenaDifficulty, OpponentDoctrine } from './ai'
import type { ArenaReplay } from './replay/types'

export interface OpponentProfile {
  id: string
  nameFr: string
  nameEn: string
  doctrine: OpponentDoctrine
  difficulty: ArenaDifficulty
  bossRule?: 'no-visible-intent' | 'aura-tax' | 'sudden-death'
}

export interface ArenaAdaptation {
  doctrine: OpponentDoctrine
  observedBouts: number
  pressure: 'guard' | 'distance' | 'deception' | 'aura'
}

export const V3_OPPONENTS: OpponentProfile[] = [
  {
    id: 'counter-student',
    nameFr: 'Élève du contre',
    nameEn: 'Counter Student',
    doctrine: 'counter',
    difficulty: 'initiate',
  },
  {
    id: 'gum-jailer',
    nameFr: 'Geôlière élastique',
    nameEn: 'Elastic Jailer',
    doctrine: 'binder',
    difficulty: 'fighter',
  },
  {
    id: 'silent-gunner',
    nameFr: 'Mitrailleur silencieux',
    nameEn: 'Silent Gunner',
    doctrine: 'artillery',
    difficulty: 'master',
  },
  {
    id: 'in-examiner',
    nameFr: "Examinateur d'In",
    nameEn: 'In Examiner',
    doctrine: 'deceiver',
    difficulty: 'master',
    bossRule: 'no-visible-intent',
  },
  {
    id: 'aura-auditor',
    nameFr: "Auditrice d'aura",
    nameEn: 'Aura Auditor',
    doctrine: 'binder',
    difficulty: 'master',
    bossRule: 'aura-tax',
  },
]

export function adaptOpponent(history: ArenaReplay[]): ArenaAdaptation {
  const recent = history.slice(-5)
  const counts = { attacks: 0, guard: 0, gyo: 0, hatsu: 0 }
  for (const replay of recent) {
    for (const { action } of replay.commands) {
      if (action.type === 'STRIKE' || action.type === 'KO') counts.attacks += 1
      if (action.type === 'GUARD' || action.type === 'KEN') counts.guard += 1
      if (action.type === 'GYO' && action.on) counts.gyo += 1
      if (action.type === 'HATSU') counts.hatsu += 1
    }
  }
  const ranked = [
    { pressure: 'guard' as const, score: counts.attacks, doctrine: 'counter' as const },
    { pressure: 'distance' as const, score: counts.guard, doctrine: 'artillery' as const },
    { pressure: 'deception' as const, score: counts.gyo, doctrine: 'deceiver' as const },
    { pressure: 'aura' as const, score: counts.hatsu, doctrine: 'binder' as const },
  ].sort((a, b) => b.score - a.score)
  return {
    doctrine: ranked[0].doctrine,
    pressure: ranked[0].pressure,
    observedBouts: recent.length,
  }
}
