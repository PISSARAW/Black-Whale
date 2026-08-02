import { hatsuById, type HatsuProfile } from '../nen/hatsuRegistry'
import type { InfiltrationState } from './state'
import { createTrace } from './traces'
import { deployScout, moveScout } from './hatsuSpatial'
import type { CoverRole } from './social/cover'
import type { Vec2 } from '../tour/types'

export type InfiltrationHatsuId = 'little-eye' | 'texture-surprise' | 'illumi-needle-people'
export type HatsuRole = 'scout' | 'forge' | 'disguise'
export type ForgerySurface = 'work-order' | 'door-sign' | 'register-copy'

export interface InfiltrationHatsu {
  id: InfiltrationHatsuId
  name: string
  actionId: string
  cost: number
  uses: number
  role: HatsuRole
  rule: string
}

export interface HatsuPlan {
  available: boolean
  conditions: { id: 'ten' | 'conscious' | 'aura' | 'uses' | 'uninterrupted'; met: boolean }[]
  projected: ('knowledge' | 'perception-mask' | 'aura-trace')[]
}

export const INFILTRATION_HATSU: InfiltrationHatsu[] = [
  fromProfile(hatsuById('little-eye')!, { actionId: 'film', cost: 18, uses: 2, role: 'scout' }),
  fromProfile(hatsuById('texture-surprise')!, {
    actionId: 'forge-document',
    cost: 22,
    uses: 1,
    role: 'forge',
  }),
  fromProfile(hatsuById('illumi-needle-people')!, {
    actionId: 'reshape',
    cost: 35,
    uses: 1,
    role: 'disguise',
  }),
]

function fromProfile(
  profile: HatsuProfile,
  config: Omit<InfiltrationHatsu, 'id' | 'name' | 'rule'>,
): InfiltrationHatsu {
  return {
    id: profile.id as InfiltrationHatsuId,
    name: profile.name,
    rule: profile.rule,
    ...config,
  }
}

export function selectHatsu(state: InfiltrationState, id: InfiltrationHatsuId) {
  const ability = INFILTRATION_HATSU.find((entry) => entry.id === id)
  if (!ability || state.clock > 0) return state
  return {
    ...state,
    hatsu: {
      id,
      aura: 100,
      uses: ability.uses,
      activeUntil: 0,
      forgedOrder: false,
      scouted: false,
      scout: null,
      forgerySurface: state.hatsu.forgerySurface,
      disguiseIdentity: state.hatsu.disguiseIdentity,
    },
  }
}

export function castHatsu(state: InfiltrationState): InfiltrationState {
  const ability = INFILTRATION_HATSU.find((entry) => entry.id === state.hatsu.id)
  if (!ability || !planHatsu(state).available) return state
  const hatsu = {
    ...state.hatsu,
    aura: state.hatsu.aura - ability.cost,
    uses: state.hatsu.uses - 1,
  }
  if (ability.role === 'scout') {
    if (!state.player.spaceId) return state
    return { ...state, hatsu: { ...hatsu, scouted: true, scout: deployScout(state.player.position, state.player.spaceId) } }
  }
  if (ability.role === 'forge') {
    const cover = state.hatsu.forgerySurface === 'door-sign'
      ? { ...state.cover, allowedSpaces: [...new Set([...state.cover.allowedSpaces, state.objectiveSpaceId])] }
      : state.hatsu.forgerySurface === 'register-copy'
        ? { ...state.cover, evidence: [...new Set([...state.cover.evidence, 'schedule' as const])] }
        : state.cover
    return {
      ...state,
      cover,
      hatsu: { ...hatsu, forgedOrder: true },
      traces: [
        ...state.traces,
        createTrace({ kind: 'forgery', spaceId: state.player.spaceId ?? state.extractionSpaceId, position: state.player.position, at: state.clock, strength: 28, duration: 300, allegedAuthor: 'maintenance' }),
      ],
    }
  }
  return {
    ...state,
    hatsu: { ...hatsu, activeUntil: state.clock + 75 },
    traces: [
      ...state.traces,
      createTrace({ kind: 'aura', spaceId: state.player.spaceId ?? state.extractionSpaceId, position: state.player.position, at: state.clock, strength: 38, duration: 90 }),
    ],
  }
}

export function configureHatsu(state: InfiltrationState, config: { forgerySurface?: ForgerySurface; disguiseIdentity?: CoverRole }): InfiltrationState {
  if (state.clock > 0) return state
  return { ...state, hatsu: { ...state.hatsu, forgerySurface: config.forgerySurface ?? state.hatsu.forgerySurface, disguiseIdentity: config.disguiseIdentity ?? state.hatsu.disguiseIdentity } }
}

export function moveLittleEye(state: InfiltrationState, position: Vec2, spaceId: string, visibleToGuard: boolean): InfiltrationState {
  if (state.hatsu.id !== 'little-eye' || !state.hatsu.scout?.active) return state
  const scout = moveScout(state.hatsu.scout, position, spaceId, visibleToGuard)
  return {
    ...state,
    authorConfirmed: state.authorConfirmed || spaceId === state.objectiveSpaceId,
    hatsu: { ...state.hatsu, scout },
    traces: visibleToGuard
      ? [...state.traces, createTrace({ kind: 'aura', spaceId, position, at: state.clock, strength: 18, duration: 35, allegedAuthor: 'unknown-scout' })]
      : state.traces,
  }
}

export function recallLittleEye(state: InfiltrationState): InfiltrationState {
  if (!state.hatsu.scout) return state
  return { ...state, hatsu: { ...state.hatsu, scout: null, scouted: false } }
}

export function planHatsu(state: InfiltrationState): HatsuPlan {
  const ability = INFILTRATION_HATSU.find((entry) => entry.id === state.hatsu.id)!
  const conditions: HatsuPlan['conditions'] = [
    { id: 'ten', met: state.player.nen === 'ten' },
    { id: 'conscious', met: state.outcome === 'playing' },
    { id: 'aura', met: state.hatsu.aura >= ability.cost },
    { id: 'uses', met: state.hatsu.uses > 0 },
    { id: 'uninterrupted', met: state.challenge === null },
  ]
  const projected: HatsuPlan['projected'] =
    ability.role === 'scout'
      ? ['knowledge']
      : ability.role === 'forge'
        ? ['perception-mask']
        : ['perception-mask', 'aura-trace']
  return { available: conditions.every((condition) => condition.met), conditions, projected }
}

export function activeDisguise(state: InfiltrationState): boolean {
  return state.hatsu.id === 'illumi-needle-people' && state.hatsu.activeUntil > state.clock
}
