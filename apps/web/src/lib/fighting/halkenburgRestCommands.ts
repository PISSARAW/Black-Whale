import { reconcileHalkenburgSouls } from './halkenburgSouls'
import {
  halkenburgMindContext,
  halkenburgMindAwake,
  halkenburgMindCanWake,
  type HalkenburgMindContext,
} from './halkenburgMindAccess'
import type { FightSide, FightState } from './types'
import type { ArsenalCommand, ArsenalOption } from './retrospectiveTypes'

export function performHalkenburgRest(
  state: FightState,
  side: FightSide,
  command: ArsenalCommand,
): FightState {
  if (command.action !== 'halkenburg-soul-rest' || !command.target) return state
  const [id, action] = command.target.split('|')
  if (action !== 'sleep' && action !== 'wake') return state
  const context = halkenburgMindContext(state, side, id)
  if (!context || !restActionReady(state, context, action)) return state
  const body = state[context.host]
  const soul = nextWakeState(context, action === 'wake')
  return reconcileHalkenburgSouls({ ...state, [context.host]: { ...body, halkenburgSoul: soul } })
}
function restActionReady(
  state: FightState,
  context: HalkenburgMindContext,
  action: 'sleep' | 'wake',
): boolean {
  const awake = halkenburgMindAwake(context)
  if (action === 'sleep') return awake
  if (awake || !halkenburgMindCanWake(state, context)) return false
  return context.role === 'initiator' || context.soul.initiatorAwake === false
}
function nextWakeState(context: HalkenburgMindContext, awake: boolean) {
  const soul = context.soul
  return context.role === 'initiator'
    ? {
        ...soul,
        initiatorAwake: awake,
        victimAwake: false,
        motion: 'stay' as const,
        victimMotion: 'stay' as const,
      }
    : { ...soul, victimAwake: awake, victimMotion: 'stay' as const }
}
export function halkenburgRestOptions(
  state: FightState,
  side: FightSide,
  context: HalkenburgMindContext,
): ArsenalOption[] {
  return (['sleep', 'wake'] as const).map((action) => {
    const command = {
      action: 'halkenburg-soul-rest' as const,
      target: `${context.soul.id}|${action}`,
    }
    const prefix =
      context.role === 'initiator'
        ? ['Conscience transférée', 'Transferred consciousness']
        : ['Conscience déplacée', 'Displaced consciousness']
    const label = action === 'sleep' ? ['Se reposer', 'Rest'] : ['Se réveiller', 'Wake up']
    return {
      command,
      ready: performHalkenburgRest(state, side, command) !== state,
      labelFr: `${prefix[0]} · ${label[0]}`,
      labelEn: `${prefix[1]} · ${label[1]}`,
      conditionFr:
        'Une seule conscience éveillée. L’initiateur a priorité ; un sommeil imposé reste appliqué au corps.',
      conditionEn:
        'Only one consciousness can be awake. The initiator has priority; imposed sleep still applies to its body.',
    }
  })
}
