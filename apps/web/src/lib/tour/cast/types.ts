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
