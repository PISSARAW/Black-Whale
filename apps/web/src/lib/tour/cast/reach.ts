/**
 * A held technique, aimed at the person in front of you.
 *
 * The walk has always been able to cast at a room and at a solid; ADR-003 §6.2
 * left the third case open and this is it. The table below is closed, and being
 * closed is the feature: a kind that is not in it can do nothing to anybody,
 * and says so. A technique that silently did nothing to the guard you aimed it
 * at would read as the walk being broken, when in fact it is a true statement
 * about the technique — Fun Fun Cloth is not a thing you do to a sentry.
 *
 * Three properties, in the shape `conduite.ts` already established:
 *
 * - **Closed.** `BODY_KINDS` is the whole list, it lives in a leaf module, and
 *   nothing here invents a technique or a kind.
 * - **Refusing.** Every refusal below is a canon condition, not a budget: the
 *   vow that restricts Chain Jail, the fifth rite that ends Gidal, the Zetsu a
 *   projectile is fired to test. The refusal is returned and shown, because a
 *   condition a reader can see is the whole pedagogy of this site.
 * - **Ephemeral.** Everything it lays goes through `bodies.ts`, which cannot
 *   hold anything open-ended. See ADR-004 §2.3.
 */
import type { HatsuInteractionKind } from '$lib/nen/hatsuRegistry'
import { reachesABody, type BodyKind } from '../bodyKinds'
import { holdFor, type BodyHold, type BodyMark } from './bodies'
import { theFlock, theThumb } from './reachBranches'
import type { CastDossier } from './dossier'
import type { Post } from './types'

/** The vow: Chain Jail closes on the Phantom Troupe and on nobody else. */
export const CHAIN_JAIL_FACTION = 'phantom-troupe'

export { FLOCK_ADDRESSEES } from './reachBranches'

/** Why a technique did not do what it does. Each one is a canon condition. */
export type ReachRefusal =
  /** This technique has nothing to say to a person. */
  | 'not-a-body'
  /** Nobody is down the reticle. */
  | 'no-target'
  /** The vow on Chain Jail: not a member of the Troupe. */
  | 'oath'
  /** A projectile fired to test Zetsu, at somebody the archive gives no aura. */
  | 'no-aura'
  /** Aura already up: the needle meets a body that is holding itself. */
  | 'resisted'
  /** Yomotsu Hegui's fifth rite is the user's own death. */
  | 'suicide'
  /** Holy Chain closes wounds, and the walk records none. */
  | 'unhurt'
  /** The thumb is already holding a stolen ability. */
  | 'thumb-occupied'
  /** The target has no ability to steal. */
  | 'no-target-ability'
  /** Rising Sun does not pick what it catches, and cannot be told to. */
  | 'spares-nobody'
  /** Gallery Fake copies things, and its page went out with Kortopi. */
  | 'objects-only'
  /**
   * Bird Manipulation takes birds.
   *
   * The refusal ch. 320 makes by omission: everything the ability does, it does
   * through an animal. Aimed at a person it neither holds them nor controls
   * them, and the walk says so rather than quietly doing nothing — a technique
   * that produced silence would read as the walk being broken.
   */
  | 'only-birds'
  /**
   * Remote Punch, aimed where there is nothing to run through.
   *
   * The same rule the ship makes for a solid — the blow goes through matter,
   * not through air — arriving at a body. Worked out by the page, which is the
   * only thing here that holds both the geometry and the person.
   */
  | 'no-matter'
  /**
   * Air Blow, aimed at a person, which the archive does not follow that far.
   *
   * Vincent raises his left palm to break a guard and the entry stops there:
   * no reach, no rate, no effect on the man behind the guard. The walk emits
   * from the palm because that much is conceded, and refuses the rest because
   * the alternative is inventing a Nen attack and attributing it to a real
   * character's ability.
   */
  | 'palm-only'

