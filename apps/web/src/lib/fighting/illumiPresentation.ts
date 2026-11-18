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
  const warp = fighter.illumiNeedleMode === 'face-warp'
  const stay = warp ? null : illumiStayReady(state, 'player')
  const ready = stay ?? (illumiAvailable(fighter) && illumiBodyFree(fighter) && fighter.aura >= 40)
  return {
    label: needleLabel(warp, stay, fr),
    ready,
    hint: needleHint(hasIllumiNeedles(fighter), warp, fr),
  }
}

function needleLabel(warp: boolean, stay: boolean | null, fr: boolean) {
  if (warp) return fr ? 'Visage · Trois aiguilles' : 'Face · Three needles'
  return stay !== null ? (fr ? 'Ordre · Reste' : 'Order · Stay') : 'Needle People'
}
function needleHint(equipped: boolean, warp: boolean, fr: boolean) {
  return !equipped
    ? fr
      ? 'Aiguilles physiques requises · à équiper avant le duel'
      : 'Physical needles required · equip them before the duel'
    : warp
      ? fr
        ? 'Contact au front · trois aiguilles physiques · déformation douloureuse sans contrôle mental'
        : 'Forehead contact · three physical needles · painful deformation without mind control'
      : fr
        ? 'L : aiguille au crâne (40 aura) / Reste · → + L : Approche · ↓ + L : Éloigne-toi · ← + L : visage remodelé'
        : 'L: skull needle (40 aura) / Stay · → + L: Approach · ↓ + L: Retreat · ← + L: altered face'
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
  if (!illumiMove(state[side], move.id)) return null
  if (state[side].illumiNeedleMode !== 'face-warp') {
    const stay = illumiStayReady(state, side)
    if (stay !== null) return stay
  }
  return !state[side].hanzoProjection && Boolean(freeDeviceHand(state, side))
}
