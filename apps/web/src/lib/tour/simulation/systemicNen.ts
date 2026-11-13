import type { NenTechniqueAction, NenTechniqueState } from '@black-whale/nen-engine'
import { scheduleWorldEvent } from './events'
import { resolveSocialAction } from './social'
import { evolveTourSimulation, type TourSimulationV1 } from './state'

export interface TourNenPresence {
  id: string
  distance: number
  physicallyVisible: boolean
  auraConcealed: boolean
}

export interface TourNenTrace {
  id: string
  hiddenWithIn: boolean
}

export interface TourNenWitness {
  id: string
  factionId: string
  spaceId: string
  detectsConcealedVisitor: boolean
  highSecurity?: boolean
}

export interface AppliedNenTransition {
  action: NenTechniqueAction<string>
  nen: NenTechniqueState<string>
  reserve: number
  pressureRising?: boolean
}

export interface TourNenContext {
  presences?: TourNenPresence[]
  traces?: TourNenTrace[]
  witnesses?: TourNenWitness[]
}

export interface TourNenResolution {
  state: TourSimulationV1
  accepted: true
  observations: string[]
  scheduled: Array<'RUMOR_SPREAD' | 'SECURITY_SWEEP'>
}

/** Project a transition already accepted and paid for by TourHatsuSession. */
export function useSystemicNen(
  state: TourSimulationV1,
  applied: AppliedNenTransition,
  context: TourNenContext = {},
): TourNenResolution {
  const { action, nen, reserve } = applied
  const observations: string[] = []

  if (action.type === 'GYO' && action.on)
    for (const trace of context.traces ?? []) observations.push(`aura-trace:${trace.id}`)

  if (action.type === 'EN' && action.radius !== null) {
    for (const presence of context.presences ?? []) {
      if (presence.distance > action.radius) continue
      // En establishes a presence, not an identity or exact intention.
      observations.push(`presence:${presence.id}:unidentified`)
    }
  }

  // Zetsu erases the aura signature, never the physically visible body.
  if (action.type === 'ZETSU')
    for (const presence of context.presences ?? [])
      if (presence.physicallyVisible) observations.push(`visible-body:${presence.id}`)

  const next = evolveTourSimulation(state, (draft) => {
    draft.player.nen = nen
    draft.player.aura = reserve
    for (const observation of observations)
      if (!draft.player.knowledge.includes(observation)) draft.player.knowledge.push(observation)
  })
  let projected = next
  const scheduled: TourNenResolution['scheduled'] = []
  const pressure = action.type === 'REN' || (action.type === 'ON' && action.on)
  if (pressure && applied.pressureRising) {
    const visible = (context.witnesses ?? []).filter(
      (witness) => !nen.in || witness.detectsConcealedVisitor,
    )
    const byFaction = new Map<string, TourNenWitness[]>()
    for (const witness of visible)
      byFaction.set(witness.factionId, [...(byFaction.get(witness.factionId) ?? []), witness])
    for (const [factionId, witnesses] of byFaction)
      projected = resolveSocialAction(projected, {
        kind: 'INTIMIDATE',
        factionId,
        witnessIds: witnesses.map((witness) => witness.id),
      })

    for (const witness of visible) {
      const incident = `hostile-nen:${witness.spaceId}`
      if (projected.incidents.includes(incident)) continue
      projected = evolveTourSimulation(projected, (draft) => draft.incidents.push(incident))
      const kind = witness.highSecurity ? 'SECURITY_SWEEP' : 'RUMOR_SPREAD'
      projected = scheduleWorldEvent(projected, {
        id: incident,
        kind,
        dueAt: projected.clock + (kind === 'SECURITY_SWEEP' ? 10 : 30),
        spaceId: witness.spaceId,
        requiresIncident: incident,
      })
      scheduled.push(kind)
    }
  }
  return { state: projected, accepted: true, observations, scheduled }
}
