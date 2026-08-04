/**
 * What Nen puts in the room, as things rather than as state.
 *
 * `$lib/tour/hatsu` says what a technique did; the scene says how the ship
 * looks. Between the two there was a gap: half the fourth and fifth waves
 * changed a field nobody drew, so casting them was a sentence in the read-out
 * and nothing in the walk — an owl attached to no perch, a tunnel with no
 * mouth, a card laid on a room that never showed a card.
 *
 * This is that missing middle, and it is deliberately not three.js. It reads
 * the world and answers with a list of apparitions: what stands where, how big,
 * how high off the deck, in what colour, and whether it takes Gyo to see. The
 * scene builds a mesh per entry and moves it; it never asks what a technique is
 * called. Everything here is pure, so what the walk shows can be tested without
 * a canvas.
 */
import { ceilingOf, floorOf, type Ship } from './blueprint'
import { distanceToBoundary, pointInPolygon } from './geometry'
import {
  boundSolidIds,
  centroid,
  solidById,
  solidNow,
  wanderOffset,
  FLOCK_PER_ROOM,
  TUNES,
  type TourReport,
  type TourWorld,
} from './hatsu'
import type { NenTechniqueState } from '@black-whale/nen-engine'
import type { Space, Vec2 } from './types'
// A type and nothing else: `morena` reads the insect's colour off this file,
// and this file needs the name of a card face. An import that is erased before
// anything runs is not a circle, and the alternative — a second spelling of the
// twelve faces, here — is how the two would drift.
import type { CardFace } from './morena'

export type ApparitionKind =
  /** A live opponent supplied by a game played inside the walk. */
  | 'combatant'
  /** Musse's owl, perched where Secret Window attached it. */
  | 'owl'
  /** Mizaistom's card, laid on the room: blue, yellow, then red. */
  | 'card'
  /** Beyond's mark, on the victim and on the sacrifice hidden among its own. */
  | 'mark'
  /** Benjamin's palm star, over a room whose Hatsu the baton took. */
  | 'star'
  /** Kacho's double, standing in the room it was left to guard. */
  | 'double'
  /** One mouth of Fugetsu's tunnel. */
  | 'portal'
  /** One of Chrollo's fish, swimming the room it was loosed in. */
  | 'fish'
  /** One of Kalluto's dolls, stuck to something in the room it watches. */
  | 'paper'
  /** Order Stamp's 人, on the head of a thing it has made a puppet of. */
  | 'stamp'
  /** Cargo a relay is holding, waiting to be advanced to the next one. */
  | 'cargo'
  /** Blinky himself: the vacuum, carried at the visitor's side. */
  | 'hoover'
  /** Kalluto, stood in a room the snakes are loose in. */
  | 'puppet'
  /** A strand of Bungee Gum strung across a room, waiting to be walked into. */
  | 'gum'
  /** Sayird's insect, flying the room the sphere was sent to. */
  | 'insect'
  /** Shalnark's antenna, stuck into a solid. */
  | 'antenna'
  /** The Dowsing Chain: links off the visitor's hand, with the ball on the end. */
  | 'chain'
  /** Skill Hunter, held open in front of the visitor with a ribbon on one page. */
  | 'book'
  /** Snake Arm, wound round the thing it is holding fast. */
  | 'snake'
  /** The Sun and Moon's sun, burning over the thing one hand marked. */
  | 'sun-mark'
  /** And its moon, over the thing the other hand marked. */
  | 'moon-mark'
  /** Melody's flute, materialized in the visitor's hands. */
  | 'flute'
  /** One flower of the room the soft air put in bloom. */
  | 'bloom'
  /** One note of the sharp air, loose in the room it was played into. */
  | 'note'
  /** Camilla's Guardian Spirit Beast, hung under the deckhead of one room. */
  | 'medusa'
  /** Tserriednich's, stood beside the last thing it touched. */
  | 'chimera'
  /** And what its third contact left standing where a fitting used to be. */
  | 'monster'
  /** Tubeppa's, squatting in the room it is filling. */
  | 'toad'
  /** One puff of what it is filling the room with. */
  | 'gas'
  /** Zhang Lei's, turning over the room it was raised in. */
  | 'wheel'
  /** And the coin at its mouth, worth nothing to anybody who does not take it. */
  | 'coin'
  /** Tyson's heart-shaped Guardian Spirit Beast, which produces Eye-wogs. */
  | 'tyson-guardian'
  /** One of Tyson's Eye-wogs, attached to the reader it is levying. */
  | 'wog'
  /** Luzurus's, coiled in the room it baited. */
  | 'centipede'
  /** Salé-salé's, hanging in the room its mouths are filling. */
  | 'mouths'
  /** One part of what those mouths have put into the room. */
  | 'fume'
  /** One of Momoze's, wherever it has got to. */
  | 'sprite'
  /** One of Cluck's, circling whoever called the flock in. */
  | 'bird'
  /** Marayam's, filling the doorway of the room it shut you into. */
  | 'dragon'
  /** Camilla's other one, taking apart the room that wears her name. */
  | 'cat'
  /**
   * Lovely Ghostwriter's beast, at the elbow of whoever it is writing for.
   *
   * Neon's, and Chrollo's since he took it: a pale animal with its mouth open
   * and a pen in one hand, which does the writing while its owner does not.
   * The only manifestation in the archive that belongs to the person rather
   * than to the room they are standing in.
   */
  | 'ghost'
  /**
   * Morena Prudo, seated behind her fan in the hideout's office.
   *
   * The only apparition in the walk that is a person rather than a technique —
   * which is exactly what she is in the manga, a game master who does nothing
   * at all until you sit down. Laid out by `$lib/tour/morena`, not by
   * `apparitionsOn`: the negotiation is its own state and is not something the
   * ship is holding.
   */
  | 'dealer'
  /** One card of that game, face up or face down on the table between them. */
  | 'game-card'
  /**
   * The visitor's own heart, worn where it is, with the vow wound round it.
   *
   * Judgment Chain is the one capability in the archive that is not aimed at
   * the room: Kurapika's chain goes into a chest, and the chest it goes into
   * here is the reader's. So this is the only apparition in the walk that is
   * *inside* the person carrying it — worn like the Dowsing Chain and the open
   * book, but at the sternum rather than in a hand, and visible by looking
   * down at yourself, which is the only direction the vow points.
   */
  | 'vow-heart'
  /**
   * Moonlight Act's pen and paper, and the contract they become.
   *
   * The one ability in the archive whose manifestation is stationery: Longhi
   * transmutes her aura into a pen and a sheet, and what the technique does is
   * done by writing on the one with the other. Blank and held up between the
   * two parties while the terms are being stated; signed, and lying in the
   * corner of the table, once they have agreed to them.
   */
  | 'contract'
  /** A canonical character represented in the living reconstruction. */
  | 'avatar'

/**
 * One thing Nen has left standing in the ship.
 *
 * `id` is stable across frames — the scene keys its meshes on it, so a card
 * that goes from blue to yellow is the same card turned over rather than a new
 * one built and the old one thrown away.
 */
export interface Apparition {
  id: string
  kind: ApparitionKind
  spaceId: string
  tierId: string
  /** Where it stands, in the coordinates of the deck it is on. */
  at: Vec2
  /** Direction of travel for moving humans, in radians around the vertical axis. */
  heading?: number
  /** How high its centre is, in metres above sea level, like every other Y. */
  y: number
  /** Its size in metres: what that measures is the kind's own business. */
  size: number
  /** What it is drawn in, as three.js takes a colour. */
  colour: number
  /** How far the technique has got: the card's three stages, and nothing else. */
  stage: number
  /** Visual direction for the shared human figure used by tour-derived games. */
  human?: {
    role:
      | 'witness'
      | 'guard'
      | 'nen-guard'
      | 'hunter'
      | 'fighter'
      | 'steward'
      | 'victim'
      | 'silent-majority'
      | 'morena'
    pose: 'idle' | 'walk' | 'listen' | 'search' | 'held' | 'guard' | 'attack' | 'fallen' | 'seated'
    /**
     * What this body is wearing, when its role's own clothes are not the answer.
     *
     * The nine roles carry a costume each, which was enough while the only
     * people in the walk were supplied by a game. The named cast of ADR-003 is
     * not: a queen and her servant are both drawn from the catalogue's own
     * roles, and one of them is in a gown. Overriding the cloth rather than
     * adding a tenth role keeps the looks a closed set — see
     * `lib/tour/cast/wardrobe.ts`, which is the only thing that sets this.
     */
    dress?: 'civilian' | 'uniform' | 'suit' | 'combat' | 'ritual' | 'gown'
    aura?: 'none' | 'ten' | 'ren' | 'zetsu'
    /** Shared Nen state; every human figure consumes the same engine contract. */
    nen?: NenTechniqueState<'head' | 'torso' | 'hands' | 'feet'>
    /** Stable identity seed: named character when known, otherwise apparition id. */
    identity?: string
    alert?: boolean
  }
  /**
   * Whether only Gyo shows it.
   *
   * One thing in the walk is deliberately hidden — the sacrifice Beyond chose
   * among the victim's own — and Emperor Time is what finds it, exactly as the
   * technique says. The scene draws it faintly rather than not at all when the
   * ship is laid open.
   */
  hidden: boolean
  /** The other mouth of the tunnel, for the portal that has to see through it. */
  pair?: { spaceId: string; tierId: string; at: Vec2; y: number }
  /**
   * How far up something wound round a solid has to climb, in metres.
   *
   * Only Snake Arm has one. Everything else in this list stands beside a thing
   * or over it; the arm is wrapped *around* it, so it needs the height of what
   * it is holding as well as the width, and one `size` cannot say both.
   */
  climb?: number
  /**
   * What is printed on it, for the one apparition that has a front and a back.
   *
   * Only a game card has one, and only while it is lying face up: the drawing
   * is the difference between a card somebody has read and a card somebody has
   * been *told about*, which is the whole of what reading a hand buys. A card
   * face down has no face here, because it has none on the table either.
   */
  face?: CardFace
  /**
   * Whether the visitor may take hold of it.
   *
   * Nothing the ship or a technique leaves standing is: an aura shell is a
   * thing to walk past. Morena's table is the exception the walk sits down at,
   * and there a card is not scenery — it is the move. The scene answers what is
   * down the reticle and reports the `id`; what taking hold of it *does* is
   * decided where the game is, which is never here.
   */
  pick?: boolean
  /**
   * How far from `at` the thing may wander, in metres.
   *
   * The fish have one, and so does everything that was sent somewhere with
   * instructions to move about once it got there: the free bird, a double
   * posted to wander, and Sayird's insect, which never holds still at all.
   * Everything else in this list is nailed to a point, and an aquarium is the
   * size of the room it is in.
   */
  spread?: number
}

