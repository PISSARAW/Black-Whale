export type FortuneSubject = { kind: 'fighter'; bodyKey: string } | { kind: 'person'; id: string }
export interface FortuneIdentity {
  subject: FortuneSubject
  name: string
  dateOfBirth: string
  bloodType: 'A' | 'B' | 'AB' | 'O'
}
export interface FortuneSignature extends FortuneIdentity {
  /** This exact original sheet was personally written by this subject before the duel. */
  sheetId: string
  handwritten: true
}
export interface FortuneMonth {
  id: string
  subject: FortuneSubject
  identity?: FortuneIdentity
  /** Explicit scenario future; never inferred from a hidden opponent input or an unknown Hatsu. */
  weeks: readonly { week: number; eventId: string; quatrain: string }[]
  deathWeek?: number
}
export interface GhostwriterWriting {
  sheetId: string
  monthId: string
  hand: import('./deviceHands').DeviceHand
  kitId: string
  signatureText: string
  frames: number
  health: number
  x: number
  y: number
  /** Server-only while automatic writing is in progress; the caster does not receive memories. */
  verses?: string
  progress: number
}
declare module './paperDocumentTypes' {
  interface PaperDocument {
    fortuneSignature?: FortuneSignature
    fortunePortrait?: FortuneSubject
    fortuneMonthReady?: boolean
    fortuneMonthId?: string
    fortuneWritten?: { monthId: string; weeks: number; writerBodyKey: string }
  }
}
declare module './preparationTypes' {
  interface PreparedEntity {
    fortunePerson?: { name: string; fictional: true; identity: FortuneIdentity }
  }
}
declare module './types' {
  interface ArcadeFighter {
    ghostwriterWriting?: GhostwriterWriting
  }
  interface FightState {
    fortuneMonths?: readonly FortuneMonth[]
  }
}

export function sameFortuneSubject(a?: FortuneSubject, b?: FortuneSubject): boolean {
  if (!a || !b || a.kind !== b.kind) return false
  if (a.kind === 'fighter' && b.kind === 'fighter') return a.bodyKey === b.bodyKey
  return a.kind === 'person' && b.kind === 'person' && a.id === b.id
}
