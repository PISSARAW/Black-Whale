import type { FighterMove } from './movesetTypes'
import { canStartFighterAttack } from './fighterAttacks'
import { illumiAvailable, ownsIllumiNeedles, illumiMove } from './illumiAccess'
import { illumiBodyFree, type NeedleOrder } from './illumiState'
import { hasIllumiNeedles } from './illumiEquipment'
import { freeDeviceHand } from './deviceHands'
import type { FightSide, FightState } from './types'

export function needleOrderLabel(order: NeedleOrder, language: 'fr' | 'en'): string {
  return {
    stay: ['Reste', 'Stay'],
    approach: ['Approche', 'Approach'],
    retreat: ['Éloigne-toi', 'Retreat'],
  }[order][language === 'fr' ? 0 : 1]
}

export function illumiStayReady(state: FightState, side: FightSide): boolean | null {
  const target = state[side === 'player' ? 'opponent' : 'player']
  if (!target.needlePuppet?.needleEmbedded || target.needlePuppet.owner !== side) return null
  const fighter = state[side]
  return (
    ownsIllumiNeedles(fighter) &&
    illumiAvailable(fighter) &&
    illumiBodyFree(fighter) &&
    !fighter.attack &&
    canStartFighterAttack(fighter, 'light')
  )
}

export function illumiSpecialPresentation(state: FightState, language: 'fr' | 'en') {
  const fr = language === 'fr'
  const fighter = state.player
  const stay = illumiStayReady(state, 'player')
  const ready = stay ?? (illumiAvailable(fighter) && illumiBodyFree(fighter) && fighter.aura >= 40)
  return {
    label: stay !== null ? (fr ? 'Ordre · Reste' : 'Order · Stay') : 'Needle People',
    ready,
    hint: !hasIllumiNeedles(fighter)
      ? fr
        ? 'Aiguilles physiques requises · à équiper avant le duel'
        : 'Physical needles required · equip them before the duel'
      : fr
        ? 'L : aiguille au crâne (40 aura) / Reste · → + L : Approche · ↓ + L : Éloigne-toi · ← + L : visage remodelé'
        : 'L: skull needle (40 aura) / Stay · → + L: Approach · ↓ + L: Retreat · ← + L: altered face',
  }
}

export function illumiMoveReadiness(
  state: FightState,
  side: FightSide,
  move: FighterMove,
): boolean | null {
  if (move.kind !== 'special') return null
  if (move.slot === 'backSpecial' && illumiMove(state[side], move.id))
    return !state[side].hanzoProjection && Boolean(freeDeviceHand(state, side))
  if (move.slot !== 'neutralSpecial') return null
  return illumiMove(state[side], move.id) ? illumiStayReady(state, side) : null
}