// The colours the techniques are already published in, as numbers.
/**
 * Musse's owl, in the pale grey-blue the walk has always perched it in.
 *
 * Exported for the same reason the insect's blue is: the bird is stuck to a
 * bulkhead over Morena's table as well as to the ones in the corridors, and a
 * bird that was one colour on the walk and another in the office would read as
 * two techniques rather than as one technique in two rooms.
 */
export const OWL = 0xa8b7d8
/**
 * Cluck's pigeons, in the grey the birds are drawn in.
 *
 * Deliberately not the owl's blue and not Momoze's colour wheel: this flock is
 * ordinary birds under somebody's control, and the thing that marks them as
 * Nen is the thread each one is on rather than a colour no pigeon has.
 */
export const BIRDS = 0xb9bec6
export const AVATAR = 0x888888
const CARDS = [0x4d8ff0, 0xf0c94d, 0xe5484d]
const CURSE = 0x9d65d0
const STAR = 0xffd166
/**
 * Kacho's double, in the pink the registry publishes Without You in.
 *
 * Exported because it sits down at Morena's table as well: it is the one proxy
 * there that answers a death rather than avoiding one, and it takes the chair
 * the moment the guest dies in it.
 */
export const DOUBLE = 0xf6b8d1
const PORTAL = 0x80edc7
const FISH = 0x78b6c9
const PAPER = 0xefb9c8
const CARGO = 0xe2b86e
const HOOVER = 0x9fb3c8
/** Order Stamp's own red, the one the technique is published in. */
const STAMP = 0xcf6d62
/** And the red a locked puppet wears, which is the red of the web's outline. */
const STAMP_LOCKED = 0xff2d2d
/** Kalluto is drawn in ink: a black kimono, a bob, and a painted face. */
const PUPPET = 0x1b1b22
/** Bungee Gum is Hisoka's own pink, the same the web draws his filament in. */
const GUM = 0xf06bb5
/**
 * Little Eye's blue, which is the sphere rather than the animal inside it.
 *
 * Exported because the walk is not the only room the insect is flown in:
 * `$lib/tour/morena` sends the same one over a card table, and a sphere that
 * was one blue in the corridors and another over the wood would read as two
 * techniques.
 */
export const INSECT = 0x55c2ff
/** The Dowsing Chain is steel: the pale blue the dock already publishes it in. */
const CHAIN = 0x8ecae6
/**
 * Which of the five chains is in the hand, by the technique being held.
 *
 * One hand, five fingers, five chains — and the walk knows the difference
 * between them by the tip alone, which is how the source distinguishes them
 * too: the archive's own entries name the cross on the thumb chain and the
 * blade on the judgment one, and the dock names the syringe on the index and
 * the shackle on the middle. The number is the tip `apparitionObjectView`
 * builds, and it is the whole of the vocabulary the two modules share.
 */
const CHAIN_TIPS: Record<string, number> = {
  dowsing: 0, // the pendulum ball
  'chain-rule': 1, // Steal Chain's syringe
  'chain-bind': 2, // Chain Jail's shackle
  healing: 3, // Holy Chain's cross
  'heart-vow': 4, // Judgment Chain's blade
}
/**
 * The heart the vow is sworn on, and the links wound round it.
 *
 * Two colours rather than one, because the whole of this manifestation is the
 * difference between them: meat, and the thing holding it. The flesh is the
 * dark red the source draws it in and the chain is white — not the Dowsing
 * Chain's steel blue, which is a tool, but the light Kurapika's chains are
 * drawn in when one of them is a judgment. Exported for the same reason the
 * insect's blue is: `$lib/tour/morena` swears the same vow over a card table.
 */
export const HEART = 0x7d2338
export const VOW_CHAIN = 0xf4f4ff
/**
 * Double Face's violet, the one the registry publishes the bookmark in.
 *
 * Exported because the same boards are opened at Morena's table: Skill Hunter
 * lies on the wood there, and a book that was one colour in the corridors and
 * another on a card table would read as two books.
 */
export const BOOK = 0x9c7ac4
/** And the ribbon, which has to be the one thing in the book that is not violet. */
export const BOOKMARK_RIBBON = 0xffd166
/**
 * Snake Arm is two colours and a ribbon, and it is drawn as it is drawn in the
 * source: an arm of flat black, a violet head at the end of it, and the pink
 * bow at the join that is the whole reason the thing is recognisable. Only the
 * arm is the apparition's own colour — the head and the bow are the scene's,
 * the way the owl's eyes and Kalluto's painted face are.
 */
const SNAKE = 0x14141a
export const SNAKE_HEAD = 0xa06ad4
export const SNAKE_BOW = 0xef7ac8
/** Halkenburg's collective aura, which is the gold of the whole ship's will. */
export const ARROW = 0xf7e27d
/** Rising Sun is the one technique whose colour is a temperature. */
export const SUN = 0xf2a63b
/**
 * And The Sun and Moon's other half, which is the cold end of the same pair.
 *
 * The sun's mark is drawn in the heat above, because the two are the same
 * light: what tells them apart across a promenade is the shape — a disc with
 * rays, and a crescent — and the colour only seconds that.
 */
export const MOON = 0xbcd2f5

/**
 * Enchanting Music: the instrument, and the two airs that leave something in
 * the room to see.
 *
 * The flute is silver because it is the one apparition in the walk that is a
 * made object rather than aura — Melody carries it, and what the technique does
 * is play it. The flowers are the pink the registry publishes the technique in;
 * the notes are paler, because ink hanging in the air of a dark ship has to be
 * legible before it is pretty. The heart of a flower is the walk's own gold.
 */
const FLUTE = 0xe6e0cf
const BLOOM = 0xf2a0c8
export const BLOOM_HEART = 0xffd166
export const BLOOM_LEAF = 0x7fc8a0
const NOTE = 0xd7c6f7

/**
 * The five Guardian Spirit Beasts, each in the colour the registry already
 * publishes its ability in.
 *
 * They are the one family of apparitions in the walk that are animals rather
 * than marks, and the walk has no business inventing a palette for them: the
 * dock draws Camilla's ability in that pink and the archive has done so since
 * the abilities page was built, so the thing that turns up in the room is that
 * pink too, and a visitor who has met the technique on the web recognises it
 * aboard without being told.
 *
 * The coin is the exception that is not one: it is gold because it is a coin,
 * and it has to be told from the wheel that produced it at a glance.
 */
const MEDUSA = 0xd98cae
/**
 * Tserriednich's, in the violet the walk has always stood it in.
 *
 * Exported for the reason the owl's grey-blue and the insect's blue are: the
 * same beast stands in the hideout's office when somebody sits down at Morena's
 * table carrying Three-Lie Transformation, and a Guardian Spirit Beast that was
 * one colour in the corridors and another over the wood would read as two.
 */
export const CHIMERA = 0x9e6d89
/** What a third lie leaves standing: the same violet, gone bad. */
const MONSTER = 0x6f3f66
const TOAD = 0x7fb08a
/** The gas, which is the one thing in the walk that is meant to look wrong. */
const GAS = 0xb9e08f
const WHEEL = 0xd7b34f
const COIN = 0xf4d67a
const WOG = 0xe8c4d8
const CENTIPEDE = 0xc98a5e
const DRAGON = 0x8fb8c9
/** Camilla's cat is drawn in her own pink, like the jellyfish: they are hers. */
const CAT = 0xd98cae
const MOUTHS = 0xb9a6d8

/**
 * The six colours Salé-salé's mouths put out, one per mouth.
 *
 * The ability is one influence and the drawing is one head with a dozen mouths
 * on it, so what tells the parts apart has to be the colour: each mouth is
 * breathing out something of its own, and the room ends up holding all of them.
 * Six because that is how many steps the room takes to fill — the nth part of
 * the room is the nth mouth's, and a visitor watching it fill sees a new colour
 * arrive each time rather than more of the last one.
 */
export const FUME_COLOURS = [0xc9a0e8, 0x8fd5e0, 0xe8c48f, 0x9fe0a8, 0xe89fb8, 0xd8d88f]

/**
 * The colours Momoze's flock comes in.
 *
 * Momoze's ability is drawn as a nursery: a bear the size of a room, a jelly on
 * the ceiling, a wolf on the floorboards, and nothing about any of them
 * matching anything else. So the flock is the one thing in the walk with no
 * single colour — the registry publishes the ability in that first pink, and
 * the rest are the walk's own, chosen only to be plainly not each other.
 */
export const SPRITES = [0xe7a6c4, 0x9fd6e8, 0xf0d79a, 0xa8dfb4, 0xc6b0ea, 0xf0a89a, 0xd9e0a0]

/**
 * How many puffs of gas a room gets, and how many tentacles the jellyfish has.
 *
 * Both are a handful for the shoal's reason: what the visitor has to read
 * across a promenade is *this room is full of it*, and the twentieth puff says
 * that no better than the tenth.
 */
export const PUFFS = 10
export const TENTACLES = 12

/**
 * How many flowers a room in bloom gets, and how many notes are left hanging.
 *
 * Both are a handful rather than a census, for the shoal's reason: what the
 * visitor has to read across a promenade is *this room has been played into*,
 * and two hundred flowers say that no better than sixteen while costing a
 * hundred and eighty more meshes.
 */
export const FLOWERS = 16
export const LOOSE_NOTES = 12

