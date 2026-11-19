import { beginFight, createFight, tickFight } from '$lib/fighting/engine'
import { EMPTY_INPUT, type FightSide, type FightState } from '$lib/fighting/types'

export function mapScenario(side: FightSide): FightState {
  const base = beginFight(
    createFight(
      side === 'player' ? 'kurapika' : 'hisoka',
      side === 'opponent' ? 'kurapika' : 'hisoka',
      {
        mode: 'versus-local',
        formatId: 'knockout',
        environment: { preparation: { mode: 'scenario', resources: ['maps'], cohorts: [] } },
      },
    ),
  )
  const met = tickFight(
    {
      ...base,
      player: { ...base.player, x: side === 'player' ? 25 : 60, aura: 100 },
      opponent: { ...base.opponent, x: side === 'player' ? 40 : 75, aura: 100 },
    },
    EMPTY_INPUT,
    { dt: 1 / 60, opponentInput: EMPTY_INPUT },
  )
  const other = side === 'player' ? 'opponent' : 'player'
  return { ...met, [other]: { ...met[other], x: side === 'player' ? 80 : 20 } }
}
