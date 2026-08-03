import { hatsuById, type HatsuProfile } from '../nen/hatsuRegistry'
import type { InfiltrationState } from './state'
import { createTrace } from './traces'
import { deployScout, moveScout, type ScoutMove } from './hatsuSpatial'
import type { CoverRole } from './social/cover'

export type InfiltrationHatsuId =
  | 'little-eye'
  | 'texture-surprise'
  | 'illumi-needle-people'
  | 'secret-window'
  | 'biohazard-hinrigh'
  | 'surveillance-paper-dolls'
  | 'bloody-mary'
  | 'body-and-soul'
  | 'dowsing-chain'
  | 'blinky'
  | 'bungee-gum'
  | 'skill-hunter'
  | 'stealth-dolphin'
export type HatsuRole =
  | 'scout'
  | 'forge'
  | 'disguise'
  | 'surveillance'
  | 'tracker'
  | 'interrogate'
  | 'analyse'
  | 'cleanup'
  | 'mobility'
  | 'theft'
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
  conditions: {
    id: 'ten' | 'conscious' | 'aura' | 'uses' | 'uninterrupted' | 'target'
    met: boolean
  }[]
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
  fromProfile(hatsuById('secret-window')!, {
    actionId: 'attach-owl',
    cost: 20,
    uses: 1,
    role: 'surveillance',
  }),
  fromProfile(hatsuById('biohazard-hinrigh')!, {
    actionId: 'animate-camera',
    cost: 24,
    uses: 2,
    role: 'scout',
  }),
  fromProfile(hatsuById('surveillance-paper-dolls')!, {
    actionId: 'paper-spy',
    cost: 12,
    uses: 3,
    role: 'surveillance',
  }),
  fromProfile(hatsuById('bloody-mary')!, {
    actionId: 'blood-search',
    cost: 16,
    uses: 2,
    role: 'tracker',
  }),
  fromProfile(hatsuById('body-and-soul')!, {
    actionId: 'truth-punch',
    cost: 28,
    uses: 1,
    role: 'interrogate',
  }),
  fromProfile(hatsuById('dowsing-chain')!, {
    actionId: 'dowsing',
    cost: 14,
    uses: 2,
    role: 'analyse',
  }),
  fromProfile(hatsuById('blinky')!, { actionId: 'vacuum', cost: 25, uses: 2, role: 'cleanup' }),
  fromProfile(hatsuById('bungee-gum')!, {
    actionId: 'attach',
    cost: 15,
    uses: 2,
    role: 'mobility',
  }),
  fromProfile(hatsuById('skill-hunter')!, { actionId: 'borrow', cost: 32, uses: 1, role: 'theft' }),
  fromProfile(hatsuById('stealth-dolphin')!, {
    actionId: 'loan',
    cost: 30,
    uses: 1,
    role: 'theft',
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
      effect: null,
      targetWitnessId: null,
      targetSpaceId: null,
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
    return {
      ...state,
      hatsu: {
        ...hatsu,
        scouted: true,
        scout: deployScout(state.player.position, state.player.spaceId),
      },
    }
  }
  if (ability.role === 'forge') {
    const cover =
      state.hatsu.forgerySurface === 'door-sign'
        ? {
            ...state.cover,
            allowedSpaces: [...new Set([...state.cover.allowedSpaces, state.objectiveSpaceId])],
          }
        : state.hatsu.forgerySurface === 'register-copy'
          ? {
              ...state.cover,
              evidence: [...new Set([...state.cover.evidence, 'schedule' as const])],
            }
          : state.cover
    return {
      ...state,
      cover,
      hatsu: {
        ...hatsu,
        forgedOrder: true,
        effect: {
          kind: 'forged-surface',
          spaceId: state.player.spaceId ?? state.extractionSpaceId,
          payload: state.hatsu.forgerySurface,
        },
      },
      traces: [
        ...state.traces,
        createTrace({
          kind: 'forgery',
          spaceId: state.player.spaceId ?? state.extractionSpaceId,
          position: state.player.position,
          at: state.clock,
          strength: 28,
          duration: 300,
          allegedAuthor: 'maintenance',
        }),
      ],
    }
  }
  const activeSpaceId = state.hatsu.targetSpaceId ?? state.player.spaceId ?? state.extractionSpaceId
  const nearest =
    state.witnesses.find((witness) => witness.id === state.hatsu.targetWitnessId) ??
    [...state.witnesses].sort(
      (a, b) =>
        Math.hypot(
          a.position[0] - state.player.position[0],
          a.position[1] - state.player.position[1],
        ) -
        Math.hypot(
          b.position[0] - state.player.position[0],
          b.position[1] - state.player.position[1],
        ),
    )[0]
  if (ability.id === 'secret-window')
    return {
      ...state,
      hatsu: {
        ...hatsu,
        effect: { kind: 'attached-owl', witnessId: nearest?.id, expiresAt: state.clock + 150 },
      },
    }
  if (ability.id === 'surveillance-paper-dolls')
    return {
      ...state,
      hatsu: {
        ...hatsu,
        effect: { kind: 'paper-network', spaceId: activeSpaceId, expiresAt: state.clock + 180 },
      },
      traces: [
        ...state.traces,
        createTrace({
          kind: 'forgery',
          spaceId: activeSpaceId,
          position: state.player.position,
          at: state.clock,
          strength: 12,
          duration: 180,
          allegedAuthor: 'paper-spy',
        }),
      ],
    }
  if (ability.id === 'bloody-mary')
    return {
      ...state,
      hatsu: {
        ...hatsu,
        effect: { kind: 'blood-tracker', witnessId: nearest?.id, expiresAt: state.clock + 120 },
      },
      traces: [
        ...state.traces,
        createTrace({
          kind: 'aura',
          spaceId: activeSpaceId,
          position: state.player.position,
          at: state.clock,
          strength: 16,
          duration: 75,
          allegedAuthor: 'blood-user',
        }),
      ],
    }
  if (ability.id === 'body-and-soul')
    return {
      ...state,
      authorConfirmed: true,
      coverIntegrity: Math.max(0, state.coverIntegrity - 35),
      alert: Math.min(100, state.alert + 28),
      hatsu: {
        ...hatsu,
        effect: {
          kind: 'forced-answer',
          witnessId: nearest?.id,
          payload: 'truth',
          expiresAt: state.clock + 2,
        },
      },
    }
  if (ability.id === 'dowsing-chain')
    return {
      ...state,
      authorConfirmed: true,
      hatsu: {
        ...hatsu,
        effect: {
          kind: 'dowsing-result',
          spaceId: state.objectiveSpaceId,
          payload: 'coherent',
          expiresAt: state.clock + 12,
        },
      },
    }
  if (ability.id === 'blinky') {
    const removable = state.traces.filter(
      (trace) => trace.spaceId === activeSpaceId && trace.kind !== 'aura',
    )
    return {
      ...state,
      traces: state.traces.filter((trace) => !removable.includes(trace)),
      hatsu: {
        ...hatsu,
        effect: {
          kind: 'cleaned',
          spaceId: activeSpaceId,
          payload: `${removable.length}`,
          expiresAt: state.clock + 2,
        },
      },
    }
  }
  if (ability.id === 'bungee-gum')
    return {
      ...state,
      hatsu: {
        ...hatsu,
        effect: { kind: 'gum-anchor', spaceId: activeSpaceId, expiresAt: state.clock + 90 },
      },
      diversion: { spaceId: activeSpaceId, left: 12 },
    }
  if (ability.id === 'skill-hunter' || ability.id === 'stealth-dolphin')
    return {
      ...state,
      authorConfirmed: true,
      hatsu: {
        ...hatsu,
        effect: {
          kind: ability.id === 'skill-hunter' ? 'borrowed-page' : 'loaned-ability',
          payload: 'dowsing-chain',
          expiresAt: state.clock + 15,
        },
      },
    }
  return {
    ...state,
    hatsu: {
      ...hatsu,
      activeUntil: state.clock + 75,
      effect: {
        kind: 'disguise-mask',
        spaceId: activeSpaceId,
        payload: state.hatsu.disguiseIdentity,
        expiresAt: state.clock + 75,
      },
    },
    traces: [
      ...state.traces,
      createTrace({
        kind: 'aura',
        spaceId: state.player.spaceId ?? state.extractionSpaceId,
        position: state.player.position,
        at: state.clock,
        strength: 38,
        duration: 90,
      }),
    ],
  }
}