/** What a technique told the visitor about the body, without holding it. */
export type ReachTell =
  /** The catalogue declares this person a Nen user. */
  | 'declares-aura'
  /** The catalogue declares nothing about their Nen. */
  | 'declares-nothing'
  /** They are holding Zetsu: the shot found nothing to disturb. */
  | 'holds-zetsu'
  /** The chain swung: their entry holds something the archive does not date. */
  | 'holds-sealed'
  /** The chain hung still. */
  | 'holds-plain'
  /** Body and Soul: what was sealed is now readable. See `address.unseal`. */
  | 'unsealed'
  /**
   * Melody, listening to a heart while its owner talks: it does not keep time.
   *
   * The reading ch. 45 is built on, and the walk projects it off the one thing
   * it can check — the archive is withholding something this person's own entry
   * would otherwise date. What the ear reports is the skip; that the skip means
   * a lie is Melody's inference and the panel's wording, not a field.
   */
  | 'heart-skips'
  /** The same listening, and the heart keeps time. */
  | 'heart-steady'
  /** Nobody is saying anything. A heart under no question tells you nothing. */
  | 'not-speaking'

/** What a cast at a body came to. */
export type Reach =
  | { outcome: 'held'; kind: BodyKind; characterId: string; hold: BodyHold }
  /**
   * Texture Surprise: the visitor is now wearing this person's face.
   *
   * The one outcome that does nothing to the body it was aimed at, and that is
   * the technique. Hisoka rebuilds his own face in ch. 357 and walks the lower
   * decks under it; nobody he passes is held, marked or altered — the layer is
   * on him. So the person down the reticle is read as a face and given back
   * unchanged, and what changed is the visitor (`TourBody.masked`).
   */
  | { outcome: 'worn'; kind: BodyKind; characterId: string }
  | { outcome: 'told'; kind: BodyKind; characterId: string; tells: ReachTell[] }
  | { outcome: 'stolen'; kind: BodyKind; characterId: string; technique: string; hold: BodyHold }
  /**
   * The stolen ability given back, and the Zetsu with it.
   *
   * The counterpart the walk did not have. A theft with no return is not the
   * ability ch. 369 draws — it is a permanent maiming, and the chain is
   * explicitly a thing Kurapika lets go of. The third of the outcomes that hold
   * nobody: what it does is take a hold *off*.
   */
  | { outcome: 'returned'; kind: BodyKind; characterId: string; technique: string }
  /**
   * A bird put something in this person's hand and left again.
   *
   * Its own outcome because it is the only one that touches nobody: no hold is
   * laid, nothing is read off them, and the person is exactly as they were a
   * moment before — what happened is that they are now holding a note. A
   * delivery filed as a `held` would have the walk claiming Cluck's pigeons
   * restrain a Zodiac.
   */
  | { outcome: 'delivered'; kind: BodyKind; characterId: string }
  /**
   * The console is pointed at this person and has started counting.
   *
   * Its own outcome, and the second one that holds nobody: what it changes is
   * `TourWorld.decipher`, not the body. `days` is what the screen reads — the
   * days still to go — because a console that showed nothing would be the one
   * part of this ability the manga actually draws, left out.
   */
  | { outcome: 'reading'; kind: BodyKind; characterId: string; days: number }
  | { outcome: 'refused'; kind: HatsuInteractionKind | null; reason: ReachRefusal }

