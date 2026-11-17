import { beginFight, createFight, tickFight } from '../../src/lib/fighting/engine'
import { performTrainingAction } from '../../src/lib/fighting/trainingAction'
import { setTrainingResources } from '../../src/lib/fighting/trainingSession'
import { attackData } from '../../src/lib/fighting/frameData'
import { EMPTY_INPUT, type FighterId, type FightState } from '../../src/lib/fighting/types'

export type ExpressionSituation = 'concentration' | 'effort' | 'pain' | 'combat'
export function emotionalCombatState(options: {
  fighter: FighterId
  situation: ExpressionSituation
  facing: 1 | -1
}) {
  let state = createFight(options.fighter, 'phinks', {
    mode: options.situation === 'combat' ? 'training' : 'versus-local',
    formatId: 'knockout',
    environment: { stageId: 'heavens-arena', arenaInteractions: false },
  })
  state = {
    ...state,
    player: { ...state.player, x: 50 - options.facing * 10, facing: options.facing },
    opponent: { ...state.opponent, x: 50, facing: options.facing === 1 ? -1 : 1 },
  }
  for (const side of ['player', 'opponent'] as const)
    state = setTrainingResources(state, side, {
      aura: 100,
      infiniteAura: true,
      infiniteHealth: true,
    })
  state = beginFight(state)
  if (options.situation === 'effort') {
    state = performTrainingAction({ state, side: 'player', action: 'heavy', input: EMPTY_INPUT })
    const startup = attackData('heavy', state.player).startup
    for (let frame = 0; frame < startup - 1; frame++) state = advanceExpressionCombat(state)
  }
  if (options.situation === 'pain') {
    state = performTrainingAction({ state, side: 'opponent', action: 'light', input: EMPTY_INPUT })
    for (let frame = 0; frame < 120 && state.player.hitStun === 0; frame++)
      state = advanceExpressionCombat(state)
    if (state.player.hitStun === 0) throw Error('Expression proof requires a real received hit')
  }
  return state
}
export function advanceExpressionCombat(state: FightState) {
  return tickFight(state, EMPTY_INPUT, { dt: 1 / 60, ai: false, opponentInput: EMPTY_INPUT })
}
