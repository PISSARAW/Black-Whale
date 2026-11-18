/** Per-tick fighter input. Re-exported by types.ts; extracted to keep it under 500 lines. */
export interface FightInput {
  /** Calls the chosen support partner beside the leader. */
  kameo?: boolean
  arena?: boolean
  interact?: boolean
  plugWounds?: boolean
  /** Occupies both hands: blocks hearing, ordinary guard and attacks. */
  coverEars?: boolean
  /** Holding this occupies both hands to cover up to two separate wounds. */
  en?: boolean
  shu?: boolean
  conceal?: boolean
  gyo?: boolean
  focusHead?: boolean
  focusTorso?: boolean
  focusHands?: boolean
  focusFeet?: boolean
  /** Occupies both hands: blocks hearing, ordinary guard and attacks. */
  /** Speech directed at a nearby sleeping body, to interrupt Hanzo Skill 4. */
  call?: boolean
  left: boolean
  right: boolean
  jump: boolean
  down: boolean
  guard: boolean
  aura: boolean
  hatsu: boolean
}

export const EMPTY_INPUT: FightInput = {
  left: false,
  right: false,
  jump: false,
  down: false,
  guard: false,
  aura: false,
  hatsu: false,
}
