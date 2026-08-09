import { describe, expect, it } from 'vitest'
import { EMPTY_WORLD } from './worldPieces'
import { selfInflictTourInjury } from './pain'
import { releaseTourWorld } from '../pageWorldCommands'

describe('physical injuries in the tour', () => {
  it('survive Zetsu while Pain Packer aura and its committed charge disappear', () => {
    const injured = selfInflictTourInjury(EMPTY_WORLD, 'severe').world
    const armoured = {
      ...injured,
      body: { ...injured.body, availablePain: 0, packed: 3 },
    }

    const released = releaseTourWorld(armoured).world
    expect(released.body).toMatchObject({ injuries: 3, availablePain: 0, packed: null })
  })

  it('keeps an uncommitted injury available through Zetsu', () => {
    const injured = selfInflictTourInjury(EMPTY_WORLD, 'medium').world
    const released = releaseTourWorld(injured).world
    expect(released.body).toMatchObject({ injuries: 2, availablePain: 2, packed: null })
  })
})
