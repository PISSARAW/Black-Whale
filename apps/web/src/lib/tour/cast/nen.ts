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
 * What *is* decided here is the state, and it is the whole of what this module
 * argues about. Until now that state was one of three modes, which meant the
 * cast could only ever hold its envelope, raise it, or drop it — while the
 * visitor had the entire vocabulary. The figure builder has always known how to
 * draw the rest of it (`humanAura.ts` renders En rings, Gyo eyes, a Ken mantle
 * and a Ryu distribution), so the asymmetry was never in the drawing: it was
 * here, in a conduct that never emitted anything for it to draw.
 *
 * The four rules below are the conduct, and they are conduct rather than canon —
 * nobody's page says which technique Sakata is in at 20:00 — so this stays a
 * small pure function with its parameters written down, and it makes no claim
 * about any *hatsu*. What it does claim is ordinary Nen practice:
 *
 *   Zetsu — a body whose whole position is not being read.
 *   En    — a body posted to watch, sweeping the floor it is answerable for.
 *   Ren   — a body that has just been given a reason.
 *   Gyo   — a body looking at the aura it has just felt raised beside it.
 *   Ryu   — that same body putting its aura where a blow would land.
 *
 * Ko is deliberately absent. Ko is every other zone emptied into one, which is
 * a commitment to a strike, and nothing the walk can do to a body is a strike:
 * a guard who answered a visitor casting in the doorway by going all-in on one
 * fist would be the archive inventing an attack the canon never has them make.
 *
 * The output is `NenTechniqueState`, the same contract `humanFigure.ts` already
 * consumes for the visitor and for the combatants of Hunt. Nothing new is drawn.
 */
import {
  createNenTechniqueState,
  transitionNen,
  type NenAuraMode,
  type NenTechniqueAction,
  type NenTechniqueState,
} from '@black-whale/nen-engine'
import type { BodyMark } from './bodies'
import type { CastLook } from './distribution'
import type { Post } from './types'

/** The four parts the shared figure lights, and the only ones. */
type Part = 'head' | 'torso' | 'hands' | 'feet'

/**
 * How far a standing En reaches, in metres.
 *
 * Small on purpose. Canon En runs from a couple of metres to Nen-user famous
 * (Netero's fifty), and a private guard at a door is at the bottom of that
 * range: this is the room they are answerable for and one pace past its
 * threshold, not a net over the deck. It is also one constant rather than a
 * per-body number, which is what lets the ring geometry be shared by every
 * figure that sweeps instead of rebuilt per radius.
 */
export const WATCH_EN_RADIUS = 4

/**
 * Where an alarmed body puts its aura.
 *
 * Ryu is a distribution and not a total, and the engine normalises it, so these
 * are proportions: most of it on the torso, because that is what a trained body
 * covers first and what an untrained one forgets; a third on the hands, which
 * is what covering *with* looks like; a little left on the head and the feet,
 * because a zone at zero is a zone that has been abandoned, and nobody
 * abandons their head.
 */
const GUARDED: Partial<Record<Part, number>> = { torso: 0.5, hands: 0.3, head: 0.12, feet: 0.08 }

/** What has just happened in a room, as far as a body standing in it can tell. */
export interface Situation {
  /** The room the visitor is in, if the walk has put them in one. */
  visitorIn: string | null
  /** Whether the visitor has aura up: a raised technique is felt, not seen. */
  visitorCasting: boolean
  /** Rooms something hostile is standing in — the walk's own apparitions. */
  hostileRooms: readonly string[]
  /**
   * Who the visitor has their aura levelled at, personally.
   *
   * The room already knew that somebody was casting in it; ADR-004 adds that a
   * technique can be pointed at *you*, and being pointed at is not the same
   * event as being nearby when something happens. Only a raised aura carries —
   * `readingIsFelt` decides that, not this module — so a visitor merely looking
   * hard at a guard through Gyo does not put the corridor on edge.
   */
  aimedAt: string | null
  /**
   * What is currently held on which body, by character id.
   *
   * The walk's own doing, from `bodies.ts`, and read here rather than there
   * because how a person carries themselves under a thread is a fact about
   * conduct and this file is the conduct.
   */
  holds: Readonly<Record<string, BodyMark>>
}

/** Nothing has happened: the state most of the ship is in, most of the time. */
export const CALM: Situation = {
  visitorIn: null,
  visitorCasting: false,
  hostileRooms: [],
  aimedAt: null,
  holds: {},
}

/** The conduct one body is holding, before the engine has had its say. */
interface Conduct {
  mode: NenAuraMode
  /** A standing En at a post, in metres, or null for a body not watching. */
  en?: number | null
  /** Looking: aura to the eyes, to see what is being hidden. */
  gyo?: boolean
  /** Where the aura is put, or absent for a body that has not distributed it. */
  ryu?: Partial<Record<Part, number>>
}

const MODE_ACTIONS: Record<NenAuraMode, NenTechniqueAction<Part>> = {
  ten: { type: 'TEN' },
  ren: { type: 'REN' },
  zetsu: { type: 'ZETSU' },
}

