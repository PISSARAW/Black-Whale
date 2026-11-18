/** Commands one side issues during a simulated frame. Re-exported by types.ts. */
export interface FightInput {
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
  /** Calls the support kameo; left / right pick where it appears (KAMEOS.md). */
  kameo?: boolean
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
