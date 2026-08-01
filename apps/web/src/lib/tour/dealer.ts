/**
 * The woman on the far side of the table, drawn.
 *
 * She used to be built inline with the ninety-odd apparitions of the walk, and
 * her face was left blank on the argument that the archive draws no character.
 * That argument holds for a technique standing in a corridor; it does not hold
 * here. The Morena room is the one room the walk sits you *down* in, at a metre
 * and a half, for the length of a negotiation, with nothing else in frame — and
 * across a table that close, a head with no face on it is not restraint, it is
 * an absence the reader has to keep explaining to themselves.
 *
 * So this draws the published face rather than an invented one: the long
 * straight hair parted over the brow, the narrow eyes under heavy lids, the
 * closed mouth — and the sutures, which are the whole of what makes it hers. A
 * band of stitches at the hairline like a crown, a dotted seam running down one
 * side of the face from that band to the jaw, and more stitching round the ear
 * on the same side. Nothing here is shaded: it is drawn the way the ship is
 * drawn, in flat colour and hard edges, so that the one face aboard is not also
 * the one surface aboard that is lit differently from everything around it.
 *
 * It lives in its own file because `TourScene` is already the longest file in
 * the app, and a face is a subject: it is easier to find here than under a
 * heading three thousand lines down.
 */

import type { Group, Mesh, MeshBasicMaterial, Object3D } from 'three'

type Three = typeof import('three')

/** Bare skin, and the pale of the hands the deal is watched through. */
const SKIN = 0xf0dfe2
/**
 * The hair, which is the silhouette across a dark room.
 *
 * She is blonde, and in a room lit the way this one is that is a problem worth
 * naming: pale hair against pale skin is one shape rather than two. So it is
 * taken warm and a good deal deeper than the skin — light enough to read as
 * blonde under the lamp, dark enough that the face is still cut out of it.
 */
const HAIR = 0xd9b978
/** The mass behind and beneath, a shade down, so the fall has a near side. */
const HAIR_SHADE = 0xb3924f
/** Every drawn line on the face: the pen the whole portrait is inked with. */
const INK = 0x1a1016
/** The one thing lighter than skin, so the eyes read as open at a distance. */
const SCLERA = 0xfbf4f2

/** What the game tells the scene about her. See `dealerStage`. */
export interface DealerLook {
  /** Her scale in metres — every dimension below is a fraction of it. */
  size: number
  /** What she is dressed in. */
  colour: number
  /** How far the hand has got, and what that has done to her. */
  stage: number
}

export interface DealerBuild {
  THREE: Three
  /** The scene's own material cache: materials are shared by colour there. */
  glow: (colour: number, opacity: number) => MeshBasicMaterial
  seen: DealerLook
}

/**
 * Everything the face is drawn with, gathered once.
 *
 * `radius` is the skull's, because every feature is placed on that sphere
 * rather than on a flat plane: a mark at the corner of the mouth and a stitch
 * beside the ear are the same call, and the one beside the ear has to lie along
 * the side of the head or it reads as a mark floating in front of it.
 */
interface Pen {
  THREE: Three
  glow: (colour: number, opacity: number) => MeshBasicMaterial
  radius: number
}

/** Where a mark goes on the skull, in fractions of its radius. */
interface Mark {
  x: number
  y: number
  /** Roll about the surface normal, in radians: which way the stroke leans. */
  tilt?: number
  /** How far off the skin it floats, as a fraction of the radius. */
  lift?: number
}

/**
 * Lays a flat mark on the skull, facing out along the surface normal.
 *
 * The lift is not decoration: a plane placed exactly on a sphere it touches
 * z-fights with it from the one distance the visitor spends the whole game at.
 */
function place(pen: Pen, mesh: Object3D, at: Mark): void {
  const { radius } = pen
  const x = at.x * radius
  const y = at.y * radius
  const z = Math.sqrt(Math.max(0, radius * radius - x * x - y * y))
  const normal = new pen.THREE.Vector3(x, y, z).normalize()
  const lift = radius * (at.lift ?? 0.02)
  mesh.position.set(x + normal.x * lift, y + normal.y * lift, z + normal.z * lift)
  // Set from the normal rather than `lookAt`: the head is not in the scene yet
  // when this runs, so there is no world matrix for `lookAt` to be right about.
  mesh.quaternion.setFromUnitVectors(new pen.THREE.Vector3(0, 0, 1), normal)
  if (at.tilt) mesh.rotateZ(at.tilt)
}

