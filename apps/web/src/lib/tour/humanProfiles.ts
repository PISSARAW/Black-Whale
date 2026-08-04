import appearanceFile from '../../../../../data/characters/appearance.json'
import type { Apparition } from './apparitions'

/**
 * What a body aboard looks like: the declaration first, the role second.
 *
 * ADR-005. Until it, this file was the whole answer — nine role profiles and a
 * hash of the person's own id, which meant Kurapika was drawn as "some hunter"
 * with a haircut nobody chose. The likeness is a fact of the catalogue now, so
 * what this file does is *project* one: `data/characters/appearance.json` says
 * what somebody looks like, and everything below turns that into the numbers
 * the figure builder consumes.
 *
 * The order is the whole doctrine, and it is `wardrobe.ts`'s order:
 *
 * 1. a declared likeness, if the catalogue holds one for this person;
 * 2. the role profile, hash variation included, if it does not.
 *
 * There is no third step and no merge. A guard nobody declared is drawn today
 * exactly as they were drawn yesterday — ADR-005 §5, "l'anonyme reste anonyme"
 * — and that is a promise about diffs, not a figure of speech.
 */

/**
 * The three vocabularies below are `packages/contracts`' — written out again
 * rather than imported.
 *
 * The contracts are a lint tool run over `data/`, not a runtime dependency of
 * the site: importing them here would ship zod and a schema to every visitor so
 * the browser could re-learn what CI already checked. So the walk keeps its own
 * copy, and `scripts/likeness.test.ts` reads both files as text and fails the
 * build if they drift — the same arrangement `nenCreatureFigure.ts` has had for
 * the Nen creature silhouettes, and for the same reason.
 */
