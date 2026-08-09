import { z } from 'zod'
import { appearanceFileSchema } from './appearance.js'
import { chapterRef, slug } from './primitives.js'

/**
 * The shape of every file in `data/`.
 *
 * These schemas are deliberately *narrow on what the site reads* and open on
 * the rest: `data/` is an editorial archive and carries fields no page renders
 * yet. Rejecting those would make the catalogue harder to enrich, which is the
 * opposite of what ADR-001 wants. What is declared here is what something
 * depends on, and it is checked exactly.
 */

/**
 * The identifier forms, re-exported from `primitives.ts`.
 *
 * They moved down a file so `appearance.ts` could use them without importing
 * back into this one — see the head of `primitives.ts`. Everything that ever
 * imported them from here still can.
 */
export { chapterRef, slug }

/**
 * How well a fact is sourced, best first.
 *
 * The order is the ship README's authority ladder, and it is a real order: a
 * volume drawn on a panel outranks one placed from a `/ship` map, which
 * outranks one inferred. Nothing may cite a weaker rank than its container —
 * see `invariants.ts`.
 */
export const PROVENANCE_RANKS = ['manga', 'panel', 'plan', 'map', 'inferred'] as const
export const provenance = z.enum(PROVENANCE_RANKS)
export type Provenance = z.infer<typeof provenance>

/** Lower is better sourced. */
export function provenanceRank(value: Provenance): number {
  return PROVENANCE_RANKS.indexOf(value)
}

export const canonStatus = z.enum(['canon', 'semi-canon', 'non-canon', 'databook', 'inferred'])

/**
 * How the map may draw a position.
 *
 * `databook` is a room from Togashi's character sheets: the room is stated, the
 * chapter never is. `inferred` is weaker still — canon puts the passenger on a
 * tier and never names their room, so the catalogue picks the one their
 * affiliation implies. Both are deductions and the map has to show them as such.
 */
export const positionProvenance = z.enum(['databook', 'inferred'])

/** Statuses that put the character's body on panel. See `deathChapter`. */
export const APPEARANCE_STATUSES = [
  'absent',
  'appears',
  'debut',
  'death',
  'corpse',
  'disguised',
  'impersonated',
  'clone',
  'soul',
  'flashback',
  'pictured',
  'mentioned',
  'vision',
  'voice',
] as const

const mangaAppearanceSchema = z
  .object({
    chapter: z.number().int().positive(),
    title: z.string().min(1),
    status: z.enum(APPEARANCE_STATUSES),
  })
  .passthrough()

/**
 * `shipLocation` can only describe one position, so a character who moves
 * during the arc declares each leg here instead. A leg ends where the next one
 * begins; `untilChapterId` is only for a final leg that stops without a
 * successor.
 */
const trajectoryLegSchema = z
  .object({
    location: slug,
    fromChapterId: chapterRef,
    untilChapterId: chapterRef.nullable().optional(),
    certainty: z.enum(['CONFIRMED', 'PROBABLE', 'LAST_KNOWN']).optional(),
    /** The manga places this leg in the corridor immediately outside this room. */
    outsideDoorOf: slug.optional(),
    note: z.string().optional(),
  })
  .passthrough()

/**
 * The shapes the walk can draw a Nen creature in.
 *
 * A closed list here rather than a free string, and declared in the contracts
 * rather than read out of `apps/web`: a silhouette is a claim the archive makes
 * about a beast, so it has to be checkable by canon-lint, which never opens the
 * site. `lib/tour/nenCreatureFigure.ts` holds the drawings and a test there
 * asserts the two lists still name the same shapes.
 */
export const NEN_CREATURE_SILHOUETTES = [
  'owl',
  'fish',
  'insect',
  'medusa',
  'chimera',
  'monster',
  'toad',
  'wheel',
  'tyson-guardian',
  'wog',
  'centipede',
  'mouths',
  'sprite',
  'dragon',
  'ghost',
  'cat',
] as const

