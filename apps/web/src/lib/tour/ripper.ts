/**
 * Ripper Cyclotron's arithmetic: what a turn of the arm buys, and what it takes
 * to break something.
 *
 * A leaf, like `gum.ts` and `decipher.ts`, and for the same reason: `hatsu.ts`
 * reads it and it reads nothing back, so neither can drag the other into a
 * cycle. No three.js, no ship, no clock.
 *
 * **One figure, and it is the manga's.** Ch. 92 gives exactly one number for
 * this ability — fifteen rotations, and what fifteen rotations did to a Chimera
 * Ant. Everything else about the charge is drawn rather than stated: the arm
 * turns, the winding is visible, the blow is one blow. So fifteen is the only
 * threshold here, and there is no curve between nought and it. A solid under
 * fifteen turns is shoved, a solid at fifteen or more is broken, and the walk
 * makes no claim about the difference between eleven and twelve.
 *
 * **The charge does not divide.** Everything wound goes into one blow, and the
 * arm is empty afterwards. That is not a simplification: it is the ability, and
 * it is why its own bearer names calibration as the weak point — you cannot
 * spend nine of fifteen turns, so guessing wrong costs the whole winding.
 */

/**
 * The one number ch. 92 puts on the ability: the rotations that went into the
 * blow that killed a Chimera Ant, and so the point at which the walk is willing
 * to say a thing has been broken rather than moved.
 */
export const RIPPER_ANT_TURNS = 15

/**
 * How far the blow throws what it lands on, in metres.
 *
 * Three for the arm alone and four more for each turn wound into it. Linear
 * because the walk has to put the solid *somewhere* and a distance is not a
 * claim about damage — the claim about damage is `ripperShatters`, and it has
 * one threshold rather than a slope.
 */
export const ripperReach = (turns: number): number => 3 + turns * 4

/** Whether this winding breaks what it hits, at ch. 92's own figure. */
export const ripperShatters = (turns: number): boolean => turns >= RIPPER_ANT_TURNS

/**
 * Whether there is anything to release.
 *
 * The refusal its bearer states himself: the calibration is the weak point, and
 * an arm that has not been turned has nothing in it to let go of. The walk
 * shows the condition rather than swallowing the key, because "you have to wind
 * it first" is a fact about Ripper Cyclotron and silence is not.
 */
export const ripperIsCharged = (turns: number): boolean => turns > 0
