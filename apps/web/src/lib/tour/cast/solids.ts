import type { Ship } from "../blueprint";
import { blocksTheFloor, pointInPolygon, structureFootprint, structureWalls } from "../geometry";
import type { HeldSolid, LoadedDeck, DeckMoment, SolidHold, TourWorld, TourCastResult, Stood } from "./types";
import { CAPACITY, emptiedOn } from "../hatsu";
import type { Polygon, Space, Structure, Vec2, WallSegment } from "../types";
import { gumTension } from "../gum";
import { distanceTo } from "../hatsu";

// ── The solids ────────────────────────────────────────────────────────────
//
// Everything from here to `castInTour` is the second noun the walk learned:
// the thing standing in the room, as opposed to the room. It is deliberately
// the same shape as the first — a value in `TourWorld`, a pure reducer, and a
// renderer that knows nothing but how to draw what it is handed.



/** Everything one air took hold of, which is what the panel counts. */
export const dancingSolidIds = (world: TourWorld): string[] =>
  Object.entries(world.solids)
    .filter(([, hold]) => hold.dancing && !hold.gone)
    .map(([id]) => id)

/** Everything the walk has to draw itself on one deck, ready to extrude. */
function resolveDetachedSolid({
  ship,
  world,
  id,
  hold,
  tierId,
  emptied,
  carrier,
  seconds,
}: {
  ship: Ship
  world: TourWorld
  id: string
  hold: SolidHold
  tierId: string
  emptied: Set<string>
  carrier: Vec2 | undefined
  seconds: number
}): { structure: Structure; room: Space } | null {
  if (hold.gone) return null
  const original = solidById(ship, world, id)
  if (!original) return null
  const room = ship.spaces.get(original.spaceId)
  if (!room || room.tierId !== tierId || emptied.has(room.id)) return null

  let structure = solidNow(original, hold)
  // Riding: set around the vehicle rather than where it was picked up.
  if (carrier && world.body.passengers.includes(id)) {
    const seat = world.body.passengers.indexOf(id)
    const angle = (seat * Math.PI * 2) / CAPACITY
    structure = {
      ...structure,
      at: [carrier[0] + Math.cos(angle) * 1.6, carrier[1] + Math.sin(angle) * 1.6],
    }
  }
  if (hold.alive) {
    const drift = wanderOffset(id, seconds)
    structure = { ...structure, at: [structure.at[0] + drift[0], structure.at[1] + drift[1]] }
  }
  return { structure, room }
}

export function detachedOn(
  ship: Ship,
  world: TourWorld,
  on: LoadedDeck,
): { structure: Structure; room: Space }[] {
  const { tierId, seconds = 0, carrier } = on
  const emptied = new Set(emptiedOn(world, tierId, ship))
  const out: { structure: Structure; room: Space }[] = []

  for (const [id, hold] of Object.entries(world.solids)) {
    const resolved = resolveDetachedSolid({ ship, world, id, hold, tierId, emptied, carrier, seconds })
    if (resolved) out.push(resolved)
  }
  return out
}

/** What those solids stop the visitor with, since they are no longer in the deck. */
export function solidWalls(ship: Ship, world: TourWorld, on: DeckMoment): WallSegment[] {
  const { tierId, seconds = 0 } = on
  // What is being carried is not something to walk around: it moves with you.
  // Nor is what is over your head — a room Camilla's beast has hold of has
  // nothing on its floor, and that is most of what the technique feels like
  // from inside it.
  return (
    detachedOn(ship, world, { tierId, seconds })
      .filter(({ structure }) => !world.body.passengers.includes(structure.id))
      .filter(({ structure }) => !world.solids[structure.id]?.adrift)
      // And what the drill went through is not either: the hole is the whole of
      // what the walk can show of a bore, so it has to be a hole you can use.
      .filter(({ structure }) => !world.solids[structure.id]?.bored)
      .filter(({ structure }) => blocksTheFloor(structure))
      .flatMap(({ structure }) => structureWalls(structure))
  )
}

export const withHold = (world: TourWorld, id: string, patch: SolidHold): TourWorld => ({
  ...world,
  solids: { ...world.solids, [id]: { ...world.solids[id], ...patch } },
})