/** One stroke of the pen: a rectangle, in radius fractions. */
function stroke(pen: Pen, span: { w: number; h: number }, colour = INK): Mesh {
  const { radius } = pen
  return new pen.THREE.Mesh(
    new pen.THREE.PlaneGeometry(span.w * radius, span.h * radius),
    pen.glow(colour, 1),
  )
}

/** A filled oval, which is every rounded thing on a face. */
function oval(pen: Pen, span: { w: number; h: number }, colour: number): Mesh {
  const mesh = new pen.THREE.Mesh(new pen.THREE.CircleGeometry(0.5, 16), pen.glow(colour, 1))
  mesh.scale.set(span.w * pen.radius, span.h * pen.radius, 1)
  return mesh
}

/**
 * The eyes: narrow, level, and heavier on the lid than on the lash.
 *
 * Drawn in four pieces per eye because that is the fewest that still reads as
 * an eye from across a table — the white, the iris, the lid line that gives it
 * its shape, and the flick at the outer corner that gives it its angle.
 *
 * At `stage` 4 the irises are left off. Three Monkeys took her sight, and the
 * scene's rule for that stage is that a removal says more than a gesture: the
 * eyes are open, and there is nothing behind them.
 */
function drawEyes(pen: Pen, head: Object3D, stage: number): void {
  for (const side of [-1, 1]) {
    const x = side * 0.42

    // The white is kept narrow: a tall oval of it is the difference between a
    // heavy-lidded look and a startled one, and she is never startled.
    const white = oval(pen, { w: 0.36, h: 0.15 }, SCLERA)
    place(pen, white, { x, y: 0.02, tilt: -side * 0.05 })
    head.add(white)

    if (stage !== 4) {
      // The iris fills the opening top to bottom with white either side of it,
      // which is how the panel draws an eye that is looking straight at you.
      const iris = oval(pen, { w: 0.17, h: 0.15 }, INK)
      place(pen, iris, { x, y: 0.02, lift: 0.03 })
      head.add(iris)
    }

    // The lid, which is the line the eye is actually recognised by, and the
    // heaviest stroke on the face.
    const lid = stroke(pen, { w: 0.44, h: 0.045 })
    place(pen, lid, { x, y: 0.12, tilt: -side * 0.07, lift: 0.035 })
    head.add(lid)

    // Lashes gathered at the outer corner, as the panel draws them.
    const lash = stroke(pen, { w: 0.14, h: 0.035 })
    place(pen, lash, { x: side * 0.58, y: 0.13, tilt: -side * 0.3, lift: 0.035 })
    head.add(lash)

    // A hint of the lower lid, faint: at full strength it closes the eye up.
    const under = new pen.THREE.Mesh(
      new pen.THREE.PlaneGeometry(0.28 * pen.radius, 0.018 * pen.radius),
      pen.glow(INK, 0.5),
    )
    place(pen, under, { x: side * 0.4, y: -0.09, tilt: side * 0.05, lift: 0.03 })
    head.add(under)

    // The brow: long, high, thin and barely arched, which is what keeps the
    // face level rather than surprised.
    const brow = stroke(pen, { w: 0.42, h: 0.032 })
    place(pen, brow, { x: side * 0.43, y: 0.31, tilt: -side * 0.13 })
    head.add(brow)
  }
}

/**
 * The nose and the mouth.
 *
 * Both are drawn as the panel draws them — the nose as two nostril ticks and
 * nothing else, the mouth as one closed line with a short mark running out of
 * each corner. Those corner marks are the reason the mouth is not simply a
 * line: they are what make the expression unreadable, which is the expression.
 */
function drawMouth(pen: Pen, head: Object3D): void {
  for (const side of [-1, 1]) {
    const nostril = stroke(pen, { w: 0.07, h: 0.03 })
    place(pen, nostril, { x: side * 0.09, y: -0.24, tilt: side * 0.4 })
    head.add(nostril)

    const corner = stroke(pen, { w: 0.1, h: 0.026 })
    place(pen, corner, { x: side * 0.2, y: -0.48, tilt: side * 0.22 })
    head.add(corner)
  }

  const lips = stroke(pen, { w: 0.34, h: 0.032 })
  place(pen, lips, { x: 0, y: -0.5 })
  head.add(lips)
}

