import { describe, expect, it } from 'vitest'
import { messagesFor } from '$lib/i18n'
import { EMPTY_WORLD, type TourWorld } from './hatsu'
import { hatsuTechniqueGuide } from './hatsuTechniqueGuide'

const copy = messagesFor('en').tour.hatsu
type GuideContext = Parameters<typeof hatsuTechniqueGuide>[0]

function context(
  kind: GuideContext['kind'],
  world: TourWorld = EMPTY_WORLD,
): GuideContext {
  return {
    copy,
    kind,
    world,
    touch: false,
    standingIn: null,
    aimedAtId: null,
    personName: (id) => `person:${id}`,
    roomName: (id) => `room:${id}`,
    pageName: (id) => `page:${id}`,
  }
}

describe('the stable Hatsu guide', () => {
  it('stays absent for a one-step technique', () => {
    expect(hatsuTechniqueGuide(context('enhance'))).toBeNull()
  })

  it('names both steps of a portal without depending on the HUD', () => {
    const first = hatsuTechniqueGuide(context('portal'))
    expect(first?.status).toBe(copy.guides.worm.first(copy.comboMaster.control))

    const world: TourWorld = {
      ...EMPTY_WORLD,
      worm: { a: 'room-a', b: '', crossings: 0 },
    }
    const second = hatsuTechniqueGuide(context('portal', world))
    expect(second?.status).toBe(
      copy.guides.worm.second('room:room-a', copy.comboMaster.control),
    )
  })

  it('reports forced Zetsu before offering Emperor Time again', () => {
    const world: TourWorld = { ...EMPTY_WORLD, forcedZetsu: 42 }
    const result = hatsuTechniqueGuide(context('scarlet', world))
    expect(result?.status).toBe(copy.guides.emperorTime.zetsu(42))
    expect(result?.detail).toBe(copy.guides.emperorTime.zetsuDetail)
  })

  it('moves Order Stamp from stamping to locking', () => {
    const world: TourWorld = {
      ...EMPTY_WORLD,
      solids: { puppet: { stamped: true } },
    }
    const result = hatsuTechniqueGuide(context('command', world))
    expect(result?.status).toBe(copy.guides.stamp.stamped(1, 20))
    expect(result?.detail).toBe(copy.guides.stamp.lock(copy.comboMaster.control))
  })
})