/** How many fish a room gets, whatever its size. A shoal, not a census. */
export const SHOAL = 7
/** How many dolls a room gets over and above one per thing standing in it. */
const LOOSE_DOLLS = 5
/** Air Blow is a palm blast of pale air; Remote Punch is a fist of blue aura. */
export const GUST = 0xc6f1ff
export const PUNCH = 0x55a7ff
/** Ripper Cyclotron's own gold, as the dock publishes the technique. */
export const CYCLOTRON = 0xf2c34f
/** Double Machine Gun's own amber, as the dock publishes the technique. */
export const VOLLEY = 0xe6ad57

/** How wide a mouth of the tunnel stands, in metres. A door, not a gate. */
export const PORTAL_RADIUS = 1.15

/**
 * How close is close enough to have stepped into the tunnel.
 *
 * Slightly wider than the mouth itself: the walk is a camera at head height and
 * the ring is a disc on the floor, so a visitor who has walked into it is
 * measured against where their feet are, and a hair of margin is what stops a
 * shoulder passing through a doorway nobody meant to take.
 */
export const PORTAL_REACH = PORTAL_RADIUS + 0.35

/**
 * Stations spread over the whole of a room, each with its own stretch of water.
 *
 * A grid over the footprint's box, kept where it falls inside the room itself —
 * which is what makes this work on the L-shaped rooms and the ones whose middle
 * is outside them. `water` is how far that station is from the nearest wall,
 * less a margin, so whatever swims about it stays in the room. Deterministic:
 * the same room gives the same stations every time it is asked, or the shoal
 * would be somewhere else on every frame.
 */
function stationsIn(
  space: Space,
  wanted: number,
  near?: Vec2,
): { index: number; at: Vec2; water: number }[] {
  const xs = space.footprint.map((corner) => corner[0])
  const zs = space.footprint.map((corner) => corner[1])
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minZ = Math.min(...zs)
  const maxZ = Math.max(...zs)

  // Enough of a grid to have somewhere to put everyone even when half of it
  // falls outside an awkward footprint, and laid along the room's long axis.
  // A grid fine enough to have somewhere to put everyone even when half of it
  // falls outside an awkward footprint — and, on a room the size of a
  // promenade, fine enough that the nearest of them is somewhere the visitor
  // can actually see from where they cast.
  const across = Math.max(4, Math.round(Math.sqrt(wanted * 6)))
  const found: { index: number; at: Vec2; water: number }[] = []
  for (let i = 0; i < across; i++) {
    for (let j = 0; j < across; j++) {
      // Offset rows, so the shoal is not a lattice.
      const u = (i + 0.5 + (j % 2) * 0.25) / across
      const v = (j + 0.5) / across
      const at: Vec2 = [minX + (maxX - minX) * u, minZ + (maxZ - minZ) * v]
      if (!pointInPolygon(at, space.footprint)) continue
      const water = Math.min(4, distanceToBoundary(at, space.footprint) - 0.6)
      if (water <= 0.3) continue
      found.push({ index: found.length, at, water })
    }
  }
  // A room too narrow for a single station still gets one fish, on the spot.
  if (!found.length) return [{ index: 0, at: centroid(space), water: 0.4 }]
  // The ones nearest where the aura came down: a shoal loosed at the far end of
  // a hundred and forty metres of promenade is a shoal nobody ever sees.
  const sorted = near
    ? [...found].sort(
        (a, b) =>
          Math.hypot(a.at[0] - near[0], a.at[1] - near[1]) -
          Math.hypot(b.at[0] - near[0], b.at[1] - near[1]),
      )
    : found
  return sorted.slice(0, wanted).map((station, index) => ({ ...station, index }))
}

/**
 * The way out of a room, as one point on its own boundary.
 *
 * The walk does not model the leaf of a door — a doorway is a gap the deck's
 * derivation leaves in a wall — so "the door" has to be answered from the
 * footprint alone. The honest answer is the point of the boundary nearest the
 * middle of the room: on a cabin it is the near wall, on anything long it is
 * the middle of a side, and on every room it is somewhere a person leaving
 * would actually have to pass. Deterministic, because a beast that stood
 * somewhere else on every frame would not be barring anything.
 */
export function doorwayOf(space: Space): Vec2 {
  const middle = centroid(space)
  let best: Vec2 = middle
  let nearest = Infinity
  const corners = space.footprint
  for (let i = 0; i < corners.length; i++) {
    const a = corners[i]
    const b = corners[(i + 1) % corners.length]
    // The point of this wall nearest the middle: the projection, clamped to
    // the segment so it never falls off the end of a wall.
    const dx = b[0] - a[0]
    const dz = b[1] - a[1]
    const length = dx * dx + dz * dz
    const t = length
      ? Math.max(0, Math.min(1, ((middle[0] - a[0]) * dx + (middle[1] - a[1]) * dz) / length))
      : 0
    const on: Vec2 = [a[0] + dx * t, a[1] + dz * t]
    const gap = Math.hypot(on[0] - middle[0], on[1] - middle[1])
    if (gap < nearest) {
      nearest = gap
      best = on
    }
  }
  // Stood just inside the wall rather than in it: a beast half in the steel is
  // a beast the room is drawing through.
  const inward = Math.hypot(middle[0] - best[0], middle[1] - best[1]) || 1
  return [
    best[0] + ((middle[0] - best[0]) / inward) * 0.9,
    best[1] + ((middle[1] - best[1]) / inward) * 0.9,
  ]
}

/** The floor and the headroom of a room, both in metres above sea level. */
function room(ship: Ship, space: Space) {
  const tier = ship.tiers.find((candidate) => candidate.id === space.tierId)
  if (!tier) return null
  const floor = floorOf(space, tier)
  return { floor, ceiling: floor + ceilingOf(space, tier), at: centroid(space) }
}

/** Where the walk is standing: a point on a deck, and which deck it is. */
export interface Footing {
  at: Vec2
  tierId: string
  /** Current room, when the renderer knows it and may lazily materialize occupants. */
  spaceId?: string | null
}

/** The state of the walk that an apparition may depend on. */
export interface Walk {
  /**
   * Where the walk currently is. Two things read it: Kacho's double, which does
   * not stand in a room at all — it stays beside the person it is protecting,
   * and follows them off the deck it was raised on — and Secret Window's
   * shoulder bird, which does the same at a bird's height.
   */
  visitor?: Footing
  /**
   * The walk's clock, for the marks that ride something that will not hold
   * still: a bomb drawn where its thing used to stand is a bomb that lies.
   */
  seconds?: number
}

/** What a technique just did, and where it was done from. */
export interface Cast {
  report: TourReport | null
  from: Vec2
  /**
   * Which way the visitor is facing, for the one flash that leaves a hand.
   *
   * Air Blow, and the reason it is worth a field: the catalogue's entry on it
   * says almost nothing, and the one thing it does say is that the emission
   * comes out of the **left palm**. A gust drawn out of the middle of the
   * visitor would be dropping the single fact the archive gives.
   */
  heading?: number
}

/**
 * Where the left palm is, in metres from where the visitor is standing.
 *
 * Half a metre out and a little forward, which is a hand held up rather than
 * a hand at the side: `air-blow`'s own entry has Vincent raising it to break a
 * guard. Not a measurement of anything — the archive gives no reach, no rate
 * and no force — it is only the place the one attested fact happens at.
 */
export const LEFT_PALM = 0.5

/** That palm, as a point on the deck. */
export const leftPalmOf = (at: Vec2, heading: number): Vec2 => [
  at[0] - Math.cos(heading) * LEFT_PALM,
  at[1] + Math.sin(heading) * LEFT_PALM,
]

/** How one apparition is drawn, over and above where it stands. */
type Drawn = Partial<Apparition> & {
  kind: ApparitionKind
  /** How high off the room's floor it hangs, in metres. */
  height: number
  size: number
  colour: number
}

/**
 * Every apparition in the ship, wherever it is.
 *
 * Not filtered to the deck being walked: the aura shells already draw a hold
 * four decks down, and the scene culls these against the geometry it has in it
 * rather than against a list of rooms. Order is stable, which is what lets the
 * scene diff frame to frame.
 */
