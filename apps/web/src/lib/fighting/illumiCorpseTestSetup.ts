import { beginFight, createFight } from './engine'
import { createKurapika } from './kurapika'
import { captureDolphinAura } from './dolphinAura'
import { mapFrames } from './dowsingMapTestSetup'
import { needleCommand } from './illumiNeedleFaceTestSetup'
import type { FightSide, FightState, FighterId } from './types'

export function corpseSetup(side: FightSide = 'player', id: FighterId = 'illumi'): FightState {
  const base = beginFight(
    createFight(side === 'player' ? id : 'kurapika', side === 'opponent' ? id : 'kurapika', {
      mode: 'versus-local',
      formatId: 'knockout',
      environment: {
        needleStock: { [side]: true },
        preparation: { mode: 'scenario', resources: ['corpses', 'hostages'], cohorts: [] },
      },
    }),
  )
  return { ...base, [side]: { ...base[side], aura: 100 } }
}
export function controlledCorpse(side: FightSide = 'player'): FightState {
  return mapFrames(
    needleCommand(corpseSetup(side), { action: 'illumi-corpse', target: `${side}:corpse` }, side),
    60,
  )
}
export function bookCorpseSetup(side: FightSide = 'player'): FightState {
  const base = corpseSetup(side, 'chrollo')
  return {
    ...base,
    [side]: {
      ...base[side],
      chrolloBook: { pages: ['illumi:neutralSpecial'], page: 0, open: true, bookmark: null },
    },
  }
}
export function corpseLoanSetup(amount = 60, side: FightSide = 'player'): FightState {
  const base = corpseSetup(side, 'theta')
  const other = side === 'player' ? 'opponent' : 'player'
  return {
    ...base,
    [side]: {
      ...base[side],
      aura: 0,
      auraExhausted: true,
      dolphinLoan: {
        lender: { owner: other, member: 0 },
        held: {
          source: 'illumi',
          moveId: 'illumi:neutralSpecial',
          victim: other,
          theftId: 'corpse-loan',
          loaded: true,
          used: false,
          sustainedKeys: [],
          auraSupply: { ...captureDolphinAura(createFight('illumi', 'theta').player), amount },
        },
      },
    },
    [other]: {
      ...base[other],
      kurapika: {
        ...createKurapika(),
        emperorTime: true,
        dolphinLoans: [{ owner: side, member: 0 }],
      },
    },
  }
}
export function corpseEntry(state: FightState, id = 'player:corpse') {
  return state.battlefield!.entities.find((entry) => entry.id === id)!
}
