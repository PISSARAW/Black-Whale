import type { WitnessId } from '../state'

export type MissionId = 'missing-report' | 'courier' | 'listening-device'
export type ObjectiveState = 'unknown' | 'believed' | 'confirmed' | 'invalidated'
export type ObjectiveKind = 'copy' | 'identify' | 'follow' | 'plant' | 'extract'

export interface ObjectiveDefinition {
  id: string
  kind: ObjectiveKind
  required: boolean
  secret?: boolean
}

export interface MissionObjective extends ObjectiveDefinition {
  state: ObjectiveState
}

export interface WitnessDefinition {
  id: WitnessId
  spaceIndex: number
  social: boolean
  usesEn: boolean
  sight: number
}

export interface MissionVariant {
  id: string
  routeOffset: number
  objectiveIndex: number
  decoyIndex?: number
  authority: 'maintenance' | 'security' | 'service'
}

export interface MissionDefinition {
  id: MissionId
  duration: number
  objectives: ObjectiveDefinition[]
  witnesses: WitnessDefinition[]
  variants: MissionVariant[]
  teaching: ('movement' | 'vision' | 'sound' | 'social' | 'nen' | 'traces' | 'hatsu')[]
}

export interface MissionSelection {
  definition: MissionDefinition
  variant: MissionVariant
  seed: number
}
