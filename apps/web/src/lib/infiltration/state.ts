import type { Vec2 } from '../tour/types'
import type { NenState } from '../hunt/nen/states'
import { castHatsu, configureHatsu, moveLittleEye, recallLittleEye, selectHatsu, type ForgerySurface, type InfiltrationHatsuId } from './hatsu'
import type { CoverRole } from './social/cover'
import type { LittleEyeScout } from './hatsuSpatial'
import { selectMission } from './missions/definitions'
import {
  initialObjectives,
  objectivesPermitExtraction,
  setObjective,
} from './missions/objectives'
import type { MissionId, MissionObjective, MissionSelection } from './missions/types'
import { createTrace } from './traces'
import { emptyMemory, type ActorMemory } from './actors/memory'
import type { CoverProfile } from './social/cover'
import { securityPolicy, type SecurityPolicy } from './security'

export type WitnessId = 'steward' | 'guard' | 'nenGuard'
export type MissionOutcome = 'playing' | 'escaped' | 'identified' | 'timeUp'
export type TraceKind = 'door' | 'document' | 'diversion' | 'aura' | 'forgery'

export interface Belief {
  identity: 'maintenance' | 'intruder' | 'unknown'
  certainty: number
  lastSpaceId: string | null
  reported: boolean
}

export interface Witness {
  id: WitnessId
  position: Vec2
  heading: number
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
  id?: string
  kind: TraceKind
  spaceId: string
  position?: Vec2
  at?: number
  expiresAt?: number
  allegedAuthor?: string
  strength: number
  discoveredBy?: WitnessId[]
}

export interface CoverClaim {
  witnessId: WitnessId
  answer: 'workOrder' | 'bluff'
  at: number
}

export interface MissionMetrics {
  distance: number
  maxAlert: number
  challenges: number
  contradictions: number
  hatsuCasts: number
  tracesDiscovered: number
}

export interface InfiltrationState {
  clock: number
  outcome: MissionOutcome
  player: { position: Vec2; spaceId: string | null; nen: NenState; moving: boolean; speed: number }
  witnesses: Witness[]
  traces: Trace[]
  objectiveSpaceId: string
  extractionSpaceId: string
  documentCopied: boolean
  authorConfirmed: boolean
  diversion: { spaceId: string; left: number } | null
  coverIntegrity: number
  alert: number
  alertLevel: import('./alerts').AlertLevel
  challenge: Challenge | null
  reports: { witnessId: WitnessId; at: number; certainty: number }[]
  claims: CoverClaim[]
  verification: { witnessId: WitnessId; left: number } | null
  metrics: MissionMetrics
  mission: { id: MissionId; seed: number; variantId: string; duration: number }
  objectives: MissionObjective[]
  memories: Record<WitnessId, ActorMemory>
  cover: CoverProfile
  security: SecurityPolicy
  journal: MissionEvent[]
  hatsu: {
    id: InfiltrationHatsuId
    aura: number
    uses: number
    activeUntil: number
    forgedOrder: boolean
    scouted: boolean
    scout: LittleEyeScout | null
    forgerySurface: ForgerySurface
    disguiseIdentity: CoverRole
  }
}

export interface MissionSetup {
  playerAt: { position: Vec2; spaceId: string }
  objectiveSpaceId: string
  extractionSpaceId: string
  witnesses: Omit<Witness, 'belief' | 'routeIndex' | 'investigating' | 'challenged'>[]
  selection?: MissionSelection
}

export type InfiltrationAction =
  | { type: 'WALKED'; position: Vec2; spaceId: string | null; moving: boolean; speed?: number }
  | { type: 'ZETSU' }
  | { type: 'COPY' }
  | { type: 'VERIFY' }
  | { type: 'DIVERT' }
  | { type: 'ANSWER'; answer: 'workOrder' | 'bluff' }
  | { type: 'SELECT_HATSU'; id: InfiltrationHatsuId }
  | { type: 'CAST_HATSU' }
  | { type: 'CONFIGURE_HATSU'; forgerySurface?: ForgerySurface; disguiseIdentity?: CoverRole }
  | { type: 'SCOUT_MOVE'; position: Vec2; spaceId: string; visibleToGuard: boolean }
  | { type: 'SCOUT_RECALL' }
  | { type: 'EXTRACT' }

