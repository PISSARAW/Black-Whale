import * as THREE from 'three'
import { disposeBanquetDetails } from './banquetDetailBuilder'
import { buildShip } from './blueprint'
import { detailTagRangesOf } from './detailTag'
import {
  buildSourceBoundInteriorDetails,
  sourceBoundInteriorSurfacePlan,
} from './sourceBoundInteriorView'
import { sourceBoundStyleFor } from './sourceBoundInteriorStyles'

const ship = buildShip()

/** Blueprint evidence attached to one catalogue location. */
export const evidenceFor = (locationId: string) => {
  const spaces = ship.blueprint.spaces.filter((space) => space.locationId === locationId)
  const spaceIds = new Set(spaces.map((space) => space.id))
  const structures = ship.structures.filter((structure) => spaceIds.has(structure.spaceId))

  return { spaces, structures }
}

/** Full renderer/data contract for one source-bound catalogue location. */
export function certificationIssuesFor(locationId: string): string[] {
  const issues: string[] = []
  const { spaces, structures } = evidenceFor(locationId)
  const style = sourceBoundStyleFor(locationId)
  if (!style) return [`${locationId}: missing reconstruction programme`]

  for (const space of spaces) {
    const plan = [...ship.plans.values()].find((candidate) =>
      candidate.spaces.some(({ id }) => id === space.id),
    )
    if (!plan) {
      issues.push(`${space.id}: missing tier plan`)
      continue
    }
    const root = buildSourceBoundInteriorDetails({
      THREE,
      plan,
      spaceId: space.id,
      reveal: false,
    })
    if (!root) {
      issues.push(`${space.id}: missing detailed renderer`)
      continue
    }

    let triangles = 0
    root.traverse((object) => {
      const mesh = object as THREE.Mesh
      if (!mesh.isMesh) return
      const faces = mesh.geometry.getAttribute('position').count / 3
      triangles += faces
      let nextFace = 0
      for (const range of detailTagRangesOf(mesh)) {
        if (range.start !== nextFace) issues.push(`${space.id}: untagged face ${nextFace}`)
        if (!range.tag.source || !range.tag.sourceFr)
          issues.push(`${space.id}: ${range.tag.id} lacks a bilingual source`)
        nextFace += range.count
      }
      if (nextFace !== faces) issues.push(`${space.id}: ${faces - nextFace} untagged faces`)
    })
    if (triangles > style.triangleBudget)
      issues.push(`${space.id}: ${triangles} triangles exceed ${style.triangleBudget}`)
    if (buildSourceBoundInteriorDetails({ THREE, plan, spaceId: space.id, reveal: true }) !== null)
      issues.push(`${space.id}: reconstruction remains visible in evidence mode`)
    if (
      sourceBoundInteriorSurfacePlan(plan, false).structures.some(
        ({ spaceId }) => spaceId === space.id,
      )
    )
      issues.push(`${space.id}: coarse and detailed furniture overlap`)
    disposeBanquetDetails(root)
  }

  for (const structure of structures) {
    if (!structure.source || !structure.sourceFr)
      issues.push(`${structure.id}: missing bilingual source`)
  }
  return issues
}
