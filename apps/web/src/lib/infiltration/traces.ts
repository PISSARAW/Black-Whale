import type { Vec2 } from '../tour/types'
import type { Trace, TraceKind } from './state'

export function createTrace(input: { kind: TraceKind; spaceId: string; position: Vec2; at: number; strength: number; duration: number; allegedAuthor?: string }): Trace {
  return { ...input, id: `${input.kind}:${input.spaceId}:${input.at.toFixed(3)}`, expiresAt: input.at + input.duration, discoveredBy: [] }
}

export function activeTraces(traces: Trace[], at: number): Trace[] {
  return traces.filter((trace) => trace.expiresAt === undefined || trace.expiresAt > at)
}
