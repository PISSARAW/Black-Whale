import type { FightSide } from './types'

export interface DoorFrame {
  id: 'A' | 'B'
  x: number
  direction: 1 | -1
  destination: 'A' | 'B'
  arrivalFacing: 1 | -1
}

export interface DoorNetwork {
  active: boolean
  pending?: { open: boolean }
}

export interface DoorTransit {
  from: 'A' | 'B'
  to: 'A' | 'B'
  owner: FightSide
  frame: number
}

export type DoorPositions = Record<FightSide, { x: number; y: number }>

export interface VoconteDoors {
  networks: Partial<Record<FightSide, DoorNetwork>>
  /** Per-step body positions: projections never stand in for their sleeping body. */
  origins?: DoorPositions
  transported: FightSide[]
  lastTransit?: Partial<Record<FightSide, DoorTransit>>
}
