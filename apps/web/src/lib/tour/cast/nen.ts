/**
 * The Nen the cast carries.
 *
 * One rule decides who glows, and it is not a rule about jobs: **aura if and
 * only if `data/` declares one**. A guard has no aura *because guard* — the
 * ship is full of ordinary soldiers, and the two the manga confirms as users
 * are soldiers too. The distinction is a fact about a person, so it lives in
 * the catalogue, where it can be sourced and linted, and never in a heuristic
 * here. The absent field covers "not a user" and "we do not know" with the same
 * silence, which is the honest thing for an archive that cannot tell them apart.
 *
 * What *is* decided here is the state: Ten at a post, Zetsu for a body that is
 * hiding, Ren when something in the room has just happened. That is conduct
 * rather than canon — nobody's page says which of the three Sakata is in at
 * 20:00 — so it is a small pure function with its parameters written down, and
 * it makes no claim about any technique.
 *
 * The output is `NenTechniqueState`, the same contract `humanFigure.ts` already
 * consumes for the visitor and for the combatants of Hunt. Nothing new is drawn.
 */
import { createNenTechniqueState, type NenTechniqueState } from '@black-whale/nen-engine'
import type { CastLook } from './distribution'
import type { Post } from './types'

/** The four parts the shared figure lights, and the only ones. */
type Part = 'head' | 'torso' | 'hands' | 'feet'

/** What has just happened in a room, as far as a body standing in it can tell. */
export interface Situation {
  /** The room the visitor is in, if the walk has put them in one. */
  visitorIn: string | null
  /** Whether the visitor has aura up: a raised technique is felt, not seen. */
  visitorCasting: boolean
  /** Rooms something hostile is standing in — the walk's own apparitions. */
  hostileRooms: readonly string[]
}

/** Nothing has happened: the state most of the ship is in, most of the time. */
export const CALM: Situation = { visitorIn: null, visitorCasting: false, hostileRooms: [] }

/**
 * The engine's own state, in the mode this body is holding.
 *
 * Built by `createNenTechniqueState` rather than assembled here: the shape is
 * the nen engine's, every figure in the walk already consumes it, and a second
 * hand-rolled version of it would be a second definition of what Ten is.
 */
function stateFor(mode: 'ten' | 'ren' | 'zetsu'): NenTechniqueState<Part> {
  const state = createNenTechniqueState<Part>()
  state.mode = mode
  return state
}

/**
 * Whether this body is keeping itself unfindable.
 *
 * Zetsu is what somebody hiding does, and the archive says who is hiding in the
 * one place it can: the role. An assassin working under a false identity and a
 * spy planted in another prince's detail are both bodies whose whole position is
 * not being read, and the catalogue names them as such.
 */
function isHiding(post: Post): boolean {
  const role = post.member.role.toLowerCase()
  return role.includes('assassin') || role.includes('undercover') || role.includes('infiltrateur')
}

/**
 * The aura one body is carrying, given what the room has just done.
 *
 * Ren is a reaction and not a temper: aura goes up when the visitor casts
 * within earshot — in the same room — or when something hostile is standing in
 * it. Everything else is Ten, because a trained body at a post is holding its
 * envelope and nothing more.
 */
export function auraFor(post: Post, situation: Situation = CALM): CastLook {
  if (!post.member.nen) return {}
  if (isHiding(post)) return { aura: 'zetsu', nen: stateFor('zetsu') }
  const alarmed =
    (situation.visitorCasting && situation.visitorIn === post.spaceId) ||
    situation.hostileRooms.includes(post.spaceId)
  const aura = alarmed ? 'ren' : 'ten'
  return { aura, nen: stateFor(aura), ...(alarmed ? { alert: true } : {}) }
}

/** The look for a whole distribution, as `castApparitions` wants it. */
export function auraReader(situation: Situation = CALM): (post: Post) => CastLook {
  return (post) => auraFor(post, situation)
}
