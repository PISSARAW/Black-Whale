import type { Material, Mesh, MeshBasicMaterial, Object3D } from 'three'
import { bodyPartFunctional, type DamagedBodyPart } from './bodyDamage'
import { gyoSight } from './nenPerception'
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
  const actor = options.fighter
  const node = root.getObjectByName(part === 'left-hand' ? 'hand-left' : 'knee-right')
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

function disguisedRubber(actor: ArcadeFighter): boolean {
  return (
    actor.textureSurprise?.surface === 'gum-prostheses' &&
    actor.textureSurprise.supportId === actor.gumProstheses?.id
  )
}

function rubberVisible(options: FigureOptions): boolean {
  return (
    disguisedRubber(options.fighter) ||
    !options.fighter.gumProstheses?.hidden ||
    !options.observer ||
    gyoSight(options.observer)
  )
}

function rubberMaterial(options: FigureOptions, material: Material): Material {
  if (material.side === options.THREE.BackSide) return material
  const rubber = material.clone()
  if ('color' in rubber) (rubber as MeshBasicMaterial).color.set(0xf09ec7)
  return rubber
}
