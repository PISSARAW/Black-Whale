/**
 * What the visitor's aura does to a solid it is pressed against.
 *
 * Out of `TourScene.svelte`, where it was an inline ternary. The verb is
 * decided by the state alone, so it is a pure function of the state and can be
 * tested without a scene.
 *
 * On is asked about before the strike, and the order is the point. On imposes
 * its own Ryu, and the one the walk imposes is weighted to the hands and feet —
 * past the share that makes an ordinary distribution read as a strike. Asked in
 * the other order, a visitor in On always struck, and the heaviest push in the
 * walk (and the marker drawn in On's own colour) could never be reached.
 */
import type { NenTechniqueState } from '@black-whale/nen-engine'
import type { NenObjectInteraction } from './auraInteraction'

/** Share of the aura on hands and feet past which a distribution is a blow. */
const STRIKE_SHARE = 0.6

/** How far the solid is pushed, in metres, by verb. */
const FORCE = {
  strike: 0.9,
  on: 1.25,
  pressure: 0.55,
  ken: 0.32,
  channel: 0.18,
} as const

/** How far it turns, in degrees, by verb. */
const TURN: Record<NenObjectInteraction, number> = { strike: 7, pressure: 3, channel: 1, sense: 0 }

const attackShare = (nen: NenTechniqueState) =>
  Number(nen.ryu.hands ?? 0) + Number(nen.ryu.feet ?? 0)

/** The verb this state makes of a touch. */
export function touchKind(nen: NenTechniqueState): NenObjectInteraction {
  if (nen.on) return 'pressure'
  if (nen.ko || attackShare(nen) >= STRIKE_SHARE) return 'strike'
  if (nen.mode === 'ren') return 'pressure'
  if (nen.gyo || nen.en) return 'sense'
  return 'channel'
}

/** How far a touch of this kind, in this state, moves the solid. */
export function touchForce(kind: NenObjectInteraction, nen: NenTechniqueState): number {
  if (kind === 'strike') return FORCE.strike
  if (kind === 'pressure') return nen.on ? FORCE.on : FORCE.pressure
  return nen.ken ? FORCE.ken : FORCE.channel
}

/** How far a touch of this kind turns the solid. */
export const touchTurn = (kind: NenObjectInteraction) => TURN[kind]
