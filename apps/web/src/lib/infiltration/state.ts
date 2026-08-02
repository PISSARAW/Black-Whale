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
  route: string[]
  routeIndex: number
  investigating: string | null
  challenged: boolean
}

export interface Challenge {
  witnessId: WitnessId
  left: number
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
  challenge: Challenge | null
  reports: { witnessId: WitnessId; at: number; certainty: number }[]
}

export interface MissionSetup {
  playerAt: { position: Vec2; spaceId: string }
  objectiveSpaceId: string
  extractionSpaceId: string
  witnesses: Omit<Witness, 'belief' | 'routeIndex' | 'investigating' | 'challenged'>[]
}

export type InfiltrationAction =
  | { type: 'WALKED'; position: Vec2; spaceId: string | null; moving: boolean }
  | { type: 'ZETSU' }
  | { type: 'COPY' }
  | { type: 'VERIFY' }
  | { type: 'DIVERT' }
  | { type: 'ANSWER'; answer: 'workOrder' | 'bluff' }
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
    witnesses: setup.witnesses.map((witness) => ({
      ...witness,
      belief: noBelief(),
      routeIndex: 0,
      investigating: null,
      challenged: false,
    })),
    traces: [],
    objectiveSpaceId: setup.objectiveSpaceId,
    extractionSpaceId: setup.extractionSpaceId,
    documentCopied: false,
    authorConfirmed: false,
    diversion: null,
    coverIntegrity: 100,
    alert: 0,
    challenge: null,
    reports: [],
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
    case 'ANSWER':
      return answerChallenge(state, action.answer)
    case 'EXTRACT':
      return extract(state)
  }
}

function answerChallenge(
  state: InfiltrationState,
  answer: 'workOrder' | 'bluff',
): InfiltrationState {
  if (!state.challenge) return state
  const witnesses = state.witnesses.map((witness) => {
    if (witness.id !== state.challenge?.witnessId) return witness
    const correct = answer === (witness.usesEn ? 'bluff' : 'workOrder')
    return {
      ...witness,
      challenged: true,
      belief: {
        ...witness.belief,
        identity: correct ? ('maintenance' as const) : ('intruder' as const),
        certainty: correct
          ? Math.max(10, witness.belief.certainty - 30)
          : Math.min(100, witness.belief.certainty + 48),
      },
    }
  })
  return { ...state, witnesses, challenge: null }
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
