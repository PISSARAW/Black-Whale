/**
 * The shared human figure used by games built on top of the tour.
 *
 * Investigation and Infiltration currently ask for the restrained `avatar`,
 * while Arena and Hunt ask for the articulated `combatant`. They intentionally
 * keep their existing appearances for now; putting both variants behind this
 * builder gives later work one place to define anatomy, clothes, faces and
 * mode-specific poses. Morena is not part of this system: the dealer remains a
 * authored character in `dealer.ts`.
 */

import type { Group, MeshBasicMaterial, Object3D } from 'three'
import type { Apparition } from './apparitions'

type Three = typeof import('three')
type HumanKind = Extract<Apparition['kind'], 'avatar' | 'combatant'>
type HumanLook = Pick<Apparition, 'kind' | 'size' | 'colour' | 'stage' | 'hidden'> & {
  kind: HumanKind
}

export interface HumanFigureBuild {
  THREE: Three
  glow: (colour: number, opacity: number) => MeshBasicMaterial
  seen: HumanLook
}

export interface HumanFigure {
  root: Group
  /** The part that follows the apparition's heading. */
  turns: Object3D
}

function buildAvatar({ THREE, glow, seen }: HumanFigureBuild): HumanFigure {
  const root = new THREE.Group()
  const skin = glow(seen.colour, seen.hidden ? 0.18 : 0.92)
  const bodyHeight = seen.size * 1.6
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(seen.size * 0.35, seen.size * 0.35, bodyHeight, 12),
    skin,
  )
  body.position.y = bodyHeight / 2
  root.add(body)

  const headRadius = seen.size * 0.35
  const head = new THREE.Mesh(new THREE.SphereGeometry(headRadius, 12, 12), skin)
  head.position.y = bodyHeight + headRadius
  root.add(head)

  return { root, turns: root }
}

function buildCombatant({ THREE, glow, seen }: HumanFigureBuild): HumanFigure {
  const root = new THREE.Group()
  const mode = seen.stage % 3
  const pose = Math.floor(seen.stage / 3)
  const figure = new THREE.Group()
  const arms: import('three').Mesh[] = []
  const body = glow(seen.colour, 0.96)
  const shade = glow(0x28191b, 1)

  const torso = new THREE.Mesh(
    new THREE.BoxGeometry(seen.size * 0.52, seen.size * 0.72, seen.size * 0.3),
    body,
  )
  torso.position.y = seen.size * 1.08
  figure.add(torso)

  const head = new THREE.Mesh(new THREE.SphereGeometry(seen.size * 0.2, 14, 10), body)
  head.position.y = seen.size * 1.62
  figure.add(head)

  for (const side of [-1, 1]) {
    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(seen.size * 0.09, seen.size * 0.11, seen.size * 0.72, 7),
      body,
    )
    leg.position.set(side * seen.size * 0.15, seen.size * 0.4, 0)
    figure.add(leg)

    const arm = new THREE.Mesh(
      new THREE.CylinderGeometry(seen.size * 0.075, seen.size * 0.09, seen.size * 0.68, 7),
      body,
    )
    arm.position.set(side * seen.size * 0.36, seen.size * 1.08, 0)
    arm.rotation.z = side * -0.16
    figure.add(arm)
    arms.push(arm)

    const eye = new THREE.Mesh(new THREE.SphereGeometry(seen.size * 0.027, 6, 5), shade)
    eye.position.set(side * seen.size * 0.07, seen.size * 1.65, seen.size * 0.19)
    figure.add(eye)
  }

  if (mode !== 2) {
    const aura = new THREE.Mesh(
      new THREE.SphereGeometry(seen.size * (mode === 1 ? 0.9 : 0.72), 18, 12),
      glow(seen.colour, mode === 1 ? 0.16 : 0.07),
    )
    aura.scale.y = 1.35
    aura.position.y = seen.size * 0.9
    figure.add(aura)
  }

  if (pose === 1) {
    for (const [index, arm] of arms.entries()) {
      const side = index === 0 ? -1 : 1
      arm.position.set(side * seen.size * 0.2, seen.size * 1.2, seen.size * 0.18)
      arm.rotation.set(-0.8, 0, side * -0.7)
    }
  } else if (pose === 2) {
    figure.rotation.z = -0.24
    figure.position.x = seen.size * 0.12
  } else if (pose === 3) {
    figure.rotation.z = 1.3
    figure.position.y = seen.size * 0.25
  } else if (pose === 4 && arms[1]) {
    arms[1].position.set(seen.size * 0.18, seen.size * 1.28, seen.size * 0.4)
    arms[1].rotation.set(-1.35, 0, -0.08)
  }

  root.add(figure)
  return { root, turns: figure }
}

export function buildHumanFigure(build: HumanFigureBuild): HumanFigure {
  return build.seen.kind === 'combatant' ? buildCombatant(build) : buildAvatar(build)
}
