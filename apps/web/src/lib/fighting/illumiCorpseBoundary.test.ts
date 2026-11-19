import { describe, expect, it } from 'vitest'
import { beginFight } from './engine'
import { createTeamFight } from './teamMatch'
import { controlledCorpse, corpseSetup, corpseEntry } from './illumiCorpseTestSetup'
import { needleCommand } from './illumiNeedleFaceTestSetup'
import { mapFrames } from './dowsingMapTestSetup'
import { expireHistoricalMatter } from './historicalMatterClock'
import { privatePvpState } from './pvp/view'
import type { FightState } from './types'

describe('corpse controls retain their actual body through PvP and replacement', () => {
  it('keeps canonical pin IDs and the same book source when P2 predicts the real application', () => {
    const base = corpseSetup('opponent', 'chrollo')
    const state: FightState = {
      ...base,
      opponent: {
        ...base.opponent,
        chrolloBook: { pages: ['illumi:neutralSpecial'], page: 0, open: true, bookmark: null },
      },
    }
    const command = { action: 'illumi-corpse' as const, target: 'opponent:corpse' }
    const actual = mapFrames(needleCommand(state, command, 'opponent'), 60)
    const local = mapFrames(needleCommand(privatePvpState(state, 'opponent'), command), 60)
    const expected = corpseEntry(privatePvpState(actual, 'opponent'), command.target)
    expect(corpseEntry(local, command.target).corpseNeedles).toEqual(expected.corpseNeedles)
    expect(corpseEntry(local, command.target).corpseControl).toEqual(expected.corpseControl)
    expect(expected.corpseNeedles?.id).toContain('corpse-pins:opponent:0:')
    expect(expected.corpseControl?.origin?.source).toBe('book')
  })
  it('does not transfer a dead member’s control to a replacement that has copied the same Hatsu', () => {
    const cast = controlledCorpse()
    const team = beginFight(
      createTeamFight({
        player: ['illumi', 'chrollo', 'bill'],
        opponent: ['kurapika', 'theta', 'machi'],
      }),
    )
    const seat = team.teamMatch!.seats.player
    const replacement = {
      ...seat.members[1],
      x: 22,
      equipment: ['book', 'needles'] as const,
      chrolloBook: {
        pages: ['illumi:neutralSpecial'],
        page: 0,
        open: true,
        bookmark: null,
      } as const,
    }
    const state: FightState = {
      ...cast,
      player: {
        ...replacement,
        equipment: [...replacement.equipment],
        chrolloBook: { ...replacement.chrolloBook, pages: [...replacement.chrolloBook.pages] },
      },
      teamMatch: {
        ...team.teamMatch!,
        seats: {
          ...team.teamMatch!.seats,
          player: { ...seat, active: 1, members: [{ ...cast.player, health: 0 }, seat.members[1]] },
        },
      },
    }
    expect(
      needleCommand(state, { action: 'illumi-corpse-order', target: 'player:corpse|retreat' }),
    ).toBe(state)
    const stopped = expireHistoricalMatter({ ...state, hitstop: 10 })
    expect(corpseEntry(stopped).controller).toBeUndefined()
    expect(corpseEntry(stopped).corpseNeedles).toEqual(corpseEntry(cast).corpseNeedles)
  })
})
