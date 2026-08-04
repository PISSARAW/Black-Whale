import type {
  TourWorld,
  TourBody,
  TourCastInput,
  TourCastResult,
  HatsuInteractionKind,
  Space,
  Vec2,
  Ship
} from "./types";
import { pointInPolygon, centroid } from "./geometry";
import { acceptsFamily } from "./families";

// ── The body ──────────────────────────────────────────────────────────────
//
// The third noun, and the only one on this side of the eye. Nothing here is
// aimed: the target is whoever is walking.

/** How fast the visitor goes, as a multiplier on the walk's own pace. */
export function paceOf(body: TourBody): number {
  const committed = 1 + body.enhance * 0.35
  // Kurton is fuelled by his passengers: an empty vehicle is barely a vehicle.
  const carried = body.riding ? 1.6 + body.passengers.length * 0.35 : 1
  return committed * carried
}

/** Where the visitor's eyes are, in metres off the floor of the deck. */
export function eyesOf(body: TourBody, standing = 1.7): number {
  if (body.eyes !== null) return body.eyes
  if (body.riding) return standing + 0.9
  return standing
}

/** How far the aura carries down the reticle. */
export const reachOf = (body: TourBody): number => 90 * (1 + body.enhance * 0.4)

/** The five things Kurton can carry, taken from the room he was boarded in. */
export const CAPACITY = 5

/**
 * How far the sun reaches per punishment packed away.
 *
 * Zazan's burst was answered by the damage taken first, so the walk keeps that
 * relation rather than a figure of its own: four metres is a stride or two, and
 * an armour that took one blow clears the furniture beside the visitor rather
 * than the deck.
 */
export const SUN_FLARE_METRES_PER_HIT = 4

/**
 * Whether the visitor goes through walls rather than around them.
 *
 * Two techniques ask for it and mean different things by it — Luini steps
 * through, Hanzo's double was never solid in the first place — but the walk
 * has one answer to give.
 */
export const walksThroughWalls = (world: TourWorld): boolean =>
  world.phasing || Boolean(world.body.projected)

/** Everything the aura is holding, named plainly, for Predator to work through. */
export function holdsInWorld(world: TourWorld): string[] {
  return [
    ...(world.laidOpen ? ['laidOpen'] : []),
    ...(world.isolated ? [`isolated:${world.isolated.spaceId}`] : []),
    ...world.doors.map((id) => `door:${id}`),
    ...world.emptied.map((id) => `emptied:${id}`),
    ...(world.eye ? [`eye:${world.eye}`] : []),
    ...(world.sealed ? [`sealed:${world.sealed}`] : []),
    ...(world.phasing ? ['phasing'] : []),
    ...world.watched.map((doll) => `doll:${doll.spaceId}`),
    ...(world.dowsing ? [`dowsing:${world.dowsing}`] : []),
    // A gathered flock is a bird's worth of aura times however many came, all
    // of it still being spent — which is exactly what Predator names one at a
    // time and what the panel has to count.
    ...(world.flock ? [`birds:${world.flock.spaceId}`] : []),
    ...Object.keys(world.solids).map((id) => `solid:${id}`),
    ...world.shut.map((id) => `shut:${id}`),
    ...world.guarded.map((id) => `guarded:${id}`),
    ...(world.pinned ? [`pinned:${world.pinned}`] : []),
    ...Object.keys(world.vows).map((id) => `vow:${id}`),
    ...(world.pact ? [`pact:${world.pact}`] : []),
    ...world.devouring.map((id) => `fish:${id}`),
    ...Object.keys(world.cards).map((id) => `card:${id}`),
    ...(world.double ? [`double:${world.double}`] : []),
    ...(world.worm ? [`worm:${world.worm.a}`] : []),
    ...(world.snakes ? ['snakes'] : []),
    ...(world.trap ? [`trap:${world.trap}`] : []),
    ...world.gumTraps.map((id) => `gum:${id}`),
    ...(world.gum ? [`strand:${world.gum.solidId}`] : []),
    ...world.flowered.map((id) => `flowered:${id}`),
    ...world.scattered.map((id) => `scattered:${id}`),
    // The Guardian Spirit Beasts. Each is a hold like any other: something the
    // aura is doing to the ship that would stop if it were let go of — which is
    // what this list answers, and what Predator names one at a time.
    ...(world.medusa ? [`beast:${world.medusa}`] : []),
    ...(world.chimera ? [`chimera:${world.chimera}`] : []),
    ...(world.toad ? [`gas:${world.toad}`] : []),
    ...(world.centipede ? [`secretion:${world.centipede}`] : []),
    ...(world.cat ? [`cat:${world.cat}`] : []),
    ...(world.dragon ? [`dragon:${world.dragon}`] : []),
    ...(world.wheel ? [`wheel:${world.wheel.spaceId}`] : []),
    ...(world.smoke ? [`smoke:${world.smoke.spaceId}`] : []),
    ...world.menagerie.map((id) => `flock:${id}`),
    ...world.lit.map((id) => `lit:${id}`),
  ]
}