export const dropHold = (world: TourWorld, id: string): TourWorld => {
  const solids = { ...world.solids }
  delete solids[id]
  return {
    ...world,
    solids,
    copies: world.copies.filter((copy) => copy.id !== id),
    // A thing put back is a thing out of the bag: Nen Stitches undoes being
    // swallowed like it undoes everything else, and Blinky cannot then be asked
    // for something that is standing in the room again.
    hoover: world.hoover.filter((held) => held !== id),
  }
}

/** Half the diagonal of a solid: how far off its centre you have to stand. */
export const clearanceOf = (structure: Structure) => Math.hypot(structure.size[0], structure.size[1]) / 2

/**
 * The metres a standing body takes up, for anything reeled in towards one.
 *
 * The same half-metre `footing.ts` gives the visitor: a wardrobe that finished
 * its trip inside the person who pulled it would be a collision the walk has no
 * way to resolve, so the contraction stops one body's width short.
 */
export const VISITOR_CLEARANCE = 0.5

/**
 * Moves a solid, but never out through the wall of the room it stands in.
 *
 * A bed shoved through the party wall would be a claim about the ship rather
 * than about the technique, so a push that would leave the room is spent
 * against it and the solid stays where it is.
 */
export function shove(ship: Ship, solid: HeldSolid, delta: Vec2): Vec2 | null {
  const { structure, hold } = solid
  const now = solidNow(structure, hold)
  const room = ship.spaces.get(structure.spaceId)
  if (!room) return null
  const target: Vec2 = [now.at[0] + delta[0], now.at[1] + delta[1]]
  const outline = structureFootprint({ ...now, at: target })
  return outline.every((corner) => pointInPolygon(corner, room.footprint)) ? target : null
}


