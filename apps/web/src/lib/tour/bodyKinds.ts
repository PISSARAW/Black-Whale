/**
 * The techniques that reach a person rather than a room.
 *
 * A leaf: it imports the kind union and nothing else, so `hatsu.ts` and
 * `lib/tour/cast/` can both read it without either importing the other. That is
 * the whole reason it is not simply another array inside `hatsu.ts` — the cast
 * already depends on the roster of tour kinds, and the roster now has to know
 * that five more techniques are performable.
 *
 * Two lists, because they are two different claims (ADR-004 §2.5):
 *
 * - `PERSON_HATSU_KINDS` are the five the walk could not carry at all until it
 *   had people in it. ADR-003 §6.1 listed them by name and deferred them; the
 *   deferral was on the freeze of ADR-001's third chantier, and that chantier
 *   has shipped (`hatsuProfiles.gen.ts`). Nothing here invents them: they are
 *   projected from `data/abilities/abilities.json` like the other seventy-eight.
 * - `BODY_KINDS` is every kind that does something to a body, the five included.
 *   The rest of them already work on rooms and solids and keep doing so — what
 *   this list adds is that aiming one at a silhouette is not a no-op.
 *
 * Closed on purpose. A kind that is not named here can do nothing to anybody,
 * and `reach.ts` says so out loud rather than failing silently: a technique that
 * quietly did nothing to the guard you aimed it at would read as a bug in the
 * walk, when it is a fact about the technique.
 */
import type { HatsuInteractionKind } from '$lib/nen/hatsuRegistry'

/**
 * The five that had nowhere to land before the walk was peopled.
 *
 * Aura Projectile (Theta), Needle People (Illumi), Yomotsu Hegui (Gidal),
 * Body and Soul (Lynch), Damage: Sweet Home (Terebellum).
 */
export const PERSON_HATSU_KINDS = [
  'training-shot',
  'needle',
  'postmortem-curse',
  'truth-punch',
  'damage-transfer',
] as const satisfies readonly HatsuInteractionKind[]

/**
 * Everything that reaches a body.
 *
 * The twelve beyond the five are techniques the walk already performs on the
 * ship, and each is here because the manga aims it at a person before it aims
 * it at anything else: Bungee Gum sticks to Gon, not to a bulkhead; Chain Jail
 * is defined by *whom* it may hold; Nen Stitches sews people back together;
 * Black Voice and Order Stamp are what they are because there is somebody
 * inside the thing being ordered. Adding a room-only kind here would be the
 * list drifting from that argument.
 */
export const BODY_KINDS = [
  ...PERSON_HATSU_KINDS,
  'elastic',
  'chain-bind',
  'stitch',
  'command',
  'puppet',
  'disguise',
  'melody',
  'healing',
  'dowsing',
  'heart-vow',
  'curse',
  'identity-swap',
  'chain-rule',
  // Bird Manipulation belongs here for the reason the list exists: aiming it at
  // a person is not a no-op. It either puts a note in a Zodiac's hand or it
  // refuses out loud, and the refusal — that the manipulation takes birds and
  // nothing else — is a fact about the ability nobody reads off a room.
  'flock',
  // Remote Punch, for the panel it is drawn in: Leorio never sees the man he
  // hits. The blow crosses the bulkhead and catches somebody in the next room,
  // which makes a body the thing it is aimed at rather than a thing it passes.
  'remote-strike',
  // Air Blow, and the one entry on this list that is here only in order to
  // refuse. Its catalogue entry concedes an emission from the left palm and
  // says the rest is unknown; aimed at a sentry the walk says exactly that,
  // which is more instructive than a key that appears to do nothing.
  'blast',
] as const satisfies readonly HatsuInteractionKind[]

export type BodyKind = (typeof BODY_KINDS)[number]

const REACHES = new Set<HatsuInteractionKind>(BODY_KINDS)

/** Whether this technique has anything to say to a person standing in front of it. */
export function reachesABody(kind: HatsuInteractionKind | null): kind is BodyKind {
  return kind !== null && REACHES.has(kind)
}
