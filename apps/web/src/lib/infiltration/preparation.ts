import type { CoverProfile } from './social/cover'
import type { InfiltrationHatsuId } from './hatsu'

export interface MissionPreparation {
  entrySpaceId: string
  extractionSpaceId: string
  cover: CoverProfile
  hatsu: InfiltrationHatsuId
  equipment: ('camera' | 'cleaning-kit' | 'relay-jammer')[]
  intel: string[]
}

export function validatePreparation(preparation: MissionPreparation): string[] {
  const errors: string[] = []
  if (!preparation.entrySpaceId) errors.push('entry-required')
  if (!preparation.extractionSpaceId) errors.push('extraction-required')
  if (preparation.equipment.length > 2) errors.push('equipment-limit')
  if (preparation.cover.allowedSpaces.length === 0) errors.push('cover-needs-access')
  return errors
}
