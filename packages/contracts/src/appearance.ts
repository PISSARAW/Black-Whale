import { z } from 'zod'
import { chapterRef, slug } from './primitives.js'

/**
 * What the named people of the arc look like — ADR-005.
 *
 * The renderer has known how to draw a manga panel since the walk existed: flat
 * colour and an inverted-hull outline. What it never had was a *fact*. Nothing
 * anywhere in `data/` said what Kurapika looks like, so the walk drew him the
 * way it drew any hunter — a role palette and a hairstyle pulled out of a hash
 * of his own id.
 *
 * So a likeness is declared here, exactly as a costume is declared in
 * `wardrobe.ts` and a date in `occurredAt`: a closed table, no inference and no
 * default. A body with no entry is drawn precisely as it was drawn yesterday,
 * because refusing to invent a face is the same gesture as refusing to invent a
 * passenger.
 *
 * Every vocabulary below is closed. A value outside one is a zod error rather
 * than a variant, which is what stops "a bun is nearly a ponytail" from
 * becoming the way the archive describes hair.
 */

/**
 * The body plan a figure is built on.
 *
 * `child` and `infant` exist because two of the fourteen princes had no gabarit
 * at all: Marayam was an adult scaled down, and Woble — who is never a standing
 * silhouette — was the same adult scaled down further. A proportion is not a
 * scale factor, and a baby drawn as a small man is the tell.
 */
export const APPEARANCE_FRAMES = ['adult', 'child', 'infant'] as const

/** The three the figure builder already carries. */
export const APPEARANCE_BUILDS = ['slim', 'average', 'broad'] as const

/** The three skull shapes `humanHead.ts` squashes its sphere into. */
export const APPEARANCE_FACES = ['narrow', 'round', 'square'] as const

/** The five expressions the eyes and brows are already drawn in. */
export const APPEARANCE_EXPRESSIONS = ['neutral', 'severe', 'tired', 'anxious', 'hostile'] as const

/**
 * Every hairstyle the walk can draw, closed.
 *
 * The first eight are what `humanHead.ts` shipped with. The rest are ADR-005
 * §4-P2's, plus `bun` — the one amendment the annexe needed, because three of
 * the queens wear a chignon and filing a chignon under `ponytail` would be the
 * archive lying in the one field it says it does not lie in.
 *
 * Ordered as the walk gained them rather than alphabetically: the split is the
 * argument, and reading it in order is what makes the new nine legible as one
 * decision.
 */
export const APPEARANCE_HAIR_STYLES = [
  'short',
  'military',
  'swept',
  'long',
  'ponytail',
  'spiked',
  'shaved',
  'bob',
  'bowl',
  'slicked-back',
  'pompadour',
  'drills',
  'chonmage',
  'hime',
  'curly',
  'afro',
  'wild',
  'bald-crown',
  'bun',
] as const

/**
 * What a declared body wears, when the role's own clothes are not the answer.
 *
 * The first six are `wardrobe.ts`'s. `changshan` and `kimono` are here because
 * two people aboard are drawn in a garment the six have no room for, and
 * dressing Zhang Lei in a western suit is the sort of quiet wrongness this
 * whole file exists to make impossible.
 */
export const APPEARANCE_ATTIRE = [
  'civilian',
  'uniform',
  'suit',
  'combat',
  'ritual',
  'gown',
  'changshan',
  'kimono',
] as const

/**
 * Annexe B: the signature pieces, closed.
 *
 * Each is a procedural geometry in `humanSignature.ts` — primitives and
 * extrusions, no asset and no texture. A new piece is an amendment to the
 * annexe, not a string somebody added to a data file.
 */
export const APPEARANCE_SIGNATURES = [
  'glasses-round',
  'glasses-thin',
  'tiara',
  'crown',
  'beard-full',
  'moustache',
  'mutton-chops',
  'goatee',
  'forehead-cross',
  'face-paint-star-tear',
  'earrings',
  'chain-right-hand',
  'fur-collar',
  'katana',
  'umbrella',
  'fan',
  'flute',
  'bandages-full',
  'stitches',
  'lips-full',
  'frills',
  'tattooed-arms',
] as const

