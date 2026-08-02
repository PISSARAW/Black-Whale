import type { MissionDefinition } from './types'

export function validateMission(definition: MissionDefinition, roomCount: number): void {
  if (definition.variants.length !== 3) throw new Error(`${definition.id}: expected three variants`)
  if (definition.duration <= 0) throw new Error(`${definition.id}: duration must be positive`)
  const objectiveIds = new Set(definition.objectives.map((objective) => objective.id))
  if (objectiveIds.size !== definition.objectives.length) throw new Error(`${definition.id}: duplicate objective`)
  if (!definition.objectives.some((objective) => objective.kind === 'extract')) {
    throw new Error(`${definition.id}: missing extraction objective`)
  }
  for (const variant of definition.variants) {
    if (variant.objectiveIndex < 0 || variant.objectiveIndex >= roomCount) {
      throw new Error(`${definition.id}/${variant.id}: objective outside arena`)
    }
  }
  for (const witness of definition.witnesses) {
    if (witness.spaceIndex < 0 || witness.spaceIndex >= roomCount) {
      throw new Error(`${definition.id}/${witness.id}: witness outside arena`)
    }
  }
}
