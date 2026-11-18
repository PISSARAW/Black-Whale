import type { Material } from 'three'
import { gyoSight } from './nenPerception'
import type { buildFightFigure } from './fighterFigure'
import type { ArcadeFighter } from './types'

export type GumFigureOptions = Parameters<typeof buildFightFigure>[0]

export function disguisedRubber(actor: ArcadeFighter): boolean {
  return (
    actor.textureSurprise?.surface === 'gum-prostheses' &&
    actor.textureSurprise.supportId === actor.gumProstheses?.id
  )
}
export function rubberVisible(options: GumFigureOptions): boolean {
  return (
    disguisedRubber(options.fighter) ||
    !options.fighter.gumProstheses?.hidden ||
    !options.observer ||
    gyoSight(options.observer)
  )
}
export function rubberMaterial(options: GumFigureOptions, material: Material): Material {
  if (material.side === options.THREE.BackSide) return material
  const rubber = material.clone()
  if ('color' in rubber) (rubber as import('three').MeshBasicMaterial).color.setHex(0xf09ec7)
  return rubber
}
