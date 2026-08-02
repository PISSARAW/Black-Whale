export type HunterProfileId = 'methodical' | 'aggressive' | 'cautious'

export interface HunterProfile {
  id: HunterProfileId
  sweepInterval: number
  listenFor: number
  searchDrain: number
}

export const HUNTER_PROFILES: HunterProfile[] = [
  { id: 'methodical', sweepInterval: 20, listenFor: 4, searchDrain: 3 },
  { id: 'aggressive', sweepInterval: 13, listenFor: 2, searchDrain: 5 },
  { id: 'cautious', sweepInterval: 27, listenFor: 6, searchDrain: 2 },
]

export const DEFAULT_HUNTER_PROFILE: HunterProfileId = 'methodical'

export function hunterProfile(id: HunterProfileId): HunterProfile {
  return HUNTER_PROFILES.find((profile) => profile.id === id) ?? HUNTER_PROFILES[0]
}
