import type { NenActionBlock, NenActionResolution } from '@black-whale/nen-engine/categories'
import {
  previewTourNenAction,
  TOUR_CATEGORY_ABILITIES,
  type TourCategoryActionId,
} from './categoryAbilities'
import { evolveTourSimulation, type TourSimulationV1 } from './state'

export interface TourNenExecution {
  state: TourSimulationV1
  accepted: boolean
  reason?: NenActionBlock
  preview: NenActionResolution
  consequences: string[]
}

export function prepareNenTarget(state: TourSimulationV1, targetId: string): TourSimulationV1 {
  const target = state.nenEnvironment.targets[targetId]
  if (!target || !['object', 'device'].includes(target.kind) || state.player.aura < 2) return state
  return evolveTourSimulation(state, (draft) => {
    draft.player.aura -= 2
    draft.nenEnvironment.targets[targetId].markedBy = draft.id
  })
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

    if (actionId === 'enhanced-effort' && target) {
      if (preview.power >= target.resistance) {
        if (target.kind === 'door') target.locked = false
        if (target.kind === 'object') target.movable = true
        target.damaged = true
        consequences.push('physical-target-forced')
      }
      draft.incidents.push(`nen-noise:${target.spaceId}:${target.id}`)
      consequences.push('noise', 'damage-risk')
    }

    if (actionId === 'remote-pulse' && target?.kind === 'device') {
      target.powered = !target.powered
      const door = draft.nenEnvironment.targets['pilot-service-door']
      if (door) door.locked = false
      consequences.push('device-triggered-at-distance')
    }

    if (actionId === 'adhesive-link' && target) consequences.push('target-held-by-aura')

    if (actionId === 'specified-tool' && target) {
      if (target.kind === 'door') target.locked = false
      consequences.push('specialized-tool-used')
    }

    if (actionId === 'marked-command' && target) {
      if (target.kind === 'device') {
        const door = draft.nenEnvironment.targets['pilot-service-door']
        if (door) door.locked = false
      }
      if (target.kind === 'object') target.movable = true
      consequences.push('marked-target-commanded')
    }

    if (actionId === 'conditional-trace-reading' && trace) {
      const reading = `trace-reading:${trace.ownerId}:${trace.sourceActionId}`
      if (!draft.player.knowledge.includes(reading)) draft.player.knowledge.push(reading)
      if (!trace.detectedBy.includes(draft.id)) trace.detectedBy.push(draft.id)
      consequences.push('limited-trace-information')
    }

    if (preview.upkeep > 0) {
      draft.player.nenProfile.maintainedEffects.push({
        abilityId: action.abilityId,
        targetId: input.targetId,
        upkeep: preview.upkeep,
        startedAt: draft.clock,
      })
      consequences.push('aura-upkeep-engaged')
    }

    if (actionId !== 'conditional-trace-reading') {
      const traceId = `trace:${draft.revision + 1}:${actionId}:${input.targetId}`
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

    for (const witnessId of input.witnessIds ?? []) {
      draft.witnessKnowledge[witnessId] ??= []
      const fact = `saw:${actionId}:${input.targetId}`
      if (!draft.witnessKnowledge[witnessId].includes(fact))
        draft.witnessKnowledge[witnessId].push(fact)
      if (!draft.witnesses.includes(witnessId)) draft.witnesses.push(witnessId)
    }
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
