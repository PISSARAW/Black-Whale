import { selectedGumLink, ownedGumLinks } from './bungeeNetwork'
import type { FightState, MoveSlot } from './types'

export function networkGumSlots(state: FightState, gap: number): readonly MoveSlot[] | null {
  const link = selectedGumLink(state, 'opponent')
  if (link && link.target.kind !== 'fighter') return []
  return gap < 12 && ownedGumLinks(state, 'opponent').length < 2 ? ['neutralSpecial'] : null
}
export function aiGumLink(state: FightState) {
  const link = selectedGumLink(state, 'opponent')
  return link ? { owner: link.owner, retracting: link.motion !== 'idle' } : null
}
export function idleGumSlots(state: FightState, roll: number): readonly MoveSlot[] {
  return !state.opponent.textureSurprise && roll > 0.8 ? ['downSpecial'] : []
}