/**
 * The shapes that stand in a room, as opposed to riding the visitor.
 *
 * Two of the sixteen are not creatures in a room at all: Tyson's eye-wog and
 * its parent hang in front of whoever is reading the Book of Tyson, so the walk
 * draws them at the camera — that is the ability, and it is why they exist. A
 * *posed* beast has to be somewhere a visitor can walk up to and aim at, so
 * declaring one of those two as a guardian beast's silhouette produces an
 * animal glued to the visitor's face on every deck of the ship, which is what
 * it did until this list existed.
 *
 * `scripts/silhouettes.test.ts` keeps it honest: it reads which kinds the scene
 * positions from the camera and asserts none of them is in here.
 */
export const POSED_SILHOUETTES = [
  'owl',
  'fish',
  'insect',
  'medusa',
  'chimera',
  'monster',
  'toad',
  'wheel',
  'centipede',
  'mouths',
  'sprite',
  'dragon',
  'ghost',
  'cat',
] as const

/**
 * The Guardian Spirit Beast a prince carries.
 *
 * Declared rather than derived, because deriving it from `abilities.json` is
 * wrong in both directions: Woble's beast has no catalogued technique, and a
 * catalogued technique is the beast's *ability* rather than proof of where the
 * animal stands. `sourceChapterId` is what makes it a fact and not a
 * decoration — see the `guardian-beast` invariant.
 */
const guardianBeastSchema = z
  .object({
    silhouette: z.enum(POSED_SILHOUETTES),
    sourceChapterId: chapterRef,
    /**
     * Whose position the beast keeps, when its owner has none of their own.
     *
     * One prince needs it. The real Woble's whereabouts are never confirmed, so
     * the catalogue gives that body no trajectory at all — while the beast is
     * seen in room 1014, around the cradle of the child presented as Woble.
     * Naming that body here is what lets the walk place the animal without
     * either inventing a position for the prince or filing the beast under
     * somebody it does not belong to.
     */
    standsWith: slug.optional(),
    note: z.string().optional(),
  })
  .passthrough()

/**
 * What the archive knows of someone's Nen.
 *
 * The presence of the block is the load-bearing part: ADR-003 gives an aura to
 * whoever declares one and to nobody else, so an absent block covers both "not
 * a user" and "we do not know" without the site having to guess between them.
 * `confirmed` exists for the users canon shows carrying aura without ever
 * naming a category — the claim is the user, not the category.
 */
const nenSchema = z
  .object({
    type: z.string().min(1).optional(),
    typeLabel: z.string().min(1).optional(),
    confirmed: z.boolean().optional(),
    overview: z.string().min(1).optional(),
    techniques: z.array(z.string()).optional(),
    abilityIds: z.array(slug).optional(),
  })
  .passthrough()

const shipLocationSchema = z
  .object({
    tier: z.number().int().min(1).max(5).nullable(),
    room: z.string().nullable(),
    status: z.string(),
    role: z.string(),
  })
  .passthrough()

const point = z.tuple([z.number(), z.number()])

export const chapterSchema = z
  .object({
    id: slug,
    number: z.number().int().positive(),
    publicationOrder: z.number().int().positive().optional(),
    title: z.string().min(1),
    date: z.string().optional(),
  })
  .passthrough()

/**
 * A character, and everything the map compiler projects into the database.
 *
 * The fields below the identity block are not decoration: `canon-compiler`
 * turns each of them into rows — a Presence, a BodyState, a closing bound — and
 * a value it cannot read is a passenger who silently leaves the map. They were
 * `passthrough()` for as long as only `.mjs` scripts read them.
 */
