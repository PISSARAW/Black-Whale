import { gyoSight } from './nenCombat/sight'
import { senseDeprived } from './saiyuSenses'
import type { FightSide, FightState } from './types'

export type WitnessEventKind = 'aggression' | 'concealed-nen'
export interface WitnessMemory {
  kind: WitnessEventKind
  actor: FightSide
  frame: number
  confidence: number
}
export interface FightWitness {
  id: string
  allegiance: FightSide | 'neutral'
  perception: 'sight' | 'gyo'
  credibility: number
  fear: number
  memories: readonly WitnessMemory[]
}
export interface SecurityAlert {
  level: number
  lastActor: FightSide
  lastFrame: number
  reason: WitnessEventKind
  witnesses: readonly string[]
}

declare module './types' {
  interface FightState {
    fightWitnesses?: readonly FightWitness[]
    securityAlert?: SecurityAlert
  }
}

export function registerFightWitness(state: FightState, witness: FightWitness): FightState {
  const current = state.fightWitnesses ?? []
  if (current.some(({ id }) => id === witness.id)) return state
  return { ...state, fightWitnesses: [...current, { ...witness, memories: [...witness.memories] }] }
}

/** Converts a real, visible aggression into witness memory and one shared security alert. */
function alertIncrease(witnesses: readonly FightWitness[], informed: readonly string[]): number {
  const credibility = witnesses
    .filter(({ id }) => informed.includes(id))
    .reduce((sum, witness) => sum + witness.credibility, 0)
  return credibility >= 1.5 ? 2 : 1
}

export function advanceFightWitnesses(state: FightState): FightState {
  const witnesses = state.fightWitnesses
  if (!witnesses?.length || state.phase !== 'fighting') return state
  const event = witnessedEvent(state)
  if (!event || state.securityAlert?.lastFrame === state.frame) return state

  const informed: string[] = []
  const nextWitnesses = witnesses.map((witness) => {
    if (!canObserve(state, witness, { actor: event.actor, kind: event.kind })) return witness
    informed.push(witness.id)
    const confidence = Math.min(1, witness.credibility * (event.kind === 'concealed-nen' ? 0.8 : 1))
    return {
      ...witness,
      fear: Math.min(100, witness.fear + 5 + (state.securityAlert?.level ?? 0) * 2),
      memories: [...witness.memories, { ...event, confidence }].slice(-16),
    }
  })
  if (informed.length === 0) return state
  const increase = alertIncrease(nextWitnesses, informed)
  return {
    ...state,
    fightWitnesses: nextWitnesses,
    securityAlert: {
      level: Math.min(5, (state.securityAlert?.level ?? 0) + increase),
      lastActor: event.actor,
      lastFrame: state.frame,
      reason: event.kind,
      witnesses: informed,
    },
  }
}

function witnessedEvent(
  state: FightState,
): (Omit<WitnessMemory, 'confidence'> & { kind: WitnessEventKind }) | null {
  for (const actor of ['player', 'opponent'] as const) {
    const attack = state[actor].attack
    if (attack?.frame !== 1) continue
    return {
      kind: attack.concealed || state[actor].nen.in ? 'concealed-nen' : 'aggression',
      actor,
      frame: state.frame,
    }
  }
  return null
}

function canObserve(
  state: FightState,
  witness: FightWitness,
  { actor, kind }: { actor: FightSide; kind: WitnessEventKind },
): boolean {
  const observerSide = witness.allegiance === 'neutral' ? otherSide(actor) : witness.allegiance
  const observer = state[observerSide]
  if (observer.health <= 0 || senseDeprived(observer, 'sight')) return false
  return kind !== 'concealed-nen' || witness.perception === 'gyo' || gyoSight(observer)
}

function otherSide(side: FightSide): FightSide {
  return side === 'player' ? 'opponent' : 'player'
}
