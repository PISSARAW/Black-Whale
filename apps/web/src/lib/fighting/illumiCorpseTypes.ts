import type { GumSource } from './bungeeSource'
import type { FightSide } from './types'
import type { DeviceHand } from './deviceHands'

export interface CorpseNeedles {
  id: string
  mediumCopyId?: string
}
export interface CorpseControl {
  owner: { owner: FightSide; member: number }
  pinsId: string
  origin?: GumSource
}
export interface CorpsePreparation {
  target: string
  frames: number
  x: number
  y: number
  hand: DeviceHand
  owner: { owner: FightSide; member: number }
  origin?: GumSource
  mediumCopyId?: string
  pinsId?: string
  stockPinsId?: string
  stockEntityId?: string
}
declare module './types' {
  interface ArcadeFighter {
    corpsePreparation?: CorpsePreparation
  }
}
declare module './preparationTypes' {
  interface PreparedEntity {
    corpsePinBundle?: CorpseNeedles
    corpseNeedles?: CorpseNeedles
    corpseControl?: CorpseControl
  }
}
