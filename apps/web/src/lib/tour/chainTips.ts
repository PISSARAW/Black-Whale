/**
 * The five ends of Kurapika's hand.
 *
 * Every one of his abilities is the same chain — the same links, off the same
 * wrist — and the only thing that tells them apart, in the source and here, is
 * what is on the end of it. So the links are built once in
 * `apparitionObjectView.ts` and the tip is built here, one small function per
 * finger, and `Apparition.stage` is the whole of the vocabulary between them.
 *
 * Each is drawn off the databook plate of the hand (thumb, middle, ring and
 * little finger) and off the Steal Chain panels for the index, part for part:
 * what the plate draws as a fitting is a fitting here, in the plate's colours.
 *
 * Everything is drawn pointing down +Z, because that is the axis the scene
 * turns onto the run of the chain: a tip modelled along its own length comes out
 * of the hand aimed at whatever the chain is aimed at, with no per-tip
 * orientation to keep in step. The flat of a flat tip faces ±Y.
 */
import type { Group } from 'three'
import {
  CHAIN_DEEP,
  CHAIN_GLASS,
  CHAIN_GLINT,
  CHAIN_NAVY,
  CHAIN_SHADE,
  CHAIN_SILVER,
  tipKit,
  type TipContext,
  type TipKit,
} from './chainTipKit'

export type { TipContext } from './chainTipKit'

/**
 * The Dowsing Chain's pendulum: a plain ball, far darker than its chain, hung
 * by an eye. The only tip that is not a point — it is meant to hang and swing
 * rather than to go into anything.
 */
function pendulum(context: TipContext): Group {
  const kit = tipKit(context)
  kit.loop(0.1)
  kit.ball(1, [0, 0, 1.18], context.glow(CHAIN_NAVY, 1))
  // The one highlight the plate gives it, high on the shoulder of the ball.
  kit.ball(0.24, [0.34, 0.74, 0.8], context.glow(CHAIN_GLINT, 1)).scale.set(1, 0.6, 1.5)
  return kit.group
}

/**
 * Steal Chain's syringe, as the panel draws it: a wide ring, the flange, a
 * glass barrel with the skull and crossed bones riding inside it, and a long
 * bare needle.
 */
function syringe(context: TipContext): Group {
  const { steel, glow } = context
  const kit = tipKit(context)
  kit.loop(0.18, 0.26)
  kit.rod({ from: 0.46, to: 0.56, radius: 0.42, material: steel })
  kit.rod({ from: 0.56, to: 2, radius: 0.3, material: glow(CHAIN_GLASS, 0.4) })
  kit.rod({ from: 0.56, to: 0.64, radius: 0.33, material: steel })
  kit.rod({ from: 1.93, to: 2, radius: 0.33, material: steel })
  kit.ball(0.1, [0, 0, 1.1], steel)
  for (const lean of [-0.65, 0.65]) {
    kit.box([0.055, 0.055, 0.5], [0, 0, 1.32], steel).rotation.y = lean
  }
  kit.rod({ from: 2, to: 2.2, radius: [0.3, 0.07], material: steel })
  kit.rod({ from: 2.2, to: 3.25, radius: 0.03, material: steel })
  kit.rod({ from: 3.25, to: 3.5, radius: [0.03, 0], material: steel })
  kit.group.scale.setScalar(0.9)
  return kit.group
}

/**
 * Chain Jail's claw: a blue ferrule with its rivet, and a pale talon curving
 * off it to a point. Absolute restraint, drawn as the hook that takes hold —
 * the plate draws no shackle on the middle finger, and neither does this.
 */
function claw(context: TipContext): Group {
  const { glow } = context
  const kit = tipKit(context)
  kit.loop(0.08)
  kit.flat(
    (shape) => {
      shape.moveTo(-0.3, 0.5)
      shape.quadraticCurveTo(-0.78, 1.9, 0.72, 2.5)
      shape.quadraticCurveTo(-0.05, 1.6, 0.3, 0.5)
      shape.closePath()
    },
    0.14,
    glow(CHAIN_SILVER, 1),
  )
  kit.box([0.66, 0.24, 0.4], [0, 0, 0.44], glow(CHAIN_DEEP, 1)).rotation.y = 0.08
  kit.stud(0.07, 0.44, glow(CHAIN_SHADE, 1))
  return kit.group
}

interface CrossArm {
  angle: number
  length: number
}

