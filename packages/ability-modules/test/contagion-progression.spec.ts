import { describe, expect, it } from 'vitest'
import {
  EMPTY_INFECTION_PROGRESS,
  completeRecruitment,
  dealTheGame,
  infectionAfter,
  recordMemberKill,
  settle,
  witnessMurder,
} from '../src/index.js'

const won = () =>
  settle({
    ...dealTheGame({ marked: null }),
    phase: 'settling',
    hand: ['yes'],
    kissed: true,
  })

describe('Contagion progression after Morena’s table', () => {
  it('requires the witnessed murder and creates the local member only once', () => {
    const game = won()
    expect(completeRecruitment(game, EMPTY_INFECTION_PROGRESS).member).toBeNull()
    const witnessed = witnessMurder(game, EMPTY_INFECTION_PROGRESS)
    const first = completeRecruitment(game, witnessed)
    const twice = completeRecruitment(game, first)
    expect(first.completedSteps).toEqual(['game-won-yes', 'kiss', 'witnessed-murder'])
    expect(twice.member).toBe(first.member)
    expect(infectionAfter(game, twice)).toMatchObject({ witnessed: true, level: 0 })
  })

  it('scores ordinary people, Nen users and princes and unlocks once at level 20', () => {
    const member = completeRecruitment(
      won(),
      witnessMurder(won(), EMPTY_INFECTION_PROGRESS),
    ).member!
    const ordinary = recordMemberKill(member, 'ordinary')
    const nen = recordMemberKill(ordinary, 'nen-user')
    const prince = recordMemberKill(nen, 'prince')
    expect([ordinary.level, nen.level, prince.level]).toEqual([1, 11, 61])
    expect(prince.kills).toBe(3)
    expect(prince.uniqueAbilityUnlocked).toBe(true)
    expect(recordMemberKill(prince, 'ordinary').uniqueAbilityUnlocked).toBe(true)
  })
})