export interface MissionEvent {
  id: string
  at: number
  type: InfiltrationAction['type'] | 'ALERT_CHANGED'
  actor: 'player' | WitnessId | 'system'
  sourceId?: string
  payload?: string
}

const noBelief = (): Belief => ({
  identity: 'unknown',
  certainty: 0,
  lastSpaceId: null,
  reported: false,
})

export function initialInfiltrationState(setup: MissionSetup): InfiltrationState {
  const selection = setup.selection ?? selectMission('missing-report', 0x5eed)
  return {
    clock: 0,
    outcome: 'playing',
    player: { ...setup.playerAt, nen: 'ten', moving: false, speed: 0 },
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
    alertLevel: 'normal',
    challenge: null,
    reports: [],
    claims: [],
    verification: null,
    metrics: {
      distance: 0,
      maxAlert: 0,
      challenges: 0,
      contradictions: 0,
      hatsuCasts: 0,
      tracesDiscovered: 0,
    },
    mission: {
      id: selection.definition.id,
      seed: selection.seed,
      variantId: selection.variant.id,
      duration: selection.definition.duration,
    },
    objectives: initialObjectives(selection.definition.objectives),
    memories: { steward: emptyMemory(), guard: emptyMemory(), nenGuard: emptyMemory() },
    cover: {
      role: 'maintenance', superior: 'deck-operations', assignment: 'ventilation-inspection',
      allowedSpaces: [setup.playerAt.spaceId], evidence: ['work-order'],
      obligations: ['inspect-service-panel'],
    },
    security: securityPolicy('normal', setup.extractionSpaceId, []),
    journal: [],
    hatsu: {
      id: 'little-eye',
      aura: 100,
      uses: 2,
      activeUntil: 0,
      forgedOrder: false,
      scouted: false,
      scout: null,
      forgerySurface: 'work-order',
      disguiseIdentity: 'maintenance',
    },
  }
}

export function infiltrationReducer(
  state: InfiltrationState,
  action: InfiltrationAction,
): InfiltrationState {
  if (state.outcome !== 'playing') return state
  const reduced = reduceAction(state, action)
  if (reduced === state) return state
  return {
    ...reduced,
    journal: [...reduced.journal, { id: `action:${reduced.journal.length}:${state.clock.toFixed(3)}`, at: state.clock, type: action.type, actor: 'player' }],
  }
}

