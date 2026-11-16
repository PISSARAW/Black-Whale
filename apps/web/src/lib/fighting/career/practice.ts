import type { FightState } from '../types'
import type { MatchPractice } from './types'

const fighter = () => ({ bestCombo: 0, bestComboDamage: 0, healthLost: 0 })
export function createMatchPractice() {
  const totals: MatchPractice = { frames: 0, player: fighter(), opponent: fighter() }
  return {
    observe(before: FightState, after: FightState) {
      // Forecast frames are not played frames; ready/replay/lab states do not earn practice.
      if (after.forecastSimulation || after.mode === 'training') return
      totals.frames += Math.max(0, Math.min(3, before.remainingFrames - after.remainingFrames))
      for (const side of ['player', 'opponent'] as const) {
        const actor = after[side]
        const target = after[side === 'player' ? 'opponent' : 'player']
        totals[side].bestCombo = Math.max(totals[side].bestCombo, target.comboHits)
        totals[side].bestComboDamage = Math.max(totals[side].bestComboDamage, target.comboDamage)
        totals[side].healthLost += Math.max(0, before[side].health - actor.health)
      }
    },
    snapshot(): MatchPractice {
      return structuredClone(totals)
    },
  }
}
