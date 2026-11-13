import {
  chirpTheFlock,
  crushLikeACat,
  hissLikeASnake,
  roarLikeADragon,
} from '$lib/audio/hatsuSounds'
import type { Ship } from '$lib/tour/blueprint'
import type { Apparition } from '$lib/tour/apparitions'
import { solidById, type TourWorld } from '$lib/tour/hatsu'
import type { MangaView } from '$lib/tour/mangaViews'
import {
  auraFor,
  auraReader,
  beastApparitions,
  beastBehind,
  castApparitions,
  distribute,
  guardianVoice,
  hostileRooms,
  intentsFor,
  runConduct,
  sensedBy,
  sensesFromKey,
  sensesKey,
  sweptByVisitor,
  type BeastVoice,
  type BodyMark,
  type CastBeast,
  type CastPayload,
  type Post,
  type Situation,
  type Visitor,
} from '$lib/tour/cast'
import { stagePostsForMangaView } from '$lib/tour/cast/mangaStage'
import { stageBeastsForMangaView } from '$lib/tour/cast/mangaBeastStage'
import { pacedPosts } from '$lib/tour/cast/pace'
import { residueApparitions } from '$lib/tour/cast/residue'
import { secretApparitions, secretForApparition, type TourSecret } from '$lib/tour/tourSecrets'
import { concertCast, type ConcertPerformance } from './melodyConcert'

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
  /** The source panel whose exact blocking is currently being reproduced. */
  mangaView: MangaView | null
  concert?: ConcertPerformance
}

/**
 * What the visitor is doing to one body in particular (ADR-004).
 *
 * Read through a closure of its own rather than folded into `CastContext`, and
 * that is not tidiness: the body view works out who is aimed at from the very
 * posts this class distributes, so a distribution that read the aim would be a
 * distribution that depends on itself. Two closures, and the cycle cannot form.
 */
interface BodiesContext {
  /**
   * Who the visitor has their aura levelled at, if anyone.
   *
   * Distinct from `casting`, which is about the room: being aimed at is a thing
   * that happens to you personally, and the conduct answers it personally.
   */
  aimedAt: string | null
  /** What the walk is currently holding on which body, from `bodies.ts`. */
  holds: Readonly<Record<string, BodyMark>>
  /** Who Steal Chain has emptied and not given back to. Not a hold: see `nen.ts`. */
  drained: readonly string[]
}

interface CastViewOptions {
  ship: Ship
  read: () => CastContext
  /** What is being done to the people, from the body view. See above. */
  readBodies: () => BodiesContext
  /**
   * Where the visitor stands and what aura they carry, for the sweeps.
   *
   * A third closure because it changes every frame: folded into `read`, every
   * derived value here — the distribution first — would rerun at frame rate.
   */
  readVisitor: () => Visitor
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

  /**
   * The walk's clock, as the scene keeps it, read once a beat.
   *
   * `step` sets it, on the page's one-second clock. The scene's own clock is
   * `requestAnimationFrame`'s, which counts from the same origin, so a body
   * pacing its beat is found within a second of where it is drawn.
   */
  private clock = $state(0)

  /** The same posts, each pacing body where its beat has taken it. See `cast/pace.ts`. */
  walking = $derived.by<Post[]>(() => pacedPosts(this.options.ship, this.posts, this.clock))

  /** Where everyone on this deck stands, at the event the server selected. */
  posts = $derived.by<Post[]>(() => {
    const { cast, tierId, mangaView, concert } = this.options.read()
    const all = distribute(this.options.ship, cast.members)
    const posts = concert
      ? concertCast(all, { ship: this.options.ship, performance: concert, cap: cast.spoilerLimit })
      : all
    if (!mangaView?.staging) {
      return posts.filter((post) => post.tierId === tierId)
    }
    const viewTierId = this.options.ship.spaces.get(mangaView.spaceId)?.tierId
    if (!viewTierId) return distribute(this.options.ship, cast.members, { tierId })
    return stagePostsForMangaView(posts, mangaView, viewTierId).filter(
      (post) => post.tierId === tierId,
    )
  })

  /** Named canonical bodies by reconstructed room, for non-visual crowd pressure. */
  occupancy = $derived.by<Record<string, number>>(() => {
    const counts: Record<string, number> = {}
    for (const post of this.posts) counts[post.spaceId] = (counts[post.spaceId] ?? 0) + 1
    return counts
  })

  /** The sourced note behind the Gyo-only reference the visitor selected. */
  secret = $state<TourSecret | null>(null)

  /**
   * What the room has just done, as a body standing in it can tell.
   *
   * Derived rather than rebuilt at each use: the apparitions and the reading of
   * a single body have to agree about whether a guard is alarmed, and two
   * constructions of the same situation is exactly how they would stop agreeing.
   */
  private ground = $derived.by<Situation>(() => {
    const { world, visitorIn, casting } = this.options.read()
    const { aimedAt, holds, drained } = this.options.readBodies()
    return {
      visitorIn,
      visitorCasting: casting,
      visitorHidden: this.hidden,
      visitorMenacing: this.menacing,
      visitorPressure: this.pressure,
      hostileRooms: hostileRooms(this.options.ship, world),
      aimedAt,
      holds,
      drained,
      sensedBy: {},
      sweptBy: [],
    }
  })

