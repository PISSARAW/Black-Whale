/**
 * The distribution: who the walk is allowed to draw, and what it knows of them.
 *
 * ADR-003 peoples the tour with the named characters of the canon and nobody
 * else. Everything in this folder is a projection of two things the archive
 * already holds — the world state `/ship` reads at the same event, and
 * `blueprint.json` — so nothing here declares a fact. The types below are the
 * seam between the two: what the server hands over, and what the walk makes of
 * it.
 *
 * A room the canon does not people stays empty. That is the whole doctrine, and
 * it is enforced by having no way to say otherwise: there is no "generic guard"
 * in any of these shapes.
 */
import type { Apparition } from '../apparitions'
import type { Vec2 } from '../types'
import type { CastDossier } from './dossier'
import type { TourWorld } from './world'
import type { SolidHold } from './worldPieces'
import type { TourReport } from './report'
import type { TourTune } from './modes'

import type { Ship } from '../blueprint'
import type { Structure } from '../types'

export { OWL_MODES, DOUBLE_MODES, EYE_MODES, TUNES } from './modes'
export type { TourTune, TourOwlMode, TourDoubleMode, TourEyeMode } from './modes'

/** The nine looks `humanProfiles.ts` draws. */
export type HumanRole = NonNullable<Apparition['human']>['role']

/** What a body is dressed in, when its role's own clothes are not the answer. */
export type Dress = 'civilian' | 'uniform' | 'suit' | 'combat' | 'ritual' | 'gown'

/** A look: the profile a body is drawn from, and what it is wearing. */
export interface Costume {
  role: HumanRole
  /** Omitted where the role's own clothing is already right. */
  dress?: Dress
}

/**
 * One body the world state puts aboard, trimmed to what the walk reads.
 *
 * Built on the server, from the same `getWorldState` projection `/ship` draws
 * its markers from — never re-derived from `mapTrajectory`, which is what keeps
 * a divergence between the map and the walk impossible rather than unlikely.
 *
 * `characterId` is the identity valid **at the reader's cap**: a body wearing
 * someone else's face travels under the face, because the cap is a reading
 * position and a revelation the reader has not reached is not a fact yet.
 */
export interface CastMember {
  characterId: string
  name: string
  /**
   * The catalogue location the body stands in, and every location under it.
   *
   * One slug is the common case. A sector — the political ward, say — resolves
   * to the rooms beneath it, and the walk picks one deterministically rather
   * than dropping the body or drawing it in a bulkhead.
   */
  locations: string[]
  /** `shipLocation.role`, verbatim: the string the wardrobe is keyed on. */
  role: string
  /** The chapter this position starts at, for the provenance card. */
  since: string | null
  /** Whether `data/` declares this person a Nen user. Nothing else grants aura. */
  nen: boolean
  /**
   * The techniques the canon gives this person, kept to the kinds the walk
   * already carries.
   *
   * Resolved on the server, from `abilities.json` by owner and the walk's own
   * `TOUR_HATSU_KINDS` — so the browser is never handed a technique the tour
   * could not perform, and the conduct has nothing to filter but the beasts.
   */
  hatsu: string[]
  /** The beast declared on this character, if any. See `beasts.ts`. */
  beast: CastBeast | null
  /**
   * Whether the catalogue names a place rather than a room, so the exact spot
   * is the walk's own.
   *
   * Absent is the strong case: a room number, and the body is where the archive
   * puts it. Present, the archive is just as sure of the *place* — the family
   * office, the ward, the cabins — and it is the walk that chose which corner of
   * it to stand them in, deterministically, from their own id. Carried this far
   * so the provenance card can say which of the two it is; nothing draws
   * differently for it, because an approximate spot in the right room is still
   * the right room.
   */
  approximate?: boolean
}

/** A Guardian Spirit Beast, as declared in `data/` and placed by the walk. */
export interface CastBeast {
  /** The character the beast belongs to — not always the body it stands with. */
  ownerId: string
  ownerName: string
  silhouette: Apparition['kind']
  sourceChapterId: string
}

/** What the server hands the walk: the cast at one event, and which event. */
export interface CastPayload {
  eventId: string | null
  chapterNumber: number | null
  /** The reader's cap, or null when they have not set one. */
  spoilerLimit: number | null
  members: CastMember[]
  /** Beasts whose owner has no position and stands with somebody who has. */
  beasts: StandingBeast[]
  /**
   * What each body can be asked, by character id (ADR-004 §2.4).
   *
   * Built on the server and cut to the reader's chapter there, which is what
   * makes the cut enforceable: the browser cannot show what it was never sent,
   * so no amount of clicking — and no technique, Body and Soul included —
   * reaches past the cap. One entry per member, and members are already the
   * people the walk is allowed to draw.
   */
  dossiers: Record<string, CastDossier>
}

/** A beast that keeps another body's position, resolved to that body. */
export interface StandingBeast extends CastBeast {
  /** The character whose position the animal keeps. */
  standsWithId: string
}

