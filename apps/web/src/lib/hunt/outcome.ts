/**
 * How a game ends. Four ways, and only one of them is a fight.
 *
 * `contact` is not a loss — it is the hand-off to the duel, and by step 4 it is
 * the moment everything laid down during the hunt is cashed in. The other three
 * are terminal.
 *
 * `eliminated` is the one worth reading twice. The hunter's aura falls with
 * everything he spends looking: every sweep, every room the player made him
 * doubt, every floor he stopped to inspect. At zero his Ten no longer holds,
 * and at that point an ordinary entrave — the same twenty-five points that
 * merely inconvenienced him ten minutes earlier — kills him. It is the only
 * ending in the prototype the player wins without ever being in the same room,
 * and it exists to prove invariant I3 has teeth outside the duel too.
 */

export type HuntOutcome = 'playing' | 'contact' | 'caught' | 'reached' | 'timeUp' | 'eliminated'

/** Ten minutes. */
export const GAME_LENGTH = 600
/** Arm's length. Close enough that neither of them gets to walk away. */
export const CONTACT_RANGE = 1.5

export interface Standing {
  clock: number
  /** Metres between the two bodies. */
  gap: number
  playerSpaceId: string | null
  targetSpaceId: string | null
  /** The hunter's Ten no longer holds. */
  hunterSpent: boolean
  /** An entrave has him where he stands. */
  hunterHeld: boolean
}

export function judgeHunt(standing: Standing): HuntOutcome {
  if (standing.hunterSpent && standing.hunterHeld) return 'eliminated'
  if (standing.gap <= CONTACT_RANGE) return 'contact'
  if (standing.targetSpaceId && standing.playerSpaceId === standing.targetSpaceId) return 'reached'
  if (standing.clock >= GAME_LENGTH) return 'timeUp'
  return 'playing'
}

/**
 * `contact` is the one non-terminal ending: it opens the duel. `caught` is what
 * it becomes when that duel is lost.
 */
export function isOver(outcome: HuntOutcome): boolean {
  return outcome !== 'playing' && outcome !== 'contact'
}

export function playerWon(outcome: HuntOutcome): boolean {
  return outcome === 'reached' || outcome === 'eliminated'
}
