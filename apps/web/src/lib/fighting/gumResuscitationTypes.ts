import type { FightSide } from './types'

export interface GumResuscitationProgram {
  bodyKey: string
  preparedAt: number
  order: 'heart-and-lungs'
}
/** An explicit historical scenario premise, not a diagnosis inferred from zero HP. */
export interface AsphyxiaCertificate {
  bodyKey: string
  cause: 'asphyxia'
  heartIntact: boolean
  lungsIntact: boolean
  airwayClear: boolean
  oxygenRestored: boolean
  viable: boolean
  traumaHealth: number
}
export interface GumResuscitationSequence {
  victimSide: FightSide
  bodyKey: string
  frame: number
  traumaHealth: number
}
declare module './types' {
  interface ArcadeFighter {
    gumResuscitationProgram?: GumResuscitationProgram
    asphyxiaCertificate?: AsphyxiaCertificate
    gumResuscitationCompleted?: boolean
    gumResuscitationFrame?: number
    gumResuscitationPaused?: boolean
  }
  interface FightState {
    gumResuscitation?: GumResuscitationSequence
    preparedAsphyxia?: FightSide[]
  }
}
