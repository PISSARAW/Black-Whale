import type { Object3D } from 'three'
import { BOOKMARK_RIBBON, type Apparition } from './apparitions'
import type { BasicApparitionContext } from './apparitionBasicView'
import { chainLinkGeometry } from './chainTipKit'
import { buildChainTip } from './chainTips'
import { buildDealer } from './dealer'
import { FORGED_AURA } from './morena'
import { indoorFish, blinky } from './apparitionMangaObjectView'
import { paperDoll } from './apparitionMangaPropView'
import { BONE, INK, modelKit } from './nenModelPrimitives'

type Builder = (seen: Apparition, context: BasicApparitionContext) => Object3D | null

const CHAIN_LINKS = 18

function gum(seen: Apparition, { THREE, root, skin }: BasicApparitionContext) {
  const strand = new THREE.Mesh(
    new THREE.CylinderGeometry(seen.size * 0.035, seen.size * 0.035, seen.size * 2, 6),
    skin,
  )
  strand.rotation.z = Math.PI / 2
  root.add(strand)
  const blob = new THREE.Mesh(new THREE.SphereGeometry(seen.size * 0.16, 8, 6), skin)
  blob.scale.set(1, 0.7, 1)
  root.add(blob)
  return root
}

function puppet(seen: Apparition, { THREE, glow, root }: BasicApparitionContext) {
  const ink = glow(seen.colour, 1)
  const pale = glow(0xefe7dd, 1)
  const kimono = new THREE.Mesh(
    new THREE.CylinderGeometry(seen.size * 0.34, seen.size * 0.62, seen.size * 1.35, 8),
    ink,
  )
  kimono.position.y = seen.size * 0.68
  root.add(kimono)
  const obi = new THREE.Mesh(
    new THREE.CylinderGeometry(seen.size * 0.38, seen.size * 0.41, seen.size * 0.22, 10),
    pale,
  )
  obi.position.y = seen.size * 0.85
  root.add(obi)
  for (const side of [-1, 1]) {
    const lapel = new THREE.Mesh(
      new THREE.BoxGeometry(seen.size * 0.1, seen.size * 0.45, seen.size * 0.05),
      pale,
    )
    lapel.rotation.z = side * 0.5
    lapel.position.set(0, seen.size * 1.15, seen.size * (0.31 + side * 0.01))
    root.add(lapel)
    const sleeve = new THREE.Mesh(
      new THREE.BoxGeometry(seen.size * 0.3, seen.size * 0.62, seen.size * 0.3),
      ink,
    )
    sleeve.position.set(side * seen.size * 0.45, seen.size * 0.95, 0)
    root.add(sleeve)
  }
  const face = new THREE.Mesh(new THREE.SphereGeometry(seen.size * 0.24, 10, 8), pale)
  face.position.y = seen.size * 1.6
  root.add(face)
  const zipper = new THREE.Mesh(
    new THREE.BoxGeometry(seen.size * 0.03, seen.size * 0.28, seen.size * 0.02),
    ink,
  )
  zipper.position.set(0, seen.size * 1.57, seen.size * 0.235)
  root.add(zipper)
  for (const side of [-1, 1]) {
    const crossV = new THREE.Mesh(
      new THREE.BoxGeometry(seen.size * 0.03, seen.size * 0.15, seen.size * 0.02),
      ink,
    )
    crossV.position.set(side * seen.size * 0.12, seen.size * 1.58, seen.size * 0.21)
    root.add(crossV)
    const crossH = new THREE.Mesh(
      new THREE.BoxGeometry(seen.size * 0.1, seen.size * 0.03, seen.size * 0.02),
      ink,
    )
    crossH.position.set(side * seen.size * 0.12, seen.size * 1.6, seen.size * 0.21)
    root.add(crossH)
  }
  const hair = new THREE.Mesh(
    new THREE.CylinderGeometry(seen.size * 0.28, seen.size * 0.3, seen.size * 0.42, 10),
    ink,
  )
  hair.position.y = seen.size * 1.68
  root.add(hair)
  return root
}

