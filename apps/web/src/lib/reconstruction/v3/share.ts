import { defineReconstructionScenario, verifyReconstructionScenario } from './scenario'
import type { ReconstructionScenario } from './scenario'

const MAX_SHARE_LENGTH = 32_000

export function encodeSharedScenario(scenario: ReconstructionScenario): string {
  if (!verifyReconstructionScenario(scenario)) throw new Error('Invalid Reconstruction scenario')
  const bytes = new TextEncoder().encode(JSON.stringify(scenario))
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
}

export function decodeSharedScenario(encoded: string): ReconstructionScenario {
  if (!encoded || encoded.length > MAX_SHARE_LENGTH || !/^[A-Za-z0-9_-]+$/.test(encoded)) {
    throw new Error('Invalid shared Reconstruction scenario')
  }
  try {
    const padded =
      encoded.replaceAll('-', '+').replaceAll('_', '/') + '='.repeat((4 - (encoded.length % 4)) % 4)
    const binary = atob(padded)
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))
    const value: unknown = JSON.parse(new TextDecoder().decode(bytes))
    if (!value || typeof value !== 'object') throw new Error('invalid payload')
    const candidate = value as ReconstructionScenario
    const { version: _version, checksum: _checksum, ...draft } = candidate
    const scenario = defineReconstructionScenario(draft)
    if (!verifyReconstructionScenario(candidate) || scenario.checksum !== candidate.checksum) {
      throw new Error('invalid checksum')
    }
    return candidate
  } catch {
    throw new Error('Invalid shared Reconstruction scenario')
  }
}