/**
 * One cast on the visitor themselves.
 *
 * The two that do take a target say so here rather than in the roster: Kurton
 * loads a solid while he is being ridden, and Metamorphosen needs a thing to
 * take the shape of.
 */
/** Everything one cast on the visitor works with, gathered once by `castOnBody`. */
type BodyCastContext = {
  world: TourWorld
  ship: Ship
  body: TourBody
  /** The cast as it came in — the two that take a target read it from here. */
  kind: HatsuInteractionKind
  input: TourCastInput
  /** The same world with the visitor changed and nothing else. */
  withBody: (patch: Partial<TourBody>) => TourWorld
}

type BodyCast = (ctx: BodyCastContext) => TourCastResult

/**
 * Kurton carries five, and what he carries is what fuels him.
 *
 * Boarding takes the room's own solids up; alighting sets them down where the
 * visitor stops. Aimed at something he is not already carrying, he loads it.
 */
function boardOrAlight({
  world,
  ship,
  body,
  kind,
  input,
  withBody,
}: BodyCastContext): TourCastResult {
  if (!body.riding) {
    return { world: withBody({ riding: true }), report: { kind: 'boarded', passengers: 0 } }
  }

  const aimed = solidById(ship, world, input.targetSolidId ?? null)
  if (aimed && !body.passengers.includes(aimed.id)) return castOnSolid(world, kind, input)

  const room = input.standingIn ? ship.spaces.get(input.standingIn) : null
  const solids = { ...world.solids }
  for (const id of body.passengers) {
    const carried = solidById(ship, world, id)
    if (!carried || !room) continue
    solids[id] = { ...solids[id], at: spawnPointNear(room, input.at) }
  }
  return {
    world: {
      ...world,
      solids,
      copies: world.copies.map((copy) =>
        body.passengers.includes(copy.id) && room ? { ...copy, spaceId: room.id } : copy,
      ),
      body: { ...body, riding: false, passengers: [] },
    },
    report: { kind: 'alighted', spaceId: input.standingIn, passengers: body.passengers.length },
  }
}

/**
 * The chain that heals: what has been crushed, shredded or swallowed in one
 * room is mended, and under Emperor Time the whole ship is.
 */
function mendWhatWasHurt({ world, ship, input }: BodyCastContext): TourCastResult {
  const whole = world.laidOpen
  const solids = { ...world.solids }
  let mended = 0
  for (const id of Object.keys(solids)) {
    const hurt = solids[id]
    if (hurt.copyOf) continue
    const room = solidById(ship, world, id)?.spaceId
    if (!whole && room !== input.standingIn) continue
    if (!hurt.gone && !hurt.squash && !hurt.scale) continue
    delete solids[id]
    mended++
  }
  return {
    world: { ...world, solids },
    report: { kind: 'mended', spaceId: whole ? null : input.standingIn, solids: mended },
  }
}

