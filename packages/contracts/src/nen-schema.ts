import { z } from 'zod'
import { chapterRef, slug } from './primitives.js'

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
  'cookie',
  'hoover',
  'animal-object',
  'benjamin-guardian',
  'halkenburg-guardian',
  'nasubi-guardian',
  'tserriednich-second',
  'dolphin',
  'predator-salesale',
  'blood-snake',
  'nen-spider',

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
 * Attested guardian anatomies. A posed guardian is anchored to its room or
 * owner before camera-carried animations run. Tyson therefore shares one
 * heart-shaped model between the salon and the active technique.
 * `scripts/silhouettes.test.ts` checks the vocabulary and this placement guard.
 */
export const POSED_SILHOUETTES = [
  'benjamin-guardian',
  'halkenburg-guardian',
  'nasubi-guardian',
  'medusa',
  'chimera',
  'toad',
  'wheel',
  'tyson-guardian',
  'centipede',
  'mouths',
  'sprite',
  'dragon',
] as const

/**
 * The Guardian Spirit Beast a prince carries.
 *
 * Declared rather than derived, because deriving it from `abilities.json` is
 * a catalogued technique is the beast's ability rather than evidence of its
 * visible anatomy or position. An unrevealed beast has no silhouette entry. `sourceChapterId` is what makes it a fact and not a
 * decoration — see the `guardian-beast` invariant.
 */
export const guardianBeastSchema = z
  .object({
    silhouette: z.enum(POSED_SILHOUETTES),
    sourceChapterId: chapterRef,
    /** Another attested body's position, when the owner has no trajectory. */
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
export const nenSchema = z
  .object({
    type: z.string().min(1).optional(),
    typeLabel: z.string().min(1).optional(),
    confirmed: z.boolean().optional(),
    overview: z.string().min(1).optional(),
    techniques: z.array(z.string()).optional(),
    abilityIds: z.array(slug).optional(),
    /** First chapter at which the character may be projected as an awakened user. */
    awakenedFromChapterId: chapterRef.optional(),
    /** Full, dated snapshots of the posture the canonical tour may render. */
    tourConduct: z
      .array(
        z
          .object({
            fromChapterId: chapterRef,
            mode: z.enum(['ten', 'zetsu']),
            concealedWithIn: z.boolean(),
            enRadius: z.number().positive().nullable(),
          })
          .strict(),
      )
      .optional(),
  })
  .passthrough()
