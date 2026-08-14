import type { NenTechnique, NenTechniqueState } from '@black-whale/nen-engine'

import type { Graph } from '../ambient'
import { setWorldVeil } from '../veil'
import { nenBed, type NenBed } from './bed'
import { letGoOfGyo, snapIntoGyo } from './onset'

/**
 * How much of the world each technique takes, and how much aura it puts back.
 *
 * Three numbers describe every Nen state the walk can be in:
 *
 *   - **veil** — how far the ordinary world closes. This is perception. Gyo is
 *     the top of it because Gyo is the technique that is *only* perception.
 *   - **pressure** — how loud the aura's own bed is. This is output. Ko is the
 *     top of it, because Ko is every drop of it in one place.
 *   - **ring** — the high beating tone, which is dread. Reserved for the states
 *     the anime scores as looking at something you would rather not see.
 *
 * The two axes are separate on purpose, and the anime is where the separation
 * comes from. A character in Ren is loud and the room stays: you hear the roar
 * *over* the street. A character in Gyo is quiet and the room goes: the street
 * is what leaves. Collapsing them into one intensity would make Ren muffle the
 * ship, which is wrong twice — Ren does not change what you hear, and a visitor
 * who holds Ren to walk faster would lose their footsteps for it.
 *
 * Zetsu is not in the composition at all. It returns nothing, so the veil opens
 * and the bed falls: aura closed is aura with no sound, and the ship comes back
 * at full brightness. That is the manga's own reading of Zetsu, and it is why
 * it is the technique that makes the world loud instead of quiet.
 */
export interface NenPerception {
  veil: number
  pressure: number
  ring: number
}

const PERCEPTION: Readonly<Record<NenTechnique, NenPerception>> = {
  // The skin at rest. Almost nothing — but not nothing, because a body holding
  // Ten is a body doing something, and the floor it puts under the mix is what
  // makes dropping into Zetsu audible as a loss.
  ten: { veil: 0, pressure: 0.09, ring: 0 },
  zetsu: { veil: 0, pressure: 0, ring: 0 },
  // The roar. Loud, and it costs the room almost nothing.
  ren: { veil: 0.16, pressure: 0.62, ring: 0 },
  // The eyes. The one state that is all perception and no output.
  gyo: { veil: 0.82, pressure: 0.5, ring: 0.55 },
  // Aura hidden is aura the visitor is holding still; the world barely moves.
  in: { veil: 0.1, pressure: 0.12, ring: 0 },
  // A circle laid over the ship. Wider than Gyo and shallower — En is knowing
  // that something is there, Gyo is looking at it.
  en: { veil: 0.54, pressure: 0.46, ring: 0.18 },
  shu: { veil: 0.06, pressure: 0.3, ring: 0 },
  // Ren held everywhere at once: the pressure without the focus.
  ken: { veil: 0.3, pressure: 0.74, ring: 0 },
  ko: { veil: 0.46, pressure: 0.96, ring: 0.3 },
  ryu: { veil: 0.12, pressure: 0.4, ring: 0 },
  // The dark Ren. The only entry where every number is near its ceiling, and
  // the only one where the ring is on without anything being looked at.
  on: { veil: 0.62, pressure: 1, ring: 0.62 },
}

const REST: NenPerception = { veil: 0, pressure: 0, ring: 0 }

/** Read off the state rather than branched over, to keep this a table. */
const FLAGS: readonly (readonly [NenTechnique, (state: NenTechniqueState) => boolean])[] = [
  ['gyo', (state) => state.gyo],
  ['in', (state) => state.in],
  ['en', (state) => state.en !== null],
  ['ken', (state) => state.ken],
  ['ko', (state) => state.ko !== null],
  ['on', (state) => state.on],
  ['shu', (state) => state.shu.length > 0],
  ['ryu', (state) => Object.keys(state.ryu).length > 0],
]

function activeTechniques(state: NenTechniqueState): NenTechnique[] {
  if (state.mode === 'zetsu') return []
  const raised = FLAGS.filter(([, held]) => held(state)).map(([technique]) => technique)
  return [state.mode, ...raised]
}

/** The loudest claim wins on each axis; nothing here adds up. */
export function nenPerception(state: NenTechniqueState): NenPerception {
  return activeTechniques(state).reduce<NenPerception>((held, technique) => {
    const claim = PERCEPTION[technique]
    return {
      veil: Math.max(held.veil, claim.veil),
      pressure: Math.max(held.pressure, claim.pressure),
      ring: Math.max(held.ring, claim.ring),
    }
  }, REST)
}

/**
 * The veil depth at which the world is heard to have closed.
 *
 * Crossing it in either direction is an event and gets a strike; moving inside
 * it is a fader. Gyo and On are above it, En sits just under, and Ren is
 * nowhere near — which is the ordering the anime scores.
 */
const SNAP = 0.5

/** Closing is a decision and opening is a release, so they take different times. */
const CLOSING = 0.3
const OPENING = 0.75

/** How long a torn-down effect has to be replaced before the veil lets go. */
const GRACE = 70

let shown: NenPerception = REST
let bed: NenBed | null = null
let last: Graph | null = null
let pending: number | null = null

function settle(next: NenPerception, g: Graph) {
  const seconds = next.veil > shown.veil ? CLOSING : OPENING
  if (next.veil >= SNAP && shown.veil < SNAP) snapIntoGyo(g)
  if (next.veil < SNAP && shown.veil >= SNAP) letGoOfGyo(g)
  setWorldVeil(next.veil, seconds)
  bed ??= nenBed(g)
  bed.pressure(next.pressure, seconds)
  bed.ring(next.ring, seconds)
  shown = next
  last = g
}

function cancelPending() {
  if (pending === null) return
  clearTimeout(pending)
  pending = null
}

/**
 * What the visitor's aura is doing to what the visitor can hear.
 *
 * Called from `sustainNenSound`, which the walk already re-runs on every change
 * of state — so this is written to be called constantly with the same argument
 * and do nothing when nothing moved.
 */
export function applyNenPerception(state: NenTechniqueState, g: Graph): void {
  cancelPending()
  settle(nenPerception(state), g)
}

/**
 * Lets the world back, once it is clear nothing is replacing the aura.
 *
 * The delay is the whole point. Every change of Nen tears the sustained voice
 * down and builds a new one in the same flush, so a release that acted at once
 * would open the veil and slam it shut again — with a strike on each edge —
 * every time the visitor pressed a key. Seventy milliseconds is far below the
 * gap between two deliberate presses and far above the gap between a teardown
 * and its replacement.
 */
export function releaseNenPerception(): void {
  if (pending !== null || typeof window === 'undefined') return
  pending = window.setTimeout(() => {
    pending = null
    if (last) settle(REST, last)
  }, GRACE)
}

/** Leaving the walk: the world comes back now, with no strike and no grace. */
export function dropNenPerception(): void {
  cancelPending()
  setWorldVeil(0, 0.2)
  bed?.pressure(0, 0.2)
  bed?.ring(0, 0.2)
  shown = REST
}
