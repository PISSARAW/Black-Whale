import { HUNT_CONTRACT_SCHEMA_VERSION, type HuntContractV3 } from './types'
import { validateContract } from './validate'

export function encodeContract(contract: HuntContractV3): string {
  const json = JSON.stringify(contract)
  const bytes = new TextEncoder().encode(json)
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('')
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
}

export function decodeContract(value: string): HuntContractV3 | null {
  try {
    const normalized = value.replaceAll('-', '+').replaceAll('_', '/')
    const binary = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '='))
    const parsed = JSON.parse(
      new TextDecoder().decode(Uint8Array.from(binary, (character) => character.charCodeAt(0))),
    ) as HuntContractV3
    return parsed.schemaVersion === HUNT_CONTRACT_SCHEMA_VERSION && validateContract(parsed).length === 0
      ? parsed
      : null
  } catch {
    return null
  }
}

export function editContract(
  template: HuntContractV3,
  changes: Partial<Pick<HuntContractV3, 'id' | 'title' | 'description' | 'durationSeconds' | 'environment'>>,
): HuntContractV3 {
  return { ...template, ...changes, schemaVersion: HUNT_CONTRACT_SCHEMA_VERSION }
}
