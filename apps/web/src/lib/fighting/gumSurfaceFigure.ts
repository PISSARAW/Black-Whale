import type { Object3D, Mesh } from 'three'
import { bodyPartFunctional, type DamagedBodyPart } from './bodyDamage'
import {
  disguisedRubber,
  rubberVisible,
  rubberMaterial,
  type GumFigureOptions,
} from './gumProsthesisAppearance'

/** Surface patches reuse the actual face rig; no eye, brain, airway or skeleton is replaced. */
export function shapeGumSurface(
  options: GumFigureOptions,
  root: Object3D,
  part: DamagedBodyPart,
): boolean {
  if (part !== 'facial-surface' && part !== 'neck-surface') return false
  const head = root.getObjectByName('face-mouth')?.parent
  if (!head) return true
  const actor = options.fighter
  const gum = bodyPartFunctional(actor, part) && rubberVisible(options)
  const skin = gum && disguisedRubber(actor)
  head.add(surfacePatch(options, { part, gum, skin }))
  if (part === 'facial-surface') shapeFacialRelief(options, { head, gum, skin })
  return true
}

function surfacePatch(
  options: GumFigureOptions,
  context: { part: DamagedBodyPart; gum: boolean; skin: boolean },
) {
  const { part, gum, skin } = context
  const patch = new options.THREE.Mesh(
    new options.THREE.PlaneGeometry(part === 'facial-surface' ? 0.16 : 0.1, 0.12),
    options.glow(gum ? 0xf09ec7 : 0x883e4b, 1),
  )
  patch.name = `gum-surface:${part}`
  patch.position.set(
    0,
    part === 'facial-surface' ? -0.075 : -0.24,
    part === 'facial-surface' ? 0.181 : 0.12,
  )
  patch.visible = !skin
  patch.userData = {
    physicalMatter: gum ? 'nen-rubber' : 'surface-wound',
    supportId: options.fighter.gumProstheses?.id,
  }
  return patch
}

function shapeFacialRelief(
  options: GumFigureOptions,
  context: { head: Object3D; gum: boolean; skin: boolean },
) {
  for (const name of ['face-relief', 'face-mouth']) {
    const part = context.head.getObjectByName(name) as Mesh | undefined
    if (!part) continue
    part.visible = context.gum
    part.userData.physicalMatter = 'nen-rubber'
    if (!context.gum || context.skin) continue
    part.material = Array.isArray(part.material)
      ? part.material.map((material) => rubberMaterial(options, material))
      : rubberMaterial(options, part.material)
  }
}
