import type { HuntTerrainId } from '../arena'
import type { HuntHatsuId } from '../hatsu'
import type { HunterProfileId } from '../hunter/profiles'

export const HUNT_CONTRACT_SCHEMA_VERSION = 3 as const

export type ContractObjective =
  | { kind: 'reach'; terrain: HuntTerrainId; spaceId?: string }
  | { kind: 'survive'; seconds: number }
  | { kind: 'misdirect'; falseTrails: number }
  | { kind: 'exhaust-hunter' }

export interface ContractEnvironment {
  lighting: 'normal' | 'low' | 'blackout'
  acoustics: 'clear' | 'reverberant' | 'masked'
  sealableExits: boolean
}

export interface HuntContractV3 {
  schemaVersion: typeof HUNT_CONTRACT_SCHEMA_VERSION
  id: string
  title: { en: string; fr: string }
  description: { en: string; fr: string }
  terrainSequence: HuntTerrainId[]
  objectives: ContractObjective[]
  allowedHatsu: HuntHatsuId[]
  hunterProfiles: HunterProfileId[]
  environment: ContractEnvironment
  durationSeconds: number
  seed: number
}

export interface ContractValidationIssue {
  path: string
  message: string
}
