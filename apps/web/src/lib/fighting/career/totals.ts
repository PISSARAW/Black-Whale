import type { CareerMatch, CareerProfile, FighterTotals } from './types'
import { mergeHistory } from './storage'

export const emptyTotals = (): FighterTotals => ({
  matches: 0,
  wins: 0,
  points: 0,
  frames: 0,
  bestCombo: 0,
  bestComboDamage: 0,
})
export function addCareerMatch(profile: CareerProfile, match: CareerMatch): CareerProfile {
  if (profile.seen.includes(match.id)) return profile
  const old = profile.totals[match.player] ?? emptyTotals()
  const total = {
    matches: old.matches + 1,
    wins: old.wins + Number(match.winner === 'player'),
    points:
      old.points + 20 + match.rounds.player * 5 + Math.min(20, match.practice.player.bestCombo * 2),
    frames: old.frames + match.practice.frames,
    bestCombo: Math.max(old.bestCombo, match.practice.player.bestCombo),
    bestComboDamage: Math.max(old.bestComboDamage, match.practice.player.bestComboDamage),
  }
  return {
    ...profile,
    revision: profile.revision + 1,
    totals: { ...profile.totals, [match.player]: total },
    seen: [...profile.seen, match.id].slice(-2000),
    history: mergeHistory(profile.history, [match]),
  }
}
