import type { BufferGeometry } from 'three'
import type { HumanClothesBuild } from './humanClothes'
import { mergeHumanDetails } from './humanDetailGeometry'

const TAILORED = new Set(['suit', 'uniform', 'civilian', 'combat'])

/** Small raised seams remain legible from the duel's oblique camera. */
export function addGarmentDetails(build: HumanClothesBuild): void {
  const { THREE, geometry, figure, profile, frame, width, materials } = build
  if (!TAILORED.has(profile.clothing)) return
  const tailored = profile.clothing === 'suit' || profile.clothing === 'uniform'
  const seams = geometry(THREE, `details:seams:${profile.clothing}`, () => {
    const parts: BufferGeometry[] = []
    // Button placket and lower jacket hem, including the back.
    if (tailored) parts.push(new THREE.BoxGeometry(0.009, 0.34, 0.008).translate(0, -0.04, 0.183))
    for (const side of [-1, 1]) {
      parts.push(new THREE.BoxGeometry(0.12, 0.009, 0.01).translate(side * 0.087, -0.25, 0.126))
      parts.push(new THREE.BoxGeometry(0.12, 0.009, 0.01).translate(side * 0.087, -0.25, -0.126))
      if (tailored) {
        parts.push(new THREE.BoxGeometry(0.075, 0.009, 0.012).translate(side * 0.128, 0.075, 0.15))
        parts.push(new THREE.BoxGeometry(0.006, 0.055, 0.008).translate(side * 0.164, 0.05, 0.145))
      }
    }
    return mergeHumanDetails(parts)
  })
  const stitching = new THREE.Mesh(seams, materials.ink)
  stitching.name = 'garment-seams'
  stitching.position.y = 1.12 * frame.neck
  stitching.scale.x = frame.width * profile.shoulders
  figure.add(stitching)
  if (tailored) addButtons(build)

  const buckle = new THREE.Mesh(
    geometry(THREE, 'details:belt-buckle', () => {
      const parts = [
        new THREE.BoxGeometry(0.063, 0.008, 0.012).translate(0, 0.021, 0),
        new THREE.BoxGeometry(0.063, 0.008, 0.012).translate(0, -0.021, 0),
        new THREE.BoxGeometry(0.008, 0.05, 0.012).translate(-0.028, 0, 0),
        new THREE.BoxGeometry(0.008, 0.05, 0.012).translate(0.028, 0, 0),
        new THREE.BoxGeometry(0.032, 0.006, 0.014),
      ]
      return mergeHumanDetails(parts)
    }),
    materials.accent,
  )
  buckle.name = 'belt-buckle'
  buckle.position.set(0, 0.82 * frame.neck, 0.128)
  buckle.scale.x = width
  figure.add(buckle)
}

function addButtons({ THREE, geometry, figure, frame, materials }: HumanClothesBuild): void {
  const buttons = new THREE.Mesh(
    geometry(THREE, 'details:jacket-buttons', () => {
      return mergeHumanDetails(
        [0, 1, 2].map((index) =>
          new THREE.SphereGeometry(0.009, 6, 4)
            .scale(1, 1, 0.5)
            .translate(0.017, -index * 0.075, 0.19),
        ),
      )
    }),
    materials.accent,
  )
  buttons.name = 'jacket-buttons'
  buttons.position.y = 1.22 * frame.neck
  figure.add(buttons)
}
