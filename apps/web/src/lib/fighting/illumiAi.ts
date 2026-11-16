import type { FightState, MoveSlot } from './types'

export function illumiAiSlots(state: FightState, gap: number): readonly MoveSlot[] {
  if (!state.player.needlePuppet && gap <= 10) return ['neutralSpecial', 'standingLight']
  return ['forwardLight', 'standingLight', 'standingHeavy']
}
