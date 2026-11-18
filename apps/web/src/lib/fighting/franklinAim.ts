import { canAct } from './fightActorState'
import { franklinNenAvailable } from './franklinAttack'
import type { ArsenalInvocation, ArsenalOption } from './retrospectiveTypes'
import type { FightSide, FightState } from './types'

declare module './types' {
  interface ArcadeFighter {
    franklinAim?: 'forward' | 'split' | 'sweep'
  }
}
export function performFranklinAim({ state, side, command }: ArsenalInvocation): FightState {
  const actor = state[side]
  if (actor.id !== 'franklin' || !franklinNenAvailable(actor) || !canAct(actor) || actor.attack)
    return state
  if (
    command.action !== 'franklin-aim' ||
    !['forward', 'split', 'sweep'].includes(command.target ?? '')
  )
    return state
  if ((actor.franklinAim ?? 'forward') === command.target) return state
  return {
    ...state,
    [side]: { ...actor, franklinAim: command.target as 'forward' | 'split' | 'sweep' },
  }
}
export function franklinAimOptions(state: FightState, side: FightSide): ArsenalOption[] {
  if (state[side].id !== 'franklin') return []
  return (['forward', 'split', 'sweep'] as const).map((target, index) => {
    const command = { action: 'franklin-aim' as const, target }
    return {
      command,
      ready: performFranklinAim({ state, side, command }) !== state,
      labelFr: ['Rafale · Vers l’avant', 'Rafale · Deux directions', 'Rafale · Balayage'][index],
      labelEn: ['Barrage · Forward', 'Barrage · Both directions', 'Barrage · Sweep'][index],
      conditionFr:
        'Les deux mains émettent leurs véritables projectiles. Directions et hauteurs de balayage sont des choix de duel ; aucun verrouillage d’une cible cachée ni dégât de zone inévitable.',
      conditionEn:
        'Both hands emit actual projectiles. Directions and sweep heights are duel choices; no lock on a hidden target or unavoidable area damage.',
    }
  })
}
