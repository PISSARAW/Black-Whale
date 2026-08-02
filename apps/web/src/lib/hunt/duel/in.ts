/**
 * In: five a second to be unreadable. The feint.
 *
 * It hides where your aura is, and nothing else — it does not move it, and it
 * does not make a strike land. What it buys is that the answer the other one
 * gives to your Ko is a guess. Against an opponent who is not holding Gyo it
 * buys nothing at all, which is why it is a decision rather than a toggle you
 * leave on.
 *
 * The price is the same as Gyo's on purpose: looking and not being seen are
 * worth the same, so the pair is a standoff rather than a dominant strategy,
 * and both of them are drawn from the reservoir Ken also needs.
 */
import { spend, type DuelistState } from './costs'

export const IN_PER_SECOND = 5

export function payForIn(duelist: DuelistState, dt: number): DuelistState {
  return spend(duelist, { active: duelist.in, rate: IN_PER_SECOND, dt, drop: 'in' })
}
