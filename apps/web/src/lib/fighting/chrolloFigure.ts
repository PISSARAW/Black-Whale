import { createVisitHatsuModel } from './visitHatsuModel'
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
/** Both poses use the visit's covers, palm emblem, printed pages and Double Face ribbon. */
export function addChrolloBook(options: {
  THREE: Three
  glow: HumanFigureBuild['glow']
  model: HumanFigure
}): void {
  const { THREE, model } = options
  const ribbons: Object3D[] = []
  const build = (open: boolean) => {
    const book = createVisitHatsuModel(THREE, {
      model: 'skill-book', figureOwned: true,
      joints: ['book-leaf:-1', 'book-leaf:1', 'book-ribbon', 'book-ribbon-tail'],
    })
    book.fit({ width: 0.5, depth: 0.35 })
    for (const side of [-1, 1]) {
      const leaf = book.joints.get(`book-leaf:${side}`)!
      if (!open) leaf.rotation.z = side * Math.PI / 2
    }
    for (const name of ['book-ribbon', 'book-ribbon-tail']) {
      const ribbon = book.joints.get(name)
      if (ribbon) {
        ribbon.name = 'chrollo-bookmark'
        ribbons.push(ribbon)
      }
    }
    return book.root
  }
  const held = build(true)
  held.name = 'chrollo-open-book'
  held.position.set(0, -0.05, 0.09)
  held.rotation.set(1, 0, -0.2)
  model.root.getObjectByName('hand-right')?.add(held)
  const stowed = build(false)
  stowed.name = 'chrollo-closed-book'
  stowed.position.set(-0.25, 0.72, 0.15)
  stowed.rotation.set(Math.PI / 2, Math.PI / 2, 0, 'YXZ')
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