export const SOLID_CASTS: Partial<Record<HatsuInteractionKind, SolidCast>> = {
  // Bungee Gum on a solid. The filament goes out of the wrist and takes hold;
  // cast at the same thing again it contracts and the thing crosses the room,
  // because that is the gesture ch. 39 draws first. The arithmetic — where a
  // thing comes to rest, and how much the strand is holding — is `gum.ts`'s;
  // all that happens here is the ship's own objection, which is that a cabinet
  // cannot be dragged through a bulkhead.
  elastic: ({ world, ship, structure, hold, id, at, standingIn }) => {
    const now = solidNow(structure, hold)
    const act = aimGum({
      strand: world.gum,
      solidId: id,
      at,
      anchorAt: now.at,
      clearance: clearanceOf(now) + VISITOR_CLEARANCE,
      together: standingIn === structure.spaceId,
    })
    if (act.act === 'stick') {
      return {
        world: { ...world, gum: { solidId: id, rest: act.rest } },
        report: { kind: 'gum-set', solidId: id, metres: act.rest },
      }
    }
    if (act.act === 'taut') {
      return {
        world,
        report: { kind: 'gum-taut', solidId: id, tension: gumTension(world.gum!, act.metres) },
      }
    }
    if (act.act === 'reel') {
      const room = ship.spaces.get(structure.spaceId)
      const outline = structureFootprint({ ...now, at: act.landing })
      const fits = room && outline.every((corner) => pointInPolygon(corner, room.footprint))
      const drawn = Math.hypot(now.at[0] - at[0], now.at[1] - at[1])
      return {
        world: { ...withHold(world, id, fits ? { at: act.landing } : {}), gum: null },
        report: {
          kind: 'gum-reeled',
          solidId: id,
          metres: fits ? act.metres : 0,
          tension: gumTension(world.gum!, drawn),
        },
      }
    }
    // A second solid with the first still stuck: the strand joins the two and
    // lets go of the wrist, which is the other half of what ch. 39 draws.
    const anchorId = world.gum!.solidId
    const anchor = solidById(ship, world, anchorId)
    const reached = Math.hypot(now.at[0] - at[0], now.at[1] - at[1])
    if (!anchor) {
      return {
        world: { ...world, gum: { solidId: id, rest: reached } },
        report: { kind: 'gum-set', solidId: id, metres: reached },
      }
    }
    const anchorNow = solidNow(anchor, world.solids[anchorId])
    const landing = gumLanding({
      at: anchorNow.at,
      anchorAt: now.at,
      clearance: clearanceOf(anchorNow) + clearanceOf(now),
    })
    const room = ship.spaces.get(structure.spaceId)
    const outline = structureFootprint({ ...now, at: landing })
    const fits = room && outline.every((corner) => pointInPolygon(corner, room.footprint))
    return {
      world: { ...withHold(world, id, fits ? { at: landing } : {}), gum: null },
      report: { kind: 'gum-pulled', solidId: id, otherId: anchorId },
    }
  },

  // Only the look changes; the thing underneath goes on being what it was,
  // and goes on stopping you exactly where it did.
  //
  // And the change leaves nothing to find. The crate that becomes an armchair
  // in ch. 61 is an armchair to the room and to Gyo alike — see `texture.ts` —
  // so the hold carries the fact that this face is forged and the scene draws
  // no aura for it. What gives it away is the touch, which here is the solid
  // going on measuring, blocking and citing exactly what it always did.
  disguise: ({ world, structure, hold, id }) => {
    const next = nextForgery(hold?.kind ?? structure.kind)
    return {
      world: withHold(world, id, { kind: next, forged: true }),
      report: { kind: 'forged', solidId: id, as: next },
    }
  },

  pocket: ({ world, hold, id }) =>
    (hold?.scale ?? 1) < 0.5
      ? {
          world: withHold(world, id, { scale: 1, squash: 1 }),
          report: { kind: 'unwrapped', solidId: id },
        }
      : {
          world: withHold(world, id, { scale: 0.25, squash: 0.25 }),
          report: { kind: 'wrapped', solidId: id },
        },

  // The stamp is not a push: it is a 人 put on a head, and the thing wearing it
  // does what it is told afterwards. Three clicks, three states — stamp a solid
  // that has none, lock or unlock one that has, and once twenty are wearing it
  // a click on anything else is the order rather than a twenty-first stamp.
  command: ({ world, ship, structure, hold, id }) => {
    if (hold?.stamped) {
      const locked = !hold.locked
      const after = withHold(world, id, { locked })
      return {
        world: after,
        report: {
          kind: 'stamp-locked',
          solidId: id,
          locked,
          locks: lockedPuppets(after).length,
        },
      }
    }

    // The lock is what tells stamping from ordering: turn one and the crowd is
    // closed, so the next cast at anything else is where they are being sent
    // rather than a twenty-first head. Unlock them all and the stamp goes back
    // to taking heads. The walk holds to the web's rule here, because a visitor
    // who has learnt the technique on the archive has learnt it aboard as well.
    if (!lockedPuppets(world).length && stampedPuppets(world).length < STAMP_LIMIT) {
      const after = withHold(world, id, { stamped: true, locked: false })
      return {
        world: after,
        report: { kind: 'stamped', solidId: id, puppets: stampedPuppets(after).length },
      }
    }

    // Otherwise this cast is a place to send them, and the solid under the
    // reticle is the place. It is told the way a room is told.
    const room = ship.spaces.get(structure.spaceId)
    const to = solidNow(structure, hold).at
    return room
      ? orderThePuppets(world, room, to)
      : { world, report: { kind: 'no-lock', stamped: stampedPuppets(world).length } }
  },

  clone: ({ world, ship, structure, hold, id }) => {
    const now = solidNow(structure, hold)
    const beside = shove(ship, { structure, hold }, [clearanceOf(now) * 2, 0]) ?? now.at
    const copyId = `${id}::fake${world.copies.length + 1}`
    const copy: Structure = { ...now, id: copyId, at: beside }
    return {
      world: {
        ...world,
        copies: [...world.copies, copy],
        solids: { ...world.solids, [copyId]: { copyOf: id } },
      },
      report: { kind: 'copied', solidId: id },
    }
  },

  puppet: ({ world, id }) => {
    if (world.puppet === id) {
      return {
        world: { ...world, puppet: null },
        report: { kind: 'puppet-released', solidId: id },
      }
    }
    return {
      world: { ...world, puppet: id },
      report: { kind: 'puppeted', solidId: id },
    }
  },

  impact: ({ world, id }) => ({
    world: withHold(world, id, { squash: 0.12 }),
    report: { kind: 'crushed', solidId: id },
  }),

  // A sustained volley: the thing is driven back, and the third burst is the
  // one that ends it.
  barrage: ({ world, ship, structure, hold, id, away }) => {
    const hits = (hold?.hits ?? 0) + 1
    if (hits >= 3) {
      return {
        world: withHold(world, id, { hits, gone: true }),
        report: { kind: 'shattered', solidId: id },
      }
    }
    const landing = shove(ship, { structure, hold }, away(2))
    return {
      world: withHold(world, id, landing ? { hits, at: landing } : { hits }),
      report: { kind: 'volley', solidId: id, hits },
    }
  },

  windup: ({ world, ship, structure, hold, id, away }) => {
    const metres = 3 + world.windup * 4
    const landing = shove(ship, { structure, hold }, away(metres))
    return {
      world: { ...withHold(world, id, landing ? { at: landing } : {}), windup: 0 },
      report: { kind: 'launched', solidId: id, metres: landing ? metres : 0 },
    }
  },

  staff: ({ world, ship, structure, hold, id, away }) => {
    const now = solidNow(structure, hold)
    const landing = shove(ship, { structure, hold }, away(1.5))
    return {
      world: withHold(world, id, {
        rotation: now.rotation + 25,
        ...(landing ? { at: landing } : {}),
      }),
      report: { kind: 'struck', solidId: id },
    }
  },

  // The chain is fixed to the hand and the weight is on the far end of it, so
  // what it does to a thing is what a whip does: the ball goes through it, it
  // is knocked back and spun by the blow, and the chain lets go again. Nothing
  // is held afterwards — a lash is over the moment it lands, and the count is
  // only so the read-out can say this is the fourth time you have hit it.
  dowsing: ({ world, ship, structure, hold, id, away, at, standingIn }) => {
    // Parer et frapper (ch. 76) : la chaîne pare le coup qui arrive puis claque
    // en retour. On ne pare que ce qui est dans la même pièce.
    if (standingIn === structure.spaceId) {
      const now = solidNow(structure, hold)
      const landing = shove(ship, { structure, hold }, away(2))
      return {
        world: withHold(world, id, {
          hits: (hold?.hits ?? 0) + 1,
          rotation: now.rotation + 40,
          ...(landing ? { at: landing } : {}),
        }),
        report: { kind: 'lashed', solidId: id, hits: (hold?.hits ?? 0) + 1 },
      }
    }

    // Sonder un objet perdu (ch. 369) : le solide perdu de vue est marqué
    // « probable » sur la carte, sans qu'on l'ait revu. La position devient
    // la salle dowsée, comme pour une salle.
    const targetRoom = ship.spaces.get(structure.spaceId)
    if (!targetRoom) return { world, report: { kind: 'no-target' } }

    const distance = distanceTo(ship, targetRoom, { at, standingIn })
    return {
      world: { ...world, dowsing: structure.spaceId },
      report: {
        kind: 'dowsed',
        spaceId: structure.spaceId,
        distance: distance.metres,
        decks: distance.decks,
      },
    }
  },

  // Two arms, two snakes, and no more than that. Letting one go is always
  // allowed — that is the hand opening — but a third catch has nothing left to
  // catch it with, so the cast is refused and says which two are busy.
  serpent: ({ world, hold, id }) => {
    if (hold?.bound) {
      return {
        world: withHold(world, id, { bound: false }),
        report: { kind: 'released', solidId: id },
      }
    }
    const held = boundSolidIds(world)
    if (held.length >= SNAKE_ARMS) {
      return { world, report: { kind: 'arms-full', solidIds: held } }
    }
    return { world: withHold(world, id, { bound: true }), report: { kind: 'bound', solidId: id } }
  },

  /**
   * Leorio strikes the deck under his own feet and the fist comes out where he
   * chose. Between the two, the aura runs in the surface — and only in it.
   *
   * The line is worked out first and everything else waits on it: a strike that
   * would have to cross an open well is refused with its rule rather than
   * quietly landing, which is the one thing about this ability that ch. 385 is
   * unambiguous about. A bulkhead in the way is not in the way — the panel is
   * a fist coming out of a closed door — so the run is stopped by the absence
   * of matter and by nothing else. See `punch.ts` and `onFloorOf`.
   *
   * Where it went *in* stays the visitor's own feet, which is what makes the
   * exit a decision rather than an accident: they choose the point, and the
   * ship decides whether there is anything joining the two.
   */
  'remote-strike': ({ world, ship, structure, hold, id, away, at }) => {
    const now = solidNow(structure, hold)
    const room = ship.spaces.get(structure.spaceId)
    if (!room) return { world, report: { kind: 'no-target' } }
    const through = punchRuns({ from: at, to: now.at, onFloor: onFloorOf(ship, room.tierId) })
    if (!through) return { world, report: { kind: 'punch-refused', spaceId: structure.spaceId } }
    const source =
      [...ship.structures, ...world.copies].find(
        (candidate) =>
          candidate.spaceId === structure.spaceId &&
          candidate.id !== id &&
          !world.solids[candidate.id]?.gone,
      ) ?? structure
    const landing = shove(ship, { structure, hold }, away(2.5))
    return {
      world: withHold(world, id, landing ? { at: landing } : { hits: (hold?.hits ?? 0) + 1 }),
      report: {
        kind: 'came-up-under',
        solidId: source.id,
        otherId: id,
        through,
        throughDoor: world.shut.includes(structure.spaceId),
      },
    }
  },

  // The thread that puts things back: the blueprint's own record, whatever
  // was done to it — crushed, shredded, swallowed, moved.
  stitch: ({ world, hold, id }) =>
    hold
      ? { world: dropHold(world, id), report: { kind: 'stitched', solidId: id } }
      : { world, report: { kind: 'nothing-to-stitch', solidId: id } },

  animate: ({ world, hold, id }) => ({
    world: withHold(world, id, { alive: !hold?.alive }),
    report: { kind: 'animated', solidId: id },
  }),

  shred: ({ world, id }) => ({
    world: { ...world, wound: id },
    report: { kind: 'shred-stuck', solidId: id },
  }),

  // Padaille: swing, and find out what the arm was.
  //
  // The one technique in the walk whose result the visitor has no say in. Every
  // other cast here is a decision — which room, which thing, which of two
  // hands, which of three airs — and this one is a decision to swing and
  // nothing more. So the tool is drawn before anything is read off the target,
  // and the three outcomes are three different things rather than three
  // strengths of one: driven into the deck, holed through, or in two pieces.
  //
  // The swing lands whatever it draws, including on something already dealt
  // with: a cupboard the hammer flattened can still be halved, and the halves
  // are half of what is left rather than half of what the blueprint had.
  'weapon-body': ({ world, ship, structure, hold, id }) => {
    const tool = toolFor(id, world.swings)
    const swung = { ...world, swings: world.swings + 1 }

    if (tool === 'hammer') {
      return {
        world: withHold(swung, id, { squash: HAMMERED_SQUASH }),
        report: { kind: 'hammered', solidId: id },
      }
    }

    if (tool === 'drill') {
      return {
        world: withHold(swung, id, { bored: true }),
        report: { kind: 'bored', solidId: id },
      }
    }

    // The axe. Two pieces where there was one, so the half that keeps the
    // blueprint's id stays put and the other is a copy set down beside it —
    // the same machinery Gallery Fake's forgery uses, because a half is a
    // solid the ship never had either. If the room has no space to lay the
    // second half in, the cut still happens and the halves stand in the same
    // place: an axe stopped by the width of a cabin would be an axe that
    // failed, and this one did not.
    const halved = Math.max(0.05, (hold?.scale ?? 1) * 0.5)
    const now = solidNow(structure, { ...hold, scale: halved })
    const beside = shove(ship, { structure, hold: { ...hold, scale: halved } }, [
      clearanceOf(now) * 1.2,
      0,
    ])
    const offcutId = `${id}::half${world.copies.length + 1}`
    const offcut: Structure = { ...now, id: offcutId, at: beside ?? now.at }
    return {
      world: {
        ...withHold(swung, id, { scale: halved }),
        copies: [...world.copies, offcut],
        solids: {
          ...withHold(swung, id, { scale: halved }).solids,
          [offcutId]: { copyOf: id },
        },
      },
      report: { kind: 'halved', solidId: id, apart: beside !== null },
    }
  },

  // Dramatic on a thing, and weak on anything Nen is already holding.
  growth: ({ world, hold, id }) => {
    if (hold?.bound || hold?.alive || hold?.copyOf) {
      return { world, report: { kind: 'growth-refused', solidId: id } }
    }
    return {
      world: withHold(world, id, { scale: Math.min(3, (hold?.scale ?? 1) * 1.8) }),
      report: { kind: 'grown', solidId: id },
    }
  },

  // Tserriednich's Guardian Spirit Beast, which is sent at a thing rather than
  // cast on one: it walks over, touches it, and what the touch does depends
  // only on how many have come before.
  //
  //   first   it shoves the thing, and that is all it does
  //   second  the green is on it, and stays on it
  //   third   whatever this was, it is not that any more
  //
  // The escalation is the ability, so the count is on the solid and not on the
  // world: the beast can be walked round a room marking three separate things
  // once each, and none of them is any nearer its third for the others. The
  // room the beast is standing in is wherever it last touched something.
  'lie-marks': ({ world, ship, structure, hold, id, away, at, heading, standingIn: here }) => {
    const lies = (hold?.lies ?? 0) + 1
    const beside = { ...world, chimera: structure.spaceId, summoned: calledUp(here, at, heading) }

    if (lies === 1) {
      const landing = shove(ship, { structure, hold }, away(1.4))
      return {
        world: withHold(beside, id, { lies, ...(landing ? { at: landing } : {}) }),
        report: { kind: 'lie-pushed', solidId: id, metres: landing ? 1.4 : 0 },
      }
    }

    if (lies === 2) {
      return {
        world: withHold(beside, id, { lies, aura: 'green' }),
        report: { kind: 'lie-greened', solidId: id },
      }
    }

    // The third, which takes the thing away and leaves the thing it became.
    // `gone` rather than a third appearance, because what stands there
    // afterwards is not a fitting of the ship at all: the deck stops drawing
    // it and `$lib/tour/apparitions` puts a beast where it was.
    return {
      world: withHold(beside, id, { lies, monster: true, gone: true }),
      report: { kind: 'lie-transformed', solidId: id },
    }
  },

  // The Sun and Moon: one hand puts the sun on, the other the moon, and which
  // hand cast is the visitor's own decision rather than a turn taken — the walk
  // gives them a key each. A marked thing wakes up and goes looking for its
  // opposite; what happens when it finds it is `polarityStep`'s.
  polarity: ({ world, id, mark }) => ({
    world: withHold(world, id, { mark, alive: true }),
    report: { kind: 'marked', solidId: id, mark },
  }),

  // The two exchange appearances, and nothing else: each stays where it is
  // and stays what it is.
  'identity-swap': ({ world, ship, structure, hold, id }) => {
    if (!world.pairing || world.pairing === id) {
      return { world: { ...world, pairing: id }, report: { kind: 'solid-paired', solidId: id } }
    }
    const other = solidById(ship, world, world.pairing)
    if (!other)
      return { world: { ...world, pairing: id }, report: { kind: 'solid-paired', solidId: id } }
    const mine = solidNow(structure, hold)
    const theirs = solidNow(other, world.solids[other.id])
    return {
      world: {
        ...withHold(withHold(world, id, { kind: theirs.kind }), other.id, { kind: mine.kind }),
        pairing: null,
      },
      report: { kind: 'swapped', solidId: id, otherId: other.id },
    }
  },

  relay: ({ world, id }) => ({
    world: { ...world, pairing: id },
    report: { kind: 'cargo-taken', solidId: id },
  }),

  // Into the bag, and the bag remembers the order. Blinky swallows what is not
  // alive and not Nen — a solid another technique has hold of is refused before
  // this is ever reached — and what he swallows is gone from the room until he
  // is asked for it back.
  vacuum: ({ world, id }) => ({
    world: {
      ...withHold(world, id, { gone: true }),
      hoover: [...world.hoover.filter((held) => held !== id), id],
    },
    report: { kind: 'swallowed', solidId: id, held: world.hoover.length + 1 },
  }),
}