function chain(seen: Apparition, { THREE, glow, root }: BasicApparitionContext) {
  const steel = glow(seen.colour, 1)
  root.add(buildChainTip(seen.stage, { THREE, steel, glow, size: seen.size }))
  const link = chainLinkGeometry(THREE, seen.size)
  for (let index = 0; index < CHAIN_LINKS; index++) root.add(new THREE.Mesh(link, steel))
  return null
}

function book(seen: Apparition, { THREE, glow, root }: BasicApparitionContext) {
  const wide = seen.size
  const long = seen.size * 1.35
  const board = glow(seen.colour, 1)
  const paper = glow(0xf4eeff, 0.96)
  const ink = glow(seen.colour, 0.5)
  for (const side of [-1, 1]) {
    const leaf = new THREE.Group()
    leaf.rotation.z = side * 0.2
    const cover = new THREE.Mesh(new THREE.BoxGeometry(wide, 0.006, long), board)
    cover.position.set((side * wide) / 2, -0.004, 0)
    leaf.add(cover)
    // The palm on the binding is visible from the back of the open book too.
    const kit = modelKit({ THREE, glow, root: leaf, skin: board }, wide)
    const palm = new THREE.Group()
    palm.position.set(side * wide * 0.5, -0.009, 0)
    palm.rotation.x = Math.PI / 2
    kit.oval({
      name: 'cover-palm',
      at: [0, 0, 0],
      radii: [0.17, 0.2, 0.008],
      colour: BONE,
      into: palm,
    })
    for (let finger = 0; finger < 5; finger++)
      kit.tube({
        name: `cover-finger-${finger}`,
        points: [
          [(finger - 2) * 0.075, 0.1, 0],
          [(finger - 2) * 0.09, 0.38 - Math.abs(finger - 2) * 0.035, 0],
        ],
        radius: 0.025,
        colour: BONE,
        into: palm,
      })
    if (side > 0) leaf.add(palm)
    const sheet = new THREE.Mesh(new THREE.BoxGeometry(wide * 0.9, 0.002, long * 0.9), paper)
    sheet.position.set((side * wide) / 2, 0.002, 0)
    leaf.add(sheet)
    // A portrait block and separated rule text, as on the ability pages.
    const portrait = new THREE.Group()
    portrait.rotation.x = -Math.PI / 2
    portrait.position.set(side * wide * 0.3, 0.006, -long * 0.25)
    kit.oval({
      name: 'page-portrait-head',
      at: [0, 0.07, 0],
      radii: [0.09, 0.12, 0.005],
      colour: INK,
      into: portrait,
    })
    kit.oval({
      name: 'page-portrait-shoulders',
      at: [0, -0.1, 0],
      radii: [0.16, 0.08, 0.005],
      colour: INK,
      into: portrait,
    })
    leaf.add(portrait)
    for (let index = 0; index < 5; index++) {
      const line = new THREE.Mesh(new THREE.BoxGeometry(wide * 0.6, 0.001, long * 0.035), ink)
      line.position.set((side * wide) / 2, 0.006, index * long * 0.1)
      leaf.add(line)
    }
    root.add(leaf)
    if ((side < 0 ? 0 : 1) === seen.stage) addBookmark(seen, { THREE, glow, leaf, side })
  }
  return null
}

interface BookmarkContext {
  THREE: BasicApparitionContext['THREE']
  glow: BasicApparitionContext['glow']
  leaf: import('three').Group
  side: number
}

function addBookmark(seen: Apparition, { THREE, glow, leaf, side }: BookmarkContext) {
  const wide = seen.size
  const long = seen.size * 1.35
  const silk = glow(BOOKMARK_RIBBON, 1)
  const along = new THREE.Mesh(new THREE.BoxGeometry(wide * 0.16, 0.002, long * 1.05), silk)
  along.position.set(side * wide * 0.58, 0.006, 0)
  leaf.add(along)
  const tail = new THREE.Mesh(new THREE.BoxGeometry(wide * 0.16, long * 0.5, 0.002), silk)
  tail.position.set(side * wide * 0.58, -long * 0.25, -long * 0.52)
  leaf.add(tail)
}

