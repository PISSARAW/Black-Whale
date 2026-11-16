import type { Group, Object3D } from 'three'
import type { HumanFigure, HumanFigureBuild } from '$lib/tour/humanFigure'
import { chrolloNenActive } from './chrolloBook'
import type { ArcadeFighter } from './types'

type Three = HumanFigureBuild['THREE']
interface BookModel {
  held: Group
  stowed: Group
  ribbon: Object3D[]
}
const BOOKS = new WeakMap<Object3D, BookModel>()
const GEOMETRIES = new WeakMap<Three, ReturnType<typeof bookShapes>>()

function bookShapes(THREE: Three) {
  const shapes = {
    cover: new THREE.BoxGeometry(0.21, 0.29, 0.015),
    paper: new THREE.BoxGeometry(0.19, 0.27, 0.035),
    ribbon: new THREE.BoxGeometry(0.025, 0.22, 0.007),
    cross: new THREE.BoxGeometry(0.08, 0.015, 0.007),
  }
  Object.values(shapes).forEach((shape) => {
    shape.userData.sharedHuman = true
  })
  return shapes
}

/** Open in the right hand; closed at the belt with the single red Double Face ribbon. */
export function addChrolloBook(options: {
  THREE: Three
  glow: HumanFigureBuild['glow']
  model: HumanFigure
}): void {
  const { THREE, glow, model } = options
  let shapes = GEOMETRIES.get(THREE)
  if (!shapes) {
    shapes = bookShapes(THREE)
    GEOMETRIES.set(THREE, shapes)
  }
  const ribbons: Object3D[] = []
  const build = (open: boolean) => {
    const root = new THREE.Group()
    const pages = new THREE.Mesh(shapes.paper, glow(0xe7d8bd, 1))
    root.add(pages)
    const cover = new THREE.Mesh(shapes.cover, glow(0x721f31, 1))
    cover.position.z = 0.028
    root.add(cover)
    const cross = new THREE.Mesh(shapes.cross, glow(0xd3b684, 1))
    cross.position.z = 0.04
    root.add(cross)
    const upright = cross.clone()
    upright.rotation.z = Math.PI / 2
    root.add(upright)
    if (open) {
      const leaf = pages.clone()
      leaf.position.x = 0.2
      leaf.rotation.y = -0.25
      root.add(leaf)
      cover.position.z = -0.025
      cross.visible = false
      upright.visible = false
    }
    const ribbon = new THREE.Mesh(shapes.ribbon, glow(0xf06789, 1))
    ribbon.name = 'chrollo-bookmark'
    ribbon.position.set(0.06, -0.1, 0.05)
    root.add(ribbon)
    ribbons.push(ribbon)
    return root
  }
  const held = build(true)
  held.name = 'chrollo-open-book'
  held.position.set(0, -0.05, 0.09)
  held.rotation.set(-0.9, 0, -0.2)
  model.root.getObjectByName('hand-right')?.add(held)
  const stowed = build(false)
  stowed.name = 'chrollo-closed-book'
  stowed.position.set(-0.25, 0.72, 0.15)
  stowed.rotation.z = -0.12
  model.turns.add(stowed)
  BOOKS.set(model.turns, { held, stowed, ribbon: ribbons })
}

export function animateChrolloBook(figure: Object3D, fighter: ArcadeFighter): void {
  const model = BOOKS.get(figure)
  if (!model) return
  const book = fighter.chrolloBook
  const active = chrolloNenActive(fighter)
  model.held.visible = Boolean(active && book?.open)
  model.stowed.visible = Boolean(active && !book?.open && book?.bookmark)
  model.ribbon.forEach((ribbon) => {
    ribbon.visible = Boolean(book?.bookmark)
  })
}
