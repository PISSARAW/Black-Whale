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
  mission(
    'initiation',
    1,
    'Fondations',
    'Foundations',
    'ryu',
    'counter',
    'initiate',
    'tier-1-banquet-hall',
  ),
  mission(
    'closed-guard',
    1,
    'Garde fermée',
    'Closed Guard',
    'guard',
    'counter',
    'fighter',
    'tier-1-banquet-hall',
    { challenge: 'ryu', mastery: { ryu: 3 } },
  ),
  mission(
    'hidden-aura',
    2,
    'Aura cachée',
    'Hidden Aura',
    'in-gyo',
    'deceiver',
    'fighter',
    'tier-2-screening-room',
    { challenge: 'guard', mastery: { gyo: 1 } },
  ),
  mission(
    'punish-ko',
    2,
    'Punir le risque',
    'Punish the Risk',
    'ko',
    'artillery',
    'master',
    'tier-2-screening-room',
    { challenge: 'in-gyo', mastery: { ken: 1 } },
  ),
  {
    ...mission(
      'mastery-exam',
      3,
      'Examen du maître',
      "Master's Exam",
      'zetsu',
      'binder',
      'master',
      'tier-1-banquet-hall',
      { challenge: 'ko', mastery: { ren: 3, ryu: 5, zetsu: 2 } },
    ),
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

function mission(
  id: string,
  chapter: number,
  titleFr: string,
  titleEn: string,
  challengeId: string,
  doctrine: OpponentDoctrine,
  difficulty: ArenaDifficulty,
  terrainId: ArenaTerrainId,
  requires: CampaignRequirement = {},
): CampaignMission {
  return { id, chapter, titleFr, titleEn, challengeId, doctrine, difficulty, terrainId, requires }
}
