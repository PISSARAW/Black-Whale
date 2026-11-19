import { beginFight, createFight } from '../../src/lib/fighting/engine'
import type { FightSide, FightState } from '../../src/lib/fighting/types'
import type { InjuryPreset } from '../../src/lib/fighting/injuryPreparation'

export function prosthesisScenario(
  side: FightSide,
  preset: InjuryPreset = 'hand-and-lower-leg',
): FightState {
  const state = beginFight(
    createFight(side === 'player' ? 'hisoka' : 'theta', side === 'opponent' ? 'hisoka' : 'theta', {
      mode: 'versus-local',
      formatId: 'knockout',
      environment: {
        preparation: {
          mode: 'scenario',
          resources: [],
          cohorts: [],
          injuries: { [side]: preset },
        },
      },
    }),
  )
  return { ...state, [side]: { ...state[side], aura: 100, health: 37 } }
}