export const characterSchema = z
  .object({
    id: slug,
    canonicalName: z.string().min(1),
    aliases: z.array(z.string()).optional(),
    description: z.string().nullable().optional(),
    factionId: slug.nullable().optional(),
    firstAppearanceChapterId: chapterRef.nullable().optional(),
    canonStatus: z.string().optional(),
    shipLocation: shipLocationSchema.optional(),
    /** Declared, and the only thing that gives a silhouette an aura. */
    nen: nenSchema.optional(),
    /** Declared, and the only thing that puts a beast in a prince's salon. */
    guardianBeast: guardianBeastSchema.optional(),
    positionProvenance: positionProvenance.optional(),
    mapTrajectory: z.array(trajectoryLegSchema).optional(),
    mangaAppearances: z.array(mangaAppearanceSchema).optional(),
    mapPresenceFromChapterId: chapterRef.nullable().optional(),
    mapPresenceUntilChapterId: chapterRef.nullable().optional(),
    /** The identity backfill owns this body's history; see `canon-compiler`. */
    temporalIdentityManaged: z.boolean().optional(),
    replaceMapPresenceHistory: z.boolean().optional(),
  })
  .passthrough()

export const abilitySchema = z
  .object({
    id: slug,
    name: z.string().min(1),
    ownerId: slug.nullable().optional(),
    userIds: z.array(slug).optional(),
    category: z.string().min(1),
    description: z.string().min(1),
    canonStatus: z.string().min(1),
    moduleKey: slug.nullable().optional(),
    /**
     * Optional today, and the reason `ability-visibility.ts` has to infer a
     * date from the owner. Every entry that carries one is one fewer guess.
     */
    firstVisibleChapterId: slug.nullable().optional(),
  })
  .passthrough()

export const ABILITY_USE_STATUSES = [
  'ACTIVATED',
  'MAINTAINED',
  'REVEALED',
  'FAILED',
  'PREVENTED',
  'EXPLAINED',
] as const

/** A named Hatsu's relationship to one published chapter or event. */
export const abilityUseSchema = z
  .object({
    id: slug,
    chapter: z.number().int().positive(),
    eventTitle: z.string().min(1).optional(),
    abilityId: slug,
    userId: slug,
    status: z.enum(ABILITY_USE_STATUSES),
    occursOnBlackWhale: z.boolean(),
    note: z.string().min(1),
  })
  .strict()

export const factionSchema = z
  .object({
    id: slug,
    name: z.string().min(1),
    description: z.string().optional(),
  })
  .passthrough()

export const locationSchema = z
  .object({
    id: slug,
    name: z.string().min(1),
    deck: z.number().int().nullable().optional(),
    zoneType: z.string().optional(),
    parentLocationId: slug.nullable().optional(),
  })
  .passthrough()

export const eventSchema = z
  .object({
    title: z.string().min(1),
    chapterTitle: z.string().min(1),
    chapter: z.number().int().positive(),
    sequence: z.number().int().nonnegative(),
    summary: z.string().optional(),
    /**
     * Titles a previous run wrote for this event. The timeline pass matches on
     * them so a renamed event is updated in place instead of duplicated.
     */
    legacyTitles: z.array(z.string()).optional(),
    /** Anchors a flashback beside the event it belongs after, not its chapter. */
    occursAfterTitle: z.string().optional(),
    /** Only read off the voyage clock; on it, the label is rendered. */
    occurredAtLabel: z.string().optional(),
    isFlashback: z.boolean().optional(),
    occursOnBlackWhale: z.boolean().optional(),
    /**
     * `passthrough()` is load-bearing, not habit. The voyage clock reads
     * `hoursUntil` and `source` off this object, and a closed schema drops
     * whatever it does not name — which turned "12:15-12:30" into "12:15" the
     * first time this was written closed.
     */
    occurredAt: z
      .object({
        basis: z.enum(['stated', 'derived']),
        hours: z.number().optional(),
        hoursUntil: z.number().optional(),
        day: z.number().int().optional(),
        // The five kinds the domain's `SourceType` allows; the clock reads it.
        source: z.enum(['manga', 'anime', 'databook', 'interview', 'community']).optional(),
      })
      .passthrough()
      .refine((value) => value.hours !== undefined || value.day !== undefined, {
        message: 'occurredAt needs hours or day; `bracketed` is computed, never written',
      })
      .optional(),
  })
  .passthrough()

