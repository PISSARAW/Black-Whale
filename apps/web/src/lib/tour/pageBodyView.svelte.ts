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
}

interface BodyViewOptions {
  read: () => BodyContext
  /** The words for the interview, re-read on every open so the locale follows. */
  words: () => AddressWords
  /** A catalogue location slug, named in the visitor's language. */
  placeOf: (location: string) => string | null
  /** Announce what a cast at a body came to, for the read-out over the scene. */
  report: (reach: Reach) => void
}

export class TourBodyView {
  /** What is held on whom. Small, bounded, and emptied at every threshold. */
  bodies = $state<BodiesWorld>(NO_BODIES)

  /** The exchange currently open, or null. Held rather than derived: see below. */
  talk = $state<Interview | null>(null)

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
      now,
    })
    if (result.outcome === 'refused' && result.reason === 'not-a-body') return false
    if (result.outcome === 'held') this.bodies = lay(this.bodies, result.hold)
    if (result.outcome === 'told' && result.tells.includes('unsealed')) this.unsealAt(person)
    this.options.report(result)
    return true
  }

  /** Open the exchange with the body in front of you. */
  address = () => {
    const person = this.aimed
    const dossier = this.dossier
    if (!person || !dossier) {
      this.talk = null
      return
    }
    this.talk = interview(this.optionsFor(person, dossier))
    this.extracted = []
  }

  /** Put it away. The same gesture, and the panel carries its own way out. */
  close = () => {
    this.talk = null
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
