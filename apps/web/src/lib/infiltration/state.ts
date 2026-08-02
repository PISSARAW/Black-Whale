import type { Vec2 } from '../tour/types'
import type { NenState } from '../hunt/nen/states'

export type WitnessId = 'steward' | 'guard' | 'nenGuard'
export type MissionOutcome = 'playing' | 'escaped' | 'identified' | 'timeUp'
export type TraceKind = 'door' | 'document' | 'diversion' | 'aura'

export interface Belief {
  identity: 'maintenance' | 'intruder' | 'unknown'
  certainty: number
  lastSpaceId: string | null
  reported: boolean
}

export interface Witness {
  id: WitnessId
  position: Vec2
  spaceId: string
  sight: number
  social: boolean
  usesEn: boolean
  belief: Belief
}

export interface Trace {
  kind: TraceKind
  spaceId: string
  strength: number
}

export interface InfiltrationState {
  clock: number
  outcome: MissionOutcome
  player: { position: Vec2; spaceId: string | null; nen: NenState; moving: boolean }
  witnesses: Witness[]
  traces: Trace[]
  objectiveSpaceId: string
  extractionSpaceId: string
  documentCopied: boolean
  authorConfirmed: boolean
  diversion: { spaceId: string; left: number } | null
  coverIntegrity: number
  alert: number
}

export interface MissionSetup {
  playerAt: { position: Vec2; spaceId: string }
  objectiveSpaceId: string
  extractionSpaceId: string
  witnesses: Omit<Witness, 'belief'>[]
}

export type InfiltrationAction =
  | { type: 'WALKED'; position: Vec2; spaceId: string | null; moving: boolean }
  | { type: 'ZETSU' }
  | { type: 'COPY' }
  | { type: 'VERIFY' }
  | { type: 'DIVERT' }
  | { type: 'EXTRACT' }

const noBelief = (): Belief => ({
  identity: 'unknown',
  certainty: 0,
  lastSpaceId: null,
  reported: false,
})

export function initialInfiltrationState(setup: MissionSetup): InfiltrationState {
  return {
    clock: 0,
    outcome: 'playing',
    player: { ...setup.playerAt, nen: 'ten', moving: false },
    witnesses: setup.witnesses.map((witness) => ({ ...witness, belief: noBelief() })),
    traces: [],
    objectiveSpaceId: setup.objectiveSpaceId,
    extractionSpaceId: setup.extractionSpaceId,
    documentCopied: false,
    authorConfirmed: false,
    diversion: null,
    coverIntegrity: 100,
    alert: 0,
  }
}

export function infiltrationReducer(
  state: InfiltrationState,
  action: InfiltrationAction,
): InfiltrationState {
  if (state.outcome !== 'playing') return state
  switch (action.type) {
    case 'WALKED':
      return {
        ...state,
        player: {
          ...state.player,
          position: action.position,
          spaceId: action.spaceId,
          moving: action.moving,
        },
      }
    case 'ZETSU':
      return {
        ...state,
        player: { ...state.player, nen: state.player.nen === 'zetsu' ? 'ten' : 'zetsu' },
      }
    case 'COPY':
      return copyDocument(state)
    case 'VERIFY':
      return state.documentCopied && state.player.spaceId === state.objectiveSpaceId
        ? { ...state, authorConfirmed: true }
        : state
    case 'DIVERT':
      return divert(state)
    case 'EXTRACT':
      return extract(state)
  }
}

function copyDocument(state: InfiltrationState): InfiltrationState {
  if (state.player.spaceId !== state.objectiveSpaceId || state.documentCopied) return state
  return {
    ...state,
    documentCopied: true,
    traces: [...state.traces, { kind: 'document', spaceId: state.objectiveSpaceId, strength: 35 }],
  }
}

function divert(state: InfiltrationState): InfiltrationState {
  if (!state.player.spaceId || state.diversion) return state
  return {
    ...state,
    diversion: { spaceId: state.player.spaceId, left: 18 },
    traces: [...state.traces, { kind: 'diversion', spaceId: state.player.spaceId, strength: 55 }],
  }
}

function extract(state: InfiltrationState): InfiltrationState {
  if (state.player.spaceId !== state.extractionSpaceId || !state.documentCopied) return state
  return { ...state, outcome: state.alert >= 100 ? 'identified' : 'escaped' }
}

export function addTrace(state: InfiltrationState, trace: Trace): InfiltrationState {
  return { ...state, traces: [...state.traces, trace] }
}
