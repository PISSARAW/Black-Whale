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

function gyoObservations(action: NenTechniqueAction<string>, context: TourNenContext): string[] {
  if (action.type !== 'GYO' || !action.on) return []
  return (context.traces ?? []).map(({ id }) => `aura-trace:${id}`)
}

function enObservations(action: NenTechniqueAction<string>, context: TourNenContext): string[] {
  if (action.type !== 'EN' || action.radius === null) return []
  return (context.presences ?? [])
    .filter(({ distance }) => distance <= action.radius!)
    .map(({ id }) => `presence:${id}:unidentified`)
}

function zetsuObservations(action: NenTechniqueAction<string>, context: TourNenContext): string[] {
  if (action.type !== 'ZETSU') return []
  return (context.presences ?? [])
    .filter(({ physicallyVisible }) => physicallyVisible)
    .map(({ id }) => `visible-body:${id}`)
}

function observationsFor(action: NenTechniqueAction<string>, context: TourNenContext): string[] {
  return [
    ...gyoObservations(action, context),
    ...enObservations(action, context),
    ...zetsuObservations(action, context),
  ]
}

function rememberObservations(state: TourSimulationV1, observations: readonly string[]): void {
  for (const observation of observations)
    if (!state.player.knowledge.includes(observation)) state.player.knowledge.push(observation)
}

function pressureRises(applied: AppliedNenTransition): boolean {
  const pressure =
    applied.action.type === 'REN' || (applied.action.type === 'ON' && applied.action.on)
  return pressure && Boolean(applied.pressureRising)
}

function visibleWitnesses(
  context: TourNenContext,
  nen: NenTechniqueState<string>,
): TourNenWitness[] {
  return (context.witnesses ?? []).filter((witness) => !nen.in || witness.detectsConcealedVisitor)
}

function applyWitnessReputation(
  state: TourSimulationV1,
  witnesses: readonly TourNenWitness[],
): TourSimulationV1 {
  const byFaction = new Map<string, TourNenWitness[]>()
  for (const witness of witnesses)
    byFaction.set(witness.factionId, [...(byFaction.get(witness.factionId) ?? []), witness])
  let next = state
  for (const [factionId, factionWitnesses] of byFaction)
    next = resolveSocialAction(next, {
      kind: 'INTIMIDATE',
      factionId,
      witnessIds: factionWitnesses.map((witness) => witness.id),
    })
  return next
}

function scheduleWitnessEvents(
  state: TourSimulationV1,
  witnesses: readonly TourNenWitness[],
): { state: TourSimulationV1; scheduled: TourNenResolution['scheduled'] } {
  let next = state
  const scheduled: TourNenResolution['scheduled'] = []
  for (const witness of witnesses) {
    const incident = `hostile-nen:${witness.spaceId}`
    if (next.incidents.includes(incident)) continue
    next = evolveTourSimulation(next, (draft) => draft.incidents.push(incident))
    const kind = witness.highSecurity ? 'SECURITY_SWEEP' : 'RUMOR_SPREAD'
    next = scheduleWorldEvent(next, {
      id: incident,
      kind,
      dueAt: next.clock + (kind === 'SECURITY_SWEEP' ? 10 : 30),
      spaceId: witness.spaceId,
      requiresIncident: incident,
    })
    scheduled.push(kind)
  }
  return { state: next, scheduled }
}

/** Project a transition already accepted and paid for by TourHatsuSession. */
export function useSystemicNen(
  state: TourSimulationV1,
  applied: AppliedNenTransition,
  context: TourNenContext = {},
): TourNenResolution {
  const { action, nen, reserve } = applied
  const observations = observationsFor(action, context)

  const next = evolveTourSimulation(state, (draft) => {
    draft.player.nen = nen
    draft.player.aura = reserve
    rememberObservations(draft, observations)
  })
  if (!pressureRises(applied)) return { state: next, accepted: true, observations, scheduled: [] }

  const witnesses = visibleWitnesses(context, nen)
  const projected = applyWitnessReputation(next, witnesses)
  const scheduled = scheduleWitnessEvents(projected, witnesses)
  return { state: scheduled.state, accepted: true, observations, scheduled: scheduled.scheduled }
}