export const prophecySchema = z
  .object({
    id: slug,
    subjectId: slug.nullable().optional(),
    factionId: slug.nullable().optional(),
    canonStatus: z.string().optional(),
  })
  .passthrough()

const shipSpaceSchema = z
  .object({
    id: slug,
    tierId: slug,
    locationId: slug.nullable().optional(),
    name: z.string().min(1),
    nameFr: z.string().min(1),
    provenance,
    source: z.string().min(1),
    /** Null when the space takes its tier's ceiling; 166 spaces do. */
    ceiling: z.number().positive().nullable(),
    footprint: z.array(point).min(3),
  })
  .passthrough()

const shipTierSchema = z
  .object({
    id: slug,
    name: z.string().min(1),
    elevation: z.number(),
    ceiling: z.number().positive(),
    provenance,
    hull: z.array(point).min(3),
  })
  .passthrough()

const shipStructureSchema = z
  .object({
    id: slug,
    spaceId: slug,
    kind: z.string().min(1),
    base: z.number(),
    height: z.number().positive(),
    provenance,
  })
  .passthrough()

const shipLinkSchema = z
  .object({
    from: slug,
    to: slug,
    kind: z.string().min(1),
    provenance,
  })
  .passthrough()

export const blueprintSchema = z
  .object({
    meta: z.object({ unit: z.string() }).passthrough(),
    tiers: z.array(shipTierSchema).min(1),
    spaces: z.array(shipSpaceSchema).min(1),
    links: z.array(shipLinkSchema),
    structures: z.array(shipStructureSchema),
  })
  .passthrough()

/** Every catalogue file, by the path it lives at under `data/`. */
export const CATALOGUE_FILES = {
  'chapters/chapters.json': z.array(chapterSchema).min(1),
  'characters/characters.json': z.array(characterSchema).min(1),
  'characters/appearance.json': appearanceFileSchema,
  'abilities/abilities.json': z.array(abilitySchema).min(1),
  'abilities/uses.json': z.array(abilityUseSchema),
  'factions/factions.json': z.array(factionSchema).min(1),
  'locations/locations.json': z.array(locationSchema).min(1),
  'events/events.json': z.array(eventSchema).min(1),
  'prophecies/prophecies.json': z.array(prophecySchema),
  'ship/blueprint.json': blueprintSchema,
} as const

export type CataloguePath = keyof typeof CATALOGUE_FILES

export type Chapter = z.infer<typeof chapterSchema>
export type Character = z.infer<typeof characterSchema>
export type ShipLocation = z.infer<typeof shipLocationSchema>
export type GuardianBeast = z.infer<typeof guardianBeastSchema>
export type NenDeclaration = z.infer<typeof nenSchema>
export type NenSilhouette = (typeof NEN_CREATURE_SILHOUETTES)[number]
export type PosedSilhouette = (typeof POSED_SILHOUETTES)[number]
export type TrajectoryLeg = z.infer<typeof trajectoryLegSchema>
export type MangaAppearance = z.infer<typeof mangaAppearanceSchema>
export type AppearanceStatus = (typeof APPEARANCE_STATUSES)[number]
export type Ability = z.infer<typeof abilitySchema>
export type AbilityUse = z.infer<typeof abilityUseSchema>
export type AbilityUseStatus = (typeof ABILITY_USE_STATUSES)[number]
export type Faction = z.infer<typeof factionSchema>
export type Location = z.infer<typeof locationSchema>
export type CanonEvent = z.infer<typeof eventSchema>
export type Prophecy = z.infer<typeof prophecySchema>
export type Blueprint = z.infer<typeof blueprintSchema>
