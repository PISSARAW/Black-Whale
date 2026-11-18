import {
  beginFight,
  createFight,
  performAuraAttack,
  tickFight,
} from '../../src/lib/fighting/engine'
import { performArsenalAction } from '../../src/lib/fighting/arsenalExecution'
import { captureDolphinAura } from '../../src/lib/fighting/dolphinAura'
import { createKurapika } from '../../src/lib/fighting/kurapika'
import { EMPTY_INPUT, type FightState } from '../../src/lib/fighting/types'
import type { ChrolloPage } from '../../src/lib/fighting/chrolloBook'

export function mixedHisokaScenario(mode: 'book-texture' | 'loan-texture'): FightState {
  const initial = beginFight(createFight('chrollo', 'kurapika', { mode: 'versus-local' }))
  const book: ChrolloPage = mode === 'book-texture' ? 'hisoka:downSpecial' : 'hisoka:neutralSpecial'
  let state: FightState = {
    ...initial,
    player: {
      ...initial.player,
      x: 44,
      aura: 100,
      chrolloBook: { pages: [book, 'sun-and-moon'], page: 0, open: true, bookmark: null },
      dolphinLoan: {
        lender: { owner: 'opponent', member: 0 },
        held: {
          source: 'hisoka',
          victim: 'opponent',
          theftId: 'mixed-ui',
          moveId: mode === 'book-texture' ? 'hisoka:neutralSpecial' : 'hisoka:downSpecial',
          loaded: true,
          used: false,
          sustainedKeys: [],
          auraSupply: {
            ...captureDolphinAura(createFight('hisoka', 'chrollo').player),
            amount: 80,
          },
        },
      },
    },
    opponent: {
      ...initial.opponent,
      x: 49,
      aura: 100,
      kurapika: {
        ...createKurapika(),
        emperorTime: true,
        dolphinLoans: [{ owner: 'player', member: 0 }],
      },
    },
  }
  state = performArsenalAction(
    {
      state,
      side: 'player',
      command:
        mode === 'book-texture'
          ? { action: 'gum-anchor', target: 'floor-back', loan: true }
          : { action: 'dolphin-use' },
    },
    performAuraAttack,
  )
  for (let frame = 0; frame < 45; frame++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  return state
}
