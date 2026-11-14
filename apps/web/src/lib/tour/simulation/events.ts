import { evolveTourSimulation, type TourSimulationV1 } from './state'

export type DynamicEventKind = 'SECURITY_SWEEP' | 'RUMOR_SPREAD' | 'MEDICAL_EMERGENCY'

export interface ScheduledWorldEvent {
  id: string
  kind: DynamicEventKind
  dueAt: number
  spaceId: string
  requiresIncident?: string
}

const keyOf = (id: string) => `dynamic-event:${id}`

export function scheduleWorldEvent(
  state: TourSimulationV1,
  event: ScheduledWorldEvent,
): TourSimulationV1 {
  return evolveTourSimulation(state, (draft) => {
    draft.activities[keyOf(event.id)] = {
      stage: 'SCHEDULED',
      status: 'ACTIVE',
      data: {
        kind: event.kind,
        dueAt: event.dueAt,
        spaceId: event.spaceId,
        requiresIncident: event.requiresIncident ?? '',
      },
    }
  })
}

export function advanceDynamicEvents(state: TourSimulationV1, dt: number): TourSimulationV1 {
  return evolveTourSimulation(state, (draft) => {
    draft.clock += Math.max(0, dt)
    for (const [key, event] of Object.entries(draft.activities)) {
      if (!key.startsWith('dynamic-event:') || event.status !== 'ACTIVE') continue
      if (Number(event.data.dueAt) > draft.clock) continue
      const requirement = String(event.data.requiresIncident)
      if (requirement && !draft.incidents.includes(requirement)) continue
      applyDynamicEvent(
        draft,
        String(event.data.kind) as DynamicEventKind,
        String(event.data.spaceId),
      )
      event.stage = 'OCCURRED'
      event.status = 'RESOLVED'
      event.data.occurredAt = draft.clock
    }
  })
}

function applyDynamicEvent(state: TourSimulationV1, kind: DynamicEventKind, spaceId: string): void {
  if (kind === 'SECURITY_SWEEP') {
    state.incidents.push(`security-sweep:${spaceId}`)
    for (const actor of Object.values(state.actors))
      if (actor.spaceId === spaceId) actor.objective = 'submit-to-security-check'
  }
  if (kind === 'RUMOR_SPREAD') {
    const rumor = `rumor:${spaceId}`
    if (!state.player.knowledge.includes(rumor)) state.player.knowledge.push(rumor)
  }
  if (kind === 'MEDICAL_EMERGENCY') {
    state.incidents.push(`medical-emergency:${spaceId}`)
    state.actors[`medic:${spaceId}`] = {
      spaceId,
      objective: 'stabilize-passenger',
      memory: [`emergency:${state.clock}`],
      nextDecisionAt: state.clock + 5,
    }
  }
}
