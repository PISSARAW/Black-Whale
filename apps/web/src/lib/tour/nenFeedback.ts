import type { NenRefusalCode } from './nenRefusal'

export type NenCause =
  | { code: 'ACTION_ACCEPTED'; action: string }
  | { code: 'ACTION_REFUSED'; action: string; reason: NenRefusalCode }
  | { code: 'EN_CONTACT'; name: string }
  | { code: 'PRESSURE_WITNESS'; name: string; pressure: 'ren' | 'on' }
  | { code: 'EXHAUSTED' }
  | { code: 'SHU_TRACE'; objectId: string }
  | { code: 'RUMOR_SPREAD'; spaceId: string }
  | { code: 'SECURITY_SWEEP'; spaceId: string }

export interface NenCauseEntry {
  id: number
  cause: NenCause
}

export const appendNenCause = (
  entries: readonly NenCauseEntry[],
  cause: NenCause,
  id = Date.now(),
): NenCauseEntry[] => [...entries, { id, cause }].slice(-4)