/**
 * The sun rises on what the armour kept and on nothing else, so an empty
 * wrapping is a refusal rather than a weak burst.
 *
 * It goes out from where the visitor stands, on their own deck, and it does not
 * pick what it catches: a solid Snake Arm was holding fast burns with the rest.
 */
function raiseTheSun({ world, ship, body, input }: BodyCastContext): TourCastResult {
  const packed = body.packed ?? 0
  const room = input.standingIn ? ship.spaces.get(input.standingIn) : null
  if (!room) return { world, report: { kind: 'no-target' } }

  // The sun rises whether or not the wrapping had anything in it. What Pain
  // Packer buys is how far it reaches — the technique used to refuse outright
  // without it, which in a walk that hands out one aura at a time meant Feitan
  // could never raise it at all.
  const metres = Math.max(SUN_FLARE_METRES_PER_HIT, packed * SUN_FLARE_METRES_PER_HIT)
  const solids = { ...world.solids }
  let burnt = 0
  for (const structure of [...ship.structures, ...world.copies]) {
    const space = ship.spaces.get(structure.spaceId)
    if (!space || space.tierId !== room.tierId) continue
    const hold = solids[structure.id]
    if (hold?.gone) continue
    const standing = solidNow(structure, hold)
    if (Math.hypot(standing.at[0] - input.at[0], standing.at[1] - input.at[1]) > metres) continue
    solids[structure.id] = { ...hold, gone: true, bound: false }
    burnt++
  }
  return {
    world: { ...world, solids, body: { ...body, packed: null } },
    report: { kind: 'sun-risen', metres, solids: burnt },
  }
}

/**
 * One air, played into the room the visitor is standing in.
 *
 * Each of the three is a toggle on that room rather than something that stacks:
 * the flute is still in the hand when the piece ends, and playing the same air
 * into the same room again is how it is taken back off. Which room is never
 * aimed — the walk is standing in the only room that can hear it.
 *
 * The soft air puts the room in flower, the sharp one leaves its notes loose in
 * the air, and the lively one gets everything standing there dancing. All three
 * are written down and nothing here is drawn: `$lib/tour/apparitions` decides
 * what a room in flower looks like, exactly as it does for a room with fish in.
 */
function playTheTune(world: TourWorld, ship: Ship, played: Played): TourCastResult {
  const { tune, spaceId } = played
  if (tune === 'dance') {
    // Everything the room has in it, the aura's own copies included: a room
    // dances with what is standing in it, whoever put it there.
    const solids = { ...world.solids }
    const inRoom = [...ship.structures, ...world.copies].filter(
      (solid) => solid.spaceId === spaceId && !solids[solid.id]?.gone,
    )
    const already = inRoom.some((solid) => solids[solid.id]?.dancing)
    for (const solid of inRoom) {
      const hold: SolidHold = { ...solids[solid.id] }
      if (already) delete hold.dancing
      else hold.dancing = true
      // A thing the walk was only holding because it was dancing is let go of
      // entirely when the music stops: an empty hold is not a hold, and one
      // left behind would keep the solid out of the deck's own mesh for good.
      if (Object.keys(hold).length) solids[solid.id] = hold
      else delete solids[solid.id]
    }
    return {
      world: {
        ...world,
        solids,
        body: { ...world.body, playing: already ? null : tune, soothed: !already },
      },
      report: already
        ? { kind: 'flute-lowered', tune, spaceId }
        : { kind: 'tune-played', tune, spaceId, on: true, solids: inRoom.length },
    }
  }

  const rooms = tune === 'bloom' ? world.flowered : world.scattered
  const on = !rooms.includes(spaceId)
  const next = on ? [...rooms, spaceId] : rooms.filter((id) => id !== spaceId)
  return {
    world: {
      ...world,
      flowered: tune === 'bloom' ? next : world.flowered,
      scattered: tune === 'scatter' ? next : world.scattered,
      // The flute goes up with the piece and comes down with it, and the senses
      // it was holding open come down with the flute. See `soothed`.
      body: { ...world.body, playing: on ? tune : null, soothed: on },
    },
    report: on
      ? { kind: 'tune-played', tune, spaceId, on, solids: 0 }
      : { kind: 'flute-lowered', tune, spaceId },
  }
}