export function apparitionsOn(ship: Ship, world: TourWorld, walk: Walk = {}): Apparition[] {
  const { visitor, seconds = 0 } = walk
  const found: Apparition[] = []

  /**
   * Where in a room a thing stands: where the aura came down, if the cast
   * remembered, and the middle of the room otherwise.
   */
  const landing = (space: Space) => world.landed[space.id] ?? centroid(space)

  const place = (id: string, space: Space, drawn: Drawn) => {
    const { kind, height, size, colour, ...extra } = drawn
    const measured = room(ship, space)
    if (!measured) return
    found.push({
      id,
      kind,
      spaceId: space.id,
      tierId: space.tierId,
      at: landing(space),
      // Never through the deckhead: a cabin with 2,2 m of headroom gets its owl
      // under the beam rather than in the deck above it.
      y: Math.min(measured.floor + height, measured.ceiling - 0.25),
      size,
      colour,
      stage: 0,
      hidden: false,
      ...extra,
    })
  }

  const spaceOf = (id: string | null | undefined) => (id ? (ship.spaces.get(id) ?? null) : null)

  /**
   * Where a Guardian Spirit Beast that comes up beside the visitor stands.
   *
   * Six of the ten do. `world.summoned` is where the caster was standing at the
   * moment of the cast — not where they are now, and not where they were
   * pointing — so the beast turns up with them and then stays put, which is
   * what the drawings show and what the reticle could never give: a beast
   * placed down the reticle came up at the far end of a promenade, or inside a
   * bulkhead, depending on what the visitor happened to be looking at.
   *
   * The room it belongs to is still the room it was cast *on* — that is where
   * its effect is — so this answers only the point, and only when the caster's
   * room is the one being asked about or the walk has nothing better. A beast
   * whose target room is somewhere else entirely falls back to that room's own
   * landing point, because standing it beside a visitor three decks away would
   * put it through a deckhead.
   */
  const beside = (space: Space): Vec2 => {
    const summoned = world.summoned
    if (!summoned || summoned.spaceId !== space.id) return landing(space)
    return inFrontOf(summoned, space.footprint, 1.8)
  }

  // The bird, perched as high as the room allows: it is eavesdropping through
  // the ceiling, so it sits where it would have to sit to do that.
  //
  // Unless it is the one that was sent to the visitor, which is not perched at
  // all: it rides the shoulder, at a shoulder's height and a shoulder's width
  // off, and the room under it is whichever one the walk is in. The free bird
  // is given room to drift, because it is on its way somewhere.
  const perch = spaceOf(world.owl)
  if (perch) {
    const mode = world.owlMode ?? 'wander'
    const beside = visitor?.at
    const measured = room(ship, perch)
    if (mode === 'shoulder' && beside && measured) {
      found.push({
        id: `owl:${perch.id}`,
        kind: 'owl',
        spaceId: perch.id,
        tierId: visitor?.tierId ?? perch.tierId,
        at: [beside[0] + 0.5, beside[1] + 0.5],
        y: Math.min(measured.floor + 1.5, measured.ceiling - 0.25),
        size: 0.5,
        colour: OWL,
        stage: 0,
        hidden: false,
      })
    } else {
      place(`owl:${perch.id}`, perch, {
        kind: 'owl',
        height: 2.4,
        size: 0.5,
        colour: OWL,
        spread: mode === 'wander' ? 1.8 : 0,
      })
    }
  }

  // Little Eye's insect, at the height a fly holds and nowhere near still: the
  // corner of the screen has always shown its feed, and this is the thing the
  // feed comes from, in the room it is actually in. Piloted it keeps close to
  // where it was sent; scouting or filming it works the room over.
  const host = spaceOf(world.eye)
  if (host) {
    place(`insect:${host.id}`, host, {
      kind: 'insect',
      height: 1.5,
      size: 0.16,
      colour: INSECT,
      spread: world.eyeMode === 'pilot' ? 0.7 : 1.9,
    })
  }

  // The cards, one apparition that carries how far the tribunal has got: blue
  // admitted, yellow restrained, red dismissed.
  for (const [spaceId, stage] of Object.entries(world.cards)) {
    const space = spaceOf(spaceId)
    if (!space || !stage) continue
    place(`card:${spaceId}`, space, {
      kind: 'card',
      height: 1.6,
      size: 0.75,
      colour: CARDS[Math.min(2, stage - 1)],
      stage,
    })
  }

  // The victim wears its mark openly. The sacrifice among its own wears one
  // too, and only Emperor Time shows it — which is the whole cruelty of it.
  const victim = spaceOf(world.curse?.victim)
  if (victim)
    place(`mark:${victim.id}`, victim, { kind: 'mark', height: 2, size: 0.95, colour: CURSE })
  const sacrifice = spaceOf(world.curse?.sacrifice)
  if (sacrifice && sacrifice.id !== victim?.id) {
    place(`mark:${sacrifice.id}`, sacrifice, {
      kind: 'mark',
      height: 2,
      size: 0.7,
      colour: CURSE,
      hidden: !world.laidOpen,
    })
  }

  for (const spaceId of world.stars) {
    const space = spaceOf(spaceId)
    if (space)
      place(`star:${spaceId}`, space, { kind: 'star', height: 2.4, size: 0.8, colour: STAR })
  }

  // The gum is strung at shin height, which is where a trip-line goes, and it
  // is the one thing aboard that is meant not to be seen: In hides it from
  // everything but Gyo, so the walk draws it faintly and only once the ship is
  // laid open. It stays after the visitor has been thrown back — the strand is
  // not spent by springing, and the room goes on catching them.
  for (const spaceId of world.gumTraps) {
    const space = spaceOf(spaceId)
    if (space)
      place(`gum:${spaceId}`, space, {
        kind: 'gum',
        height: 0.35,
        size: 1.2,
        colour: GUM,
        hidden: !world.laidOpen,
      })
  }

  // Kacho stands rather than floats: she is a person, and the one apparition
  // in the walk whose height is a person's height.
  //
  // And she does not stay where she was raised. The whole of the ability is
  // that the double remains beside the surviving twin — so she walks with the
  // visitor, two paces off, and the room she is recorded in is only where she
  // waits when the walk is somewhere she cannot follow.
  const guarded = spaceOf(world.double)
  if (guarded) {
    const beside = visitor?.at
    const measured = room(ship, guarded)
    const mode = world.doubleMode ?? 'follow'
    if (mode === 'follow' && beside && measured) {
      const here = ship.spaces.get(world.cameFrom ?? '') ?? null
      const floor = here && visitor ? (room(ship, here)?.floor ?? measured.floor) : measured.floor
      found.push({
        id: `double:${guarded.id}`,
        kind: 'double',
        spaceId: here?.id ?? guarded.id,
        tierId: visitor?.tierId ?? guarded.tierId,
        // Beside and a little behind: a guardian walks at your shoulder, and
        // one standing in front of you is in the way of the walk.
        at: [beside[0] + 1.4, beside[1] + 1.4],
        y: floor + 0.9,
        size: 0.9,
        colour: DOUBLE,
        stage: 0,
        hidden: false,
      })
    } else {
      place(`double:${guarded.id}`, guarded, {
        kind: 'double',
        height: 0.9,
        size: 0.9,
        colour: DOUBLE,
        spread: mode === 'wander' ? 2.5 : 0,
      })
    }
  }

  // Everything standing in a room, as the aura currently leaves it: the dolls
  // stick to it and the fish eat it, so both have to see what is actually there
  // rather than what the blueprint says was.
  const standingIn = (spaceId: string) =>
    [...ship.structures, ...world.copies]
      .filter((solid) => solid.spaceId === spaceId && !world.solids[solid.id]?.gone)
      .map((solid) => solidNow(solid, world.solids[solid.id]))

  // The fish swim the room rather than sitting in it — the whole room, and not
  // through its walls. Each one is given a station of its own somewhere inside
  // the footprint and only as much water as there is between that station and
  // the nearest bulkhead, so a shoal spreads over a promenade instead of
  // circling its centre, and none of them swims into the steel.
  for (const spaceId of world.devouring) {
    const space = spaceOf(spaceId)
    const measured = space ? room(ship, space) : null
    if (!space || !measured) continue
    for (const station of stationsIn(space, SHOAL, landing(space))) {
      found.push({
        id: `fish:${spaceId}:${station.index}`,
        kind: 'fish',
        spaceId: space.id,
        tierId: space.tierId,
        at: station.at,
        y: Math.min(measured.floor + 1.5 + (station.index % 3) * 0.45, measured.ceiling - 0.4),
        size: 0.55,
        colour: FISH,
        stage: station.index,
        hidden: false,
        spread: station.water,
      })
    }
  }

  // A doll on everything in the room, and a handful more in the air: what
  // Kalluto throws is a fistful of paper, and it sticks where it lands.
  for (const doll of world.watched) {
    const space = spaceOf(doll.spaceId)
    const measured = space ? room(ship, space) : null
    if (!space || !measured) continue
    const stuck = standingIn(space.id)
    stuck.forEach((solid, i) => {
      found.push({
        id: `paper:${space.id}:${solid.id}`,
        kind: 'paper',
        spaceId: space.id,
        tierId: space.tierId,
        at: solid.at,
        y: Math.min(measured.floor + 1.1, measured.ceiling - 0.3),
        size: 0.16,
        colour: PAPER,
        stage: i,
        hidden: false,
      })
    })
    const loose = stationsIn(space, LOOSE_DOLLS, landing(space))
    for (let i = 0; i < loose.length; i++) {
      // Thrown over the room rather than fanned about its middle: a fistful of
      // paper lands where it lands, and the same room lands it the same way
      // twice, because the walk has to be able to draw the same room twice.
      found.push({
        id: `paper:${space.id}:loose${i}`,
        kind: 'paper',
        spaceId: space.id,
        tierId: space.tierId,
        at: loose[i].at,
        y: Math.min(measured.floor + 1.4 + (i % 2) * 0.5, measured.ceiling - 0.3),
        size: 0.16,
        colour: PAPER,
        stage: stuck.length + i,
        hidden: false,
      })
    }
  }

  // Silent Majority, once in each room covered by the curse. The shared human
  // builder supplies its fixed mask, ritual robe and black bob.
  const silentRooms = world.snakes?.rooms ?? []
  const renderedSilentRooms = visitor
    ? visitor.spaceId
      ? silentRooms.filter((spaceId) => spaceId === visitor.spaceId)
      : []
    : silentRooms
  for (const spaceId of renderedSilentRooms) {
    const space = spaceOf(spaceId)
    const measured = space ? room(ship, space) : null
    if (!space || !measured) continue
    const [station] = stationsIn(space, 1, landing(space))
    found.push({
      id: `silent-majority:${spaceId}`,
      kind: 'avatar',
      spaceId: space.id,
      tierId: space.tierId,
      at: station.at,
      y: measured.floor,
      size: 0.42,
      colour: PUPPET,
      stage: 0,
      human: {
        role: 'silent-majority',
        identity: 'silent-majority',
        pose: 'idle',
        aura: 'none',
      },
      hidden: false,
    })
  }

  // Blinky, who is a thing rather than an effect: the vacuum is out for as long
  // as the aura is up, carried at the visitor's side, and how full it is is
  // written on it. `stage` is what it is holding, so the scene can show the bag.
  if (world.holding === 'vacuum' && visitor) {
    found.push({
      id: 'hoover',
      kind: 'hoover',
      spaceId: world.cameFrom ?? '',
      tierId: visitor.tierId,
      at: [visitor.at[0], visitor.at[1]],
      // Carried, so its height is the visitor's rather than the room's.
      y: 0,
      size: 0.5,
      colour: HOOVER,
      stage: world.hoover.length,
      hidden: false,
    })
  }

  // The chains, which are worn rather than placed: one is fixed to the visitor's
  // hand for as long as that aura is up, and hangs there swinging until
  // something is done with it. Like Blinky, they are carried — the scene puts
  // the chain at the hand every frame, so the room and the height here are only
  // what deck it belongs to.
  //
  // All five, and not the pendulum alone. Kurapika's abilities are one hand with
  // a chain on every finger, and the walk drew exactly one of them: a visitor
  // holding Steal Chain or Chain Jail had bare hands, and a technique that
  // materializes nothing reads as a technique that is not working — which is
  // what it was taken for. What differs between them is the tip, which is the
  // only thing that differs between them on the page either.
  const chain = CHAIN_TIPS[world.holding ?? ''] ?? null
  if (chain !== null && visitor) {
    found.push({
      id: 'chain',
      kind: 'chain',
      spaceId: world.cameFrom ?? '',
      tierId: visitor.tierId,
      at: [visitor.at[0], visitor.at[1]],
      y: 0,
      // The pendulum ball, in metres across. Every link and every other tip is
      // drawn to scale off it, so the five are one chain with five ends.
      size: 0.13,
      colour: CHAIN,
      stage: chain,
      hidden: false,
    })
  }

  // Judgment Chain, planted in every heart a vow was sworn on. The visitor's own
  // is worn at the sternum; every other is fixed to the chest of whoever stands
  // in the room the rule was laid on.
  for (const vow of Object.values(world.vows)) {
    const violated = vow.violated ? 2 : 1
    if (vow.subjectId === 'self') {
      if (!visitor) continue
      found.push({
        id: 'vow:self',
        kind: 'vow-heart',
        spaceId: visitor.spaceId ?? world.cameFrom ?? '',
        tierId: visitor.tierId,
        at: [visitor.at[0], visitor.at[1]],
        y: 0,
        size: 0.055,
        colour: HEART,
        stage: violated,
        hidden: false,
      })
    } else {
      const space = spaceOf(vow.subjectId)
      if (!space) continue
      const measured = room(ship, space)
      if (!measured) continue
      found.push({
        id: `vow:${vow.subjectId}`,
        kind: 'vow-heart',
        spaceId: space.id,
        tierId: space.tierId,
        at: landing(space),
        y: measured.floor + 1.1,
        size: 0.11,
        colour: HEART,
        stage: violated,
        hidden: false,
      })
    }
  }

  // Skill Hunter, held open in front of whoever is carrying the bookmark. Two
  // pages, and a ribbon lying across one of them — which one is the whole of
  // what Double Face is, so it is what `stage` carries: 0 for the left page,
  // 1 for the right. The book is worn like the chain and the hoover, so the
  // room and the height here say only what deck it belongs to.
  if (world.holding === 'bookmark' && visitor && world.book.bookmark) {
    const ribboned = world.book.pages.indexOf(world.book.bookmark)
    found.push({
      id: 'book',
      kind: 'book',
      spaceId: world.cameFrom ?? '',
      tierId: visitor.tierId,
      at: [visitor.at[0], visitor.at[1]],
      y: 0,
      // Half the width of one page, in metres: a book held at reading distance.
      size: 0.16,
      colour: BOOK,
      stage: ribboned < 0 ? 0 : ribboned,
      hidden: false,
    })
  }

  // Melody's flute, materialized for as long as the aura is up and carried the
  // way the chain and the book are: the scene puts it at the hands every frame,
  // so the room and the height here say only what deck it belongs to. `stage`
  // is which air is coming out of it — nought for none, and the scene reads
  // that as the difference between an instrument at the lips and one at the
  // side, which is the only tell that says the technique is doing anything.
  if (world.holding === 'melody' && visitor) {
    found.push({
      id: 'flute',
      kind: 'flute',
      spaceId: world.cameFrom ?? '',
      tierId: visitor.tierId,
      at: [visitor.at[0], visitor.at[1]],
      y: 0,
      // Half the length of the tube, in metres: a concert flute, near enough.
      size: 0.33,
      colour: FLUTE,
      stage: world.body.playing ? TUNES.indexOf(world.body.playing) + 1 : 0,
      hidden: false,
    })
  }

  // A room the soft air was played into, in flower. The flowers are planted
  // across the whole footprint rather than fanned about the middle, the way the
  // shoal is spread and for the same reason: what the piece changed is the
  // room, and a bouquet at the centre of a promenade is a bouquet.
  for (const spaceId of world.flowered) {
    const space = spaceOf(spaceId)
    const measured = space ? room(ship, space) : null
    if (!space || !measured) continue
    for (const station of stationsIn(space, FLOWERS, landing(space))) {
      found.push({
        id: `bloom:${spaceId}:${station.index}`,
        kind: 'bloom',
        spaceId: space.id,
        tierId: space.tierId,
        at: station.at,
        // Growing out of the deck, so the floor exactly: everything else in
        // this list hangs over a room and this is the one thing rooted in one.
        y: measured.floor,
        // Not one height: a bed of flowers all of a size is a lawn.
        size: 0.22 + (station.index % 3) * 0.07,
        colour: BLOOM,
        stage: station.index,
        hidden: false,
        spread: station.water,
      })
    }
  }

  // And a room the sharp air was played into, with the notes it shook loose
  // still hanging in it. `stage` is both which note it is — a crotchet, a
  // quaver, a semiquaver — and its place in the scatter, so no two are on the
  // same drift.
  for (const spaceId of world.scattered) {
    const space = spaceOf(spaceId)
    const measured = space ? room(ship, space) : null
    if (!space || !measured) continue
    for (const station of stationsIn(space, LOOSE_NOTES, landing(space))) {
      found.push({
        id: `note:${spaceId}:${station.index}`,
        kind: 'note',
        spaceId: space.id,
        tierId: space.tierId,
        at: station.at,
        // Head height and above: notes hang where they were played, which is
        // in front of a face rather than round anybody's ankles.
        y: Math.min(measured.floor + 1.4 + (station.index % 4) * 0.4, measured.ceiling - 0.3),
        size: 0.2,
        colour: NOTE,
        stage: station.index,
        hidden: false,
        spread: Math.min(station.water, 1.1),
      })
    }
  }

  // Cargo a relay has taken and not yet advanced. `pairing` is shared by every
  // technique that joins two things, so it is only cargo while the relay is the
  // aura being held.
  const cargo = world.holding === 'relay' ? solidById(ship, world, world.pairing) : null
  const cargoRoom = cargo ? spaceOf(cargo.spaceId) : null
  const cargoMeasured = cargoRoom ? room(ship, cargoRoom) : null
  if (cargo && cargoRoom && cargoMeasured) {
    found.push({
      id: `cargo:${cargo.id}`,
      kind: 'cargo',
      spaceId: cargoRoom.id,
      tierId: cargoRoom.tierId,
      at: solidNow(cargo, world.solids[cargo.id]).at,
      y: Math.min(cargoMeasured.floor + 1.8, cargoMeasured.ceiling - 0.3),
      size: 0.4,
      colour: CARGO,
      stage: 0,
      hidden: false,
    })
  }

  // Order Stamp's 人, one over every head it is on. A stamped puppet is drawn
  // in the technique's own red; a locked one — the one an order will actually
  // reach — is drawn in the bright red the web draws its outline in, so the
  // crowd is readable at a glance before anything is said to it.
  for (const [id, hold] of Object.entries(world.solids)) {
    if (!hold.stamped || hold.gone) continue
    const puppet = solidById(ship, world, id)
    const stampRoom = puppet ? spaceOf(puppet.spaceId) : null
    const measured = stampRoom ? room(ship, stampRoom) : null
    if (!puppet || !stampRoom || !measured) continue
    const now = solidNow(puppet, hold)
    found.push({
      id: `stamp:${id}`,
      kind: 'stamp',
      spaceId: stampRoom.id,
      tierId: stampRoom.tierId,
      at: now.at,
      // On the head of the thing, which is where the stamp goes: just clear of
      // whatever it stands on, and never through the deckhead.
      y: Math.min(measured.floor + now.base + now.height + 0.35, measured.ceiling - 0.2),
      size: 0.34,
      colour: hold.locked ? STAMP_LOCKED : STAMP,
      stage: hold.locked ? 1 : 0,
      hidden: false,
    })
  }

  // The Sun and Moon, one over every marked thing. The mark *is* the bomb, so
  // it has to be legible from across the room — and it rides what it is on,
  // drift and all, because a mark that lags behind the thing it is stuck to
  // would say the two are apart when they are already touching.
  for (const [id, hold] of Object.entries(world.solids)) {
    if (!hold.mark || hold.gone) continue
    const marked = solidById(ship, world, id)
    const markRoom = marked ? spaceOf(marked.spaceId) : null
    const measured = markRoom ? room(ship, markRoom) : null
    if (!marked || !markRoom || !measured) continue
    const now = solidNow(marked, hold)
    const drift = hold.alive ? wanderOffset(id, seconds) : [0, 0]
    const sun = hold.mark === 'sun'
    found.push({
      id: `${hold.mark}:${id}`,
      kind: sun ? 'sun-mark' : 'moon-mark',
      spaceId: markRoom.id,
      tierId: markRoom.tierId,
      at: [now.at[0] + drift[0], now.at[1] + drift[1]],
      y: Math.min(measured.floor + now.base + now.height + 0.45, measured.ceiling - 0.2),
      size: 0.32,
      colour: sun ? SUN : MOON,
      stage: 0,
      hidden: false,
    })
  }

  // Snake Arm, on everything it is holding fast. The technique is the only one
  // in the walk whose whole effect is a refusal — a bound solid turns every
  // other cast away — and until now that refusal was invisible until you tried
  // it. So the arm is drawn where it is: wound round the thing, from the floor
  // it stands on to the top of it, with the head over it.
  //
  // There are at most two, because there are two arms, and `stage` is which
  // one — nought the left, one the right. The scene runs the rest of the limb
  // back to that shoulder, so a snake in the room is a snake you are holding
  // rather than one you left behind.
  boundSolidIds(world).forEach((id, arm) => {
    const hold = world.solids[id]
    const caught = solidById(ship, world, id)
    const boundRoom = caught ? spaceOf(caught.spaceId) : null
    const measured = boundRoom ? room(ship, boundRoom) : null
    if (!caught || !boundRoom || !measured) return
    const now = solidNow(caught, hold)
    // A bound solid Biohazard woke is still bound, and the coil rides it: an
    // arm that stayed where the thing used to be has plainly let go of it.
    const drift = hold.alive ? wanderOffset(id, seconds) : [0, 0]
    found.push({
      id: `snake:${id}`,
      kind: 'snake',
      spaceId: boundRoom.id,
      tierId: boundRoom.tierId,
      at: [now.at[0] + drift[0], now.at[1] + drift[1]],
      // The foot of the thing, because that is where the coil starts; the
      // height it climbs to is `climb`.
      y: measured.floor + now.base,
      // Clear of the widest side of what it is round, and never so thin a coil
      // that a wine glass gets a bracelet: an arm has a thickness of its own.
      size: Math.max(0.34, Math.max(now.size[0], now.size[1]) / 2 + 0.16),
      colour: SNAKE,
      stage: arm,
      hidden: false,
      climb: Math.min(
        Math.max(now.height, 0.5),
        Math.max(measured.ceiling - measured.floor - 0.6, 0.5),
      ),
    })
  })

  const mouths = wormMouths(ship, world)
  for (const mouth of mouths) {
    const other = mouths.find((end) => end.spaceId !== mouth.spaceId)
    const space = spaceOf(mouth.spaceId)
    if (!space) continue
    place(`worm:${mouth.spaceId}`, space, {
      kind: 'portal',
      height: PORTAL_RADIUS + 0.1,
      size: PORTAL_RADIUS,
      colour: PORTAL,
      y: mouth.y,
      pair: other,
    })
  }

  // ── The Guardian Spirit Beasts ───────────────────────────────────────────
  //
  // Five animals, and the only apparitions in the walk with a body: everything
  // above this is a mark, a card, a doll or a bird. Each is put where the
  // ability says it stands — under the deckhead, beside what it touched, in the
  // middle of what it is filling, in front of the reader it is levying — and
  // what it is doing to the room is drawn elsewhere, on the solids themselves.

  // Camilla's, hung as high as the room allows with its tentacles down: it has
  // the whole room off the floor, so it has to be over the whole room.
  const hung = spaceOf(world.medusa)
  if (hung)
    place(`medusa:${hung.id}`, hung, {
      kind: 'medusa',
      height: 3.6,
      size: 1.15,
      colour: MEDUSA,
      at: beside(hung),
    })

  // Tserriednich's, stood on the deck beside the last thing it marked. A
  // quadruped's height, because that is what it is.
  const stood = spaceOf(world.chimera)
  if (stood)
    place(`chimera:${stood.id}`, stood, {
      kind: 'chimera',
      height: 1.05,
      size: 0.95,
      colour: CHIMERA,
      at: beside(stood),
    })

  // And what the third contact left: the fitting is `gone` from the deck and
  // this stands where it stood, at its size, so a coffin becomes something the
  // size of a coffin rather than something the size of a beast.
  for (const [id, hold] of Object.entries(world.solids)) {
    if (!hold.monster) continue
    const was = solidById(ship, world, id)
    const where = was ? spaceOf(was.spaceId) : null
    const measured = where ? room(ship, where) : null
    if (!was || !where || !measured) continue
    const now = solidNow(was, hold)
    found.push({
      id: `monster:${id}`,
      kind: 'monster',
      spaceId: where.id,
      tierId: where.tierId,
      at: [now.at[0] + wanderOffset(id, seconds)[0], now.at[1] + wanderOffset(id, seconds)[1]],
      y: measured.floor + now.base,
      // Half the widest side of what it was, floored: whatever it is now, it
      // came out of that, and a thing that grew in the changing would be a
      // claim about the curse the technique does not make.
      size: Math.max(0.45, Math.max(now.size[0], now.size[1]) / 2),
      colour: MONSTER,
      stage: 0,
      hidden: false,
      spread: 1.2,
      climb: Math.max(now.height, 0.6),
    })
  }

  // Tubeppa's, squatting where the aura came down, and the room full of what it
  // is making: the puffs are spread over the whole footprint the way the shoal
  // and the flowers are, because a cloud gathered at the middle of a promenade
  // is not a room full of gas.
  const squatting = spaceOf(world.toad)
  if (squatting) {
    place(`toad:${squatting.id}`, squatting, {
      kind: 'toad',
      height: 0.85,
      size: 1.35,
      colour: TOAD,
    })
    const measured = room(ship, squatting)
    if (measured) {
      for (const station of stationsIn(squatting, PUFFS, landing(squatting))) {
        found.push({
          id: `gas:${squatting.id}:${station.index}`,
          kind: 'gas',
          spaceId: squatting.id,
          tierId: squatting.tierId,
          at: station.at,
          y: Math.min(measured.floor + 0.8 + (station.index % 3) * 0.55, measured.ceiling - 0.4),
          size: 0.7 + (station.index % 3) * 0.25,
          colour: GAS,
          stage: station.index,
          hidden: false,
          spread: Math.min(station.water, 1.4),
        })
      }
    }
  }

  // Zhang Lei's, turning over the room, with the coin under its mouth at the
  // height a hand reaches for one. Both are at the landing point, because the
  // coin is what the visitor has to be able to walk into and `coinAt` reads the
  // same spot: put the wheel at the middle of the room instead and the coin you
  // can see and the coin you can take are two different coins.
  const minted = coinSpot(ship, world)
  if (minted && world.wheel) {
    const space = spaceOf(world.wheel.spaceId)
    const measured = space ? room(ship, space) : null
    if (space && measured) {
      place(`wheel:${space.id}`, space, {
        kind: 'wheel',
        height: 2.7,
        size: 1.25,
        colour: WHEEL,
        at: minted.at,
      })
      found.push({
        id: `coin:${space.id}`,
        kind: 'coin',
        spaceId: space.id,
        tierId: space.tierId,
        at: minted.at,
        y: minted.y,
        size: 0.19,
        colour: COIN,
        // What it is worth, which is what the scene draws it thicker for: the
        // tenth coin is the same disc and unmistakably more of one.
        stage: world.wheel.coin,
        hidden: false,
      })
    }
  }

  // Tyson's, which is not in a room at all: it comes up in front of the reader
  // and stays in front of them, at eye height, for as long as the aura is up.
  if (world.holding === 'aura-levy' && visitor) {
    found.push({
      id: 'tyson-guardian',
      kind: 'tyson-guardian',
      spaceId: world.cameFrom ?? '',
      tierId: visitor.tierId,
      at: [visitor.at[0], visitor.at[1]],
      y: 0,
      size: 0.58,
      colour: WOG,
      stage: world.body.halo,
      hidden: false,
    })
    found.push({
      id: 'wog',
      kind: 'wog',
      spaceId: world.cameFrom ?? '',
      tierId: visitor.tierId,
      at: [visitor.at[0], visitor.at[1]],
      // Carried, so the height is the visitor's and the scene sets it.
      y: 0,
      size: 0.16,
      colour: WOG,
      stage: world.body.halo,
      hidden: false,
    })
  }

  // Luzurus's, coiled where the bait was laid. Its `stage` is how many things
  // the secretion still has hold of, so the scene can show it closing on the
  // last of them rather than sitting over an empty room.
  const coiled = spaceOf(world.centipede)
  if (coiled) {
    const caught = standingIn(coiled.id).filter(
      (solid) => world.solids[solid.id]?.glued !== undefined,
    ).length
    place(`centipede:${coiled.id}`, coiled, {
      kind: 'centipede',
      height: 1.1,
      size: 1.05,
      colour: CENTIPEDE,
      stage: caught,
      at: beside(coiled),
    })
  }

  // Salé-salé's, and what its mouths have put into the room so far. One part of
  // the room per step taken, each in its own mouth's colour, spread over the
  // whole footprint — a room fills from everywhere at once, and a cloud at the
  // middle of a promenade is not a room filling.
  const breathing = world.smoke ? spaceOf(world.smoke.spaceId) : null
  if (breathing && world.smoke) {
    const measured = room(ship, breathing)
    const filled = world.smoke.filled
    // `stage` is whether the mouths are still open: the closing is the one
    // thing the technique does that the room itself does not show.
    place(`mouths:${breathing.id}`, breathing, {
      kind: 'mouths',
      height: 2.2,
      size: 1.1,
      colour: MOUTHS,
      stage: filled >= FUME_COLOURS.length ? 1 : 0,
      at: beside(breathing),
    })
    if (measured) {
      // Every part laid down so far, and each part gets its own handful of
      // stations: the room does not go from empty to full, it goes from a sixth
      // of the way there to the whole of it, and that has to be visible.
      const stations = stationsIn(breathing, FUME_COLOURS.length * 4, landing(breathing))
      for (const station of stations) {
        const part = station.index % FUME_COLOURS.length
        if (part >= filled) continue
        found.push({
          id: `fume:${breathing.id}:${station.index}`,
          kind: 'fume',
          spaceId: breathing.id,
          tierId: breathing.tierId,
          at: station.at,
          y: Math.min(measured.floor + 0.9 + (station.index % 4) * 0.6, measured.ceiling - 0.4),
          size: 0.75 + (station.index % 3) * 0.2,
          colour: FUME_COLOURS[part],
          stage: station.index,
          hidden: false,
          spread: Math.min(station.water, 1.3),
        })
      }
    }
  }

  // Momoze's flock, four to a room across the ten rooms it was loosed over.
  //
  // Two things here are deliberate and both are the ability. The `spread` is
  // larger than the water the room gave the station, so these are the only
  // apparitions in the walk that leave the room they belong to — they go
  // through the bulkhead and come back, which is what the drawing shows and
  // what nothing else aboard is allowed to do. And the size varies with the
  // beast rather than with the room: they are of every size and shape, so no
  // two neighbours are the same one drawn twice.
  for (const spaceId of world.menagerie) {
    const space = spaceOf(spaceId)
    const measured = space ? room(ship, space) : null
    if (!space || !measured) continue
    for (const station of stationsIn(space, FLOCK_PER_ROOM, landing(space))) {
      // A hash off the room and the place in it, so the same room gives the
      // same four creatures every time it is asked and the deck is not
      // reshuffled on every frame.
      let seed = station.index * 7 + 3
      for (let i = 0; i < spaceId.length; i++) seed = (seed * 31 + spaceId.charCodeAt(i)) % 997
      found.push({
        id: `sprite:${spaceId}:${station.index}`,
        kind: 'sprite',
        spaceId: space.id,
        tierId: space.tierId,
        at: station.at,
        y: Math.min(measured.floor + 0.6 + (seed % 5) * 0.45, measured.ceiling - 0.5),
        // From a hand's width to something the size of a person: everything
        // about this flock is that no two of them are alike.
        size: 0.22 + (seed % 7) * 0.16,
        colour: SPRITES[seed % SPRITES.length],
        // Which shape it is, and its own phase: both come off the same number,
        // because a beast that flew like its neighbour and looked like its
        // neighbour is its neighbour.
        stage: seed,
        hidden: false,
        // Wider than the water on purpose: through the wall and back.
        spread: 2.6 + (seed % 4),
      })
    }
  }

  // Cluck's flock, called in and circling the person who called it.
  //
  // The one crowd in the walk that keeps no place of its own. Momoze's beasts
  // are put in rooms and wander from where they were put; these converge on
  // whoever whistled — ch. 320 is a nuée closing on Cheadle, and a flock that
  // sat in a corner of the room would be birds, not a flock being *manipulated*.
  // So the point below is only where they belong for the purpose of deciding
  // which deck to draw them on: the scene puts each one on its own orbit round
  // the visitor, every frame, and the thread back to the wrist with it.
  //
  // `stage` is the bird's place in the ring, and it is the whole of what makes
  // twelve orbits a flock rather than twelve birds flying the same circle.
  if (world.flock) {
    const space = spaceOf(world.flock.spaceId)
    const measured = space ? room(ship, space) : null
    if (space && measured) {
      for (let index = 0; index < world.flock.birds; index++) {
        found.push({
          id: `bird:${world.flock.spaceId}:${index}`,
          kind: 'bird',
          spaceId: space.id,
          tierId: space.tierId,
          at: visitor?.at ?? landing(space),
          y: Math.min(measured.floor + 1.8, measured.ceiling - 0.4),
          size: 0.26,
          colour: BIRDS,
          stage: index,
          hidden: false,
          // How wide the ring is. One number for all of them: a flock keeping
          // formation is what being controlled looks like.
          spread: 1.9,
        })
      }
    }
  }

  // Marayam's, which does not stand where the aura came down: it stands in the
  // way. The door of the room is what it is between you and, so it is put at
  // the doorway nearest the middle of the room and faced into it — a beast in
  // the corner would be a beast you could walk round, and the whole of the
  // technique is that you cannot.
  const barring = spaceOf(world.dragon)
  if (barring) {
    const measured = room(ship, barring)
    if (measured) {
      // The nearest point of the room's own boundary to its middle, which is
      // where a door has to be: the walk does not model the leaf of a door, and
      // this is the closest honest answer to "the way out".
      const way = doorwayOf(barring)
      found.push({
        id: `dragon:${barring.id}`,
        kind: 'dragon',
        spaceId: barring.id,
        tierId: barring.tierId,
        at: way,
        y: measured.floor,
        size: 1.15,
        colour: DRAGON,
        // Which way it is facing, as a bearing into the room, so the scene does
        // not have to work the geometry out again every frame.
        stage: Math.round(
          ((Math.atan2(measured.at[0] - way[0], measured.at[1] - way[1]) + Math.PI * 2) * 180) /
            Math.PI,
        ),
        hidden: false,
      })
    }
  }

  // Camilla's cat, in the room that wears her name. It is put over whatever it
  // is about to break — `catStep` takes them in the order the ship lists them,
  // so the next one is the first still standing — and over the middle of the
  // room once there is nothing left, which is a cat sitting in a bare room.
  const prowling = spaceOf(world.cat)
  if (prowling) {
    const left = standingIn(prowling.id)
    const over = left.length ? solidNow(left[0], world.solids[left[0].id]).at : beside(prowling)
    const measured = room(ship, prowling)
    if (measured) {
      found.push({
        id: `cat:${prowling.id}`,
        kind: 'cat',
        spaceId: prowling.id,
        tierId: prowling.tierId,
        at: over,
        y: measured.floor,
        size: 1.3,
        colour: CAT,
        // How much of the room is left, so the scene can have it working rather
        // than sitting: a cat over nothing has finished.
        stage: left.length,
        hidden: false,
      })
    }
  }

  // Black Voice's antenna, stuck into a solid.
  if (world.puppet) {
    const puppetSolid = solidById(ship, world, world.puppet)
    const space = puppetSolid ? spaceOf(puppetSolid.spaceId) : null
    if (puppetSolid && space) {
      found.push({
        id: `antenna:${world.puppet}`,
        kind: 'antenna',
        spaceId: space.id,
        tierId: space.tierId,
        at: solidNow(puppetSolid, world.solids[puppetSolid.id]).at,
        y: 0,
        size: 0.15,
        colour: PUPPET,
        stage: 0,
        hidden: false,
      })
    }
  }

  return found
}

