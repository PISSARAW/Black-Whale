import type { FightSide, FightState } from './types'
import type { ArsenalCommand, ArsenalOption } from './retrospectiveTypes'
import {
  halkenburgMindContext,
  halkenburgMindAwake,
  halkenburgMindCanWake,
} from './halkenburgMindAccess'
import { performHalkenburgRest, halkenburgRestOptions } from './halkenburgRestCommands'
import { reconcileHalkenburgSouls } from './halkenburgSouls'

const MOTIONS = ['left', 'right', 'stay'] as const

export function isHalkenburgSoulCommand(command: ArsenalCommand): boolean {
  return command.action === 'halkenburg-host-motion' || command.action === 'halkenburg-soul-rest'
}
export function performHalkenburgSoulCommand(
  state: FightState,
  side: FightSide,
  command: ArsenalCommand,
): FightState {
  return command.action === 'halkenburg-soul-rest'
    ? performHalkenburgRest(state, side, command)
    : performHalkenburgHostMotion(state, side, command)
}

export function performHalkenburgHostMotion(
  state: FightState,
  side: FightSide,
  command: ArsenalCommand,
): FightState {
  if (command.action !== 'halkenburg-host-motion' || !command.target) return state
  const [id, motion] = command.target.split('|')
  if (!MOTIONS.includes(motion as (typeof MOTIONS)[number])) return state
  const context = halkenburgMindContext(state, side, id)
  if (!context || !halkenburgMindAwake(context) || !halkenburgMindCanWake(state, context))
    return state
  const { host: target, soul } = context
  const body = state[target]
  const key = context.role === 'initiator' ? 'motion' : 'victimMotion'
  if ((soul[key] ?? 'stay') === motion) return state
  return reconcileHalkenburgSouls({
    ...state,
    [target]: {
      ...body,
      halkenburgSoul: { ...soul, [key]: motion as (typeof MOTIONS)[number] },
    },
  })
}

export function halkenburgHostOptions(state: FightState, side: FightSide): ArsenalOption[] {
  const options: ArsenalOption[] = []
  for (const target of ['player', 'opponent'] as const) {
    const soul = state[target].halkenburgSoul
    if (!soul) continue
    const context = halkenburgMindContext(state, side, soul.id)
    if (!context) continue
    const prefix =
      context.role === 'initiator'
        ? ['Conscience transférée', 'Transferred consciousness']
        : ['Conscience déplacée', 'Displaced consciousness']
    for (const motion of MOTIONS) {
      const command = { action: 'halkenburg-host-motion' as const, target: `${soul.id}|${motion}` }
      options.push({
        command,
        ready: performHalkenburgHostMotion(state, side, command) !== state,
        labelFr: `${prefix[0]} · ${MOTION_LABELS[motion][0]}`,
        labelEn: `${prefix[1]} · ${MOTION_LABELS[motion][1]}`,
        conditionFr:
          'Conscience éveillée dans le corps occupé. Le mouvement respecte ses blessures et ses entraves.',
        conditionEn:
          'The consciousness is awake in its current body. Movement respects its injuries and restraints.',
      })
    }
    options.push(...halkenburgRestOptions(state, side, context))
  }
  return options
}
const MOTION_LABELS = {
  left: ['Marcher à gauche', 'Walk left'],
  right: ['Marcher à droite', 'Walk right'],
  stay: ['Rester sur place', 'Stay still'],
} as const
