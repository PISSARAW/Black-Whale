/**
 * The five ends of Kurapika's hand.
 *
 * Every one of his abilities is the same chain — the same links, off the same
 * wrist — and the only thing that tells them apart, in the source and here, is
 * what is on the end of it. So the links are built once in
 * `apparitionObjectView.ts` and the tip is built here, one small function per
 * finger, and `Apparition.stage` is the whole of the vocabulary between them.
 *
 * Everything is drawn pointing down +Z, because that is the axis the scene
 * turns onto the run of the chain: a tip modelled along its own length comes out
 * of the hand aimed at whatever the chain is aimed at, with no per-tip
 * orientation to keep in step.
 */
import type { Group, MeshBasicMaterial } from 'three'

type Three = typeof import('three')

/** What one tip is built from: the three.js namespace, the steel, and the scale. */
interface TipContext {
  THREE: Three
  steel: MeshBasicMaterial
  /** The pendulum ball's diameter in metres — every tip is drawn to it. */
  size: number
}

/**
 * The Dowsing Chain's pendulum: a plain weight, and the only tip that is not a
 * point. It is meant to hang and swing rather than to go into anything.
 */
function pendulum({ THREE, steel, size }: TipContext): Group {
  const tip = new THREE.Group()
  tip.add(new THREE.Mesh(new THREE.SphereGeometry(size, 12, 10), steel))
  return tip
}

/**
 * Steal Chain's syringe: the barrel, and the needle that goes into the body.
 *
 * The dock's own French names it the index syringe chain, and the profile's
 * instruction is to drive it into somebody — so the drawn end is a syringe and
 * not a spike.
 */
function syringe({ THREE, steel, size }: TipContext): Group {
  const tip = new THREE.Group()
  const barrel = new THREE.Mesh(
    new THREE.CylinderGeometry(size * 0.4, size * 0.4, size * 1.5, 8),
    steel,
  )
  barrel.rotation.x = Math.PI / 2
  barrel.position.z = size * 0.4
  tip.add(barrel)
  const collar = new THREE.Mesh(new THREE.TorusGeometry(size * 0.46, size * 0.09, 4, 10), steel)
  collar.position.z = -size * 0.32
  tip.add(collar)
  const needle = new THREE.Mesh(new THREE.ConeGeometry(size * 0.11, size * 1.15, 6), steel)
  needle.rotation.x = Math.PI / 2
  needle.position.z = size * 1.72
  tip.add(needle)
  return tip
}

/**
 * Chain Jail's shackle: a ring wide enough to close on somebody, with the barb
 * that carries it there ahead of it. Absolute restraint, drawn as the thing that
 * does the restraining.
 */
function shackle({ THREE, steel, size }: TipContext): Group {
  const tip = new THREE.Group()
  const ring = new THREE.Mesh(new THREE.TorusGeometry(size * 0.95, size * 0.16, 6, 16), steel)
  ring.position.z = size * 0.6
  tip.add(ring)
  const barb = new THREE.Mesh(new THREE.ConeGeometry(size * 0.34, size * 1.1, 6), steel)
  barb.rotation.x = Math.PI / 2
  barb.position.z = size * 1.7
  tip.add(barb)
  return tip
}

/**
 * Holy Chain's cross, which the archive names outright: the cross-tipped thumb
 * chain. Nothing on it is pointed, because nothing about it goes in.
 */
function cross({ THREE, steel, size }: TipContext): Group {
  const tip = new THREE.Group()
  const upright = new THREE.Mesh(
    new THREE.BoxGeometry(size * 0.26, size * 0.26, size * 1.9),
    steel,
  )
  upright.position.z = size * 0.75
  tip.add(upright)
  const arm = new THREE.Mesh(new THREE.BoxGeometry(size * 1.2, size * 0.24, size * 0.24), steel)
  arm.position.z = size * 0.5
  tip.add(arm)
  return tip
}

/**
 * Judgment Chain's blade, which the archive names as plainly: a blade and a
 * chain, implanted around a heart. Flat, and the only tip with an edge.
 */
function blade({ THREE, steel, size }: TipContext): Group {
  const tip = new THREE.Group()
  const stake = new THREE.Mesh(new THREE.ConeGeometry(size * 0.5, size * 2.1, 4), steel)
  stake.rotation.x = Math.PI / 2
  stake.scale.x = 0.34
  stake.position.z = size * 1.15
  tip.add(stake)
  const guard = new THREE.Mesh(new THREE.BoxGeometry(size * 0.9, size * 0.18, size * 0.18), steel)
  tip.add(guard)
  return tip
}

/** In the order `apparitions.ts` numbers them, which is the order of the fingers. */
const TIPS: ((context: TipContext) => Group)[] = [pendulum, syringe, shackle, cross, blade]

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