/**
 * A spot the caster can actually see, a couple of paces off.
 *
 * Everything called up beside the visitor used to be stepped off along the
 * ship's own axes — two metres east, or north if east was in a bulkhead — which
 * has nothing to do with where the visitor is looking: half the time the beast
 * came up behind them, and a beast behind you is one you never saw arrive.
 *
 * So it is stepped off along the heading the cast was made on, which is the
 * camera's own axis: it looks along (-sin yaw, -cos yaw), the same reading the
 * reticle uses. Straight ahead first, then wider and wider off the shoulder,
 * then shorter — a visitor casting with their nose against a bulkhead still
 * gets a body in the room rather than one in the steel — and only if the room
 * refuses every one of those does it land on the visitor's own spot.
 */
function inFrontOf(
  summoned: { at: Vec2; heading: number },
  footprint: Vec2[],
  metres: number,
): Vec2 {
  const quarter = Math.PI / 2
  for (const reach of [metres, metres * 0.6]) {
    for (const turn of [0, quarter / 2, -quarter / 2, quarter, -quarter, Math.PI]) {
      const angle = summoned.heading + turn
      const spot: Vec2 = [
        summoned.at[0] - Math.sin(angle) * reach,
        summoned.at[1] - Math.cos(angle) * reach,
      ]
      if (pointInPolygon(spot, footprint)) return spot
    }
  }
  return summoned.at
}