/** Everything the decision reads. Nothing is fetched, nothing is global. */
export interface ReachInput {
  kind: HatsuInteractionKind | null
  /** The body down the reticle, or null. */
  target: Post | null
  /** Its dossier, for the two conditions that are facts about the person. */
  dossier: CastDossier | null
  /** The aura it is currently carrying, from `cast/nen.ts`. */
  aura: 'ten' | 'ren' | 'zetsu' | null
  /** The visitor's book, for checking if a stolen ability is held. */
  book: { open: string | null; pages: string[]; stolenFrom?: string | null } | null
  /**
   * Whether this body is currently answering the visitor.
   *
   * Only Melody reads it, and only because ch. 45 is specific: the heart gives
   * a lie away *while the lie is being told*. A heart listened to across a
   * silent room is a heart, and the walk will not turn one into a verdict.
   */
  speaking: boolean
  /**
   * Whether continuous matter joins the visitor to this body.
   *
   * Only Remote Punch reads it. Decided by `punch.ts` off the ship's own plan
   * and handed in, because `reach.ts` has no geometry and is not getting any:
   * it decides what a technique does to a person, and where the deck stops is
   * not that question.
   */
  throughMatter: boolean
  /**
   * Days still to go on the console, for the one outcome that reports a number.
   *
   * Handed in for the reason `throughMatter` is: `reach.ts` decides what a
   * technique does to a person, and how many days of co-presence have been
   * banked is not that question — it is `decipher.ts`'s, counted by the walk.
   */
  decipherDays: number
  /** The page's clock, so a hold knows when it lifts. */
  now: number
}

/**
 * The techniques that ask rather than hold.
 *
 * Their whole output is what the visitor now knows, so laying a thread for them
 * would be the walk drawing a binding where the manga draws a question.
 */
const ASKS = ['dowsing', 'truth-punch', 'training-shot', 'melody'] as const

/**
 * The technique that takes rather than holds.
 *
 * A face is copied off the body in front of you, and the body is not touched.
 * Listed rather than branched on inline so `MARKS` below cannot silently
 * acquire an entry for it again: a mask laid *on* a guard would be the walk
 * saying Texture Surprise disguises other people, which is not what ch. 357
 * draws — it draws Hisoka wearing a face that is not his.
 */
const WORN = 'disguise' as const

/**
 * The technique that only ever refuses a person. See `CONDITIONS.blast`.
 *
 * Named rather than branched on inline so `MARKS` below cannot acquire an
 * entry for it: a mark laid by Air Blow would be the walk deciding what a gust
 * does to a man, which is the one thing its catalogue entry declines to say.
 */
const PALM = 'blast' as const

/** The technique that refuses a person because it cannot choose. Ch. 258 has
 * Feitan warning his own companions to take cover, which is the ability's only
 * statement about who it catches: everybody. */
const NO_MERCY = 'sun-flare' as const

/** The technique that refuses a person because its page is closed. Ch. 371
 * takes Kortopi and everything his left hand had made: no record of a person
 * copied, and no hand left to do it. */
const PAGE_IS_DEAD = 'clone' as const

/** The technique that delivers rather than holds. See `FLOCK_ADDRESSEES`. */
const CARRIES = 'flock' as const

/**
 * The technique that reads rather than holds.
 *
 * Combo Master pointed at a person lays nothing on them: it starts counting the
 * days it spends in the room with them, and the person never learns of it. A
 * mark would have the walk claiming Furykov's console restrains the prince it
 * is reading, which is the opposite of what ch. 413 draws — it draws a man
 * standing near somebody for ten days.
 */
const READS = 'decipher' as const

type AskKind = (typeof ASKS)[number]

const ASKING: ReadonlySet<BodyKind> = new Set(ASKS)

/**
 * What each technique leaves on a body.
 *
 * Grouped by what the hold looks like rather than by ability, for the reason
 * `bodies.ts` gives: the scene draws the hold, and the ability's own name is
 * already on the panel beside it. The five of ADR-003 §6.1 are the first five
 * lines, and the twelve after them are techniques the walk already performed on
 * the ship which the manga aims at a person first.
 */
const MARKS: Record<
  Exclude<
    BodyKind,
    | AskKind
    | typeof WORN
    | typeof CARRIES
    | typeof PALM
    | typeof READS
    | typeof NO_MERCY
    | typeof PAGE_IS_DEAD
    | 'chain-rule'
  >,
  BodyMark