/** Three flat colours as three.js takes them, written the way `data/` reads. */
const colour = z.string().regex(/^0x[0-9a-f]{6}$/, 'must be a 0xrrggbb colour, lower case')

/**
 * Where a colour comes from, exactly as `occurredAt.basis` says where an hour
 * comes from.
 *
 * The 2011 anime stops before the embarkation, so for this arc the only source
 * is a manga printed almost entirely in black and white. That makes colour a
 * provenance problem rather than a rendering one, and the honest answer is two
 * words: `attested` for a magazine colour page, a volume cover, the anime for
 * anyone drawn before ch. 340, or cited official material — and `chosen` for a
 * stable editorial decision, whose reason goes in `note`.
 *
 * A `chosen` dressed as `attested` is the exact lie the date convention already
 * forbids.
 */
const colourBasis = z.enum(['attested', 'chosen'])

const coloursSchema = z
  .object({
    basis: colourBasis,
    /** What was actually looked at. Required — a basis with no source is a claim. */
    source: z.string().min(1),
    skin: colour,
    hair: colour,
    attire: z.object({
      jacket: colour,
      shirt: colour,
      trousers: colour,
      accent: colour,
    }),
  })
  .strict()

const bodySchema = z
  .object({
    build: z.enum(APPEARANCE_BUILDS),
    /** Multiplier on the figure's height. The walk's own unit is 1. */
    height: z.number().min(0.4).max(1.4),
    frame: z.enum(APPEARANCE_FRAMES),
    /**
     * Shoulder width, for the handful the gabarit cannot hold.
     *
     * Benjamin's neck is drawn wider than his skull and Franklin is a sewn
     * colossus; `broad` does not reach either. Absent everywhere else, which is
     * the point — a per-person number that most people carry is a role profile
     * with extra steps.
     */
    shoulders: z.number().min(0.8).max(1.4).optional(),
  })
  .strict()

const headSchema = z
  .object({
    face: z.enum(APPEARANCE_FACES),
    hairStyle: z.enum(APPEARANCE_HAIR_STYLES),
    expression: z.enum(APPEARANCE_EXPRESSIONS),
  })
  .strict()

/**
 * The panels this likeness was written against.
 *
 * `confirmed` means every field was read off a cited panel. `partial` means the
 * silhouette was and some detail below it was not — the annexe's own *(à
 * confirmer)*, carried into the data rather than dropped at the door.
 */
const verifiedSchema = z
  .object({
    chapterIds: z.array(chapterRef).min(1),
    status: z.enum(['confirmed', 'partial']),
  })
  .strict()

export const appearanceSchema = z
  .object({
    id: slug,
    body: bodySchema,
    head: headSchema,
    colours: coloursSchema,
    attire: z.enum(APPEARANCE_ATTIRE),
    signatures: z.array(z.enum(APPEARANCE_SIGNATURES)),
    verified: verifiedSchema,
    note: z.string().min(1).optional(),
  })
  .strict()

/**
 * Somebody the annexe names and the archive declines to draw.
 *
 * Not an omission and not a `null`: a deferral is a statement that no usable
 * panel was found, kept beside the reason so the next reader can overturn it
 * with a page number rather than a guess. Four of the queens and one mafia boss
 * are here for that reason; `pyon` and `piyon` are here for another, which
 * their own notes give.
 */
const deferredSchema = z
  .object({
    id: slug,
    reason: z.string().min(1),
  })
  .strict()

export const appearanceFileSchema = z
  .object({
    declared: z.array(appearanceSchema),
    deferred: z.array(deferredSchema),
  })
  .strict()

export type Appearance = z.infer<typeof appearanceSchema>
export type AppearanceFile = z.infer<typeof appearanceFileSchema>
export type AppearanceFrame = (typeof APPEARANCE_FRAMES)[number]
export type AppearanceHairStyle = (typeof APPEARANCE_HAIR_STYLES)[number]
export type AppearanceAttire = (typeof APPEARANCE_ATTIRE)[number]
export type AppearanceSignature = (typeof APPEARANCE_SIGNATURES)[number]
