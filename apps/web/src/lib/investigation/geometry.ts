import type { InvestigationCase } from './case'

export type ScenePhenomenon = 'doll' | 'snakes'

export interface SightLine {
  observerId: string
  targetId: string
  phenomenon: ScenePhenomenon
  visible: boolean
  reason: string
}

export const ROOM_1014_SIGHT_LINES: SightLine[] = [
  {
    observerId: 'loberry',
    targetId: 'furykov',
    phenomenon: 'doll',
    visible: true,
    reason: 'La condition de la capacité désigne Loberry comme unique témoin de la poupée.',
  },
  ...['kurapika', 'bill', 'furykov', 'belerainte', 'sakata'].map((observerId): SightLine => ({
    observerId,
    targetId: 'body',
    phenomenon: 'snakes',
    visible: true,
    reason: 'Les créatures sont matérialisées et deviennent visibles à tous pendant l’attaque.',
  })),
  ...['kurapika', 'bill', 'furykov', 'belerainte', 'sakata'].map((observerId): SightLine => ({
    observerId,
    targetId: 'furykov',
    phenomenon: 'doll',
    visible: false,
    reason:
      'La restriction de perception masque la poupée à toute personne autre que Loberry et l’utilisateur.',
  })),
]

export interface SceneNode {
  id: string
  label: string
  x: number
  y: number
  isDead: boolean
}

export function sceneNodes(investigation: InvestigationCase): SceneNode[] {
  return investigation.subjects.map((subject) => ({
    id: subject.id,
    label: subject.name,
    x: 200 + subject.posOffset[0] * 55,
    y: 130 + subject.posOffset[1] * 42,
    isDead: subject.isDead === true,
  }))
}

export function visibleSightLines(
  phenomenon: ScenePhenomenon,
  sightLines: SightLine[] = ROOM_1014_SIGHT_LINES,
): SightLine[] {
  return sightLines.filter((line) => line.phenomenon === phenomenon && line.visible)
}