/**
 * Where the coin off Zhang Lei's wheel is hanging, or nothing.
 *
 * The same shape and the same reasoning as `wormMouths`: a thing the visitor
 * has to be able to *walk into* cannot be drawn in one place and tested for in
 * another, so there is one function that says where it is and both the picture
 * and the pickup read it.
 */
export function coinSpot(
  ship: Ship,
  world: TourWorld,
): { spaceId: string; tierId: string; at: Vec2; y: number } | null {
  const wheel = world.wheel
  const space = wheel ? (ship.spaces.get(wheel.spaceId) ?? null) : null
  const measured = space ? room(ship, space) : null
  if (!space || !measured) return null
  // Where the wheel was called up, which is where the visitor was standing: the
  // coin is put out where they can reach it rather than wherever they happened
  // to be pointing. Two metres along their own line of sight, so it is in front
  // of them rather than through them or at their back, and kept inside the room.
  const summoned = world.summoned?.spaceId === space.id ? world.summoned : null
  const reach: Vec2 = summoned
    ? inFrontOf(summoned, space.footprint, 2)
    : (world.landed[space.id] ?? measured.at)
  return {
    spaceId: space.id,
    tierId: space.tierId,
    at: reach,
    // Chest height: it came out of the wheel's mouth and it is hanging where a
    // hand would close on it.
    y: Math.min(measured.floor + 1.35, measured.ceiling - 0.3),
  }
}