function flute(seen: Apparition, { THREE, glow, root }: BasicApparitionContext) {
  const silver = glow(seen.colour, 1)
  const bore = seen.size * 0.055
  const tube = new THREE.Mesh(
    new THREE.CylinderGeometry(bore, bore * 0.92, seen.size * 2, 10),
    silver,
  )
  tube.rotation.z = Math.PI / 2
  root.add(tube)
  const crown = new THREE.Mesh(
    new THREE.CylinderGeometry(bore * 1.25, bore * 1.25, seen.size * 0.1, 10),
    silver,
  )
  crown.rotation.z = Math.PI / 2
  crown.position.x = -seen.size
  root.add(crown)
  const lip = new THREE.Mesh(
    new THREE.CylinderGeometry(bore * 0.85, bore * 0.85, bore * 1.2, 8),
    silver,
  )
  lip.position.set(-seen.size * 0.78, bore * 0.9, 0)
  root.add(lip)
  const holes = glow(0x2a2a30, 1)
  for (let index = 0; index < 6; index++) {
    const key = new THREE.Mesh(
      new THREE.CylinderGeometry(bore * 0.62, bore * 0.62, bore * 0.9, 8),
      holes,
    )
    key.position.set(-seen.size * 0.34 + index * seen.size * 0.24, bore * 0.85, 0)
    root.add(key)
  }
  return null
}

function dealer(seen: Apparition, { THREE, glow, root }: BasicApparitionContext) {
  root.add(buildDealer({ THREE, glow, seen }))
  return null
}

function gameCard(seen: Apparition, { THREE, glow, root, cardFace }: BasicApparitionContext) {
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(seen.size, seen.size * 1.5),
    glow(seen.colour, seen.stage === 2 ? 0.55 : 0.95),
  )
  face.rotation.x = -Math.PI / 2
  root.add(face)

  const rimColour =
    seen.stage === 0
      ? 0x6b4c58
      : seen.stage === 4
        ? 0x8ecae6
        : seen.stage === 5
          ? FORGED_AURA
          : 0xf5efe6
  const rim = new THREE.Mesh(
    new THREE.PlaneGeometry(seen.size * 1.12, seen.size * 1.62),
    glow(rimColour, 0.7),
  )
  rim.rotation.x = -Math.PI / 2
  rim.position.y = -0.001
  root.add(rim)

  if (seen.face && cardFace) {
    const mark = new THREE.Mesh(
      new THREE.PlaneGeometry(seen.size * 0.82, seen.size * 1.16),
      cardFace(seen.face, seen.stage === 2 ? '#6f6f78' : '#20161c'),
    )
    mark.rotation.x = -Math.PI / 2
    mark.position.y = 0.002
    root.add(mark)
  }
  if (seen.stage === 5) {
    const aura = new THREE.Mesh(
      new THREE.PlaneGeometry(seen.size * 1.9, seen.size * 2.5),
      glow(FORGED_AURA, 0.22),
    )
    aura.rotation.x = -Math.PI / 2
    aura.position.y = -0.002
    root.add(aura)
  }
  if (seen.stage === 3) {
    const nick = new THREE.Mesh(
      new THREE.PlaneGeometry(seen.size * 0.22, seen.size * 0.06),
      glow(0x2b1b22, 1),
    )
    nick.rotation.x = -Math.PI / 2
    nick.rotation.z = Math.PI / 4
    nick.position.set(seen.size * 0.32, 0.001, -seen.size * 0.6)
    root.add(nick)
  }
  return null
}