export function configureHatsu(
  state: InfiltrationState,
  config: { forgerySurface?: ForgerySurface; disguiseIdentity?: CoverRole },
): InfiltrationState {
  if (state.clock > 0) return state
  return {
    ...state,
    hatsu: {
      ...state.hatsu,
      forgerySurface: config.forgerySurface ?? state.hatsu.forgerySurface,
      disguiseIdentity: config.disguiseIdentity ?? state.hatsu.disguiseIdentity,
    },
  }
}

export function moveLittleEye(state: InfiltrationState, move: ScoutMove): InfiltrationState {
  const { position, spaceId, visibleToGuard } = move
  if (
    (state.hatsu.id !== 'little-eye' && state.hatsu.id !== 'biohazard-hinrigh') ||
    !state.hatsu.scout?.active
  )
    return state
  const scout = moveScout(state.hatsu.scout, move)
  return {
    ...state,
    authorConfirmed: state.authorConfirmed || spaceId === state.objectiveSpaceId,
    hatsu: { ...state.hatsu, scout },
    traces: visibleToGuard
      ? [
          ...state.traces,
          createTrace({
            kind: 'aura',
            spaceId,
            position,
            at: state.clock,
            strength: 18,
            duration: 35,
            allegedAuthor: 'unknown-scout',
          }),
        ]
      : state.traces,
  }
}

export function recallLittleEye(state: InfiltrationState): InfiltrationState {
  if (!state.hatsu.scout) return state
  return { ...state, hatsu: { ...state.hatsu, scout: null, scouted: false } }
}

export function planHatsu(state: InfiltrationState): HatsuPlan {
  const ability = INFILTRATION_HATSU.find((entry) => entry.id === state.hatsu.id)!
  const needsWitness = ['secret-window', 'bloody-mary', 'body-and-soul'].includes(ability.id)
  const target = state.witnesses.find((witness) => witness.id === state.hatsu.targetWitnessId)
  const conditions: HatsuPlan['conditions'] = [
    { id: 'ten', met: state.player.nen === 'ten' },
    { id: 'conscious', met: state.outcome === 'playing' },
    { id: 'aura', met: state.hatsu.aura >= ability.cost },
    { id: 'uses', met: state.hatsu.uses > 0 },
    { id: 'uninterrupted', met: state.challenge === null },
    { id: 'target', met: !needsWitness || (!!target && target.spaceId === state.player.spaceId) },
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