/**
 * Anything aimed at a solid while Kurton is being ridden loads it instead, up
 * to the five he carries: a vehicle passes what it is given to its hold.
 */
function loadIntoHold(world: TourWorld, structure: Structure | null): TourCastResult | null {
  if (!world.body.riding || !structure) return null
  if (world.body.passengers.includes(structure.id)) return null
  if (world.body.passengers.length >= CAPACITY) return { world, report: { kind: 'hold-full' } }

  const passengers = [...world.body.passengers, structure.id]
  return {
    world: { ...withHold(world, structure.id, {}), body: { ...world.body, passengers } },
    report: { kind: 'loaded', solidId: structure.id, passengers: passengers.length },
  }
}

/**
 * The three casts that do not go to the solid the visitor is aiming at.
 *
 * Winding up needs nothing to hit, the confetti goes wherever it first stuck,
 * and Transport Portals asks for a room second. Each is answered before the
 * target is looked up, because for these the target is not where the cast goes.
 */
function castPastTheTarget(
  world: TourWorld,
  kind: HatsuInteractionKind,
  aimedAt: { input: TourCastInput; structure: Structure | null },
): TourCastResult | null {
  const { input, structure } = aimedAt
  const { ship } = input

  if (kind === 'windup' && !structure) {
    const turns = world.windup + 1
    return { world: { ...world, windup: turns }, report: { kind: 'wound-up', turns } }
  }

  if (kind === 'shred' && world.wound) return shredTheWound(world, ship, world.wound)

  // The aura runs along the floor and comes up wherever it was sent, and a
  // stretch of empty deck is somewhere it can be sent: the technique was
  // refusing every room the reticle happened to cross without a solid in it,
  // which from inside the walk was a punch that did nothing four casts in five.
  // Nothing is struck and nothing is moved — the floor answers, and that is the
  // whole of the report.
  // Nothing down the reticle, and something in the bag: the last thing in is
  // the first thing out, set down where the aura came down. An empty bag falls
  // back to what Blinky did before he had one — the room, swallowed whole.
  if (kind === 'vacuum' && !structure) {
    const room = input.targetId ? ship.spaces.get(input.targetId) : null
    if (!room) return { world, report: { kind: 'no-target' } }
    const last = world.hoover[world.hoover.length - 1]
    const coughed = solidById(ship, world, last ?? null)
    if (!coughed) {
      if (nenHeld(world).includes(room.id)) {
        return { world, report: { kind: 'refused', spaceId: room.id } }
      }
      if (world.emptied.includes(room.id)) {
        return { world, report: { kind: 'emptied', spaceId: room.id, structures: 0 } }
      }
      const structures = ship.structures.filter((solid) => solid.spaceId === room.id).length
      return {
        world: { ...world, emptied: [...world.emptied, room.id] },
        report: { kind: 'emptied', spaceId: room.id, structures },
      }
    }
    const hoover = world.hoover.slice(0, -1)
    return {
      world: {
        ...withHold(world, coughed.id, {
          gone: false,
          at: landingIn(room, { at: input.at, heading: input.heading })[room.id],
        }),
        hoover,
        // It comes out where it was put down, so it belongs to that room now.
        copies: world.copies.map((copy) =>
          copy.id === coughed.id ? { ...copy, spaceId: room.id } : copy,
        ),
      },
      report: { kind: 'coughed-up', solidId: coughed.id, spaceId: room.id, held: hoover.length },
    }
  }

  /**
   * Air Blow held on a thing, which is the one thing it is *not* recorded doing.
   *
   * The catalogue's entry is four sentences long and three of them say the same
   * thing: it comes out of the left palm, contact does not appear to be
   * required, and its precise functioning remains unknown. Nothing about a
   * rate, nothing about a reach, nothing about what a second gust adds to the
   * first. So the walk offers the sustained fire and refuses it with its
   * reason, which is more honest than inventing a cadence and quieter than
   * hiding the key: a reader who tries it learns what the archive does not say.
   */
  if (kind === 'blast' && structure) {
    return { world, report: { kind: 'blast-solid-refused', solidId: structure.id } }
  }

  // Order Stamp aimed at no solid is the order: the stamp is already on the
  // heads that matter, and this is the click that tells the locked ones where
  // to go. Nothing locked and the order is spoken into the room and ignored,
  // which is the whole point of the lock.
  if (kind === 'command' && !structure) {
    const room = input.targetId ? ship.spaces.get(input.targetId) : null
    if (!room) return { world, report: { kind: 'no-target' } }
    return orderThePuppets(
      world,
      room,
      landingIn(room, { at: input.at, heading: input.heading })[room.id],
    )
  }

  // The same blow with nothing under the reticle but deck: the exit is the
  // point the aura came down at in the room aimed at, and the rule is the same
  // rule — a room across an open well is a room the fist cannot reach.
  if (kind === 'remote-strike' && !structure) {
    const room = input.targetId ? ship.spaces.get(input.targetId) : null
    if (!room) return { world, report: { kind: 'no-target' } }
    const exit =
      landingIn(room, { at: input.at, heading: input.heading })[room.id] ?? centroid(room)
    const through = punchRuns({
      from: input.at,
      to: exit,
      onFloor: onFloorOf(ship, room.tierId),
    })
    if (!through) return { world, report: { kind: 'punch-refused', spaceId: room.id } }
    return { world, report: { kind: 'came-up-empty', spaceId: room.id, through } }
  }

  if (kind === 'relay' && world.pairing) {
    const cargoId = world.pairing
    const cargo = solidById(ship, world, cargoId)
    const room = input.targetId ? ship.spaces.get(input.targetId) : null
    if (!cargo || !room) return { world, report: { kind: 'no-target' } }
    return {
      world: {
        ...withHold(world, cargoId, { at: centroid(room) }),
        pairing: null,
        // The cargo now stands in the far relay, so it belongs to that room.
        copies: world.copies.map((copy) =>
          copy.id === cargoId ? { ...copy, spaceId: room.id } : copy,
        ),
      },
      report: { kind: 'cargo-landed', solidId: cargoId, spaceId: room.id },
    }
  }

  return null
}

