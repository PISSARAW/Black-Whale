import type { ArenaDifficulty, OpponentDoctrine } from './ai'
import type { ArenaProfile, NenMastery } from './profile'
import type { ArenaTerrainId } from './terrain'

export interface CampaignRequirement {
  challenge?: string
  mastery?: Partial<Record<NenMastery, number>>
}

export interface CampaignMission {
  id: string
  chapter: number
  titleFr: string
  titleEn: string
  challengeId: string
  doctrine: OpponentDoctrine
  difficulty: ArenaDifficulty
  terrainId: ArenaTerrainId
  boss?: boolean
  requires: CampaignRequirement
}

export const ARENA_CAMPAIGN: CampaignMission[] = [
  {
    id: 'initiation',
    chapter: 1,
    titleFr: 'Fondations',
    titleEn: 'Foundations',
    challengeId: 'ryu',
    doctrine: 'counter',
    difficulty: 'initiate',
    terrainId: 'tier-1-banquet-hall',
    requires: {},
  },
  {
    id: 'closed-guard',
    chapter: 1,
    titleFr: 'Garde fermée',
    titleEn: 'Closed Guard',
    challengeId: 'guard',
    doctrine: 'counter',
    difficulty: 'fighter',
    terrainId: 'tier-1-banquet-hall',
    requires: { challenge: 'ryu', mastery: { ryu: 3 } },
  },
  {
    id: 'hidden-aura',
    chapter: 2,
    titleFr: 'Aura cachée',
    titleEn: 'Hidden Aura',
    challengeId: 'in-gyo',
    doctrine: 'deceiver',
    difficulty: 'fighter',
    terrainId: 'tier-2-screening-room',
    requires: { challenge: 'guard', mastery: { gyo: 1 } },
  },
  {
    id: 'punish-ko',
    chapter: 2,
    titleFr: 'Punir le risque',
    titleEn: 'Punish the Risk',
    challengeId: 'ko',
    doctrine: 'artillery',
    difficulty: 'master',
    terrainId: 'tier-2-screening-room',
    requires: { challenge: 'in-gyo', mastery: { ken: 1 } },
  },
  {
    ...{
      id: 'mastery-exam',
      chapter: 3,
      titleFr: 'Examen du maître',
      titleEn: "Master's Exam",
      challengeId: 'zetsu',
      doctrine: 'binder',
      difficulty: 'master',
      terrainId: 'tier-1-banquet-hall',
      requires: { challenge: 'ko', mastery: { ren: 3, ryu: 5, zetsu: 2 } },
    },
    boss: true,
  },
]

export function missionStatus(
  mission: CampaignMission,
  profile: ArenaProfile,
): 'complete' | 'available' | 'locked' {
  if (profile.unlocked.includes(mission.challengeId)) return 'complete'
  return unmetRequirements(mission, profile).length === 0 ? 'available' : 'locked'
}

export function unmetRequirements(mission: CampaignMission, profile: ArenaProfile): string[] {
  const unmet: string[] = []
  if (mission.requires.challenge && !profile.unlocked.includes(mission.requires.challenge)) {
    unmet.push(`challenge:${mission.requires.challenge}`)
  }
  for (const [technique, minimum] of Object.entries(mission.requires.mastery ?? {})) {
    if (profile.mastery[technique as NenMastery] < (minimum ?? 0))
      unmet.push(`mastery:${technique}:${minimum}`)
  }
  return unmet
}
