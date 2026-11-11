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
  return [...traces, { ...trace, position: [trace.position[0], trace.position[1]] as Vec2 }].slice(
    -MAX_HUNT_TRACES,
  )
}

export function traceStrength(trace: HuntTrace, now: number): number {
  const age = Math.max(0, now - trace.createdAt)
  const lifetime = trace.kind === 'aura' ? 90 : trace.kind === 'trap' ? 300 : 45
  return Math.max(0, trace.strength * (1 - age / lifetime))
}

export function liveTraces(traces: readonly HuntTrace[], now: number): HuntTrace[] {
  return traces.filter((trace) => traceStrength(trace, now) > 0)
}

/** Strongest residual clue Dowsing may follow; never a live entity position. */
export function dowsingTrace(
  traces: readonly HuntTrace[],
  options: { terrain: HuntTerrainId | null; now: number },
): HuntTrace | null {
  return (
    liveTraces(traces, options.now)
      .filter(
        (trace) =>
          trace.terrain === options.terrain &&
          (trace.actor === 'hunter' || trace.actor === 'unknown'),
      )
      .sort(
        (left, right) =>
          traceStrength(right, options.now) - traceStrength(left, options.now) ||
          right.createdAt - left.createdAt,
      )[0] ?? null
  )
}
