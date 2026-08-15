/**
 * The people, as things the visitor can act on — the reactive half of ADR-004.
 *
 * Same deal `pageCastView.svelte.ts` struck with ADR-002: everything worth
 * arguing about is pure and lives in `lib/tour/cast/`, and what lives here is
 * only the part that has to be reactive. Four members of state, and the page
 * carries a handful of lines of it.
 *
 * The holds expire on the page's own clock — the walk is allowed exactly one —
 * and are dropped outright when the visitor walks out of the room or lets their
 * aura down. That is ADR-004 §2.3 enforced by mechanism rather than by
 * discipline: there is no path through this class that leaves a body held by
 * somebody who is not standing next to it.
 */
import type { NenTechniqueState } from '@black-whale/nen-engine'
import type { HatsuInteractionKind } from '$lib/nen/hatsuRegistry'
import {
  aimedPerson,
  expire,
  holdOn,
  interview,
  lay,
  letGoOf,
  NO_BODIES,
  readBody,
  reachBody,
  releaseBodies,
  unseal,
  type AddressWords,
  type BodiesWorld,
  type BodyMark,
  type CastDossier,
  type CastPayload,
  type ContextLine,
  type Interview,
  type Post,
  type Reach,
  type ReadingTell,
} from '$lib/tour/cast'
import type { Vec2 } from '$lib/tour/types'

/** What the page knows that the bodies need. */
interface BodyContext {
  cast: CastPayload
  /** Everyone on this deck, from the distribution. */
  posts: readonly Post[]
  /** The room the visitor is in, where they stand and where they look. */
  spaceId: string | null
  position: Vec2
  heading: number
  /** The visitor's own Nen: what they can read with, and what is felt. */
  nen: NenTechniqueState
  /** The technique they are holding, or null. */
  activeKind: HatsuInteractionKind | null
  /** The beast standing with each body, resolved by the cast view. */
  beastFor: (characterId: string) => Parameters<typeof readBody>[0]['beast']
  /** The aura each body is carrying, as the conduct decided it. */
  auraFor: (post: Post) => 'ten' | 'ren' | 'zetsu' | null
  /** The visitor's book, for checking if a stolen ability is held. */
  book: { open: string | null; pages: string[]; stolenFrom?: string | null } | null
  /**
   * Whether continuous matter joins the visitor to a point on this deck.
   *
   * Remote Punch's one rule, handed in as a predicate: the page holds the ship
   * and this class holds the people, and neither is going to grow the other.
   */
  throughMatter: (to: Vec2) => boolean
  /** Days still to go on the console, from `decipher.ts` via the world. */
  decipherDays: number
}

interface BodyViewOptions {
  read: () => BodyContext
  /** The words for the interview, re-read on every open so the locale follows. */
  words: () => AddressWords
  /** A catalogue location slug, named in the visitor's language. */
  placeOf: (location: string) => string | null
  /** Announce what a cast at a body came to, for the read-out over the scene. */
  report: (reach: Reach) => void
  /**
   * Point the console at the body in front of you and start counting.
   *
   * Handed back to the world for the same reason the mask is: what a reading
   * changes is the visitor's console, and the console is `TourWorld`. Nothing
   * is written about the person being read — they never learn of it.
   */
  startReading: (characterId: string) => void
  /**
   * Put on the face of the body in front of you, or take it off again.
   *
   * The one thing this class hands back to the world rather than keeping: the
   * mask is worn by the visitor, and the visitor is `TourWorld.body`. Nothing
   * is written about the person the face was copied from.
   */
  wear: (characterId: string) => void
  /**
   * Persist a stolen technique to the visitor's book.
   */
  steal: (characterId: string, technique: string) => void
  /** Give a stolen ability back, and the aura that went with it. */
  giveBack: (characterId: string) => void
}

export class TourBodyView {
  /** What is held on whom. Small, bounded, and emptied at every threshold. */
  bodies = $state<BodiesWorld>(NO_BODIES)

  /** The exchange currently open, or null. Held rather than derived: see below. */
  talk = $state<Interview | null>(null)

  /** The present-tense reply currently being spoken in the reconstruction. */
  conversation = $state<{ name: string; line: ContextLine } | null>(null)

  /**
   * What Body and Soul took, kept beside the interview rather than inside it.
   *
   * The interview is what a person answers; this is what their body answered
   * over them. Two different claims, and the panel shows them under two
   * different headings for that reason.
   */
  extracted = $state<Interview['answers']>([])

  constructor(private readonly options: BodyViewOptions) {}

  /** The body down the reticle, if any. The same aim the fiche already uses. */
  aimed = $derived.by<Post | null>(() => {
    const context = this.options.read()
    return aimedPerson(context.posts, {
      from: context.position,
      heading: context.heading,
      spaceId: context.spaceId,
    })
  })

  /** Its dossier, as the server cut it at the reader's chapter. */
  dossier = $derived.by<CastDossier | null>(() => {
    const person = this.aimed
    if (!person) return null
    return this.options.read().cast.dossiers[person.member.characterId] ?? null
  })

  /** The line authored for this person at this exact projected event. */
  contextLine = $derived.by<ContextLine | null>(() => {
    const person = this.aimed
    if (!person) return null
    return this.options.read().cast.dialogue[person.member.characterId] ?? null
  })

