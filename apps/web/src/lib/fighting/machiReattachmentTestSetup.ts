import { createKurapika } from './kurapika'
import { captureDolphinAura } from './dolphinAura'
import { beginFight, createFight, tickFight } from './engine'
import { applyAuraContext } from './nen'
import { performArsenalCommand } from './retrospectiveArsenal'
import { EMPTY_INPUT, type FightSide, type FightState, type FighterId } from './types'

export const RELAX_ARMS = { ...EMPTY_INPUT, aura: true, down: true }
export function stitchingSetup(
  side: FightSide = 'player',
  caster: FighterId = 'machi',
  patientId: FighterId = 'hisoka',
): FightState {
  const target = side === 'player' ? 'opponent' : 'player'
  const state = beginFight(
    createFight(side === 'player' ? caster : patientId, side === 'opponent' ? caster : patientId, {
      mode: 'versus-local',
      formatId: 'knockout',
      environment: {
        needleStock: caster === 'machi' ? undefined : { [side]: true },
        preparation: {
          mode: 'scenario',
          resources: [],
          cohorts: [],
          injuries: { [target]: 'severed-forearms' },
        },
      },
    }),
  )
  const ready = {
    ...state,
    [side]: { ...state[side], x: state[target].x + (side === 'player' ? -4 : 4), aura: 100 },
    [target]: { ...state[target], health: state[target].health - 23 },
  }
  const consented = performArsenalCommand(ready, target, { action: 'support-consent' })
  return { ...consented, [target]: applyAuraContext(consented[target], RELAX_ARMS) }
}
export function stitchingFrames(state: FightState, side: FightSide, frames: number): FightState {
  for (let i = 0; i < frames; i++)
    state = tickFight(state, side === 'player' ? EMPTY_INPUT : RELAX_ARMS, {
      dt: 1 / 60,
      opponentInput: side === 'player' ? RELAX_ARMS : EMPTY_INPUT,
    })
  return state
}
export function severedPart(state: FightState, part = 'left-forearm') {
  return state.battlefield!.entities.find((entry) => entry.detachedForearm?.part === part)!
}

export function stitchingBookSetup(side: FightSide = 'player'): FightState {
  const state = stitchingSetup(side, 'chrollo')
  return {
    ...state,
    [side]: {
      ...state[side],
      chrolloBook: { pages: ['machi'], page: 0, open: false, bookmark: 'machi' },
    },
  }
}
export function stitchingDolphinSetup(side: FightSide = 'player', amount = 30): FightState {
  const state = stitchingSetup(side, 'kurapika')
  return {
    ...state,
    [side]: {
      ...state[side],
      aura: 0,
      auraExhausted: true,
      kurapika: {
        ...createKurapika(),
        emperorTime: true,
        held: {
          source: 'machi',
          moveId: 'machi:neutralSpecial',
          victim: side === 'player' ? 'opponent' : 'player',
          theftId: 'machi-suture-loan',
          loaded: true,
          used: false,
          sustainedKeys: [],
          auraSupply: { ...captureDolphinAura(createFight('machi', 'hisoka').player), amount },
        },
      },
    },
  }
}

export function stitchingBorrowerSetup(side: FightSide = 'player', amount = 30): FightState {
  const base = stitchingSetup(side, 'theta', 'kurapika')
  const lender = side === 'player' ? 'opponent' : 'player'
  const held = stitchingDolphinSetup(side, amount)[side].kurapika!.held!
  return {
    ...base,
    [side]: {
      ...base[side],
      aura: 0,
      auraExhausted: true,
      dolphinLoan: {
        lender: { owner: lender, member: 0 },
        held,
      },
    },
    [lender]: {
      ...base[lender],
      kurapika: {
        ...createKurapika(),
        emperorTime: true,
        dolphinLoans: [{ owner: side, member: 0 }],
      },
    },
  }
}
