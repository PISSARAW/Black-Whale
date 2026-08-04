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
import type { CastDossier } from './dossier'
import type { Post } from './types'

/** The vow: Chain Jail closes on the Phantom Troupe and on nobody else. */
export const CHAIN_JAIL_FACTION = 'phantom-troupe'

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

/** What a cast at a body came to. */
export type Reach =
  | { outcome: 'held'; kind: BodyKind; characterId: string; hold: BodyHold }
  | { outcome: 'told'; kind: BodyKind; characterId: string; tells: ReachTell[] }
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
  /** The page's clock, so a hold knows when it lifts. */
  now: number
}

/**
 * The techniques that ask rather than hold.
 *
 * Their whole output is what the visitor now knows, so laying a thread for them
 * would be the walk drawing a binding where the manga draws a question.
 */
const ASKS = ['dowsing', 'truth-punch', 'training-shot'] as const

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
const MARKS: Record<Exclude<BodyKind, AskKind>, BodyMark> = {
  // The five that had nowhere to land until the walk had people in it, less the
  // two of them that ask.
  needle: 'controlled',
  'postmortem-curse': 'marked',
  'damage-transfer': 'linked',
  // And the twelve the ship already knew.
  elastic: 'bound',
  'chain-bind': 'bound',
  stitch: 'bound',
  command: 'controlled',
  puppet: 'controlled',
  disguise: 'masked',
  melody: 'soothed',
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

/** The canon condition that stops a technique before it starts, if any. */
function refusalFor(kind: BodyKind, input: ReachInput): ReachRefusal | null {
  const always = REFUSED[kind]
  if (always) return always

  // The vow. Kurapika's chain closes on the Troupe and, if he turned it on
  // anyone else, on his own heart — so the walk refuses rather than performs.
  if (kind === 'chain-bind' && input.dossier?.factionId !== CHAIN_JAIL_FACTION) return 'oath'

  // Theta fires to see whether a student can hold Zetsu under pressure. There
  // is nothing to test on somebody the archive gives no aura to, and inventing
  // an aura to test would be inventing a Nen user.
  if (kind === 'training-shot' && !input.target?.member.nen) return 'no-aura'

  // A needle overwrites autonomy. A body already holding its aura up is the one
  // case the walk will not claim it overwrites.
  if (kind === 'needle' && input.aura === 'ren') return 'resisted'

  return null
}

/** What an asking technique found. */
function tellsFor(kind: AskKind, input: ReachInput): ReachTell[] {
  if (kind === 'training-shot') return input.aura === 'zetsu' ? ['holds-zetsu'] : ['declares-aura']
  if (kind === 'truth-punch') return input.dossier?.sealed ? ['unsealed'] : ['holds-plain']
  // The dowsing chain swings towards what is not being said. What the archive
  // holds without a date is exactly that, and a capped reader was never sent
  // it — so the chain hangs still for them, which is the correct answer.
  return [
    input.dossier?.sealed ? 'holds-sealed' : 'holds-plain',
    input.target?.member.nen ? 'declares-aura' : 'declares-nothing',
  ]
}

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
  if (isAsking(kind)) return { outcome: 'told', kind, characterId, tells: tellsFor(kind, input) }
  return {
    outcome: 'held',
    kind,
    characterId,
    hold: holdFor(characterId, { kind, mark: MARKS[kind] }, input.now),
  }
}

/** Whether this is one of the three that come back with an answer. */
function isAsking(kind: BodyKind): kind is AskKind {
  return ASKING.has(kind)
}