  /** What the visitor's own aura tells them about that body. */
  reading = $derived.by<ReadingTell[]>(() => {
    const person = this.aimed
    if (!person) return []
    const context = this.options.read()
    return readBody({
      target: person,
      aura: context.auraFor(person),
      beast: context.beastFor(person.member.characterId),
      visitor: context.nen,
      range: Math.hypot(person.at[0] - context.position[0], person.at[1] - context.position[1]),
    })
  })

  /** What is held on the body being aimed at, for the read-out. */
  heldMark = $derived.by<BodyMark | null>(
    () => holdOn(this.bodies, this.aimed?.member.characterId ?? null)?.mark ?? null,
  )

  /** Every hold, by character id: what `cast/nen.ts` reads to answer with. */
  marks = $derived.by<Record<string, BodyMark>>(() =>
    Object.fromEntries(this.bodies.holds.map((hold) => [hold.characterId, hold.mark])),
  )

  /**
   * Who has a filament of Bungee Gum on them, if anybody.
   *
   * Its own reading rather than another user of `marks`, because a mark is what
   * a hold *looks* like and three techniques leave a body bound: the strand is
   * drawn between the visitor's wrist and this person, and a chain drawn as gum
   * would be the walk showing the wrong aura. It goes when the hold does — the
   * filament comes off with it, which is what `bodies.ts` is counting down.
   */
  strandOn = $derived<string | null>(
    this.bodies.holds.find((hold) => hold.kind === 'elastic')?.characterId ?? null,
  )

  /** Who the visitor has their aura levelled at, when it is levelled at all. */
  aimedId = $derived(this.aimed?.member.characterId ?? null)

  /**
   * Aim the held technique at the body in front of you.
   *
   * Returns whether anything was aimed at a person at all, so the caller can
   * fall back to casting at the room — a technique that reaches nobody should
   * still do to the ship what it has always done.
   */
  reach = (now: number): boolean => {
    const context = this.options.read()
    const person = this.aimed
    if (!person) return false
    const result = reachBody({
      kind: context.activeKind,
      target: person,
      dossier: this.dossier,
      aura: context.auraFor(person),
      book: context.book,
      // Melody hears a lie in a heart that is answering. The exchange being
      // open is the walk's own record of somebody talking.
      speaking: this.talk !== null || this.conversation !== null,
      // The blow goes through matter, not through air — and the bulkhead
      // between the visitor and this body is matter. See `punch.ts`.
      throughMatter: context.throughMatter(person.at),
      decipherDays: context.decipherDays,
      now,
    })
    if (result.outcome === 'refused' && result.reason === 'not-a-body') return false
    this.settle(result, person)
    this.options.report(result)
    return true
  }

  /**
   * What each outcome leaves behind: a hold laid, a hold taken off, or a fact
   * handed back to the world.
   *
   * Split out of `reach` so that method stays the aim and this stays the
   * consequence — and because the two of these that hand something back are the
   * ones ADR-004 §2.3 is about, and they read better beside each other.
   */
  private settle(result: Reach, person: Post) {
    if (result.outcome === 'held') this.bodies = lay(this.bodies, result.hold)
    if (result.outcome === 'stolen') {
      this.bodies = lay(this.bodies, result.hold)
      this.options.steal(result.characterId, result.technique)
    }
    // The one outcome that takes a hold *off*: the chain unwinds, the ability
    // goes back, and the body has its aura for the first time since ch. 369.
    if (result.outcome === 'returned') {
      this.bodies = letGoOf(this.bodies, result.characterId)
      this.options.giveBack(result.characterId)
    }
    if (result.outcome === 'worn') this.options.wear(result.characterId)
    if (result.outcome === 'reading') this.options.startReading(result.characterId)
    if (result.outcome === 'told' && result.tells.includes('unsealed')) this.unsealAt(person)
  }

  /** Open the exchange with the body in front of you. */
  address = () => {
    const person = this.aimed
    const dossier = this.dossier
    if (!person || !dossier) {
      this.talk = null
      return
    }
    this.conversation = null
    this.talk = interview(this.optionsFor(person, dossier))
    this.extracted = []
  }

  /** Let the person answer from inside the event currently being reconstructed. */
  speak = () => {
    const person = this.aimed
    const line = this.contextLine
    if (!person || !line) {
      this.conversation = null
      return
    }
    this.talk = null
    this.extracted = []
    this.conversation = { name: person.member.name, line }
  }

  /** Put it away. The same gesture, and the panel carries its own way out. */
  close = () => {
    this.talk = null
    this.conversation = null
    this.extracted = []
  }

  /** One turn of the clock: nothing here is held open. */
  step = (now: number) => {
    const next = expire(this.bodies, now)
    if (next !== this.bodies) this.bodies = next
  }

  /**
   * Let go of everybody.
   *
   * Called on arrival in a room and when the aura comes down. The exchange goes
   * with it: a card about the person you were standing in front of, still up
   * two decks later, would be the walk quoting somebody who is not there.
   */
  release = () => {
    this.bodies = releaseBodies(this.bodies)
    this.close()
  }

  /** What Body and Soul obtained, when it obtained anything. */
  private unsealAt(person: Post) {
    const dossier = this.options.read().cast.dossiers[person.member.characterId] ?? null
    if (!dossier) return
    const options = this.optionsFor(person, dossier)
    if (!this.talk) this.talk = interview(options)
    this.extracted = unseal(options)
  }

  private optionsFor(person: Post, dossier: CastDossier) {
    return {
      dossier,
      name: person.member.name,
      since: person.member.since?.replace(/^ch-/, '') ?? null,
      placeOf: this.options.placeOf,
      words: this.options.words(),
    }
  }
}