function reduceAction(state: InfiltrationState, action: InfiltrationAction): InfiltrationState {
  switch (action.type) {
    case 'WALKED':
      return {
        ...state,
        metrics: {
          ...state.metrics,
          distance:
            state.metrics.distance +
            Math.hypot(
              action.position[0] - state.player.position[0],
              action.position[1] - state.player.position[1],
            ),
        },
        player: {
          ...state.player,
          position: action.position,
          spaceId: action.spaceId,
          moving: action.moving,
          speed: action.speed ?? (action.moving ? 2.1 : 0),
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
      return verifyInformation(state)
    case 'DIVERT':
      return divert(state)
    case 'ANSWER':
      return answerChallenge(state, action.answer)
    case 'SELECT_HATSU':
      return selectHatsu(state, action.id)
    case 'CAST_HATSU':
      return useHatsu(state)
    case 'CONFIGURE_HATSU':
      return configureHatsu(state, action)
    case 'SCOUT_MOVE': {
      const moved = moveLittleEye(state, action.position, action.spaceId, action.visibleToGuard)
      return moved.authorConfirmed && !state.authorConfirmed
        ? { ...moved, objectives: completeObjective(moved.objectives, ['identify'], 'confirmed') }
        : moved
    }
    case 'SCOUT_RECALL':
      return recallLittleEye(state)
    case 'EXTRACT':
      return extract(state)
  }
}

function useHatsu(state: InfiltrationState): InfiltrationState {
  const cast = castHatsu(state)
  if (cast === state) return state
  return {
    ...cast,
    objectives:
      cast.authorConfirmed && !state.authorConfirmed
        ? completeObjective(cast.objectives, ['identify'], 'confirmed')
        : cast.objectives,
    metrics: { ...cast.metrics, hatsuCasts: cast.metrics.hatsuCasts + 1 },
  }
}

function answerChallenge(
  state: InfiltrationState,
  answer: 'workOrder' | 'bluff',
): InfiltrationState {
  if (!state.challenge) return state
  const prior = state.claims.at(-1)
  const contradiction = !!prior && prior.answer !== answer
  const documentSupport =
    state.hatsu.forgedOrder &&
    (state.hatsu.forgerySurface === 'work-order' || state.hatsu.forgerySurface === 'register-copy') &&
    answer === 'workOrder'
  const verification =
    documentSupport && state.hatsu.forgerySurface === 'work-order'
      ? { witnessId: state.challenge.witnessId, left: 15 }
      : state.verification
  const witnesses = state.witnesses.map((witness) => {
    if (witness.id !== state.challenge?.witnessId) return witness
    const correct =
      !contradiction &&
      (documentSupport
        ? true
        : answer === (witness.usesEn ? 'bluff' : 'workOrder'))
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
  return {
    ...state,
    witnesses,
    challenge: null,
    verification,
    claims: [...state.claims, { witnessId: state.challenge.witnessId, answer, at: state.clock }],
    metrics: {
      ...state.metrics,
      challenges: state.metrics.challenges + 1,
      contradictions: state.metrics.contradictions + (contradiction ? 1 : 0),
    },
  }
}

function copyDocument(state: InfiltrationState): InfiltrationState {
  if (state.player.spaceId !== state.objectiveSpaceId || state.documentCopied) return state
  return {
    ...state,
    documentCopied: true,
    objectives: completeObjective(state.objectives, ['copy', 'plant', 'follow'], 'believed'),
    traces: [...state.traces, createTrace({ kind: 'document', spaceId: state.objectiveSpaceId, position: state.player.position, at: state.clock, strength: 35, duration: 180, allegedAuthor: 'maintenance' })],
  }
}

function verifyInformation(state: InfiltrationState): InfiltrationState {
  if (!state.documentCopied || state.player.spaceId !== state.objectiveSpaceId) return state
  return {
    ...state,
    authorConfirmed: true,
    objectives: completeObjective(state.objectives, ['identify'], 'confirmed'),
  }
}

function completeObjective(
  objectives: MissionObjective[],
  kinds: MissionObjective['kind'][],
  result: MissionObjective['state'],
): MissionObjective[] {
  const objective = objectives.find((candidate) => kinds.includes(candidate.kind))
  return objective ? setObjective(objectives, objective.id, result) : objectives
}

function divert(state: InfiltrationState): InfiltrationState {
  if (!state.player.spaceId || state.diversion) return state
  return {
    ...state,
    diversion: { spaceId: state.player.spaceId, left: 18 },
    traces: [...state.traces, createTrace({ kind: 'diversion', spaceId: state.player.spaceId, position: state.player.position, at: state.clock, strength: 55, duration: 45 })],
  }
}

function extract(state: InfiltrationState): InfiltrationState {
  if (state.player.spaceId !== state.extractionSpaceId || !objectivesPermitExtraction(state.objectives)) {
    return state
  }
  return {
    ...state,
    objectives: completeObjective(state.objectives, ['extract'], 'confirmed'),
    outcome: 'escaped',
  }
}

export function addTrace(state: InfiltrationState, trace: Trace): InfiltrationState {
  return { ...state, traces: [...state.traces, trace] }
}
