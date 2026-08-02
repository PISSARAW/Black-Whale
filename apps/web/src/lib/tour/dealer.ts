/** Morena, rendered through the shared articulated human system. */
import type { Group, MeshBasicMaterial, Object3D } from 'three'
import type { Apparition } from './apparitions'
import { buildHumanFigure } from './humanFigure'

type Three = typeof import('three')

export interface DealerLook {
  size: number
  colour: number
  stage: number
}

export interface DealerBuild {
  THREE: Three
  glow: (colour: number, opacity: number) => MeshBasicMaterial
  seen: DealerLook
}

function named(root: Object3D, name: string): Object3D | undefined {
  return root.getObjectByName(name)
}

/** Animates Morena's expression without rebuilding her shared human rig. */
export function animateDealerFace(root: Group, stage: number, seconds: number): void {
  const eyes = [named(root, 'face-eye-left'), named(root, 'face-eye-right')]
  const brows = [named(root, 'face-brow-left'), named(root, 'face-brow-right')]
  const mouth = named(root, 'face-mouth')
  const corners = [named(root, 'morena-mouth-left'), named(root, 'morena-mouth-right')]
  const blanks = [named(root, 'morena-blank-left'), named(root, 'morena-blank-right')]
  const blinkWindow = seconds % 4.8
  const blink = blinkWindow > 4.66 ? Math.max(0.12, Math.abs(blinkWindow - 4.73) * 12) : 1
  const eyeHeight = stage === 1 ? 0.72 : stage === 2 ? 0.58 : stage === 3 ? 1.45 : blink

  eyes.forEach((eye) => {
    if (!eye) return
    eye.visible = stage !== 4
    eye.scale.y = stage === 4 ? 0.1 : eyeHeight * blink
  })
  blanks.forEach((blank) => {
    if (blank) blank.visible = stage === 4
  })

  brows.forEach((brow, index) => {
    if (!brow) return
    const side = index === 0 ? -1 : 1
    brow.rotation.z =
      stage === 3 ? side * 0.28 : stage === 1 || stage === 2 ? side * 0.06 : side * -0.12
    brow.position.y = stage === 3 ? 0.075 : 0.06
  })

  const smile = stage === 1 ? 0.28 : stage === 2 ? 0.4 : stage === 3 ? -0.22 : 0.12
  corners.forEach((corner, index) => {
    if (!corner) return
    const side = index === 0 ? -1 : 1
    corner.rotation.z = side * smile
    corner.position.y = -0.09 + Math.sin(seconds * 0.8) * 0.002
  })
  if (mouth) {
    mouth.scale.x = stage === 3 ? 0.72 : stage === 2 ? 1.12 : 1
    mouth.position.y = -0.09 + (stage === 2 ? 0.006 : 0)
  }
}

export function buildDealer({ THREE, glow, seen }: DealerBuild): Group {
  const apparition: Apparition & { kind: 'avatar' } = {
    id: 'morena-dealer-human',
    kind: 'avatar',
    spaceId: 'tier-2-heilly-secret-hideout-office',
    tierId: 'interior-heilly-hideout',
    at: [0, 0],
    y: 0,
    size: seen.size,
    colour: seen.colour,
    stage: seen.stage,
    hidden: false,
    human: {
      role: 'morena',
      identity: 'morena-prudo',
      pose: 'seated',
      aura: 'none',
    },
  }
  const human = buildHumanFigure({ THREE, glow, seen: apparition })
  const root = human.root

  // At the canonical camera distance the shared one-metre figure is too small
  // for the sutures and eyelids to survive rasterisation. Morena fills more of
  // her chair in the panel, so enlarge only the portrait rig and sink it back
  // into the cushion rather than changing the world's human scale.
  human.turns.scale.multiplyScalar(1.12)
  human.turns.position.y -= 0.09

  // The panel frames Morena inside a broad upholstered chair. The room already
  // contains the chair as navigable geometry, but its near-black block is too
  // coarse to read behind a face. This inset belongs to the portrait: a warm
  // rim, a padded back and the separate headrest visible around her hair.
  const chair = new THREE.Group()
  chair.name = 'morena-chair-portrait'
  const chairRim = new THREE.Mesh(new THREE.BoxGeometry(0.72, 1.16, 0.13), glow(0x8a6f61, 0.92))
  chairRim.position.set(0, 0.91, -0.31)
  chair.add(chairRim)
  const chairBack = new THREE.Mesh(new THREE.BoxGeometry(0.64, 1.08, 0.145), glow(0x35282b, 0.98))
  chairBack.position.set(0, 0.91, -0.29)
  chair.add(chairBack)
  const headrestRim = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.46, 0.15), glow(0xb0927f, 0.96))
  headrestRim.position.set(0, 1.48, -0.28)
  chair.add(headrestRim)
  const headrest = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.4, 0.165), glow(0x49373b, 1))
  headrest.position.set(0, 1.48, -0.26)
  chair.add(headrest)
  root.add(chair)

  // Preserve the negotiation's restrained body language while the articulated
  // seated pose keeps her hips, knees and forearms aligned with the chair/table.
  human.turns.rotation.x = -0.04
  if (seen.stage === 1) human.turns.rotation.x = -0.1
  if (seen.stage === 2) human.turns.rotation.x = 0.06
  if (seen.stage === 3) human.turns.rotation.x = 0.1
  return root
}
