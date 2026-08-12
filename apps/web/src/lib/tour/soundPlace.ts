import { listenerNow, type Place } from '$lib/audio/space'

import { theShip } from './blueprint'
import { centroid, solidById, type TourReport, type TourWorld } from './hatsu'
import type { Reach } from './cast'

/**
 * Where a report happened, so the ear can be told.
 *
 * The walk has never had to answer this before: a sound was played, and where
 * it came from was not a question the mixer could ask. It is answerable
 * without inventing anything, because the reports already say what they landed
 * on — a room by its identifier or a solid by its own — and the blueprint says
 * where those are. Nothing here decides a position; it looks two up.
 *
 * The world is remembered rather than passed. Every one of these calls sits at
 * the end of a chain that starts in a Svelte handler, and threading the world
 * through `playTourReportSound` would put a third parameter on nine call sites
 * to carry a fact the page is already holding. `pageHatsuAudio` hands it over
 * whenever it changes, which is the same place the muffle and the held loops
 * are driven from.
 */

let known: TourWorld | null = null

/** The world the walk is in, for the two lookups below. */
export function rememberSoundWorld(world: TourWorld): void {
  known = world
}

/** A room's own centre, unless a technique has moved the room's contents. */
function placeOfSpace(spaceId: string): Place | null {
  const space = theShip().spaces.get(spaceId)
  if (!space) return null
  return { at: known?.landed[spaceId] ?? centroid(space), spaceId }
}

function placeOfSolid(solidId: string): Place | null {
  const world = known
  if (!world) return null
  const solid = solidById(theShip(), world, solidId)
  return solid ? { at: solid.at, spaceId: solid.spaceId } : null
}

/**
 * Where a cast landed, or null for one that landed nowhere in particular.
 *
 * Null is a real answer and not a failure: a refusal, a mode change or an
 * ability turning on happens at the visitor, and a sound made at the visitor is
 * a sound in the middle of their head. Those keep the voice they have always
 * had, unpanned, which is where they belong.
 *
 * The solid is preferred over the room when a report names both, because it is
 * the more precise of the two answers to the same question: a crate broken at
 * the far end of the hold is at the crate, not at the middle of the hold.
 */
export function placeOfReport(report: TourReport): Place | null {
  const held = report as { solidId?: string; spaceId?: string }
  if (typeof held.solidId === 'string') {
    const solid = placeOfSolid(held.solidId)
    if (solid) return solid
  }
  if (typeof held.spaceId === 'string') return placeOfSpace(held.spaceId)
  return null
}

/** How far down the reticle a body stood, in metres. */
const AN_ARM_AND_A_HALF = 2.5

/**
 * Where a cast at a person happened: down the reticle, in front of the ear.
 *
 * The bodies the walk draws are placed by the renderer from the world state and
 * are not in the report — a `Reach` says who was reached and what it did to
 * them, never where they were standing. What is certain is that they were down
 * the reticle when the cast went out, which is what this returns: a couple of
 * metres ahead, in the room the visitor is in. That is a fact about the cast
 * rather than a guess about the body, and it is the fact the ear needs.
 *
 * A refusal is placed nowhere, for the reason `reachSound` gives it no voice:
 * nothing left the visitor.
 */
export function placeOfReach(reach: Reach): Place | null {
  if (reach.outcome === 'refused') return null
  const { at, heading, spaceId } = listenerNow()
  return {
    at: [
      at[0] - Math.sin(heading) * AN_ARM_AND_A_HALF,
      at[1] - Math.cos(heading) * AN_ARM_AND_A_HALF,
    ],
    spaceId,
  }
}
