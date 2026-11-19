import type { FightState, MoveSlot } from './types'

export function illumiAiSlots(state: FightState, gap: number): readonly MoveSlot[] {
  const implanted =
    state.opponent.illumiNeedleMode === 'face-warp'
      ? state.player.needleFace
      : state.player.needlePuppet
  if (!implanted && gap <= 10) return ['neutralSpecial', 'standingLight']
  return ['forwardLight', 'standingLight', 'standingHeavy']
}