/** How many stitches the band at the hairline is drawn with. */
const CROWN_STITCHES = 15
/** How many dashes the seam down the face is drawn with. */
const SEAM_DASHES = 11
/** And how many the stitching round the ear takes. */
const EAR_STITCHES = 7

/**
 * The sutures, which are the whole of what makes this face hers.
 *
 * Three runs, all on the same side of the head, because the panel puts them
 * there: the band across the hairline like a crown, the dotted seam falling
 * from it past the eye to the jaw, and the stitching round the ear. The band
 * is drawn as a run of short segments rather than one long strip because it
 * has to follow the curve of the skull, and a strip that wide would stand off
 * the temples.
 */
function drawSutures(pen: Pen, head: Object3D): void {
  for (let i = 0; i < CROWN_STITCHES; i++) {
    const x = -0.7 + (1.4 * i) / (CROWN_STITCHES - 1)
    const link = stroke(pen, { w: 1.4 / (CROWN_STITCHES - 1) + 0.02, h: 0.022 })
    place(pen, link, { x, y: 0.52 })
    head.add(link)
    // The cross-ticks, leaning alternately, which is what says stitched rather
    // than scarred.
    const tick = stroke(pen, { w: 0.028, h: 0.1 })
    place(pen, tick, { x, y: 0.52, tilt: i % 2 === 0 ? 0.5 : -0.5, lift: 0.03 })
    head.add(tick)
  }

  // The seam: it starts under the band, passes inboard of the eye, and drifts
  // outwards as it crosses the cheek to the jaw.
  for (let i = 0; i < SEAM_DASHES; i++) {
    const along = i / (SEAM_DASHES - 1)
    const dash = stroke(pen, { w: 0.024, h: 0.06 })
    place(pen, dash, { x: 0.2 + along * 0.17, y: 0.42 - along * 1.05, tilt: 0.14 })
    head.add(dash)
  }

  // A second, shorter run parallel to it on the forehead, with one tick
  // crossing between the two: the panel has two lines up there, not one.
  for (let i = 0; i < 5; i++) {
    const dash = stroke(pen, { w: 0.024, h: 0.055 })
    place(pen, dash, { x: 0.45, y: 0.44 - i * 0.06, tilt: 0.1 })
    head.add(dash)
  }
  const crossing = stroke(pen, { w: 0.18, h: 0.022 })
  place(pen, crossing, { x: 0.33, y: 0.42, tilt: -0.22 })
  head.add(crossing)

  // And the ear, stitched round its edge on the same side as the seam.
  for (let i = 0; i < EAR_STITCHES; i++) {
    const y = 0.26 - (0.52 * i) / (EAR_STITCHES - 1)
    const tick = stroke(pen, { w: 0.075, h: 0.026 })
    place(pen, tick, { x: 0.9, y, tilt: y * 0.6 })
    head.add(tick)
  }
}

/** A full turn, for the partial spheres the hair is cut from. */
const TURN = Math.PI * 2

/**
 * The hair on the skull: a cap down to the hairline, and a shell behind it.
 *
 * Two partial spheres rather than one, and the reason is the forehead. A single
 * ball of hair large enough to be a head of hair covers the brow, and the brow
 * is where the crown of stitches is — the one mark that has to be visible for
 * the face to be hers. So the cap stops just above the band all the way round,
 * and the shell that takes the hair down past the ears is cut open at the front
 * by a wedge wide enough to leave the whole face clear.
 */
function drawHairline(pen: Pen, head: Object3D): void {
  const dark = pen.glow(HAIR, 1)
  const cap = new pen.THREE.Mesh(
    new pen.THREE.SphereGeometry(pen.radius * 1.06, 20, 10, 0, TURN, 0, 0.68),
    dark,
  )
  head.add(cap)

  // The wedge left open at the front is 1,9 radians — a shade over a hundred
  // degrees — measured about +Z, which is the way she is looking.
  const shell = new pen.THREE.Mesh(
    new pen.THREE.SphereGeometry(pen.radius * 1.08, 20, 12, Math.PI / 2 + 0.95, TURN - 1.9, 0, 2.1),
    dark,
  )
  head.add(shell)

  // The cap's edge is a line of latitude, and a line of latitude sitting level
  // across a forehead is a wig. Tipping the cap forward costs nothing and buys
  // the whole difference: the hair comes down over the brow and rides up at the
  // back, which is what a head of hair parted in the middle does. The back is
  // where the shell is, so nothing is uncovered by the tilt.
  cap.rotation.x = 0.16
}

