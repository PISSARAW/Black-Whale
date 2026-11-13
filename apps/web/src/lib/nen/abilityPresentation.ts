import type {
  AbilityActionPlan,
  AbilityPresentationProjection,
  NenActionWheelEntry,
} from '@black-whale/nen-engine'
import { ABILITY_PRESENTATIONS } from './abilityPresentations.gen'

export const ABILITY_PRESENTATION_BY_ID = new Map(
  ABILITY_PRESENTATIONS.map((presentation) => [presentation.abilityId, presentation]),
)

export function presentationFor(abilityId: string | null | undefined) {
  return abilityId ? (ABILITY_PRESENTATION_BY_ID.get(abilityId) ?? null) : null
}

export interface AbilityViewModel {
  abilityId: string
  name: string
  owner: string
  componentKey: string
  action: NenActionWheelEntry
  plan: AbilityActionPlan
  effects: AbilityActionPlan['projectedEffects']
  targets: string[]
  metrics: Record<string, string | number | boolean | null>
  reducedMotion: boolean
  preview: boolean
}

export interface AbilitySurfaceAdapter {
  modelFor(presentation: AbilityPresentationProjection, actionId: string): AbilityViewModel | null
  dispatch(actionId: string): void | Promise<void>
  availability?(actionId: string): AbilitySurfaceActionAvailability
  /** Whether this media has a real reducer path for the action, even if it is temporarily blocked. */
  supports?(actionId: string): boolean
}

export interface AbilitySurfaceActionAvailability {
  executable: boolean
  reason?: string
}

export interface AbilitySurfaceSnapshot {
  effects?: AbilityActionPlan['projectedEffects']
  targets?: string[]
  metrics?: Record<string, string | number | boolean | null>
}

export function previewViewModel(options: {
  presentation: AbilityPresentationProjection
  actionId?: string | null
  name: string
  owner: string
  reducedMotion?: boolean
}): AbilityViewModel | null {
  const visible = options.presentation.actions.filter(({ entry }) => entry.visibility !== 'hidden')
  const selected =
    visible.find(({ entry }) => entry.id === options.actionId) ??
    visible.find(({ entry }) => entry.visibility === 'available') ??
    visible[0]
  if (!selected) return null
  return {
    abilityId: options.presentation.abilityId,
    name: options.name,
    owner: options.owner,
    componentKey: options.presentation.componentKey,
    action: selected.entry,
    plan: selected.plan,
    effects: selected.plan.projectedEffects,
    targets: selected.plan.targetSchema.allowedTargets,
    metrics: {
      actions: visible.length,
      conditions: selected.plan.conditions.length,
      effects: selected.plan.projectedEffects.length,
    },
    reducedMotion: options.reducedMotion ?? false,
    preview: true,
  }
}

/** Adapter for catalogue and global-site surfaces that have no world snapshot. */
export function previewSurfaceAdapter(options: {
  name: string
  owner: string
  reducedMotion?: boolean
  onDispatch?: (actionId: string) => void | Promise<void>
}): AbilitySurfaceAdapter {
  return {
    modelFor: (presentation, actionId) =>
      previewViewModel({
        presentation,
        actionId,
        name: options.name,
        owner: options.owner,
        reducedMotion: options.reducedMotion,
      }),
    dispatch: (actionId) => options.onDispatch?.(actionId),
  }
}

/** Adapter for a playable surface whose reducer and state already exist. */
export function liveSurfaceAdapter(options: {
  name: string
  owner: string
  reducedMotion?: boolean
  snapshot: (actionId: string) => AbilitySurfaceSnapshot
  dispatch: (actionId: string) => void | Promise<void>
  availability?: (actionId: string) => AbilitySurfaceActionAvailability
  supports?: (actionId: string) => boolean
}): AbilitySurfaceAdapter {
  return {
    modelFor(presentation, actionId) {
      const preview = previewViewModel({
        presentation,
        actionId,
        name: options.name,
        owner: options.owner,
        reducedMotion: options.reducedMotion,
      })
      if (!preview) return null
      const live = options.snapshot(actionId)
      return {
        ...preview,
        effects: live.effects ?? preview.effects,
        targets: live.targets ?? preview.targets,
        metrics: { ...preview.metrics, ...live.metrics },
        preview: false,
      }
    },
    dispatch: options.dispatch,
    availability: options.availability,
    supports: options.supports,
  }
}
