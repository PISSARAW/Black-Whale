import { physicalBodyAt } from './fightBodyIdentity'
import type { HalkenburgSoulExchange } from './halkenburgSoulTypes'
import type { FightSide, FightState, ArcadeFighter } from './types'

export interface HalkenburgMindContext {
  host: FightSide
  role: 'initiator' | 'victim'
  soul: HalkenburgSoulExchange
}
export function halkenburgMindContext(
  state: FightState,
  side: FightSide,
  id: string,
): HalkenburgMindContext | undefined {
  for (const host of ['player', 'opponent'] as const) {
    const soul = state[host].halkenburgSoul
    if (!soul || soul.id !== id) continue
    if (soul.owner === side) return { host, role: 'initiator', soul }
    if (soul.target.owner === side) return { host, role: 'victim', soul }
  }
  return undefined
}
export function halkenburgMindAwake(context: HalkenburgMindContext): boolean {
  const soul = context.soul
  return context.role === 'initiator'
    ? soul.initiatorAwake !== false
    : soul.initiatorAwake === false && soul.victimAwake === true
}
export function halkenburgMindBody(state: FightState, context: HalkenburgMindContext) {
  if (context.role === 'initiator') return state[context.host]
  const donor = context.soul.donor
  if (!donor) return undefined
  return donor.kind === 'fighter'
    ? physicalBodyAt(state, donor.owner, donor.member)
    : state.battlefield?.entities.find((entry) => entry.id === donor.id)
}
export function halkenburgMindCanWake(state: FightState, context: HalkenburgMindContext): boolean {
  const body = halkenburgMindBody(state, context)
  if (!body) return context.role === 'victim' && context.soul.victimWakeReady === true
  return !halkenburgBodySleep(body)
}
type SleepBody = Pick<
  ArcadeFighter,
  'health' | 'arsenalSleep' | 'kurapika' | 'dolphinLoan' | 'halkenburgSleeping'
> & { sleepingFrames?: number }
export function halkenburgBodySleep(body?: SleepBody): boolean {
  if (!body) return true
  return (
    body.health <= 0 ||
    Boolean(
      body.arsenalSleep || body.kurapika?.blackoutFrames || body.dolphinLoan?.blackoutFrames,
    ) ||
    foreignSupporterSleep(body)
  )
}
function foreignSupporterSleep(body: SleepBody): boolean {
  const frames = body.sleepingFrames ?? 0
  return frames > 1 || (frames > 0 && !body.halkenburgSleeping)
}
