/**
 * Ken: six a second to be covered everywhere, and to get nowhere.
 *
 * It is the most expensive thing in the duel and it cannot win one. Nothing
 * lands on a duelist in Ken, and a duelist in Ken cannot charge a Ko — it buys
 * time and only time.
 *
 * Which makes it the load-bearing verb for invariant I3. A player who intends
 * to win by attrition holds Ken and never attacks; the question then is only
 * whether the other one's hundred runs out before theirs does, and everything
 * the hunt did to the hunter's reservoir is the answer.
 */
import { spend, type DuelistState } from './costs'

export const KEN_PER_SECOND = 6

export function payForKen(duelist: DuelistState, dt: number): DuelistState {
  return spend(duelist, { active: duelist.ken, rate: KEN_PER_SECOND, dt, drop: 'ken' })
}

/** Raising Ken puts down whatever was gathered: there is no strike from behind it. */
export function raiseKen(duelist: DuelistState, up: boolean): DuelistState {
  return { ...duelist, ken: up, ko: up ? null : duelist.ko }
}
