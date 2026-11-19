import { canAct } from './fightActorState'
import { illumiNenActive } from './illumiAccess'
import { illumiState, ILLUMI_DISGUISE_FRAMES } from './illumiState'
import type { FightSide, FightState, FighterId } from './types'
import type { ArsenalInvocation, ArsenalOption } from './retrospectiveTypes'

declare module './types' {
  interface ArcadeFighter {
    illumiMask?: { model: FighterId; remaining: number }
  }
}
export const NEEDLELESS_MASK_FRAMES = 5 * 60 * 60 * 60
export function performIllumiMask({ state, side, command }: ArsenalInvocation): FightState {
  const actor = state[side]
  if (command.action !== 'illumi-mask' || !maskReady(state, side)) return state
  if (command.target === 'restore' && actor.illumiMask)
    return {
      ...state,
      [side]: {
        ...actor,
        illumiMask: undefined,
        illumi: { ...illumiState(actor), disguised: false, preparation: 0 },
      },
    }
  if (command.target !== 'hisoka' || !illumiNenActive(actor) || actor.aura < 20 || actor.illumiMask)
    return state
  return {
    ...state,
    [side]: {
      ...actor,
      aura: actor.aura - 20,
      illumiMask: { model: 'hisoka', remaining: NEEDLELESS_MASK_FRAMES },
      illumi: {
        ...illumiState(actor),
        disguised: false,
        preparation: ILLUMI_DISGUISE_FRAMES,
        anchor: { x: actor.x, y: actor.y },
      },
    },
  }
}
function maskReady(state: FightState, side: FightSide): boolean {
  const actor = state[side]
  return (
    state.phase === 'fighting' &&
    !state.catsName &&
    actor.id === 'illumi' &&
    canAct(actor) &&
    !actor.attack
  )
}
export function advanceIllumiMask(state: FightState): FightState {
  for (const side of ['player', 'opponent'] as const) {
    const actor = state[side],
      mask = actor.illumiMask
    if (!mask || actor.illumi?.preparation) continue
    const remaining = mask.remaining - 1
    const active = actor.illumi?.disguised && remaining > 0
    state = {
      ...state,
      [side]: {
        ...actor,
        illumiMask: active ? { ...mask, remaining } : undefined,
        illumi: { ...illumiState(actor), disguised: Boolean(active) },
      },
    }
  }
  return state
}
export function illumiMaskOptions(state: FightState, side: FightSide): ArsenalOption[] {
  if (state[side].id !== 'illumi') return []
  return ['hisoka', 'restore'].map((target) => {
    const command = { action: 'illumi-mask' as const, target }
    return {
      command,
      ready: performIllumiMask({ state, side, command }) !== state,
      labelFr:
        target === 'hisoka'
          ? 'Illumi · Imiter Hisoka sans aiguilles'
          : 'Illumi · Reprendre son visage',
      labelEn:
        target === 'hisoka'
          ? 'Illumi · Impersonate Hisoka without needles'
          : 'Illumi · Restore his face',
      conditionFr:
        'Déguisement montré à York Shin, cinq heures maximum. Préparation vulnérable ; ni guérison ni pouvoir d’Hisoka. Les aiguilles de Needle People restent un équipement distinct.',
      conditionEn:
        'The Yorknew disguise, lasting at most five hours. Vulnerable preparation; no healing or Hisoka abilities. Needle People needles remain separate equipment.',
    }
  })
}
