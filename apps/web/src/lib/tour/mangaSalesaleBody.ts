export const SALESALE_BODY = { chest: 0.313, waist: 0.303, depth: 0.291, neck: 1 }

/** Chapter 362, page 14: the abdomen projects farther than the chest. */
export const SALESALE_SECTIONS: ReadonlyArray<readonly [number, number]> = [
  [0, 0.73],
  [0.299, 0.73],
  [0.352, 0.89],
  [0.383, 1.018],
  [0.382, 1.12],
  [0.354, 1.23],
  [0.313, 1.35],
  [0.252, 1.405],
  [0.095, 1.47],
  [0.079, 1.49],
  [0, 1.49],
]
