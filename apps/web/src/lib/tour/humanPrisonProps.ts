import type * as Three from 'three'
import type { Apparition } from './apparitions'

const restingBeyond = (seen: Apparition) =>
  seen.human?.identity === 'beyond-netero' && seen.human.pose === 'reclined'

/** The chapter 359 bunk scene shows bare feet, not the cast's default black shoes. */
export function prisonFootMaterial(
  seen: Apparition,
  skin: Three.Material,
  boot: Three.Material,
): Three.Material {
  return restingBeyond(seen) ? skin : boot
}

export function prisonFootGeometry(
  seen: Apparition,
  THREE: typeof Three,
  shoe: Three.BufferGeometry,
): Three.BufferGeometry {
  if (!restingBeyond(seen)) return shoe
  return new THREE.SphereGeometry(1, 8, 4).scale(0.075, 0.045, 0.125)
}

/** A plain open book held at the chest; no lettering is invented. */
export function addPrisonBook(options: {
  THREE: typeof Three
  seen: Apparition
  figure: Three.Group
  paper: Three.Material
  cover: Three.Material
}): void {
  if (!restingBeyond(options.seen)) return
  const { THREE, figure, paper, cover } = options
  const hand = figure.getObjectByName('hand-right')
  if (!hand) return
  const book = new THREE.Group()
  book.name = 'beyond-prison-book'
  for (const side of [-1, 1]) {
    const leaf = new THREE.Group()
    leaf.rotation.y = side * 0.23
    const pages = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.23, 0.025), paper)
    pages.position.x = side * 0.08
    const binding = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.24, 0.008), cover)
    binding.position.set(side * 0.08, 0, -0.018)
    leaf.add(pages, binding)
    book.add(leaf)
  }
  book.position.set(0, -0.02, 0.09)
  book.rotation.x = -0.4
  hand.add(book)
}
