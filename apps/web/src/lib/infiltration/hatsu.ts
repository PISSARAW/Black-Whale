import { hatsuById, type HatsuProfile } from '../nen/hatsuRegistry'
import type { InfiltrationState } from './state'
import { createTrace } from './traces'

export type InfiltrationHatsuId = 'little-eye' | 'texture-surprise' | 'illumi-needle-people'
export type HatsuRole = 'scout' | 'forge' | 'disguise'

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
    return { ...state, hatsu: { ...hatsu, scouted: true }, authorConfirmed: true }
  }
  if (ability.role === 'forge') {
    return {
      ...state,
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
