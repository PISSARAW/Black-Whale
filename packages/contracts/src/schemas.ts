import { z } from 'zod'

/**
 * The shape of every file in `data/`.
 *
 * These schemas are deliberately *narrow on what the site reads* and open on
 * the rest: `data/` is an editorial archive and carries fields no page renders
 * yet. Rejecting those would make the catalogue harder to enrich, which is the
 * opposite of what ADR-001 wants. What is declared here is what something
 * depends on, and it is checked exactly.
 */

/** Kebab-case, the one identifier form `data/CONVENTIONS.md` allows. */
export const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'must be a kebab-case slug')

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

export const characterSchema = z
  .object({
    id: slug,
    canonicalName: z.string().min(1),
    aliases: z.array(z.string()).optional(),
    factionId: slug.nullable().optional(),
    firstAppearanceChapterId: slug.nullable().optional(),
    canonStatus: z.string().optional(),
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
    chapter: z.number().int().positive(),
    sequence: z.number().int().nonnegative(),
    summary: z.string().optional(),
    isFlashback: z.boolean().optional(),
    occursOnBlackWhale: z.boolean().optional(),
    occurredAt: z
      .object({
        basis: z.enum(['stated', 'derived']),
        hours: z.number().optional(),
        day: z.number().int().optional(),
      })
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
  'abilities/abilities.json': z.array(abilitySchema).min(1),
  'factions/factions.json': z.array(factionSchema).min(1),
  'locations/locations.json': z.array(locationSchema).min(1),
  'events/events.json': z.array(eventSchema).min(1),
  'prophecies/prophecies.json': z.array(prophecySchema),
  'ship/blueprint.json': blueprintSchema,
} as const

export type CataloguePath = keyof typeof CATALOGUE_FILES

export type Chapter = z.infer<typeof chapterSchema>
export type Character = z.infer<typeof characterSchema>
export type Ability = z.infer<typeof abilitySchema>
export type Faction = z.infer<typeof factionSchema>
export type Location = z.infer<typeof locationSchema>
export type CanonEvent = z.infer<typeof eventSchema>
export type Prophecy = z.infer<typeof prophecySchema>
export type Blueprint = z.infer<typeof blueprintSchema>
