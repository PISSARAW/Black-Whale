import type { NenActionBlock, NenActionResolution } from '@black-whale/nen-engine/categories'
import {
  previewTourNenAction,
  TOUR_CATEGORY_ABILITIES,
  type TourCategoryActionId,
} from './categoryAbilities'
import type { PersistentNenTrace, TourNenTarget } from './nenEnvironment'
import { evolveTourSimulation, type TourSimulationV1 } from './state'

export interface TourNenExecution {
  state: TourSimulationV1
  accepted: boolean
  reason?: NenActionBlock
  preview: NenActionResolution
  consequences: string[]
}

interface ExecutionContext {
  draft: TourSimulationV1
  actionId: TourCategoryActionId
  targetId: string
  target?: TourNenTarget
  trace?: PersistentNenTrace
  preview: NenActionResolution
  consequences: string[]
  witnessIds: readonly string[]
  abilityId: string
}

export function prepareNenTarget(state: TourSimulationV1, targetId: string): TourSimulationV1 {
  const target = state.nenEnvironment.targets[targetId]
  if (!target || !['object', 'device'].includes(target.kind) || state.player.aura < 2) return state
  return evolveTourSimulation(state, (draft) => {
    draft.player.aura -= 2
    draft.nenEnvironment.targets[targetId].markedBy = draft.id
  })
}

function applyEnhancedEffort({ draft, target, preview, consequences }: ExecutionContext) {
  if (!target) return
  if (preview.power >= target.resistance) {
    if (target.kind === 'door') target.locked = false
    if (target.kind === 'object') target.movable = true
    target.damaged = true
    consequences.push('physical-target-forced')
  }
  draft.incidents.push(`nen-noise:${target.spaceId}:${target.id}`)
  consequences.push('noise', 'damage-risk')
}

function applyRemotePulse(
  draft: TourSimulationV1,
  target: TourNenTarget | undefined,
  consequences: string[],
) {
  if (target?.kind !== 'device') return
  target.powered = !target.powered
  const door = draft.nenEnvironment.targets['pilot-service-door']
  if (door) door.locked = false
  consequences.push('device-triggered-at-distance')
}

function applySpecifiedTool(target: TourNenTarget | undefined, consequences: string[]) {
  if (!target) return
  if (target.kind === 'door') target.locked = false
  consequences.push('specialized-tool-used')
}

function applyMarkedCommand(
  draft: TourSimulationV1,
  target: TourNenTarget | undefined,
  consequences: string[],
) {
  if (!target) return
  const door = draft.nenEnvironment.targets['pilot-service-door']
  if (target.kind === 'device' && door) door.locked = false
  if (target.kind === 'object') target.movable = true
  consequences.push('marked-target-commanded')
}

function applyTraceReading(
  draft: TourSimulationV1,
  trace: PersistentNenTrace | undefined,
  consequences: string[],
) {
  if (!trace) return
  const reading = `trace-reading:${trace.ownerId}:${trace.sourceActionId}`
  if (!draft.player.knowledge.includes(reading)) draft.player.knowledge.push(reading)
  if (!trace.detectedBy.includes(draft.id)) trace.detectedBy.push(draft.id)
  consequences.push('limited-trace-information')
}

function applyWorldEffect(execution: ExecutionContext) {
  const { draft, actionId, target, trace, consequences } = execution
  if (actionId === 'enhanced-effort') applyEnhancedEffort(execution)
  if (actionId === 'remote-pulse') applyRemotePulse(draft, target, consequences)
  if (actionId === 'adhesive-link' && target) consequences.push('target-held-by-aura')
  if (actionId === 'specified-tool') applySpecifiedTool(target, consequences)
  if (actionId === 'marked-command') applyMarkedCommand(draft, target, consequences)
  if (actionId === 'conditional-trace-reading') applyTraceReading(draft, trace, consequences)
}

function engageMaintenance(execution: ExecutionContext) {
  const { draft, abilityId, targetId, preview, consequences } = execution
  if (preview.upkeep <= 0) return
  draft.player.nenProfile.maintainedEffects.push({
    abilityId,
    targetId,
    upkeep: preview.upkeep,
    startedAt: draft.clock,
  })
  consequences.push('aura-upkeep-engaged')
}

function leaveNenTrace(execution: ExecutionContext) {
  const { draft, actionId, targetId, target, preview, consequences } = execution
  if (actionId === 'conditional-trace-reading') return
  const traceId = `trace:${draft.revision + 1}:${actionId}:${targetId}`
  draft.nenEnvironment.traces[traceId] = {
    id: traceId,
    spaceId: target?.spaceId ?? draft.player.spaceId,
    sourceActionId: actionId,
    ownerId: draft.id,
    hiddenWithIn: draft.player.nen.in,
    createdAt: draft.clock,
    expiresAt: preview.duration ? draft.clock + preview.duration : null,
    detectedBy: [],
  }
  consequences.push('nen-trace-left')
}

function recordWitnesses({ draft, witnessIds, actionId, targetId }: ExecutionContext) {
  for (const witnessId of witnessIds) {
    draft.witnessKnowledge[witnessId] ??= []
    const fact = `saw:${actionId}:${targetId}`
    if (!draft.witnessKnowledge[witnessId].includes(fact))
      draft.witnessKnowledge[witnessId].push(fact)
    if (!draft.witnesses.includes(witnessId)) draft.witnesses.push(witnessId)
  }
}

export function executeTourNenAction(
  state: TourSimulationV1,
  actionId: TourCategoryActionId,
  input: { targetId: string; distance: number; witnessIds?: string[] },
): TourNenExecution {
  const preview = previewTourNenAction(state, actionId, input)
  if (!preview.accepted)
    return { state, accepted: false, reason: preview.reason, preview, consequences: [] }

  const action = TOUR_CATEGORY_ABILITIES[actionId]
  const consequences: string[] = []
  const next = evolveTourSimulation(state, (draft) => {
    draft.player.aura -= preview.cost
    const target = draft.nenEnvironment.targets[input.targetId]
    const trace = draft.nenEnvironment.traces[input.targetId]
    const execution: ExecutionContext = {
      draft,
      actionId,
      targetId: input.targetId,
      target,
      trace,
      preview,
      consequences,
      witnessIds: input.witnessIds ?? [],
      abilityId: action.abilityId,
    }
    applyWorldEffect(execution)
    engageMaintenance(execution)
    leaveNenTrace(execution)
    recordWitnesses(execution)
  })

  return { state: next, accepted: true, preview, consequences }
}

/** Charge one upkeep unit per elapsed simulation minute and releases unpaid effects. */
export function advanceNenMaintenance(
  state: TourSimulationV1,
  elapsedMinutes: number,
): TourSimulationV1 {
  if (elapsedMinutes <= 0 || !state.player.nenProfile.maintainedEffects.length) return state
  return evolveTourSimulation(state, (draft) => {
    const kept = []
    for (const effect of draft.player.nenProfile.maintainedEffects) {
      const cost = effect.upkeep * elapsedMinutes
      if (draft.player.aura < cost) continue
      draft.player.aura -= cost
      kept.push(effect)
    }
    draft.player.nenProfile.maintainedEffects = kept
  })
}