function ghost(seen: Apparition, { THREE, glow, root, skin }: BasicApparitionContext) {
  const body = new THREE.Mesh(new THREE.SphereGeometry(seen.size, 10, 8), skin)
  body.scale.set(0.9, 1, 1.25)
  root.add(body)

  const head = new THREE.Group()
  head.position.set(0, seen.size * 0.9, -seen.size * 0.35)
  const skull = new THREE.Mesh(new THREE.SphereGeometry(seen.size * 0.66, 10, 8), skin)
  skull.scale.set(1, 0.8, 1.5)
  head.add(skull)
  const mouth = new THREE.Mesh(
    new THREE.ConeGeometry(seen.size * 0.42, seen.size * 0.9, 8, 1, true),
    glow(0x2a1f33, 0.95),
  )
  mouth.rotation.x = -Math.PI / 2.2
  mouth.position.set(0, -seen.size * 0.12, -seen.size * 0.7)
  head.add(mouth)
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(seen.size * 0.12, 8, 6), glow(0xfdfbff, 1))
    eye.position.set(side * seen.size * 0.26, seen.size * 0.3, -seen.size * 0.5)
    head.add(eye)
  }
  root.add(head)

  const arm = new THREE.Mesh(
    new THREE.CylinderGeometry(seen.size * 0.07, seen.size * 0.07, seen.size * 1.1, 6),
    skin,
  )
  arm.position.set(-seen.size * 0.5, -seen.size * 0.3, -seen.size * 0.3)
  arm.rotation.z = 0.6
  root.add(arm)
  const pen = new THREE.Mesh(
    new THREE.CylinderGeometry(seen.size * 0.035, seen.size * 0.01, seen.size * 0.8, 6),
    glow(0xfff4d6, 1),
  )
  pen.position.set(-seen.size * 0.85, seen.size * (seen.stage > 0 ? -1.05 : -0.7), -seen.size * 0.5)
  pen.rotation.z = seen.stage > 0 ? 0.15 : 0.5
  root.add(pen)

  if (seen.stage > 0) {
    const page = new THREE.Mesh(
      new THREE.PlaneGeometry(seen.size * 1.5, seen.size * 2),
      glow(0xf6f3ec, 0.85),
    )
    page.rotation.x = -Math.PI / 2
    page.position.set(-seen.size * 0.9, -seen.size * 1.6, -seen.size * 0.2)
    root.add(page)
  }
  return null
}

function contract(seen: Apparition, { THREE, glow, root }: BasicApparitionContext) {
  const aura = glow(seen.colour, seen.stage === 0 ? 0.55 : 0.8)
  const ink = glow(0x2b3a5c, 0.9)
  const long = seen.size
  const tall = seen.size * 0.72
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(long, tall), aura)
  if (seen.stage > 0) sheet.rotation.x = -Math.PI / 2
  root.add(sheet)

  if (seen.stage > 0) {
    for (let line = 0; line < 5; line++) {
      const signature = line === 4
      const ruled = new THREE.Mesh(
        new THREE.PlaneGeometry(long * (signature ? 0.34 : 0.66), tall * 0.045),
        ink,
      )
      ruled.rotation.x = -Math.PI / 2
      ruled.position.set(
        signature ? long * 0.24 : -long * 0.1,
        0.001,
        tall * (-0.3 + line * 0.13 + (signature ? 0.06 : 0)),
      )
      root.add(ruled)
    }
  }

  const pen = new THREE.Group()
  pen.add(
    new THREE.Mesh(
      new THREE.CylinderGeometry(seen.size * 0.022, seen.size * 0.022, seen.size * 0.5, 6),
      aura,
    ),
  )
  const nib = new THREE.Mesh(new THREE.ConeGeometry(seen.size * 0.024, seen.size * 0.09, 6), ink)
  nib.position.y = -seen.size * 0.29
  nib.rotation.x = Math.PI
  pen.add(nib)
  if (seen.stage > 0) {
    pen.rotation.set(Math.PI / 2, 0, 0)
    pen.rotateY(0.6)
    pen.position.set(long * 0.12, seen.size * 0.03, -tall * 0.1)
  } else {
    pen.rotation.z = -0.35
    pen.position.set(long * 0.62, -tall * 0.1, 0)
  }
  root.add(pen)
  return null
}

const BUILDERS: Partial<Record<Apparition['kind'], Builder>> = {
  gum,
  fish: indoorFish,
  paper: paperDoll,
  puppet,
  hoover: blinky,
  chain,
  book,
  flute,
  dealer,
  'game-card': gameCard,
  ghost,
  contract,
}

export function buildObjectApparition(
  seen: Apparition,
  context: BasicApparitionContext,
): Object3D | null | undefined {
  return BUILDERS[seen.kind]?.(seen, context)
}