/** How close the visitor has to get to have taken it, in metres. */
export const COIN_REACH = 1.1

/** Whether the visitor is standing near enough the coin to have taken it. */
export function coinAt(ship: Ship, world: TourWorld, standing: Footing): string | null {
  const { at, tierId } = standing
  const spot = coinSpot(ship, world)
  if (!spot || spot.tierId !== tierId) return null
  return Math.hypot(spot.at[0] - at[0], spot.at[1] - at[1]) <= COIN_REACH ? spot.spaceId : null
}

/**
 * Where the two ends of Fugetsu's tunnel stand.
 *
 * The middle of the room, at head height: a door has to be somewhere a visitor
 * can walk into, and the centre is the one point of a room the walk can always
 * name without a second value in the world. A half-placed tunnel has one end
 * and cannot be crossed, so it is listed but never paired.
 */
export function wormMouths(
  ship: Ship,
  world: TourWorld,
): { spaceId: string; tierId: string; at: Vec2; y: number }[] {
  const worm = world.worm
  if (!worm) return []
  const mouths: { spaceId: string; tierId: string; at: Vec2; y: number }[] = []
  for (const id of [worm.a, worm.b]) {
    const space = id ? ship.spaces.get(id) : null
    const measured = space ? room(ship, space) : null
    if (!space || !measured) continue
    mouths.push({
      spaceId: space.id,
      tierId: space.tierId,
      // Where the door was put, which is where the aura came down — the same
      // point the ring is drawn at. Read off the middle of the room instead and
      // the doorway you can see and the doorway you can walk into are two
      // different places, which is a tunnel that cannot be entered.
      at: world.landed[space.id] ?? measured.at,
      y: Math.min(measured.floor + PORTAL_RADIUS + 0.1, measured.ceiling - 0.3),
    })
  }
  return mouths
}

/**
 * Which mouth of the tunnel the visitor has walked into, if either.
 *
 * The walk used to teleport anyone who set foot in the room, which meant a
 * tunnel you could not stand beside and could not choose to take. Now it is the
 * doorway itself that has to be crossed: the visitor's own position against the
 * mouth on the deck they are on.
 */