/** One more volley into whatever the confetti is already stuck to. */
function shredTheWound(world: TourWorld, ship: Ship, woundId: string): TourCastResult {
  const wounded = solidById(ship, world, woundId)
  const hold = world.solids[woundId]
  if (!wounded || hold?.gone) {
    return { world: { ...world, wound: null }, report: { kind: 'no-solid' } }
  }
  const left = (hold?.scale ?? 1) * 0.7
  if (left < 0.2) {
    return {
      world: { ...withHold(world, woundId, { gone: true }), wound: null },
      report: { kind: 'shattered', solidId: woundId },
    }
  }
  return {
    world: withHold(world, woundId, { scale: left }),
    report: { kind: 'shred-cut', solidId: woundId, left: Math.round(left * 100) },
  }
}

/**
 * One cast on the solid.
 *
 * Split out of `castInTour` because the two halves share nothing but the world:
 * a room is a place and a solid is a thing, and the rules that bind them —
 * Snake Arm holding one fast, Nen Stitches putting one back — are all here.
 */
function castOnSolid(
  world: TourWorld,
  kind: HatsuInteractionKind,
  input: TourCastInput,
): TourCastResult {
  const { ship, targetSolidId, at, heading = 0 } = input
  const structure = solidById(ship, world, targetSolidId ?? null)

  const elsewhere =
    loadIntoHold(world, structure) ?? castPastTheTarget(world, kind, { input, structure })
  if (elsewhere) return elsewhere

  if (!structure) return { world, report: { kind: 'no-solid' } }
  const id = structure.id
  const hold = world.solids[id]

  // Snake Arm holds a thing fast. Only the chain that undoes damage, and the
  // blast that strips holds off a room, get past it.
  if (hold?.bound && kind !== 'serpent' && kind !== 'stitch') {
    return { world, report: { kind: 'bound-fast', solidId: id } }
  }
  if (hold?.gone && kind !== 'stitch') return { world, report: { kind: 'no-solid' } }

  const away = (metres: number): Vec2 => {
    const now = solidNow(structure, hold)
    const dx = now.at[0] - at[0]
    const dz = now.at[1] - at[1]
    const length = Math.hypot(dx, dz) || 1
    return [(dx / length) * metres, (dz / length) * metres]
  }

  // What may be aimed at a solid is the module's declaration, not this table's
  // shape: the table says how the cast looks, the manifest says whether it is
  // allowed at all. The two agree for the eighty-two — `targeting.test.ts`
  // holds them to it — so this refuses nothing the walk used to do.
  const cast = acceptsFamily(kind, 'solid') ? SOLID_CASTS[kind] : undefined
  return cast
    ? cast({
        world,
        ship,
        structure,
        hold,
        id,
        heading,
        away,
        mark: input.mark ?? 'sun',
        at,
        standingIn: input.standingIn,
      })
    : { world, report: { kind: 'inert' } }
}
