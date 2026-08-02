import type { InfiltrationState } from './state'

export const INFILTRATION_SAVE_VERSION = 2
export interface InfiltrationSave { version: 2; savedAt: string; state: InfiltrationState }

export function encodeSave(state: InfiltrationState, savedAt = new Date().toISOString()): string {
  return JSON.stringify({ version: INFILTRATION_SAVE_VERSION, savedAt, state } satisfies InfiltrationSave)
}

export function decodeSave(raw: string): InfiltrationSave | null {
  try {
    const value = JSON.parse(raw) as Partial<InfiltrationSave>
    if (value.version !== INFILTRATION_SAVE_VERSION || !value.state?.mission || !Array.isArray(value.state.objectives)) return null
    return value as InfiltrationSave
  } catch { return null }
}
