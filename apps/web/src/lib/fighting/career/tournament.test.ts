import { describe, expect, it } from 'vitest'
import { createTournament, readTournament, tournamentWinner } from './tournament'

describe('local tournament organizer', () => {
  it.each([2, 3, 4, 5, 7, 8, 9, 16])(
    'advances %i participants through byes to one champion',
    (count) => {
      let cup = createTournament(Array.from({ length: count }, (_, index) => `Hunter ${index + 1}`))
      let played = 0
      while (!cup.champion) {
        const bout = cup.bouts.find((entry) => !entry.winner && entry.seats.every(Boolean))!
        expect(bout).toBeDefined()
        cup = tournamentWinner(cup, bout.id, bout.seats[0]!)
        played += 1
      }
      expect(played).toBe(count - 1)
      expect(cup.players.some((entry) => entry.id === cup.champion)).toBe(true)
      expect(readTournament(JSON.stringify(cup))).toEqual(cup)
    },
  )
  it('rejects invalid entrants and results, and never mutates the previous bracket', () => {
    for (const names of [
      [],
      ['one'],
      ['one', 'ONE'],
      Array(17).fill('one'),
      ['one', 'x'.repeat(25)],
    ])
      expect(() => createTournament(names)).toThrow()
    const cup = createTournament(['A', 'B', 'C', 'D']),
      text = JSON.stringify(cup)
    expect(() => tournamentWinner(cup, '1:0', 'p1')).toThrow('INVALID_RESULT')
    const next = tournamentWinner(cup, '0:0', 'p1')
    expect(JSON.stringify(cup)).toBe(text)
    expect(() => tournamentWinner(next, '0:0', 'p4')).toThrow('INVALID_RESULT')
  })
  it('reconstructs only legal progress and handles corrupt or oversized local saves', () => {
    expect(readTournament('{')).toBeNull()
    expect(readTournament('x'.repeat(20001))).toBeNull()
    const cup = createTournament(['A', 'B', 'C', 'D'])
    cup.bouts[0].winner = 'foreign'
    expect(readTournament(JSON.stringify(cup))).toBeNull()
  })
})
