import type { Group } from 'three'
import type { HumanLimbsBuild } from './humanLimbs'
import { mergeHumanDetails } from './humanDetailGeometry'

const FINGER_LENGTHS = [0.047, 0.059, 0.055, 0.041] as const
const FINGER_WIDTHS = [0.0085, 0.0095, 0.009, 0.0078] as const

/** A tapered palm and two phalanges per finger share one cached buffer. */
export function humanHandGeometry({ THREE }: HumanLimbsBuild) {
  const palm = new THREE.Shape()
  palm.moveTo(-0.031, -0.032)
  palm.quadraticCurveTo(-0.044, -0.012, -0.038, 0.036)
  palm.quadraticCurveTo(-0.026, 0.059, 0, 0.062)
  palm.quadraticCurveTo(0.026, 0.059, 0.038, 0.036)
  palm.quadraticCurveTo(0.044, -0.012, 0.031, -0.032)
  palm.closePath()
  const palmGeometry = new THREE.ExtrudeGeometry(palm, {
    depth: 0.038,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.004,
    bevelThickness: 0.004,
    curveSegments: 4,
  }).translate(0, 0, -0.019)
  const parts = [
    palmGeometry,
    new THREE.SphereGeometry(1, 8, 6)
      .toNonIndexed()
      .scale(0.027, 0.029, 0.021)
      .translate(0, 0.052, 0),
  ]
  for (let index = 0; index < 4; index++) {
    const length = FINGER_LENGTHS[index]
    const width = FINGER_WIDTHS[index]
    const proximal = length * 0.56
    const distal = length - proximal
    const x = (index - 1.5) * 0.019
    parts.push(fingerSection(THREE, { x, y: -0.031 - proximal / 2, length: proximal, width }))
    parts.push(
      fingerSection(THREE, {
        x,
        y: -0.034 - proximal - distal / 2,
        length: distal,
        width: width * 0.88,
        bend: 0.12,
      }),
    )
  }
  return mergeHumanDetails(parts)
}

function fingerSection(
  THREE: HumanLimbsBuild['THREE'],
  options: { x: number; y: number; length: number; width: number; bend?: number },
) {
  const section = new THREE.SphereGeometry(1, 8, 6)
    .toNonIndexed()
    .scale(options.width, options.length / 2, options.width * 1.45)
  if (options.bend) section.rotateX(options.bend)
  return section.translate(options.x, options.y, options.bend ? 0.003 : 0)
}

export function addSleeveCuff(build: HumanLimbsBuild, elbow: Group): void {
  const { THREE, geometry, glow, profile } = build
  const cuff = new THREE.Mesh(
    geometry(THREE, 'details:sleeve-cuff', () => {
      const band = new THREE.CylinderGeometry(0.038, 0.04, 0.028, 10)
      return band.translate(0, -0.25, 0)
    }),
    glow(profile.shirt, 1),
  )
  cuff.name = 'sleeve-cuff'
  const girth = { slim: 0.86, average: 1, broad: 1.12 }[profile.build]
  cuff.scale.set(girth, 1, girth)
  elbow.add(cuff)
}

export function addShoeDetails(build: HumanLimbsBuild, shoe: Group): void {
  const { THREE, geometry, materials, seen } = build
  if (seen.human?.identity === 'beyond-netero' && seen.human.pose === 'reclined') return
  const seams = new THREE.Mesh(
    geometry(THREE, 'details:shoe-seams', () =>
      mergeHumanDetails([
        new THREE.BoxGeometry(0.117, 0.008, 0.23).translate(0, -0.036, 0.008),
        new THREE.BoxGeometry(0.1, 0.009, 0.012).translate(0, 0.008, 0.071),
      ]),
    ),
    materials.ink,
  )
  seams.name = 'shoe-sole-and-toecap'
  shoe.add(seams)
  const ankle = new THREE.Mesh(
    geometry(THREE, 'details:ankle-transition', () =>
      new THREE.CylinderGeometry(0.036, 0.043, 0.075, 10).translate(0, 0.082, -0.035),
    ),
    materials.dark,
  )
  ankle.name = 'ankle-transition'
  shoe.add(ankle)
}