export const HAIR_STYLES = [
  'short',
  'military',
  'swept',
  'long',
  'ponytail',
  'spiked',
  'shaved',
  'bob',
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

export const ATTIRE = [
  'civilian',
  'uniform',
  'suit',
  'combat',
  'ritual',
  'gown',
  'changshan',
  'kimono',
] as const

export const SIGNATURES = [
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
] as const

export const FRAMES = ['adult', 'child', 'infant'] as const

export type HairStyle = (typeof HAIR_STYLES)[number]
export type Attire = (typeof ATTIRE)[number]
export type Signature = (typeof SIGNATURES)[number]
export type Frame = (typeof FRAMES)[number]

export interface HumanProfile {
  build: 'slim' | 'average' | 'broad'
  height: number
  shoulders: number
  skin: number
  hair: number
  hairStyle: HairStyle
  face: 'narrow' | 'round' | 'square'
  expression: 'neutral' | 'severe' | 'tired' | 'anxious' | 'hostile'
  jacket: number
  trousers: number
  shirt: number
  accent: number
  clothing: Attire
  /**
   * The body plan the figure is built on.
   *
   * `adult` for everyone the role profiles ever produced, so nothing that was
   * not declared can change shape. The other two exist because Marayam and
   * Woble had no gabarit at all: a child is not a small man, and a baby is not
   * a small child.
   */
  frame: Frame
  /** Annexe B pieces this body wears. Empty for everyone undeclared. */
  signatures: readonly Signature[]
  /**
   * The catalogue id this face was declared under, or `null`.
   *
   * Load-bearing rather than informational: it is how the figure builder tells
   * a person the archive has drawn from a person it has only dressed, which is
   * the difference between adding Morena's scars and adding somebody else's.
   */
  likeness: string | null
}

const ROLE_PROFILES: Record<
  Exclude<NonNullable<Apparition['human']>['role'], 'morena'>,
  HumanProfile
> = {
  witness: {
    build: 'average',
    height: 1,
    shoulders: 1,
    skin: 0xd8b49a,
    hair: 0x342820,
    hairStyle: 'swept',
    face: 'round',
    expression: 'anxious',
    jacket: 0x59636d,
    trousers: 0x29313a,
    shirt: 0xd8d3c8,
    accent: 0x8ba2b5,
    clothing: 'civilian',
    frame: 'adult',
    signatures: [],
    likeness: null,
  },
  guard: {
    build: 'broad',
    height: 1.04,
    shoulders: 1.12,
    skin: 0xc99473,
    hair: 0x201c1a,
    hairStyle: 'military',
    face: 'square',
    expression: 'severe',
    jacket: 0x475467,
    trousers: 0x273140,
    shirt: 0xd6d9dc,
    accent: 0xd3a742,
    clothing: 'uniform',
    frame: 'adult',
    signatures: [],
    likeness: null,
  },
  'nen-guard': {
    build: 'broad',
    height: 1.06,
    shoulders: 1.14,
    skin: 0xb8795d,
    hair: 0x171719,
    hairStyle: 'spiked',
    face: 'square',
    expression: 'hostile',
    jacket: 0x582d3b,
    trousers: 0x2c1d26,
    shirt: 0xd9d1cc,
    accent: 0xc95062,
    clothing: 'uniform',
    frame: 'adult',
    signatures: [],
    likeness: null,
  },
  hunter: {
    build: 'average',
    height: 1.05,
    shoulders: 1.06,
    skin: 0xc8906f,
    hair: 0x252129,
    hairStyle: 'spiked',
    face: 'narrow',
    expression: 'tired',
    jacket: 0x354356,
    trousers: 0x202a37,
    shirt: 0xc7d0d8,
    accent: 0x6f9fbd,
    clothing: 'combat',
    frame: 'adult',
    signatures: [],
    likeness: null,
  },
  fighter: {
    build: 'broad',
    height: 1.08,
    shoulders: 1.16,
    skin: 0xb9785d,
    hair: 0x241719,
    hairStyle: 'short',
    face: 'square',
    expression: 'hostile',
    jacket: 0x753e3c,
    trousers: 0x332426,
    shirt: 0xd9c9bf,
    accent: 0xc36f68,
    clothing: 'combat',
    frame: 'adult',
    signatures: [],
    likeness: null,
  },
  steward: {
    build: 'slim',
    height: 0.98,
    shoulders: 0.94,
    skin: 0xe0b894,
    hair: 0x4b3527,
    hairStyle: 'short',
    face: 'narrow',
    expression: 'neutral',
    jacket: 0x335d7d,
    trousers: 0x22384c,
    shirt: 0xeee8dc,
    accent: 0x69a7cf,
    clothing: 'suit',
    frame: 'adult',
    signatures: [],
    likeness: null,
  },
  victim: {
    build: 'slim',
    height: 1,
    shoulders: 0.96,
    skin: 0xb99b88,
    hair: 0x2e2928,
    hairStyle: 'shaved',
    face: 'narrow',
    expression: 'tired',
    jacket: 0x55565c,
    trousers: 0x303136,
    shirt: 0xbdbab3,
    accent: 0x6c2024,
    clothing: 'civilian',
    frame: 'adult',
    signatures: [],
    likeness: null,
  },
  'silent-majority': {
    build: 'slim',
    height: 0.96,
    shoulders: 0.94,
    skin: 0xf0ece4,
    hair: 0x141414,
    hairStyle: 'bob',
    face: 'narrow',
    expression: 'neutral',
    jacket: 0x171717,
    trousers: 0x151515,
    shirt: 0xf0ece4,
    accent: 0xf0ece4,
    clothing: 'ritual',
    frame: 'adult',
    signatures: [],
    likeness: null,
  },
}

/**
 * Every declared likeness, projected once at module load.
 *
 * `appearance.json` is validated by canon-lint before it ever reaches here, so
 * the cast is a statement about who checked rather than a shortcut: the shape
 * is guaranteed by `packages/contracts`, and re-parsing it in the browser would
 * ship a schema to every visitor to re-learn what CI already knows.
 */
const LIKENESSES: ReadonlyMap<string, HumanProfile> = new Map(
  (appearanceFile.declared as ReadonlyArray<DeclaredLikeness>).map((entry) => [
    entry.id,
    {
      build: entry.body.build,
      height: entry.body.height,
      shoulders: entry.body.shoulders ?? 1,
      skin: Number(entry.colours.skin),
      hair: Number(entry.colours.hair),
      hairStyle: entry.head.hairStyle,
      face: entry.head.face,
      expression: entry.head.expression,
      jacket: Number(entry.colours.attire.jacket),
      trousers: Number(entry.colours.attire.trousers),
      shirt: Number(entry.colours.attire.shirt),
      accent: Number(entry.colours.attire.accent),
      clothing: entry.attire,
      frame: entry.body.frame,
      signatures: entry.signatures,
      likeness: entry.id,
    },
  ]),
)

/** The subset of an `appearance.json` entry the walk actually draws. */
interface DeclaredLikeness {
  id: string
  body: { build: HumanProfile['build']; height: number; frame: Frame; shoulders?: number }
  head: { face: HumanProfile['face']; hairStyle: HairStyle; expression: HumanProfile['expression'] }
  colours: {
    skin: string
    hair: string
    attire: { jacket: string; shirt: string; trousers: string; accent: string }
  }
  attire: Attire
  signatures: Signature[]
}

/**
 * Morena's own catalogue id, which the walk reaches through a role.
 *
 * Her look used to be a tenth entry in the table above — a face written in
 * TypeScript, which is exactly the thing ADR-005 says a face is not. The entry
 * carries the same values field for field, so the projection renders what the
 * hard-coded profile rendered; what changed is which of the two is the fact.
 */
const MORENA = 'morena-prudo'

/** Whether this body is the one the walk draws Morena's own marks on. */
export function isMorena(profile: HumanProfile): boolean {
  return profile.likeness === MORENA
}

/** Whether a likeness was declared for this id — ADR-005's only lookup. */
export function hasLikeness(identity: string | null | undefined): boolean {
  return identity !== null && identity !== undefined && LIKENESSES.has(identity)
}

function identityHash(value: string): number {
  let hash = 2166136261
  for (const char of value) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619)
  return hash >>> 0
}

