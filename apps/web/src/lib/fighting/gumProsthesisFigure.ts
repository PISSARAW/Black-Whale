import { forearmNode, type SeveredForearm } from './severedForearms'
import type { Mesh, Object3D } from 'three'
import { bodyPartFunctional, type DamagedBodyPart } from './bodyDamage'
import { shapeGumSurface } from './gumSurfaceFigure'
import { disguisedRubber, rubberVisible, rubberMaterial } from './gumProsthesisAppearance'
import type { buildFightFigure } from './fighterFigure'
import type { ArcadeFighter } from './types'

type FigureOptions = Parameters<typeof buildFightFigure>[0]

export function gumBodyFigureKey(actor: ArcadeFighter) {
  return [
    actor.bodyDamage,
    actor.gumProstheses?.id,
    actor.bodyDamage?.parts.map((part) => bodyPartFunctional(actor, part)),
    actor.gumProstheses?.hidden,
    actor.textureSurprise?.surface,
    actor.textureSurprise?.supportId,
  ]
}

/** Reuses the articulated shape, without mutating any shared geometry or skin material. */
export function shapeGumProstheses(options: FigureOptions, root: Object3D): void {
  for (const part of options.fighter.bodyDamage?.parts ?? []) shapePart(options, root, part)
}

function shapePart(options: FigureOptions, root: Object3D, part: DamagedBodyPart): void {
  if (shapeGumSurface(options, root, part)) return
  const actor = options.fighter
  const name = part.endsWith('forearm')
    ? forearmNode(part as SeveredForearm)
    : part === 'left-hand'
      ? 'hand-left'
      : 'knee-right'
  const node = root.getObjectByName(name)
  if (!node) return
  node.visible = bodyPartFunctional(actor, part) && rubberVisible(options)
  if (!node.visible) return
  const disguised = disguisedRubber(actor)
  node.userData.gumProsthesis = actor.gumProstheses?.id
  node.traverse((object) => {
    if (!(object as Mesh).isMesh) return
    const mesh = object as Mesh
    mesh.userData = { ...mesh.userData, physicalMatter: 'nen-rubber' }
    if (disguised) return
    mesh.material = Array.isArray(mesh.material)
      ? mesh.material.map((material) => rubberMaterial(options, material))
      : rubberMaterial(options, mesh.material)
  })
}