/**
 * The hair that falls: the mass down her back, and a lock either side of the
 * face turning in at the ends, which is how the panel frames it.
 */
function drawFall(build: DealerBuild, root: Group): void {
  const { THREE, glow, seen } = build
  const size = seen.size
  const dark = glow(HAIR, 1)

  const behind = new THREE.Mesh(
    new THREE.CylinderGeometry(size * 0.34, size * 0.44, size * 0.9, 12),
    glow(HAIR_SHADE, 1),
  )
  behind.position.set(0, size * 0.78, -size * 0.2)
  root.add(behind)

  for (const side of [-1, 1]) {
    // Long: it clears the shoulder and keeps going, which is the one thing
    // about her hair a reader would name from memory.
    const lock = new THREE.Mesh(
      new THREE.CylinderGeometry(size * 0.075, size * 0.05, size * 0.95, 8),
      dark,
    )
    lock.position.set(side * size * 0.18, size * 0.72, size * 0.05)
    lock.rotation.z = side * 0.05
    root.add(lock)

    // The tip turns inwards at the end. Without it the locks read as two
    // straight bars, and the whole point of that hair is that it curves.
    const tip = new THREE.Mesh(
      new THREE.CylinderGeometry(size * 0.05, size * 0.018, size * 0.26, 8),
      dark,
    )
    tip.position.set(side * size * 0.16, size * 0.13, size * 0.05)
    tip.rotation.z = -side * 0.4
    root.add(tip)
  }
}

/**
 * Morena, seated, dealing.
 *
 * Built from the same primitives and the same flat colour as everything else in
 * the walk: what is different about her is only how much of it there is, and
 * that is because she is the one thing in the walk you sit down opposite rather
 * than walk past.
 */
export function buildDealer(build: DealerBuild): Group {
  const { THREE, glow, seen } = build
  const size = seen.size
  const root = new THREE.Group()
  const cloth = glow(seen.colour, 0.95)
  const pale = glow(SKIN, 0.95)

  const torso = new THREE.Mesh(
    new THREE.CylinderGeometry(size * 0.62, size * 0.78, size * 1.5, 12),
    cloth,
  )
  root.add(torso)

  // Forearms laid along the table top, which is where a dealer's hands are and
  // the first thing you look at across one. The height is not free:
  // `TABLE_HEIGHT` above the deck is where the wood is, and an arm a hand's
  // breadth under it is an arm inside the table.
  for (const side of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(size * 0.15, size * 0.75, 4, 8), cloth)
    arm.rotation.x = Math.PI / 2
    arm.rotation.z = side * 0.3
    arm.position.set(side * size * 0.58, size * 0.18, size * 0.6)
    root.add(arm)
    const hand = new THREE.Mesh(new THREE.SphereGeometry(size * 0.16, 8, 6), pale)
    hand.position.set(side * size * 0.76, size * 0.18, size * 1.05)
    root.add(hand)
  }

  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(size * 0.15, size * 0.19, size * 0.24, 8),
    pale,
  )
  neck.position.y = size * 0.86
  root.add(neck)

  // The head is a group rather than a mesh: the face is drawn on the skull's
  // own sphere, and the long-in-the-jaw proportion the panel has is then a
  // scale on the whole group — features included — instead of a distortion the
  // marks would have to be corrected for one at a time.
  const head = new THREE.Group()
  head.position.y = size * 1.18
  head.scale.set(0.9, 1.22, 0.94)
  root.add(head)

  const radius = size * 0.33
  head.add(new THREE.Mesh(new THREE.SphereGeometry(radius, 20, 16), pale))

  const pen: Pen = { THREE, glow, radius }
  drawHairline(pen, head)
  drawEyes(pen, head, seen.stage)
  drawMouth(pen, head)
  drawSutures(pen, head)
  drawFall(build, root)

  // She leans in when she offers the kiss, and sits back when the hand is
  // played out. `stage` is the only thing the game tells the scene.
  if (seen.stage === 1) root.rotation.x = -0.14
  if (seen.stage === 2) root.rotation.x = 0.1
  // Caught: she straightens off the cards. The rest of that reaction is in the
  // drift, and it is a subtraction — see there.
  if (seen.stage === 3) root.rotation.x = 0.17

  return root
}