/** Where one body actually stands, once the geometry has had its say. */
export interface Post {
  member: CastMember
  spaceId: string
  tierId: string
  at: Vec2
  /** Which way it faces, or absent to turn to whoever is looking. */
  heading?: number
  costume: Costume
  /**
   * Whether this is the body's place on the interior level of its room, rather
   * than on the deck the room is a box on. Both are the same room.
   */
  inside?: boolean
}

/** An empty payload: what the walk shows before the server has answered. */
export const NO_CAST: CastPayload = {
  eventId: null,
  chapterNumber: null,
  spoilerLimit: null,
  members: [],
  beasts: [],
  dossiers: {},
}

/**
 * Where the visitor is standing: the point, and the room that point falls in.
 *
 * The pair is named because nothing here can use one without the other — a
 * distance needs the point, and the deck it is measured across needs the room —
 * and because passing them apart is how they get passed the wrong way round.
 */
export interface Stood {
  at: Vec2
  standingIn: string | null
}

/** Where the visitor is standing and what they are pointing at from there. */
export interface Aim {
  at: Vec2
  /** Bearing in radians, as the walk's own movement code has it. */
  heading: number
  /** How far down the line to look, in metres. Each caller has its own reach. */
  range?: number
}

/** A deck at a moment of the walk's clock. */
export interface DeckMoment {
  tierId: string
  seconds?: number
}

/** That same deck, plus the visitor, so anything carried rides along. */
export interface LoadedDeck extends DeckMoment {
  /** Where the visitor is, so anything Kurton is carrying moves with them. */
  carrier?: Vec2
}

/** A deck, a point on it, and the way the visitor is facing. */
export interface Heading {
  tierId: string
  at: Vec2
  heading: number
}

/** The reconstruction, and what the techniques have done to it. */
export interface Scene {
  ship: Ship
  world: TourWorld
}

/** One solid and the hold a technique currently has on it. */
export interface HeldSolid {
  structure: Structure
  hold: SolidHold | undefined
}

/** A ray cast across a deck: where it starts, and the way it runs. */
export interface Ray {
  at: Vec2
  dx: number
  dz: number
}

/** A tune, and the room it is played in. */
export interface Played {
  tune: TourTune
  spaceId: string
}

/** The pair of doors a step is taken between. */
export interface Doors {
  spaceId: string | null
  arrivedFrom: string | null
}

/** What the paired doors need beyond themselves, when they need anything. */
export interface DoorOptions {
  ship?: Ship
  random?: () => number
}

/** Which room the owl is sent to, and how one is picked when it is at random. */
export interface Perch {
  targetId: string
  standingIn: string | null
  random: () => number
}

/** One marked solid, read at a moment of the walk's clock. */
export interface Mark {
  id: string
  hold: SolidHold
  seconds: number
}

/**
 * The façade. `TourWorld`, its pieces and `TourReport` were moved out under
 * ADR-002 when this file passed 500 lines; they keep this path so nothing
 * outside the folder had to change.
 */
export type { TourWorld } from './world'
export type { SolidHold, TourBook, TourBody, VowState } from './worldPieces'
export { CLOSED_BOOK, EMPTY_WORLD, RESTING_BODY } from './worldPieces'
export type { TourReport } from './report'

export interface TourCastInput {
  ship: Ship
  /** The room the technique is aimed at, or `null` when it is aimed at nothing. */
  targetId: string | null
  /** The solid down the reticle, for the techniques that work on solids. */
  targetSolidId?: string | null
  /** The room the visitor is standing in. */
  standingIn: string | null
  /** Where they stand, on their own deck. */
  at: Vec2
  /** Which way they face: a push goes where they are looking. */
  heading?: number
  /**
   * Whose cast this is, or `null`/absent for the visitor's own.
   *
   * The conduct casts through this same door, so a technique whose cost falls
   * on its user has to know which user. Emperor Time is the one that makes it
   * matter: a Kurapika who goes scarlet in the Woble quarters under the emotion
   * of the moment is spending *his* years, and charging them to the reader
   * would be the walk making somebody else's price the visitor's.
   */
  caster?: string | null
  /**
   * Which of The Sun and Moon's two hands is casting.
   *
   * Genthru puts the sun on with one hand and the moon with the other, and
   * which one he uses is his own decision rather than a turn taken — so the
   * walk gives the two marks two keys, and this is which of them was pressed.
   * Nothing else in the roster reads it.
   */
  mark?: 'sun' | 'moon'
  /**
   * Which of Enchanting Music's three airs is being played.
   *
   * The same shape as the hand above and for the same reason: three keys, and
   * which one was pressed is the whole of what the walk has to carry across.
   * Absent, the flute is not raised at all and the technique does what it did
   * before it had one — it soothes.
   */
  tune?: TourTune
  /**
   * The two rules spoken aloud by Judgment Chain. Kept in the world so the
   * registry can show them exactly as they were declared.
   */
  rules?: string[]
  /** Deterministic in tests; Chrollo's teleport is the only caller. */
  random?: () => number
}

export interface TourCastResult {
  world: TourWorld
  report: TourReport
  /** A space the visitor is moved to, if the technique moves them. */
  travelTo?: string
}
