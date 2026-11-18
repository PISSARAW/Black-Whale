import type { FightSide, FightState } from './types'
import type { ArsenalCommand, ArsenalOption } from './retrospectiveTypes'

const MOTIONS = ['left', 'right', 'stay'] as const

export function performHalkenburgHostMotion(
  state: FightState,
  side: FightSide,
  command: ArsenalCommand,
): FightState {
  if (command.action !== 'halkenburg-host-motion' || !command.target) return state
  const [id, motion] = command.target.split('|')
  if (!MOTIONS.includes(motion as (typeof MOTIONS)[number])) return state
  const target = hostFor(state, side, id)
  if (!target) return state
  const body = state[target],
    soul = body.halkenburgSoul!
  if ((soul.motion ?? 'stay') === motion) return state
  return {
    ...state,
    [target]: {
      ...body,
      halkenburgSoul: { ...soul, motion: motion as (typeof MOTIONS)[number] },
    },
  }
}

function hostFor(state: FightState, side: FightSide, id: string): FightSide | undefined {
  return (['player', 'opponent'] as const).find((target) => {
    const body = state[target]
    return body.health > 0 && body.halkenburgSoul?.owner === side && body.halkenburgSoul.id === id
  })
}

export function halkenburgHostOptions(state: FightState, side: FightSide): ArsenalOption[] {
  const options: ArsenalOption[] = []
  for (const target of ['player', 'opponent'] as const) {
    const soul = state[target].halkenburgSoul
    if (!soul || soul.owner !== side) continue
    for (const motion of MOTIONS) {
      const command = { action: 'halkenburg-host-motion' as const, target: `${soul.id}|${motion}` }
      options.push({
        command,
        ready: performHalkenburgHostMotion(state, side, command) !== state,
        labelFr: `Conscience transférée · ${MOTION_LABELS[motion][0]}`,
        labelEn: `Transferred consciousness · ${MOTION_LABELS[motion][1]}`,
        conditionFr:
          'Conscience initiatrice dans le corps touché. Le mouvement respecte ses blessures et ses entraves.',
        conditionEn:
          'The initiating consciousness occupies the pierced body. Movement respects its injuries and restraints.',
      })
    }
  }
  return options
}
const MOTION_LABELS = {
  left: ['Marcher à gauche', 'Walk left'],
  right: ['Marcher à droite', 'Walk right'],
  stay: ['Rester sur place', 'Stay still'],
} as const