  /** Booleans and strings stop the frame-rate visitor here. See `cast/sensing.ts`. */
  private hidden = $derived.by(() => this.options.readVisitor().nen.in)
  private menacing = $derived.by(() => this.options.readVisitor().nen.on)
  private pressure = $derived.by<'none' | 'ren' | 'on'>(() => {
    const nen = this.options.readVisitor().nen
    return nen.on ? 'on' : nen.mode === 'ren' ? 'ren' : 'none'
  })
  private swept = $derived.by(() => sweptByVisitor(this.walking, this.options.readVisitor()))
  private sensed = $derived.by(() => {
    const visitor = this.options.readVisitor()
    const { world } = this.options.read()
    const marks = visitor.nen.shu.flatMap((id) => {
      const solid = solidById(this.options.ship, world, id)
      return solid ? [solid.at] : []
    })
    return sensesKey(
      sensedBy(this.walking, { ...visitor, marks }, (post) => auraFor(post, this.ground).nen),
    )
  })

  situation = $derived.by<Situation>(() => ({
    ...this.ground,
    sensedBy: sensesFromKey(this.sensed),
    sweptBy: this.swept,
  }))

  /**
   * The people and the beasts, as the scene draws them.
   *
   * One list, because the scene takes one: a room with a prince, his detail and
   * his animal in it is one room, and the walk has no reason to keep them in
   * separate passes.
   */
  apparitions = $derived.by<Apparition[]>(() => {
    const { cast, world, tierId, mangaView } = this.options.read()
    return [
      ...castApparitions(this.options.ship, this.posts, auraReader(this.situation)),
      // Aura left where a technique forced a seam: hidden, so only Gyo draws it.
      ...residueApparitions({
        ship: this.options.ship,
        vestiges: world.vestiges,
        tierId,
        traces: cast.auraTraces,
        objects: cast.auraObjects,
        awakened: this.options.readVisitor().awakened !== false,
      }),
      ...(this.options.readVisitor().awakened === false
        ? []
        : stageBeastsForMangaView(
            beastApparitions(this.options.ship, this.posts, {
              standing: cast.beasts,
              chapter: cast.chapterNumber,
            }),
            mangaView,
          )),
      // Authored references only exist while the character that justifies them
      // is actually reconstructed in their catalogued place. In hides them.
      ...secretApparitions(this.options.ship, this.posts),
    ]
  })

  /** Hostile raised aura sharing the visitor's room, for pre-awakening pressure. */
  pressureAtVisitor = $derived.by<'none' | 'ren'>(() => {
    const room = this.options.read().visitorIn
    if (!room) return 'none'
    return this.posts.some(
      (post) => post.spaceId === room && auraFor(post, this.situation).aura === 'ren',
    )
      ? 'ren'
      : 'none'
  })

  /**
   * The aura one body is carrying right now, for what a visitor reads off it.
   *
   * `none` and absent come back as the same `null`: the scene distinguishes the
   * two because it has a shell to draw or not draw, and a visitor reading a
   * body cannot — nothing coming off somebody reads as nothing either way,
   * which is the silence `reading.ts` calls `still`.
   */
  auraOf = (post: Post): 'ten' | 'ren' | 'zetsu' | null => {
    const look = auraFor(post, this.situation)
    // An aura veiled with In reads as nothing at all until the visitor is in Gyo.
    if (look.nen?.in && !this.options.readVisitor().nen.gyo) return null
    return look.aura === 'none' ? null : (look.aura ?? null)
  }

  /** Who is standing in the room the visitor is in, for the readouts. */
  here = $derived.by<Post[]>(() => {
    const { visitorIn } = this.options.read()
    return visitorIn ? this.posts.filter((post) => post.spaceId === visitorIn) : []
  })

  /** The beast under an apparition the reticle has taken hold of, if any. */
  beastAt = (id: string): CastBeast | null =>
    beastBehind(id, this.posts, this.options.read().cast.beasts)

  /**
   * The beast standing with one person, by character id.
   *
   * What a visitor in Gyo can tell about the body they are aiming at: the
   * animal belongs to somebody, and that somebody is not always the body it
   * keeps the position of — which is why this asks the same resolver the
   * apparitions do rather than reading the member's own declaration.
   */
  beastFor = (characterId: string): CastBeast | null => this.beastAt(`cast-beast:${characterId}`)

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
    const secret = secretForApparition(id)
    if (secret) {
      this.secret = secret
      return
    }
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
    this.clock = performance.now() / 1000
    const { cast, world, visitorIn } = this.options.read()
    if (!visitorIn || cast.chapterNumber === null) return
    const intents = intentsFor(this.posts, {
      tick,
      chapter: cast.chapterNumber,
      visitorIn,
      standing: 0,
      eventHatsu: cast.eventHatsu,
    })
    if (intents.length === 0) return
    const next = runConduct(this.options.ship, world, intents)
    this.options.updateWorld(next.world)
  }
}
