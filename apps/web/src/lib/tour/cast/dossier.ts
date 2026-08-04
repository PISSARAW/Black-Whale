/**
 * What a body can be asked, projected from the catalogue and cut at the cap.
 *
 * ADR-004 §2.4 decides that speech in the walk is a reading of `data/` and
 * never a written line. This module is where that reading happens, and it is
 * deliberately the *only* place: `address.ts` turns a dossier into questions
 * and answers, and cannot reach past what this handed it. So the spoiler rule
 * is enforced once, on the server, over the raw catalogue — which is the same
 * shape of guarantee `roster.ts` gets by consuming a world state that was
 * already capped.
 *
 * Two cuts are made here, and they are not the same cut:
 *
 * - **The dated facts are trimmed.** A trajectory step at chapter 390 does not
 *   travel to a reader capped at 361. What travels instead is the *count* of
 *   what was withheld, because "the archive knows more than your chapter" is a
 *   true statement about the archive and tells the reader nothing about the
 *   manga.
 * - **The undated facts are sealed.** `suspectedAllegiance` and `identity` are
 *   real catalogue fields with no chapter on them. The walk cannot prove they
 *   are not a revelation, so it does not send them to a capped reader at all —
 *   not sealed-and-shown, not counted: absent. Body and Soul can unseal what is
 *   here (`sealed`), and there is nothing for it to unseal when the reader is
 *   capped, which is the correct behaviour for an archive and the reason the
 *   one punch in the walk can never obtain more than the archive gives.
 *
 * Pure, and free of the database: the server hands in catalogue rows, this
 * hands back a record per body.
 */

/** A catalogue character, trimmed to the fields an interview reads. */
export interface DossierCharacter {
  id: string
  canonicalName: string
  factionId?: string | null
  shipLocation?: { role?: string } | null
  nen?: { typeLabel?: string | null } | null
  mapTrajectory?: readonly { location: string; fromChapterId: string }[] | null
  suspectedAllegiance?: string | null
  identity?: { description?: string | null } | null
}

/** An ability, as the interview reads it: whose it is, and what it is called. */
export interface DossierAbility {
  ownerId: string | null
  name: string
  /** Whether the walk can perform it, so the answer can say which are playable. */
  carried: boolean
}

/** One step of a body's route through the ship, as the catalogue dates it. */
export interface DossierStep {
  /** The catalogue location slug. Named in the browser, where the ship is. */
  location: string
  /**
   * The chapter it starts at, for ordering and for the cut at the cap.
   *
   * The archive's own arithmetic, shared with `presence.ts`: `ch-359.5` sorts
   * as 359.005, because the decimal is a sequence marker inside a chapter and
   * not a fraction of one.
   */
  chapter: number
  /** The same chapter as the archive writes it — `359.5` — for the panel. */
  label: string
}

/** Everything one body can be asked, already cut to the reader's chapter. */
export interface CastDossier {
  characterId: string
  /** The role the catalogue puts them aboard as. */
  role: string
  /** Their faction, by name, or null when the catalogue gives none. */
  faction: string | null
  /**
   * The same faction, by id.
   *
   * Kept beside the name because one technique in the walk is *defined* by it:
   * Chain Jail may only hold a member of the Phantom Troupe, and a vow checked
   * against a display name would break the day the label is translated.
   */
  factionId: string | null
  /** The Nen category the catalogue declares, or null for its silence. */
  category: string | null
  /** The techniques the catalogue makes them the owner of. */
  techniques: readonly { name: string; carried: boolean }[]
  /** Where they have been aboard, oldest first, nothing past the cap. */
  route: readonly DossierStep[]
  /** How many steps the cap held back. Counted, never described. */
  withheld: number
  /**
   * The undated facts, for an uncapped reader only.
   *
   * `null` is the answer for everyone else, and it is the same `null` a body
   * with nothing to hide gets: the walk does not distinguish "sealed from you"
   * from "there is nothing", because the distinction is itself a spoiler.
   */
  sealed: DossierSealed | null
}

/** What a body would not volunteer, and what the archive dates on neither. */
export interface DossierSealed {
  /** `suspectedAllegiance`: the Heil-Ly informants, in the catalogue today. */
  allegiance: string | null
  /** `identity.description`: a body travelling under a face that is not its own. */
  identity: string | null
}

/** What the projection needs beyond the character itself. */
export interface DossierOptions {
  /** The reader's chapter, or null for a reader who has set none. */
  cap: number | null
  /** Faction names by id, resolved where the catalogue holds them. */
  factions: ReadonlyMap<string, string>
  /** Every ability in the catalogue, already marked for what the walk carries. */
  abilities: readonly DossierAbility[]
}

/** `ch-358` and `ch-359.5` alike, as a number. Null for anything else. */
function chapterOf(reference: string): number | null {
  const match = /^ch-(\d+)(?:\.(\d+))?$/.exec(reference)
  if (!match) return null
  return Number(match[1]) + Number(match[2] ?? 0) / 1000
}

/** The route, oldest first, and how much of it the cap kept back. */
function routeOf(
  trajectory: readonly { location: string; fromChapterId: string }[],
  cap: number | null,
): { route: DossierStep[]; withheld: number } {
  const steps: DossierStep[] = []
  let withheld = 0
  for (const step of trajectory) {
    const chapter = chapterOf(step.fromChapterId)
    // A step the archive does not date cannot be placed against the cap, so it
    // is treated as the undated facts are: not shown, and not counted either,
    // because counting it would say that something exists at a chapter.
    if (chapter === null) continue
    if (cap !== null && chapter > cap) {
      withheld += 1
      continue
    }
    steps.push({
      location: step.location,
      chapter,
      label: step.fromChapterId.replace(/^ch-/, ''),
    })
  }
  return { route: steps.sort((left, right) => left.chapter - right.chapter), withheld }
}

/** What is sealed on this body, or null — including for a reader with a cap. */
function sealedOf(character: DossierCharacter, cap: number | null): DossierSealed | null {
  if (cap !== null) return null
  const allegiance = character.suspectedAllegiance ?? null
  const identity = character.identity?.description ?? null
  if (!allegiance && !identity) return null
  return { allegiance, identity }
}

/**
 * One body's dossier, at one reader's chapter.
 *
 * Everything it answers, it answers from a field of `data/`. There is no
 * default, no fallback text and no inference: a body whose catalogue entry says
 * nothing about Nen has `category: null`, and `address.ts` renders that as the
 * archive's silence rather than as an absence of aura, because those are two
 * different claims and only the first one is ours to make.
 */
export function dossierFor(character: DossierCharacter, options: DossierOptions): CastDossier {
  const { route, withheld } = routeOf(character.mapTrajectory ?? [], options.cap)
  return {
    characterId: character.id,
    role: character.shipLocation?.role ?? '',
    faction: (character.factionId && options.factions.get(character.factionId)) || null,
    factionId: character.factionId ?? null,
    category: character.nen?.typeLabel ?? null,
    techniques: options.abilities
      .filter((ability) => ability.ownerId === character.id)
      .map((ability) => ({ name: ability.name, carried: ability.carried })),
    route,
    withheld,
    sealed: sealedOf(character, options.cap),
  }
}
