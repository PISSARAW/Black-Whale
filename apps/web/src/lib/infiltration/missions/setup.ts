import type { Arena } from '../../hunt/arena'
import type { NavGraph } from '../../hunt/navmesh'
import { centroid } from '../../tour/hatsu'
import { interiorPoint } from '../../tour/geometry'
import type { MissionSetup } from '../state'
import type { MissionSelection } from './types'

export interface MissionGround {
  selection: MissionSelection
  arena: Arena
  graph: NavGraph
}

/**
 * Places a selected mission on the arena: the visitor at the extraction
 * room, the objective where the variant puts it, and each witness on a
 * round of its room's doors, started where the variant offsets it.
 */
export function missionSetup({ selection, arena, graph }: MissionGround): MissionSetup {
  const extraction = arena.spaces[0]
  const objective = arena.spaces[selection.variant.objectiveIndex]
  return {
    playerAt: { position: interiorPoint(extraction.footprint), spaceId: extraction.id },
    objectiveSpaceId: objective.id,
    extractionSpaceId: extraction.id,
    selection,
    witnesses: selection.definition.witnesses.map((definition, index) => {
      const space = arena.spaces[definition.spaceIndex]
      const neighbours = graph.edges.get(space.id) ?? []
      const rotated = neighbours.map(
        (_, routeIndex) =>
          neighbours[(routeIndex + selection.variant.routeOffset) % neighbours.length],
      )
      return {
        id: definition.id,
        position: centroid(space),
        heading: index % 2 === 0 ? 0 : Math.PI,
        spaceId: space.id,
        sight: definition.sight,
        social: definition.social,
        usesEn: definition.usesEn,
        route: [space.id, ...rotated],
      }
    }),
  }
}
