import type { Vec2 } from '../tour/types'
import type { HuntTerrainId } from './arena'

export type HuntTraceKind = 'footstep' | 'aura' | 'trap'
export type HuntTraceActor = 'player' | 'hunter' | 'unknown'

export interface HuntTrace {
  kind: HuntTraceKind
  actor: HuntTraceActor
  terrain: HuntTerrainId | null
  spaceId: string
  position: Vec2
  createdAt: number
  strength: number
  falseTrail: boolean
}

export const MAX_HUNT_TRACES = 64

export function appendTrace(traces: readonly HuntTrace[], trace: HuntTrace): HuntTrace[] {
  return [...traces, { ...trace, position: [...trace.position] }].slice(-MAX_HUNT_TRACES)
}

export function traceStrength(trace: HuntTrace, now: number): number {
  const age = Math.max(0, now - trace.createdAt)
  const lifetime = trace.kind === 'aura' ? 90 : trace.kind === 'trap' ? 300 : 45
  return Math.max(0, trace.strength * (1 - age / lifetime))
}

export function liveTraces(traces: readonly HuntTrace[], now: number): HuntTrace[] {
  return traces.filter((trace) => traceStrength(trace, now) > 0)
}
