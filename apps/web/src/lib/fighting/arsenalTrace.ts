import type { ArsenalCommand, ArsenalInvocation } from './retrospectiveTypes'
import type { FightSide, FightState } from './types'

declare module './types' {
  interface FightState {
    arsenalTrace?: { frame: number; side: FightSide; command: ArsenalCommand; rngBefore: number }
  }
}

/** Future replay records the actual command, including an AI roster draw, without reading inputs. */
export function traceArsenal(options: ArsenalInvocation, next: FightState): FightState {
  if (next === options.state) return next
  return {
    ...next,
    arsenalTrace: {
      frame: options.state.frame,
      side: options.side,
      command: { ...options.command },
      rngBefore: options.state.rng,
    },
  }
}
