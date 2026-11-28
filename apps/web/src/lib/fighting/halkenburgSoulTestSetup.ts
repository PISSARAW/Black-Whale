import { beginFight, createFight, performAuraAttack, tickFight } from './engine'
import { COHORT_WILL_FRAMES } from './preparationTuning'
import { EMPTY_INPUT, type FightState, type FightSide } from './types'

export function soulDuel(side: FightSide = 'player', seed = 0): FightState {
  const base = beginFight(
    createFight(
      side === 'player' ? 'halkenburg' : 'hisoka',
      side === 'opponent' ? 'halkenburg' : 'hisoka',
      {
        mode: 'versus-local',
        formatId: 'knockout',
        environment: {
          preparation: { mode: 'scenario', resources: [], cohorts: [side] },
        },
      },
    ),
  )
  return {
    ...base,
    rng: seed,
    player: { ...base.player, x: 44 },
    opponent: { ...base.opponent, x: 56 },
    [side]: {
      ...base[side],
      x: side === 'player' ? 44 : 56,
      aura: 100,
      hatsuEffects: { ...base[side].hatsuEffects, cohortWillFrames: COHORT_WILL_FRAMES },
    },
  }
}
export function shootSoul(state: FightState, side: FightSide = 'player'): FightState {
  let next = performAuraAttack({
    state,
    side,
    kind: 'special',
    moveId: 'halkenburg:neutralSpecial',
    auraCharged: false,
  })
  for (let frame = 0; frame < 90; frame++) {
    next = tickFight(next, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
    if (next.player.halkenburgSoul || next.opponent.halkenburgSoul) return next
  }
  return next
}
