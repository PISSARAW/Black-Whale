import { HUNT_TERRAINS } from '../arena'
import { HUNTER_PROFILES } from '../hunter/profiles'
import type { HuntHatsuId } from '../hatsu'
import {
  HUNT_CONTRACT_SCHEMA_VERSION,
  type ContractValidationIssue,
  type HuntContractV3,
} from './types'

const hatsu = new Set<HuntHatsuId>(['bungee-gum', 'parallel-future', 'dowsing-chain'])
const terrains = new Set(HUNT_TERRAINS.map((terrain) => terrain.id))
const hunters = new Set(HUNTER_PROFILES.map((profile) => profile.id))

export function validateContract(contract: HuntContractV3): ContractValidationIssue[] {
  const issues: ContractValidationIssue[] = []
  const add = (path: string, message: string) => issues.push({ path, message })

  if (contract.schemaVersion !== HUNT_CONTRACT_SCHEMA_VERSION) add('schemaVersion', 'must be 3')
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(contract.id)) add('id', 'must be a stable slug')
  if (!contract.title.en.trim() || !contract.title.fr.trim()) add('title', 'requires en and fr')
  if (!contract.description.en.trim() || !contract.description.fr.trim()) {
    add('description', 'requires en and fr')
  }
  if (contract.terrainSequence.length === 0) add('terrainSequence', 'cannot be empty')
  contract.terrainSequence.forEach((id, index) => {
    if (!terrains.has(id)) add(`terrainSequence.${index}`, `unknown terrain ${id}`)
  })
  if (contract.objectives.length === 0) add('objectives', 'cannot be empty')
  if (contract.allowedHatsu.length === 0) add('allowedHatsu', 'cannot be empty')
  contract.allowedHatsu.forEach((id, index) => {
    if (!hatsu.has(id)) add(`allowedHatsu.${index}`, `unknown Hatsu ${id}`)
  })
  if (new Set(contract.allowedHatsu).size !== contract.allowedHatsu.length) {
    add('allowedHatsu', 'cannot contain duplicates')
  }
  if (contract.hunterProfiles.length === 0) add('hunterProfiles', 'cannot be empty')
  contract.hunterProfiles.forEach((id, index) => {
    if (!hunters.has(id)) add(`hunterProfiles.${index}`, `unknown hunter ${id}`)
  })
  if (contract.durationSeconds < 60 || contract.durationSeconds > 1800) {
    add('durationSeconds', 'must be between 60 and 1800')
  }
  for (const [index, objective] of contract.objectives.entries()) {
    if (objective.kind === 'survive' && objective.seconds > contract.durationSeconds) {
      add(`objectives.${index}.seconds`, 'cannot exceed contract duration')
    }
    if (objective.kind === 'misdirect' && objective.falseTrails < 1) {
      add(`objectives.${index}.falseTrails`, 'must be positive')
    }
  }
  return issues
}

export function requireValidContract(contract: HuntContractV3): HuntContractV3 {
  const issues = validateContract(contract)
  if (issues.length > 0) {
    throw new Error(`Invalid Hunt contract ${contract.id}: ${issues.map((i) => `${i.path} ${i.message}`).join('; ')}`)
  }
  return contract
}
