import {
  chirpTheFlock,
  crushLikeACat,
  hissLikeASnake,
  roarLikeADragon,
} from '$lib/audio/hatsuSounds'
import type { Ship } from '$lib/tour/blueprint'
import type { Apparition } from '$lib/tour/apparitions'
import type { TourWorld } from '$lib/tour/hatsu'
import {
  auraReader,
  beastApparitions,
  beastBehind,
  castApparitions,
  distribute,
  guardianVoice,
  hostileRooms,
  intentsFor,
  runConduct,
  type BeastVoice,
  type CastBeast,
  type CastPayload,
  type Post,
} from '$lib/tour/cast'

/** What the page knows that the distribution needs. */
interface CastContext {
  cast: CastPayload
  world: TourWorld
  /** The deck being walked: bodies on the others are not built. */
  tierId: string
  /** The room the visitor is standing in. */
  visitorIn: string | null
  /** Whether the visitor has a technique up. A raised aura is felt in the room. */
  casting: boolean
}

interface CastViewOptions {
  ship: Ship
  read: () => CastContext
  updateWorld: (world: TourWorld) => void
}

/**
 * The inhabited walk, as one object the page holds.
 *
 * The page had no people in it and no `data` to load them from; ADR-003 gives
 * it both, and this is the whole of what it adds to `+page.svelte` — the
 * distribution, the beasts, the aura and the conduct, behind four members. The
 * modules under `lib/tour/cast/` stay pure and testable without a canvas; what
 * lives here is only the part that has to be reactive.
 */
export class TourCastView {
  constructor(private readonly options: CastViewOptions) {}

  /** Where everyone on this deck stands, at the event the server selected. */
  posts = $derived.by<Post[]>(() => {
    const { cast, tierId } = this.options.read()
    return distribute(this.options.ship, cast.members, { tierId })
  })

  /**
   * The people and the beasts, as the scene draws them.
   *
   * One list, because the scene takes one: a room with a prince, his detail and
   * his animal in it is one room, and the walk has no reason to keep them in
   * separate passes.
   */
  apparitions = $derived.by<Apparition[]>(() => {
    const { cast, world, visitorIn, casting } = this.options.read()
    const situation = {
      visitorIn,
      visitorCasting: casting,
      hostileRooms: hostileRooms(this.options.ship, world),
    }
    return [
      ...castApparitions(this.options.ship, this.posts, auraReader(situation)),
      ...beastApparitions(this.options.ship, this.posts, cast.beasts),
    ]
  })

  /** Who is standing in the room the visitor is in, for the readouts. */
  here = $derived.by<Post[]>(() => {
    const { visitorIn } = this.options.read()
    return visitorIn ? this.posts.filter((post) => post.spaceId === visitorIn) : []
  })

  /** The beast under an apparition the reticle has taken hold of, if any. */
  beastAt = (id: string): CastBeast | null =>
    beastBehind(id, this.posts, this.options.read().cast.beasts)

  /** What that beast says. A sound, and nothing else: see ADR-003 §2.4. */
  voiceAt = (id: string): BeastVoice | null => guardianVoice(this.beastAt(id))

  /**
   * Answer, when the visitor takes hold of a beast.
   *
   * The four voices the walk already has, from `lib/audio/hatsuSounds.ts`. No
   * world state is touched: an animal that changed the ship by being spoken to
   * would be an animal acting, and none of these is.
   */
  speak = (id: string) => {
    const voices = {
      hiss: hissLikeASnake,
      roar: roarLikeADragon,
      chirp: chirpTheFlock,
      crush: crushLikeACat,
    }
    const voice = this.voiceAt(id)
    if (voice) voices[voice]()
  }

  /**
   * One turn of the conduct.
   *
   * Called by the page's own clock rather than by a clock of its own — the walk
   * has exactly one — and it only ever hands the engine a decision: `castInTour`
   * does the rest, with the same refusals it gives the visitor.
   */
  step = (tick: number) => {
    const { cast, world, visitorIn } = this.options.read()
    if (!visitorIn || cast.chapterNumber === null) return
    const intents = intentsFor(this.posts, {
      tick,
      chapter: cast.chapterNumber,
      visitorIn,
      standing: 0,
    })
    if (intents.length === 0) return
    const next = runConduct(this.options.ship, world, intents)
    this.options.updateWorld(next.world)
  }
}
