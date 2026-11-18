import type { FightSide, FightState } from '../types'

export function createPerceptionHistory() {
  const notes: Record<FightSide, string[]> = { player: [], opponent: [] }
  let sequence: number | undefined
  function reset() {
    notes.player = []
    notes.opponent = []
    sequence = undefined
  }
  function observe(state: FightState) {
    const impact = state.impact
    if (!impact || sequence === impact.sequence) return
    sequence = impact.sequence
    for (const side of ['player', 'opponent'] as const) {
      const action = impact.attacker === side ? 'self landed' : 'self received'
      notes[side].push(`${action} ${impact.kind}${impact.blocked ? ' (guarded)' : ''}`)
      if (notes[side].length > 6) notes[side].shift()
    }
  }
  return { reset, observe, read: (side: FightSide) => [...notes[side]] }
}