/** What each technique does to the visitor, one entry per kind. */
export const BODY_CASTS: Partial<Record<HatsuInteractionKind, BodyCast>> = {
  // Reinforcement in proportion to the aura committed, and it is committed a
  // handful at a time.
  enhance: ({ body, withBody }) => {
    const committed = Math.min(6, body.enhance + 1)
    const eyes = committed > 0 ? null : body.eyes
    return {
      world: withBody({ enhance: committed, eyes }),
      report: { kind: 'reinforced', committed },
    }
  },

  puppet: ({ withBody }) => {
    return {
      world: withBody({ autopilotUntil: Date.now() + 10000 }),
      report: { kind: 'autopilot-started' },
    }
  },

  vehicle: boardOrAlight,

  // Hanzo leaves the body where it is and goes on without it. The double
  // walks through the ship; the body is a place you have to come back to.
  projection: ({ world, body, input, withBody }) => {
    if (body.projected) {
      return {
        world: withBody({ projected: null }),
        report: { kind: 'returned', spaceId: body.projected.spaceId },
      }
    }
    if (!input.standingIn) return { world, report: { kind: 'no-target' } }
    return {
      world: withBody({ projected: { spaceId: input.standingIn, at: input.at } }),
      report: { kind: 'projected', spaceId: input.standingIn },
    }
  },

  // The body changes radically and the identity underneath does not: a child's
  // eyes, the walk's own, and something that sees over the bulkheads.
  transformation: ({ body, withBody }) => {
    // The walk's own eyes, the girl she goes about as, and what she actually
    // is. Cycling from `null` rather than from a height keeps the visitor's
    // ordinary body first in the ring, where it belongs.
    const cycle: (number | null)[] = [null, 0.95, 3.4]
    const eyes = cycle[(cycle.indexOf(body.eyes) + 1) % cycle.length]
    return { world: withBody({ eyes }), report: { kind: 'reshaped', metres: eyes ?? 1.7 } }
  },

  // Cookie compresses hours of rest into a short treatment. What the walk has
  // to be rested of is the exhaustion its own techniques wrote down: the
  // tunnel that has been asked too often, and the aura committed to force.
  restoration: ({ world, body }) => ({
    world: {
      ...world,
      worm: world.worm ? { ...world.worm, crossings: 0 } : null,
      body: { ...body, enhance: 0, dance: 0 },
    },
    report: { kind: 'rested', hours: 24 },
  }),

  healing: mendWhatWasHurt,

  rhythm: ({ body, withBody }) => {
    const bars = body.dance + 1
    return { world: withBody({ dance: bars }), report: { kind: 'dance-played', bars } }
  },

  // Metamorphosen runs on the prologue: without the music there is nothing to
  // change shape with.
  mimicry: ({ world, ship, body, input, withBody }) => {
    if (!body.dance) return { world, report: { kind: 'dance-needed' } }
    if (body.mimic) {
      return { world: withBody({ mimic: null, eyes: null }), report: { kind: 'unmimicked' } }
    }
    const shape = solidById(ship, world, input.targetSolidId ?? null)
    if (!shape) return { world, report: { kind: 'no-solid' } }
    const worn = solidNow(shape, world.solids[shape.id])
    return {
      world: withBody({ mimic: shape.id, eyes: Math.max(0.4, worn.base + worn.height) }),
      report: { kind: 'mimicked', solidId: shape.id },
    }
  },

  /**
   * Music carried straight into the listener.
   *
   * What it soothes is the only thing in the walk that can be done to a sense:
   * it holds open the three the monkeys sealed. **Held open, not opened** — the
   * seal is another technique's hold and Melody does not undo it, she plays
   * over it, which is why `sealed` survives the piece and `soothed` is what the
   * muffle actually reads. Put the flute down and the ship closes over again,
   * and that difference is the whole of ch. 45's ending.
   *
   * The refusal first, because it is the one thing about her that a
   * reconstruction has to be careful with. Her ear reaches further than the
   * walk draws — that is attested and it is why the refusal is worded as a
   * refusal rather than as a failure — but a room the visitor is not standing
   * in has a bulkhead in front of it, and a walk that started reporting the
   * contents of the next compartment would be sourcing rooms off a sense
   * nobody can check.
   */
  melody: ({ world, ship, body, input }) => {
    if (input.targetId && input.standingIn && input.targetId !== input.standingIn) {
      return { world, report: { kind: 'ear-refused', spaceId: input.targetId } }
    }
    // Off the book there is no flute in the hand and no key to choose an air
    // with: the music is still hers, and it is still what holds a sense open.
    const opened = world.sealed > 0
    const heard: TourWorld = { ...world, body: { ...body, soothed: true } }
    if (!input.tune) return { world: heard, report: { kind: 'soothed', opened } }
    // A flute is heard where it is played: the reticle is never consulted for
    // *which* room, and a piece with nowhere to land is one nobody was in for.
    if (!input.standingIn) return { world: heard, report: { kind: 'no-target' } }
    return playTheTune(heard, ship, { tune: input.tune, spaceId: input.standingIn })
  },

  // Tyson's eye-wog, which is the one Guardian Spirit Beast in the walk that
  // comes up in front of its own user rather than being sent anywhere. It takes
  // what they have committed — the levy is the whole of the cost, and it takes
  // it whether or not there was any — and gives it back as light, in proportion
  // to what it got. Where the light goes is not a choice:
  //
  //   the room is dark    it goes into the room, and stays there
  //   the room is not     it goes onto the reader, as a bubble they carry
  //
  // Dark means what the blueprint says it means: a room the ship put no window
  // in. Nothing else aboard has an opinion about brightness, and inventing a
  // second one would be the walk making a claim it cannot support.
  'aura-levy': ({ world, ship, body, input }) => {
    const here = input.standingIn ? ship.spaces.get(input.standingIn) : null
    if (!here) return { world, report: { kind: 'no-target' } }
    const levied = body.enhance
    const daylight = ship.structures.some(
      (solid) => solid.spaceId === here.id && solid.kind === 'window',
    )
    if (!daylight && !world.lit.includes(here.id)) {
      return {
        world: { ...world, lit: [...world.lit, here.id], body: { ...body, enhance: 0 } },
        report: { kind: 'room-brightened', spaceId: here.id, levied },
      }
    }
    const halo = body.halo + 1 + levied
    return {
      world: { ...world, body: { ...body, enhance: 0, halo } },
      report: { kind: 'halo-raised', spaceId: here.id, levied, halo },
    }
  },

  // Predator gets stronger by correctly naming what it is up against. There
  // is exactly one thing in the walk to be up against: the aura's own holds.
  predator: ({ world, body, withBody }) => {
    const unnamed = holdsInWorld(world).find((hold) => !body.deduced.includes(hold))
    if (!unnamed) return { world, report: { kind: 'nothing-to-deduce' } }
    const deduced = [...body.deduced, unnamed]
    return {
      world: withBody({ deduced, enhance: Math.min(6, body.enhance + 1) }),
      report: { kind: 'deduced', what: unnamed, strength: deduced.length },
    }
  },

  // The wrapping neither heals nor deflects: while it is on, what the walk
  // would have done to the visitor is packed away inside it and stays there.
  // Cast on an armour already worn, it reads out what it is holding — taking
  // it off is not offered, because the damage in it has to go somewhere.
  'pain-armour': ({ world, body, withBody }) =>
    body.packed === null
      ? { world: withBody({ packed: 0 }), report: { kind: 'armour-worn' } }
      : { world, report: { kind: 'armour-holding', packed: body.packed } },

  'sun-flare': raiseTheSun,

  /**
   * Bird Manipulation with the reticle empty: have the flock survey the ship
   * and file what it sees. The walk will not.
   *
   * Every panel of this ability is a bird carrying something to somebody. Not
   * one of them is a bird looking, and a reconstruction that started sourcing
   * rooms from a survey no chapter draws would be manufacturing evidence under
   * the name of a real character — the exact thing `/tour/sources` exists to
   * make impossible. So the use is offered, refused, and the refusal says why:
   * that is a fact about the technique, and hiding the key would have hidden
   * the fact.
   */
  flock: ({ world }) => ({ world, report: { kind: 'flock-survey-refused' } }),

  // Judgment Chain plants a rule in a heart. Cast on a room, the heart is the
  // person standing there; cast with no target, the heart is the visitor's own.
  // The rules are spoken aloud at activation and never amended afterwards.
  'heart-vow': ({ world, ship, input }) => {
    const subjectId = input.targetId ?? 'self'
    if (subjectId !== 'self' && !ship.spaces.has(subjectId)) {
      return { world, report: { kind: 'no-target' } }
    }
    if (world.vows[subjectId]) {
      return { world, report: { kind: 'vow-locked', subjectId } }
    }
    const rules = input.rules ?? [
      subjectId === 'self'
        ? 'while the rule holds, Chain Jail is certain'
        : `do not enter ${subjectId}`,
      subjectId === 'self'
        ? 'to break the oath is to pierce your own heart'
        : `do not lay a hand on ${subjectId}`,
    ]
    const vow: VowState = { subjectId, rules, violated: false }
    return {
      world: {
        ...world,
        vows: { ...world.vows, [subjectId]: vow },
        body: subjectId === 'self' ? { ...world.body, vowed: vow } : world.body,
      },
      report: { kind: 'vow-declared', subjectId, rules },
    }
  },

  /**
   * Bungee Gum turned on its own user, which the manga does two ways.
   *
   * With a punishment packed away, it is Faux Tissu closing what was opened.
   * With nothing packed, it is the propulsion of ch. 39: the strand is anchored
   * and the visitor is pulled towards the anchor rather than the anchor towards
   * them. What that is worth rises with the stretch, because the force does —
   * a propulsion that gave the same shove from one metre and from nine would be
   * a winch, and this aura is not one. With nothing stuck, the gum still has
   * the visitor's own frame to contract against, and that is the floor.
   */
  elastic: ({ world, ship, body, input, withBody }) => {
    if (body.packed !== null && body.packed > 0) {
      return {
        world: withBody({ packed: body.packed - 1 }),
        report: { kind: 'gum-healed', healed: 1 },
      }
    }
    const tension = strandTension(world, ship, input.at)
    const committed = Math.min(6, body.enhance + 1 + Math.round(tension * 2))
    return { world: withBody({ enhance: committed }), report: { kind: 'gum-propulsion', tension } }
  },
}

function castOnBody(
  world: TourWorld,
  kind: HatsuInteractionKind,
  input: TourCastInput,
): TourCastResult {
  const body = world.body
  const withBody = (patch: Partial<TourBody>): TourWorld => ({
    ...world,
    body: { ...body, ...patch },
  })

  const cast = acceptsFamily(kind, 'body') ? BODY_CASTS[kind] : undefined
  return cast
    ? cast({ world, ship: input.ship, body, kind, input, withBody })
    : { world, report: { kind: 'inert' } }
}

/** A clear spot in a room to set something down, near where the visitor is. */
function spawnPointNear(room: Space, at: Vec2): Vec2 {
  return pointInPolygon(at, room.footprint) ? at : centroid(room)
}
