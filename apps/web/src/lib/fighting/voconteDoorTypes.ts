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

/** A real doorframe already built into a level; Door can only link two of these. */
export interface DoorSite {
  id: string
  x: number
  labelFr: string
  labelEn: string
}

/** Two site ids chosen before the round. */
export type DoorFramePick = readonly [string, string]
