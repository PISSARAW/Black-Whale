import { describe, expect, it } from 'vitest'
import {
  askMorena,
  dealTheGame,
  leaveTheTable,
  playTechnique,
  refuseTheDeal,
  settle,
  takeTheDeal,
} from '@black-whale/ability-modules'
import { commandForGesture, playGesture, type TableGesture } from './morenaHands'
import { applyMorenaCommand } from './morenaCommands'

describe('Morena commands', () => {
  it('uses the same deterministic reducer path for DOM and 3D questions', () => {
    const game = dealTheGame({ marked: null })
    const question = game.questions[0]
    const random = () => 0
    const expected = askMorena(game, question, { random })

    expect(applyMorenaCommand(game, { kind: 'ask', question }, { random })).toEqual(expected)
    expect(playGesture(game, { kind: 'ask', question }, { random })).toEqual(expected)
  })

  it('maps every physical gesture to the shared command vocabulary', () => {
    const gestures: Array<[TableGesture, ReturnType<typeof commandForGesture>]> = [
      [
        { kind: 'ask', question: 'goal' },
        { kind: 'ask', question: 'goal' },
      ],
      [
        { kind: 'kiss', card: 'yes' },
        { kind: 'accept-deal', card: 'yes' },
      ],
      [{ kind: 'decline' }, { kind: 'decline-deal' }],
      [
        { kind: 'point', side: 'no' },
        { kind: 'settle', choice: 'no' },
      ],
      [
        { kind: 'reach', card: 'back' },
        { kind: 'settle', choice: 'back' },
      ],
      [{ kind: 'play', card: 'x' }, { kind: 'settle' }],
    ]

    for (const [gesture, command] of gestures) expect(commandForGesture(gesture)).toEqual(command)
  })

  it('delegates each command to the existing rules', () => {
    const asking = dealTheGame({ marked: null, technique: 'scarlet' })
    const deal = askMorena(asking, asking.questions[0], { random: () => 0 })

    expect(applyMorenaCommand(deal, { kind: 'accept-deal', card: deal.graveyard[0] })).toEqual(
      takeTheDeal(deal, deal.graveyard[0]),
    )
    expect(applyMorenaCommand(deal, { kind: 'decline-deal' })).toEqual(refuseTheDeal(deal))
    expect(applyMorenaCommand(asking, { kind: 'settle', choice: 'yes' })).toEqual(
      settle(asking, 'yes'),
    )
    expect(
      applyMorenaCommand(asking, { kind: 'play-technique', page: 'open' }, { random: () => 0 }),
    ).toEqual(playTechnique(asking, { page: 'open', random: () => 0 }))
    expect(applyMorenaCommand(asking, { kind: 'leave' })).toEqual(leaveTheTable(asking))
  })
})