> = {
  // The five that had nowhere to land until the walk had people in it, less the
  // two of them that ask.
  needle: 'controlled',
  'postmortem-curse': 'marked',
  'damage-transfer': 'linked',
  // And the twelve the ship already knew.
  elastic: 'bound',
  'chain-bind': 'bound',
  // Held back rather than tied: the staff goes across the corridor and the man
  // does not get past it. `bound` is the walk's word for a body that is not
  // going anywhere, and ch. 349 is careful that nobody is hurt by it.
  staff: 'bound',
  'remote-strike': 'struck',
  stitch: 'bound',
  command: 'controlled',
  puppet: 'controlled',
  healing: 'soothed',
  'heart-vow': 'marked',
  curse: 'marked',
  'identity-swap': 'masked',
}

/**
 * The two the walk refuses whoever is standing in front of it.
 *
 * Gidal's fifth rite is his own suicide, and the visitor is not going to
 * perform it: this is the one technique in the catalogue whose cost the walk
 * refuses outright, and saying so is more faithful than staging it. Holy Chain
 * closes what is open, and the walk records no wounds on anybody — §2.3 is why
 * — so there is never anything for it to work on.
 *
 * A table rather than two more branches, because neither of them looks at the
 * body at all: a refusal that depends on nothing is a fact about the technique.
 */
const REFUSED: Partial<Record<BodyKind, ReachRefusal>> = {
  'postmortem-curse': 'suicide',
  healing: 'unhurt',
}

/**
 * The conditions that depend on the body, or on where the visitor is standing.
 *
 * One entry per technique that has one, for the reason `REFUSED` above is a
 * table: these look at different things and at no point at each other, so there
 * is no order between them to read and nothing is carried from one to the next.
 * Each returns its refusal or `null` for "this one may proceed".
 */
const CONDITIONS: Partial<Record<BodyKind, (input: ReachInput) => ReachRefusal | null>> = {
  // The vow. Kurapika's chain closes on the Troupe and, if he turned it on
  // anyone else, on his own heart — so the walk refuses rather than performs.
  'chain-bind': (input) => (input.dossier?.factionId === CHAIN_JAIL_FACTION ? null : 'oath'),

  // Theta fires to see whether a student can hold Zetsu under pressure. There
  // is nothing to test on somebody the archive gives no aura to, and inventing
  // an aura to test would be inventing a Nen user.
  'training-shot': (input) => (input.target?.member.nen ? null : 'no-aura'),

  // A needle overwrites autonomy. A body already holding its aura up is the one
  // case the walk will not claim it overwrites.
  needle: (input) => (input.aura === 'ren' ? 'resisted' : null),

  // Leorio never sees the man he hits in ch. 385 — the blow crosses a bulkhead
  // to reach him. What it will not cross is nothing at all.
  'remote-strike': (input) => (input.throughMatter ? null : 'no-matter'),

  // Not a condition on the body at all — it refuses whoever is standing there,
  // which is why it reads as a constant. Kept here with the others rather than
  // in `REFUSED` because what it refuses is a *target*, not the technique: the
  // gust still leaves the palm, and the room still hears it.
  [PALM]: () => 'palm-only',

  // The sun catches whoever is in the room, companions included. Kept beside
  // the gust for the same reason: what it refuses is a *target*, not the
  // technique — the sun still rises, and the room still burns.
  [NO_MERCY]: () => 'spares-nobody',

  // The left hand copies things, and the hand is gone. See `PAGE_IS_DEAD`.
  [PAGE_IS_DEAD]: () => 'objects-only',

  'chain-rule': (input) => {
    // Aimed back at the person it was taken from, the same finger gives it
    // back — see `reachBody` — so the refusal is only for a *second* theft.
    // Without that exception the thumb would be occupied for ever: the walk had
    // a way to take an ability and no way to return one, which made the one
    // condition the ability states into a dead end rather than a condition.
    if (input.book?.stolenFrom === input.target?.member.characterId) return null
    if (input.book?.open) return 'thumb-occupied'
    return input.target?.member.hatsu.length ? null : 'no-target-ability'
  },
}

