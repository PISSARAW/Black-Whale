/** Duel tuning, not the three-minute banquet performance's manga duration. */
export const MELODY_STARTUP = 18
export const MELODY_START_COST = 8
export const MELODY_AURA_PER_SECOND = 6
export const MELODY_MUSIC_RANGE = 36
export const MELODY_HEARING_RANGE = 86
export const MELODY_LISTEN_FRAMES = 12
export const MELODY_PARRY_BONUS = 3
export const MELODY_MUSIC_MOVE = 'melody:neutralSpecial'

export interface MelodyPerformance {
  originX: number
  startupFrames: number
  playingFrames: number
  moveId: string
}

export interface MelodyHearing {
  target: 'player' | 'opponent'
  frames: number
  direction: -1 | 1
  pulse: 'steady' | 'agitated'
  acceleration?: 'sudden' | 'gradual'
  threat: 'startup' | 'active' | 'recovery' | null
}
