import { describe, expect, it } from 'vitest'
import type { ProposedWorldEvent } from '@black-whale/canon-engine'
import { resolveSimultaneousOrders } from './simultaneous'

function move(id: string, locationId: string) {
  return {
    type: 'ENTITY_MOVED',
    payload: { presence: { entity: { id, kind: 'CHARACTER' }, locationId } },
  } as ProposedWorldEvent
}

describe('simultaneous strategy orders', () => {
  it('reveals both plans before a conditional guard reacts', () => {
    const player = move('player', 'hall')
    const opposition = move('enemy', 'vault')
    const resolution = resolveSimultaneousOrders({
      player: [player],
      opposition: [opposition],
      reactions: [
        { owner: 'PLAYER', trigger: 'HOSTILE_MOVE', locationId: 'vault', effect: 'BLOCK' },
      ],
    })
    expect(resolution.player).toEqual([player])
    expect(resolution.blockedOpposition).toEqual([opposition])
  })

  it('does not let plan array order change the resolution', () => {
    const orders = [move('a', 'north'), move('b', 'south')]
    const reactions = [
      {
        owner: 'OPPOSITION' as const,
        trigger: 'HOSTILE_MOVE' as const,
        locationId: 'north',
        effect: 'BLOCK' as const,
      },
    ]
    const forward = resolveSimultaneousOrders({ player: orders, opposition: [], reactions })
    const reverse = resolveSimultaneousOrders({
      player: [...orders].reverse(),
      opposition: [],
      reactions,
    })
    expect(new Set(forward.player)).toEqual(new Set(reverse.player))
    expect(new Set(forward.blockedPlayer)).toEqual(new Set(reverse.blockedPlayer))
  })
})
