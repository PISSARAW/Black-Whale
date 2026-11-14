import {
  resolveNenCategoryAction,
  type NenActionDefinition,
  type NenActionResolution,
} from '@black-whale/nen-engine/categories'
import type { NenCategory } from '@black-whale/domain'
import { evolveTourSimulation, type TourSimulationV1, type TrainableNenCategory } from './state'

export const TOUR_CATEGORY_ABILITIES = {
  'enhanced-effort': {
    id: 'enhanced-effort',
    abilityId: 'tour-pilot-enhanced-effort',
    category: 'enhancer',
    modulates: 'power',
    baseCost: 12,
    basePower: 100,
    baseRange: 1.5,
    requiresTargetKinds: ['door', 'object'],
  },
  'remote-pulse': {
    id: 'remote-pulse',
    abilityId: 'tour-pilot-remote-pulse',
    category: 'emitter',
    modulates: 'range',
    baseCost: 14,
    basePower: 25,
    baseRange: 12,
    requiresTargetKinds: ['device'],
  },
  'adhesive-link': {
    id: 'adhesive-link',
    abilityId: 'tour-pilot-adhesive-link',
    category: 'transmuter',
    modulates: 'duration',
    baseCost: 10,
    basePower: 55,
    baseRange: 4,
    baseDuration: 60,
    upkeep: 2,
    requiresTargetKinds: ['door', 'object'],
  },
  'specified-tool': {
    id: 'specified-tool',
    abilityId: 'tour-pilot-specified-tool',
    category: 'conjurer',
    modulates: 'cost',
    baseCost: 9,
    basePower: 45,
    baseRange: 1.5,
    baseDuration: 120,
    requiresTargetKinds: ['door', 'device'],
  },
  'marked-command': {
    id: 'marked-command',
    abilityId: 'tour-pilot-marked-command',
    category: 'manipulator',
    modulates: 'duration',
    baseCost: 16,
    basePower: 50,
    baseRange: 8,
    baseDuration: 30,
    upkeep: 3,
    requiresTargetKinds: ['object', 'device'],
    requiresPreparation: 'marked-target',
  },
  'conditional-trace-reading': {
    id: 'conditional-trace-reading',
    abilityId: 'tour-pilot-conditional-trace-reading',
    category: 'specialist',
    modulates: 'duration',
    baseCost: 18,
    basePower: 1,
    baseRange: 2,
    baseDuration: 20,
    requiresTargetKinds: ['trace'],
  },
} as const satisfies Record<string, NenActionDefinition>

export type TourCategoryActionId = keyof typeof TOUR_CATEGORY_ABILITIES

export const TOUR_CATEGORY_ACTION_IDS = Object.keys(
  TOUR_CATEGORY_ABILITIES,
) as TourCategoryActionId[]

export function configurePilotNenProfile(
  state: TourSimulationV1,
  affinity: NenCategory,
): TourSimulationV1 {
  return evolveTourSimulation(state, (draft) => {
    draft.player.nenProfile.naturalAffinity = affinity
    for (const category of Object.keys(draft.player.nenProfile.mastery) as TrainableNenCategory[])
      draft.player.nenProfile.mastery[category] = category === affinity ? 100 : 60
    draft.player.nenProfile.learnedAbilities = TOUR_CATEGORY_ACTION_IDS.map(
      (id) => TOUR_CATEGORY_ABILITIES[id].abilityId,
    )
  })
}

export function previewTourNenAction(
  state: TourSimulationV1,
  actionId: TourCategoryActionId,
  input: { targetId: string; distance: number },
): NenActionResolution {
  const action = TOUR_CATEGORY_ABILITIES[actionId]
  const target = state.nenEnvironment.targets[input.targetId]
  const trace = state.nenEnvironment.traces[input.targetId]
  const preparations = target?.markedBy === state.id ? ['marked-target'] : []
  return resolveNenCategoryAction(state.player.nenProfile, action, {
    aura: state.player.aura,
    inZetsu: state.player.nen.mode === 'zetsu',
    distance: input.distance,
    targetKind: target?.kind ?? (trace ? 'trace' : undefined),
    preparations,
  })
}

export function actionsForNenTarget(
  state: TourSimulationV1,
  targetId: string,
): TourCategoryActionId[] {
  const target = state.nenEnvironment.targets[targetId]
  const kind = target?.kind ?? (state.nenEnvironment.traces[targetId] ? 'trace' : null)
  if (!kind) return []
  return TOUR_CATEGORY_ACTION_IDS.filter((id) =>
    TOUR_CATEGORY_ABILITIES[id].requiresTargetKinds?.includes(kind as never),
  )
}
