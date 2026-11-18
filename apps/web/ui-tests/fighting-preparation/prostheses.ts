import { beginFight, createFight } from '../../src/lib/fighting/engine'
import type { FightSide, FightState } from '../../src/lib/fighting/types'

export function prosthesisScenario(side: FightSide): FightState {
  const state = beginFight(
    createFight(side === 'player' ? 'hisoka' : 'theta', side === 'opponent' ? 'hisoka' : 'theta', {
      mode: 'versus-local',
      formatId: 'knockout',
      environment: {
        preparation: {
          mode: 'scenario',
          resources: [],
          cohorts: [],
          injuries: { [side]: 'hand-and-lower-leg' },
        },
      },
    }),
  )
  return { ...state, [side]: { ...state[side], aura: 100, health: 37 } }
}