/**
 * The engine's own state, in the conduct this body is holding.
 *
 * Every field goes in through `transitionNen` rather than being assigned, which
 * is what keeps this module from having opinions it is not entitled to: Zetsu
 * closing En and Gyo behind it, a Ryu distribution being normalised, a
 * non-positive radius being refused — all of that is the nen engine's, and
 * hand-rolling the state would be a second definition of what Ten is.
 *
 * The mode goes first because entering one clears the distribution: applied the
 * other way round, an alarmed body would raise Ren and drop the Ryu it raised
 * it for.
 */
function stateFor(conduct: Conduct): NenTechniqueState<Part> {
  const actions: NenTechniqueAction<Part>[] = [MODE_ACTIONS[conduct.mode]]
  if (conduct.en) actions.push({ type: 'EN', radius: conduct.en })
  if (conduct.gyo) actions.push({ type: 'GYO', on: true })
  if (conduct.ryu) actions.push({ type: 'RYU', distribution: conduct.ryu })
  return actions.reduce(
    (state, action) => transitionNen(state, action).state,
    createNenTechniqueState<Part>(),
  )
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

/** Roles the catalogue writes in two languages for the same standing order. */
const WATCHING = ['guard', 'garde', 'bodyguard', 'sentinel', 'surveillant', 'escorte', 'escort']

/**
 * Whether this body's job is to notice.
 *
 * Same shape of judgement as `isHiding`, and the same justification: the role
 * string is the only place the archive says what a body is *for*, and a guard
 * on a door who is a Nen user sweeps — that is what the technique is, and a
 * private guard who did not would be a guard drawn as decoration.
 *
 * It says nothing about whether the body has aura at all. A body without one in
 * `data/` never reaches here.
 */
function isWatching(post: Post): boolean {
  const role = post.member.role.toLowerCase()
  return WATCHING.some((word) => role.includes(word))
}

/**
 * How far the visitor's own doing has reached this body.
 *
 * Two answers rather than one, and the difference is the whole of the Gyo rule
 * below: `felt` is aura at *you* — levelled at you personally, or raised in the
 * room you are standing in — and `alarmed` adds what is merely visible in it. A
 * body looks harder only at what it felt and cannot see.
 */
function alarmOf(post: Post, situation: Situation): { felt: boolean; alarmed: boolean } {
  const aimed = situation.aimedAt === post.member.characterId
  const felt = aimed || (situation.visitorCasting && situation.visitorIn === post.spaceId)
  return { felt, alarmed: felt || situation.hostileRooms.includes(post.spaceId) }
}

/**
 * The aura one body is carrying, given what the room has just done.
 *
 * Ren is a reaction and not a temper: aura goes up when the visitor casts
 * within earshot — in the same room — or when something hostile is standing in
 * it. Gyo is narrower still, and only answers the first of those two: a
 * technique raised beside you is a thing you *felt* and cannot yet see, which is
 * exactly the question Gyo is for, where an apparition standing in the room is
 * already visible and looking harder at it buys nothing.
 */
export function auraFor(post: Post, situation: Situation = CALM): CastLook {
  if (!post.member.nen) return {}
  if (isHiding(post)) return { aura: 'zetsu', nen: stateFor({ mode: 'zetsu' }) }
  const held = situation.holds[post.member.characterId] ?? null
  if (held) return underHold(held)
  const { felt, alarmed } = alarmOf(post, situation)
  const aura = alarmed ? 'ren' : 'ten'
  const nen = stateFor({
    mode: aura,
    en: isWatching(post) ? WATCH_EN_RADIUS : null,
    gyo: felt,
    ...(alarmed ? { ryu: GUARDED } : {}),
  })
  return { aura, nen, ...(alarmed ? { alert: true } : {}) }
}

/**
 * How a body carries itself while the walk is holding it.
 *
 * Three answers, and the third is the one that matters. A body under a thread
 * or a mark is a body that has just been made to notice: aura up, put where a
 * blow would land, exactly as if a technique had gone off beside it. A body
 * under music or a closing chain settles instead — that is what those two
 * techniques *are*, and drawing Melody's flute as an alarm would be the walk
 * contradicting the ability it just performed.
 *
 * And a controlled body drops to Ten with nothing distributed: it is not
 * defending itself, because it is not the one deciding. The walk stops short of
 * saying more than that. Whether a needled sentry is aware of it is a question
 * the manga answers per case, and this file has no business answering it in
 * general — so it draws the difference and makes no claim about the mind.
 */
function underHold(held: BodyMark): CastLook {
  if (held === 'soothed') return { aura: 'ten', nen: stateFor({ mode: 'ten' }) }
  if (held === 'controlled') return { aura: 'ten', nen: stateFor({ mode: 'ten' }) }
  if (held === 'drained') return { aura: 'zetsu', nen: stateFor({ mode: 'zetsu' }) }
  return {
    aura: 'ren',
    nen: stateFor({ mode: 'ren', gyo: true, ryu: GUARDED }),
    alert: true,
  }
}

/** The look for a whole distribution, as `castApparitions` wants it. */
export function auraReader(situation: Situation = CALM): (post: Post) => CastLook {
  return (post) => auraFor(post, situation)
}