/** The canon condition that stops a technique before it starts, if any. */
function refusalFor(kind: BodyKind, input: ReachInput): ReachRefusal | null {
  return REFUSED[kind] ?? CONDITIONS[kind]?.(input) ?? null
}

/**
 * The heart Melody is listening to, while its owner answers.
 *
 * Its own function because it is its own sense: what the skip is projected off
 * is the archive withholding something this entry would otherwise date — the
 * same evidence the dowsing chain swings on, heard rather than felt, which is
 * the whole difference between the two techniques. A heart under no question
 * is a heart, so the exchange has to be open for any of it to mean anything.
 */
function heartOf(input: ReachInput): ReachTell[] {
  if (!input.speaking) return ['not-speaking']
  const keeping = Boolean(input.dossier?.sealed) || (input.dossier?.withheld ?? 0) > 0
  return [keeping ? 'heart-skips' : 'heart-steady']
}

/**
 * The dowsing chain swings towards what is not being said. What the archive
 * holds without a date is exactly that, and a capped reader was never sent it
 * — so the chain hangs still for them, which is the correct answer.
 */
const chainOf = (input: ReachInput): ReachTell[] => [
  input.dossier?.sealed ? 'holds-sealed' : 'holds-plain',
  input.target?.member.nen ? 'declares-aura' : 'declares-nothing',
]

/**
 * What each asking technique found, one entry per kind.
 *
 * A table rather than a chain of ifs, for the reason `SOLID_CASTS` is one:
 * these four share a shape and nothing else, and there is no order between
 * them to read.
 */
const TELLS: Record<AskKind, (input: ReachInput) => ReachTell[]> = {
  'training-shot': (input) => (input.aura === 'zetsu' ? ['holds-zetsu'] : ['declares-aura']),
  'truth-punch': (input) => (input.dossier?.sealed ? ['unsealed'] : ['holds-plain']),
  melody: heartOf,
  dowsing: chainOf,
}

/** What an asking technique found. */
const tellsFor = (kind: AskKind, input: ReachInput): ReachTell[] => TELLS[kind](input)

/**
 * Aim what you are holding at the person in front of you.
 *
 * Pure, and the only door: the page has no other way to put a hold on a body,
 * which is what keeps ADR-004 §2.3's promise mechanical rather than
 * conscientious.
 */
export function reachBody(input: ReachInput): Reach {
  if (!reachesABody(input.kind))
    return { outcome: 'refused', kind: input.kind, reason: 'not-a-body' }
  if (!input.target) return { outcome: 'refused', kind: input.kind, reason: 'no-target' }

  const kind = input.kind
  const refusal = refusalFor(kind, input)
  if (refusal) return { outcome: 'refused', kind, reason: refusal }

  const characterId = input.target.member.characterId
  if (kind === WORN) return { outcome: 'worn', kind, characterId }

  // The console. Nothing is laid on them and nothing is read off their entry:
  // the reading is a duration, and the duration is the rules' to count.
  if (kind === READS) {
    return { outcome: 'reading', kind, characterId, days: input.decipherDays }
  }

  if (kind === CARRIES) return theFlock(kind, characterId, input)

  if (isAsking(kind)) return { outcome: 'told', kind, characterId, tells: tellsFor(kind, input) }

  if (kind === 'chain-rule') return theThumb(kind, characterId, input)

  // Everything with no mark of its own has already returned: the four that ask,
  // the one that is worn, the one that carries, the one that steals and the one
  // that only ever refuses. `MARKS` is exactly the remainder, and a kind added
  // to `BODY_KINDS` without either an entry there or a branch above will not
  // compile — which is the closure this module claims in its own doc.
  const mark = MARKS[kind as keyof typeof MARKS]
  return {
    outcome: 'held',
    kind,
    characterId,
    hold: holdFor(characterId, { kind, mark }, input.now),
  }
}

/** Whether this is one of the three that come back with an answer. */
function isAsking(kind: BodyKind): kind is AskKind {
  return ASKING.has(kind)
}