export function humanProfile(seen: Apparition): HumanProfile {
  const identity = seen.human?.identity ?? seen.id
  // The declaration first. Nothing below it runs for somebody the archive has
  // drawn: no hash, no role palette, and no wardrobe override — a face the
  // catalogue states is a face nothing else may edit.
  const declared = LIKENESSES.get(identity)
  if (declared) return declared

  const role = seen.human?.role ?? (seen.kind === 'combatant' ? 'fighter' : 'witness')
  // The one role that is a person rather than a job: the Morena game reaches
  // her through it, so it resolves to her declaration like any other name.
  if (role === 'morena') return LIKENESSES.get(MORENA) ?? ROLE_PROFILES.witness
  const base = ROLE_PROFILES[role]
  const hash = identityHash(identity)
  const hairs: HairStyle[] =
    role === 'guard' || role === 'nen-guard'
      ? ['military', 'short', 'shaved']
      : ['short', 'swept', 'long', 'ponytail', 'spiked', 'shaved']
  // The mask is a fixed face for the same reason a declared one is: it is the
  // whole point of the person wearing it.
  if (role === 'silent-majority') return base
  const skins = [0x8f5d45, 0xb8795d, 0xc99473, 0xd8b49a, 0xe4c3a5]
  return {
    ...base,
    height: base.height * (0.96 + ((hash >>> 5) % 9) / 100),
    skin: skins[(hash >>> 9) % skins.length],
    hairStyle: role === 'victim' ? base.hairStyle : hairs[(hash >>> 13) % hairs.length],
    // What the catalogue's own role says they are wearing, where it says so.
    clothing: seen.human?.dress ?? base.clothing,
  }
}
