import { voluntaryNenAvailable } from './nenAccess'
import type { DolphinAuraSupply } from './dolphinAura'
import type { ArcadeFighter, FightSide, FightState } from './types'

export interface DolphinExecution {
  supply: DolphinAuraSupply
  ownAura: number
  ownExhausted: boolean
  ownNen: ArcadeFighter['nen']
  borrowedTen: boolean
}
declare module './types' {
  interface ArcadeFighter {
    dolphinExecution?: DolphinExecution
  }
}

/** A temporary execution channel: the carrier's own reserve is never replaced in saved state. */
export function stolenAuraActor(actor: ArcadeFighter): ArcadeFighter {
  const supply = actor.kurapika?.held?.auraSupply
  if (!supply || actor.kurapika?.held?.returned || actor.dolphinExecution) return actor
  const borrowedTen = actor.nen.mode === 'zetsu'
  return {
    ...actor,
    aura: supply.amount,
    auraExhausted: supply.amount <= 0 && !supply.committed,
    nen: borrowedTen ? { ...actor.nen, mode: 'ten' } : actor.nen,
    dolphinExecution: {
      supply,
      ownAura: actor.aura,
      ownExhausted: actor.auraExhausted,
      ownNen: actor.nen,
      borrowedTen,
    },
  }
}
export function restoreStolenAura(original: ArcadeFighter, after: ArcadeFighter): ArcadeFighter {
  const context = after.dolphinExecution
  if (!context || original.dolphinExecution) return after
  const gain = Math.max(0, after.aura - context.supply.amount)
  const held = after.kurapika?.held
  const sameSupply = held?.auraSupply === context.supply
  return {
    ...after,
    aura: Math.min(100, context.ownAura + gain),
    auraExhausted: context.ownExhausted,
    nen: context.borrowedTen ? context.ownNen : after.nen,
    dolphinExecution: original.dolphinExecution,
    kurapika: sameSupply
      ? {
          ...after.kurapika!,
          held: {
            ...held!,
            auraSupply: {
              ...context.supply,
              amount: Math.max(0, Math.min(context.supply.amount, after.aura)),
              committed:
                (context.supply.committed ?? 0) + Math.max(0, context.supply.amount - after.aura),
            },
          },
        }
      : after.kurapika,
  }
}

/** Once equipped, Dolphin spends stolen aura; new voluntary use still needs a conscious carrier. */
export function dolphinSupplyAvailable(actor: ArcadeFighter): boolean {
  const supplied = stolenAuraActor(actor)
  return voluntaryNenAvailable(
    actor.kurapika?.held?.used ? { ...supplied, auraExhausted: false } : supplied,
  )
}

export function withDolphinSupply(
  state: FightState,
  side: FightSide,
  run: (state: FightState) => FightState,
): FightState {
  const actor = stolenAuraActor(state[side])
  if (actor === state[side]) return run(state)
  const prepared = { ...state, [side]: actor }
  const next = run(prepared)
  if (next === prepared) return state
  return { ...next, [side]: restoreStolenAura(state[side], next[side]) }
}