export function wormMouthAt(ship: Ship, world: TourWorld, standing: Footing): string | null {
  const { at, tierId } = standing
  for (const mouth of wormMouths(ship, world)) {
    if (mouth.tierId !== tierId) continue
    if (Math.hypot(mouth.at[0] - at[0], mouth.at[1] - at[1]) <= PORTAL_REACH) return mouth.spaceId
  }
  return null
}

/**
 * The two techniques that are an event rather than a thing.
 *
 * A blast and a punch leave nothing standing: they happen, they are seen, and
 * they are over. So they are not in the world at all — the page reads what the
 * cast reported and hands the scene one of these, which it plays out and
 * forgets. `from` is where the aura came out of the visitor, so the gust has a
 * direction to travel in.
 */
export interface TourFlash {
  kind: 'gust' | 'punch' | 'sun' | 'arrow' | 'rewind' | 'lash' | 'blast' | 'swing' | 'volley'
  tierId: string
  at: Vec2
  /** The floor it comes out of, or the height it lands at, in metres. */
  y: number
  from?: Vec2
  colour: number
  /** How far it reaches: the sun's radius, in metres. */
  metres?: number
  /**
   * The line the aura took through the matter, for Remote Punch.
   *
   * Handed over rather than re-derived because the rules already walked it and
   * refused the cast if it was broken: what Gyo draws is exactly the run the
   * blow was allowed on, and a second answer worked out in the renderer could
   * disagree with the first.
   */
  through?: Vec2[]
}

/**
 * A thing broken by the arm rather than by the barrels or by the paper.
 *
 * Three techniques report the same word and the scene owes each of them a
 * different picture, which is what `by` is on the report for: this is the only
 * one of the three that is a fist.
 */
const windupShatter = (report: TourReport): report is Extract<TourReport, { kind: 'shattered' }> =>
  report.kind === 'shattered' && report.by === 'windup'

/** And the one of the three that is ten barrels. See `windupShatter`. */
const barrageShatter = (report: TourReport): report is Extract<TourReport, { kind: 'shattered' }> =>
  report.kind === 'shattered' && report.by === 'barrage'

/**
 * What the walk should show for what just happened, or nothing.
 *
 * Only the techniques whose whole substance is the moment of the cast: Air
 * Blow, which strips a room from across the ship and moves nothing, Remote
 * Punch, whose aura runs along the floor and comes up under something else, and
 * Ripper Cyclotron, which is one blow and then an empty arm.
 */
export function flashFor(cast: Cast, ship: Ship, world: TourWorld): TourFlash | null {
  const { report, from } = cast
  if (!report) return null

  // Air Blow. The gust leaves the left palm and not the middle of the visitor,
  // because the emission coming out of the left palm is the whole of what the
  // catalogue concedes about this ability — everything else about it, the
  // entry says outright, remains unknown. So the walk draws the one fact it
  // has and asserts nothing over it: no reach, no rate, no measure.
  if (report.kind === 'stripped') {
    const space = ship.spaces.get(report.spaceId)
    const measured = space ? room(ship, space) : null
    if (!space || !measured) return null
    return {
      kind: 'gust',
      tierId: space.tierId,
      at: world.landed[space.id] ?? measured.at,
      y: Math.min(measured.floor + 1.4, measured.ceiling - 0.3),
      from: cast.heading === undefined ? from : leftPalmOf(from, cast.heading),
      colour: GUST,
    }
  }

  // The Sun and Moon going off, where the two of them met. The pair is already
  // gone by the time this is read — that is what the report says — but what is
  // wanted is the place they were standing when they touched, and a hold keeps
  // where it was moved to after the thing itself has stopped being there.
  if (report.kind === 'detonated') {
    const met = solidById(ship, world, report.solidId)
    const space = met ? (ship.spaces.get(met.spaceId) ?? null) : null
    const measured = space ? room(ship, space) : null
    if (!met || !space || !measured) return null
    const now = solidNow(met, world.solids[report.solidId])
    return {
      kind: 'blast',
      tierId: space.tierId,
      at: now.at,
      y: Math.min(measured.floor + now.height / 2 + 0.4, measured.ceiling - 0.3),
      colour: SUN,
      metres: 4,
    }
  }

  // Ten seconds, taken back. Nothing is drawn for it and nothing is placed:
  // what the walk does with this is rewind its own clock, which is the scene's
  // business and nobody else's — see `TourScene`. It is here because it is an
  // event rather than a thing, like the blast and the punch.
  if (report.kind === 'vision-ended') {
    return { kind: 'rewind', tierId: '', at: from, y: 0, colour: SUN }
  }

  // Halkenburg's arrow, drawn from where it was loosed to where it fell. The
  // exchange has already happened by the time this is read — the walk is
  // standing in the far room — so the streak is the archive showing what just
  // went past, which is the only way anyone ever sees an arrow.
  if (report.kind === 'souls-swapped') {
    const space = ship.spaces.get(report.b)
    const measured = space ? room(ship, space) : null
    if (!space || !measured) return null
    return {
      kind: 'arrow',
      tierId: space.tierId,
      at: world.landed[space.id] ?? measured.at,
      y: Math.min(measured.floor + 1.5, measured.ceiling - 0.3),
      from,
      colour: ARROW,
    }
  }

  // The sun rises on the visitor rather than on a room: Feitan does not throw
  // it, he becomes it, so it is centred where they are standing and its radius
  // is whatever the wrapping had taken.
  if (report.kind === 'sun-risen') {
    return {
      kind: 'sun',
      tierId: '',
      at: from,
      y: 0,
      colour: SUN,
      metres: report.metres,
    }
  }

  // The same fist, out of bare deck: nothing was struck, so where it comes up
  // is the middle of the room it was sent to.
  if (report.kind === 'came-up-empty') {
    const space = ship.spaces.get(report.spaceId)
    const measured = space ? room(ship, space) : null
    if (!space || !measured) return null
    return {
      kind: 'punch',
      tierId: space.tierId,
      at: world.landed[space.id] ?? measured.at,
      y: measured.floor,
      colour: PUNCH,
      through: report.through,
    }
  }

  // The lash is an event in the same way the punch is: the chain itself is
  // standing in the room — it is on the visitor's hand — and what this hands
  // over is where the ball has to reach and back. Read after the blow, so the
  // point is where the thing was knocked to, which is where the ball ended up.
  if (report.kind === 'lashed') {
    const struck = solidById(ship, world, report.solidId)
    const space = struck ? ship.spaces.get(struck.spaceId) : null
    const measured = space ? room(ship, space) : null
    if (!struck || !space || !measured) return null
    const now = solidNow(struck, world.solids[struck.id])
    return {
      kind: 'lash',
      tierId: space.tierId,
      at: now.at,
      // Halfway up whatever was hit: a whip lands on the body of a thing.
      y: Math.min(measured.floor + now.base + now.height * 0.6, measured.ceiling - 0.2),
      from,
      colour: CHAIN,
    }
  }

  // Ripper Cyclotron, arriving. The blow, the blow that broke what it hit, and
  // the swing that had nothing in it are one gesture drawn three ways — the arm
  // goes round either way, and the refusal is about what was *in* it — so all
  // three are the same fist, thrown from where the visitor is standing at the
  // thing they aimed at. Read after the cast, so a thing that was launched is
  // already where it was launched to, which is where the fist met it.
  if (report.kind === 'launched' || report.kind === 'not-wound' || windupShatter(report)) {
    const struck = solidById(ship, world, report.solidId)
    const space = struck ? ship.spaces.get(struck.spaceId) : null
    const measured = space ? room(ship, space) : null
    if (!struck || !space || !measured) return null
    const now = solidNow(struck, world.solids[struck.id])
    return {
      kind: 'swing',
      tierId: space.tierId,
      // Halfway up whatever was hit: a fist lands on the body of a thing.
      at: now.at,
      y: Math.min(measured.floor + now.base + now.height * 0.5, measured.ceiling - 0.3),
      from,
      colour: CYCLOTRON,
    }
  }

  // Double Machine Gun, on one thing. The rounds went out and nothing was ever
  // seen to go out: the struck thing was shoved back on its own, and on the
  // third burst it simply stopped being there. Ten tracers from the hip to what
  // was aimed at — see `HatsuVolleyEffect` for why ten — and nothing drawn where
  // they land, because the technique's own claim is that constructs do not stop
  // them: there is no impact to draw, only a thing that was hit.
  if (report.kind === 'volley' || barrageShatter(report)) {
    const struck = solidById(ship, world, report.solidId)
    const space = struck ? ship.spaces.get(struck.spaceId) : null
    const measured = space ? room(ship, space) : null
    if (!struck || !space || !measured) return null
    const now = solidNow(struck, world.solids[struck.id])
    return {
      kind: 'volley',
      tierId: space.tierId,
      at: now.at,
      // Halfway up the body of the thing: rounds go into it, not under it.
      y: Math.min(measured.floor + now.base + now.height * 0.5, measured.ceiling - 0.3),
      from,
      colour: VOLLEY,
    }
  }

  // And across a sector, which is the same burst aimed at a room: it goes where
  // the aura came down rather than at any one thing, because what the sweep is
  // aimed at is the compartment. The empty sweep is drawn too — the barrels
  // fired, and a reader who watches the tracers cross an empty room has been
  // told something the panel then names.
  if (report.kind === 'swept' || report.kind === 'nothing-there') {
    const space = ship.spaces.get(report.spaceId)
    const measured = space ? room(ship, space) : null
    if (!space || !measured) return null
    return {
      kind: 'volley',
      tierId: space.tierId,
      at: world.landed[space.id] ?? measured.at,
      y: Math.min(measured.floor + 1.2, measured.ceiling - 0.3),
      from,
      colour: VOLLEY,
    }
  }

  if (report.kind === 'came-up-under') {
    const struck = solidById(ship, world, report.otherId)
    const space = struck ? ship.spaces.get(struck.spaceId) : null
    const measured = space ? room(ship, space) : null
    if (!struck || !space || !measured) return null
    return {
      kind: 'punch',
      tierId: space.tierId,
      at: solidNow(struck, world.solids[struck.id]).at,
      y: measured.floor,
      colour: PUNCH,
      through: report.through,
    }
  }

  return null
}
