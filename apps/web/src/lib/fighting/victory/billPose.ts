import type { VictoryContext } from './types'
import { billFinalePose, BILL_FALL } from './billFinalePose'
import { billNativeComboPose } from './billNativePose'
export { BILL_IMPACT, BILL_FALL, BILL_GROWTH, BILL_BLOOM } from './billFinalePose'

export function billVictoryPose(context: VictoryContext) {
  if (context.age >= BILL_FALL) return { ...billFinalePose(context), native: null }
  // Borrow the unchanged finale's two contact anchors, then draw only production combat poses.
  const finale = billFinalePose({ ...context, age: BILL_FALL }, true)
  const native = billNativeComboPose(context)
  return { ...finale, hand: native.hand, fist: native.hand, native }
}
export type BillVictoryPose = ReturnType<typeof billVictoryPose>