/** One arm of the Holy Chain's cross: flared, slotted, and capped in blue. */
function crossArm(hub: TipKit, { angle, length }: CrossArm, context: TipContext) {
  const arm = hub.spoke(angle, 0)
  arm.rod({ from: 0.12, to: length, radius: [0.11, 0.17], material: context.steel })
  arm.box([0.04, 0.27, length * 0.4], [0, 0, length * 0.55], context.glow(CHAIN_SHADE, 1))
  arm.ball(0.19, [0, 0, length], context.glow(CHAIN_DEEP, 1)).scale.set(1, 1, 0.7)
}

/**
 * Holy Chain's cross, which the archive names outright: the cross-tipped thumb
 * chain. Four round arms flaring to blue caps, a slot down each, and a boss
 * with a stone in it. Nothing on it is pointed, because nothing about it goes in.
 */
function cross(context: TipContext): Group {
  const kit = tipKit(context)
  kit.loop(0.1)
  const hub = kit.spoke(0, 1.02)
  const arms: CrossArm[] = [
    { angle: 0, length: 1 },
    { angle: Math.PI, length: 0.72 },
    { angle: Math.PI / 2, length: 0.72 },
    { angle: -Math.PI / 2, length: 0.72 },
  ]
  for (const arm of arms) crossArm(hub, arm, context)
  hub.box([0.34, 0.3, 0.34], [0, 0, 0], context.steel)
  hub.stud(0.1, 0, context.glow(CHAIN_DEEP, 1))
  return kit.group
}

/** One arm of the dagger's guard: a flared blue bar ending in two lobes. */
function guardArm(hub: TipKit, { angle, length }: CrossArm, context: TipContext) {
  const deep = context.glow(CHAIN_DEEP, 1)
  const arm = hub.spoke(angle, 0)
  arm.rod({ from: 0.08, to: length, radius: [0.08, 0.15], material: deep })
  for (const side of [-1, 1]) arm.ball(0.11, [side * 0.1, 0, length], deep)
}

/**
 * Judgment Chain's dagger, which the archive names as plainly: a blade and a
 * chain, implanted around a heart. A block marked with a cross, a guard of four
 * flared blue arms, a collar, and a long kite of a blade with a ridge down it —
 * flat, and the only tip with an edge.
 */
function blade(context: TipContext): Group {
  const { steel, glow } = context
  const deep = glow(CHAIN_DEEP, 1)
  const shade = glow(CHAIN_SHADE, 1)
  const kit = tipKit(context)
  kit.loop(0.08)
  kit.box([0.4, 0.3, 0.36], [0, 0, 0.42], steel)
  kit.box([0.26, 0.33, 0.07], [0, 0, 0.42], deep)
  kit.box([0.07, 0.33, 0.26], [0, 0, 0.42], deep)
  kit.rod({ from: 0.6, to: 0.8, radius: 0.08, material: steel })
  const hub = kit.spoke(0, 0.98)
  const arms: CrossArm[] = [
    { angle: Math.PI / 2, length: 0.62 },
    { angle: -Math.PI / 2, length: 0.62 },
    { angle: Math.PI, length: 0.26 },
    { angle: 0, length: 0.26 },
  ]
  for (const arm of arms) guardArm(hub, arm, context)
  hub.box([0.26, 0.32, 0.26], [0, 0, 0], deep)
  hub.box([0.12, 0.35, 0.12], [0, 0, 0], shade)
  kit.rod({ from: 1.24, to: 1.34, radius: 0.15, material: steel })
  kit.flat(
    (shape) => {
      shape.moveTo(0.1, 1.32)
      shape.lineTo(0.42, 1.58)
      shape.lineTo(0, 3.1)
      shape.lineTo(-0.42, 1.58)
      shape.lineTo(-0.1, 1.32)
      shape.closePath()
    },
    0.1,
    glow(CHAIN_SILVER, 1),
  )
  kit.box([0.03, 0.12, 1.25], [0, 0, 2.25], shade)
  kit.group.scale.setScalar(0.82)
  return kit.group
}

/** In the order `apparitions.ts` numbers them, which is the order of the fingers. */
const TIPS: ((context: TipContext) => Group)[] = [pendulum, syringe, claw, cross, blade]

/**
 * The end of the chain the visitor is holding.
 *
 * Falls back to the pendulum, which is the one that was always drawn: a stage
 * the table has not learned yet is better as a weight on a chain than as a
 * chain running to nothing.
 */
export function buildChainTip(stage: number, context: TipContext): Group {
  return (TIPS[stage] ?? pendulum)(context)
}
