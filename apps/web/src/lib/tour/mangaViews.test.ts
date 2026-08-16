import { describe, expect, it } from 'vitest'
import { theShip } from './blueprint'
import { pointInPolygon, structureFootprint } from './geometry'
import { MANGA_VIEWS, mangaViewById, viewsForSpace } from './mangaViews'

describe('manga photo viewpoints', () => {
  const ship = theShip()

  it('has a unique, bilingual, traceable entry for every panel view', () => {
    expect(new Set(MANGA_VIEWS.map((view) => view.id)).size).toBe(MANGA_VIEWS.length)

    for (const view of MANGA_VIEWS) {
      expect(view.label.trim(), view.id).not.toBe('')
      expect(view.labelFr.trim(), view.id).not.toBe('')
      expect(view.chapter, view.id).toBeGreaterThanOrEqual(350)
      expect(view.volume, view.id).toBeGreaterThanOrEqual(34)
    }
  })

  it('lands every camera inside the room named by the manga view', () => {
    for (const view of MANGA_VIEWS) {
      const space = ship.spaces.get(view.spaceId)
      expect(space, view.id).toBeDefined()
      expect(pointInPolygon(view.at, space!.footprint), view.id).toBe(true)
      expect(Number.isFinite(view.heading), view.id).toBe(true)
      expect(Number.isFinite(view.pitch), view.id).toBe(true)

      if (view.eyeHeight === undefined) {
        const oneMetreAhead: [number, number] = [
          view.at[0] - Math.sin(view.heading),
          view.at[1] - Math.cos(view.heading),
        ]
        expect(pointInPolygon(oneMetreAhead, space!.footprint), `${view.id} faces out`).toBe(true)
      } else {
        expect(view.eyeHeight, view.id).toBeGreaterThan(1.7)
      }

      const plan = ship.plans.get(space!.tierId)!
      const obstruction = plan.structures.find(
        (structure) =>
          structure.spaceId === space!.id && pointInPolygon(view.at, structureFootprint(structure)),
      )
      expect(obstruction?.id, `${view.id} starts inside the scenery`).toBeUndefined()
    }
  })

  it('offers the cineplex establishing shot from every zone of the same hall', () => {
    for (const spaceId of [
      'tier-3-cineplex-concession',
      'tier-3-cineplex-screen-corridor',
      'tier-3-cineplex-ticket-desk',
    ]) {
      expect(viewsForSpace(spaceId).map((view) => view.id)).toContain('cineplex-establishing-shot')
    }
  })

  it('offers the chapter 363 aerial plan all around the princely quarter', () => {
    const plan = mangaViewById('princely-quarter-aerial-plan')

    expect(plan).toMatchObject({ chapter: 363, volume: 35, pages: '49–50' })
    expect(plan?.eyeHeight).toBeGreaterThanOrEqual(30)
    expect(plan?.pitch).toBeLessThan(-0.9)
    for (const spaceId of [
      'tier-1-royal-residential-corridor-port',
      'tier-1-royal-residential-corridor-starboard',
      'tier-1-royal-residential-corridor-aft',
      'tier-1-royal-residential-cross-gap-8',
    ]) {
      expect(viewsForSpace(spaceId)).toContain(plan)
    }
  })

  it("carries the character blocking drawn in Nasubi's establishing panel", () => {
    const view = mangaViewById('nasubi-living-mantel')
    expect(view?.eventSequence).toBe(1)
    expect(view?.staging).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ characterId: 'nasubi-hui-guo-rou', pose: 'seated' }),
        expect.objectContaining({ characterId: 'prince-halkenburg' }),
      ]),
    )
  })

  it('offers the two Tier 1 rooms enriched from their manga panels', () => {
    expect(viewsForSpace('tier-1-supreme-court').map((view) => view.id)).toContain(
      'supreme-court-bench-seal',
    )
    expect(viewsForSpace('tier-1-queens-living-quarters-room-01').map((view) => view.id)).toContain(
      'unma-nursery-salon',
    )
  })

  it('offers Morena’s Tier 2 office with both players staged at the game table', () => {
    const view = mangaViewById('morena-office-negotiation-game')

    expect(viewsForSpace('tier-2-heilly-secret-hideout-office')).toContain(view)
    expect(view?.staging?.map(({ characterId }) => characterId)).toEqual([
      'morena-prudo',
      'borksen',
    ])
  })

  it('offers both the furnished room and bathroom-trap compositions for room 3101', () => {
    expect(viewsForSpace('tier-3-residential-room-3101-living').map(({ id }) => id)).toEqual(
      expect.arrayContaining(['room-3101-bunks-storage', 'room-3101-bathroom-trap']),
    )
  })

  it('offers the Tier 4 briefing from behind the U-shaped table', () => {
    const view = mangaViewById('royal-army-briefing-audience')

    expect(viewsForSpace('tier-4-royal-army-conference-room-floor')).toContain(view)
    expect(view?.pages).toBe('189')
    expect(view?.staging?.[0]?.characterId).toBe('mizaistom-nana')
  })

  it('offers each of the three panel-shown rooms inside the Tier 5 Cha-R office', () => {
    expect(viewsForSpace('tier-5-cha-r-family-office-main-office').map(({ id }) => id)).toContain(
      'cha-r-emblem-three-doors',
    )
    expect(viewsForSpace('tier-5-cha-r-family-office-bedroom').map(({ id }) => id)).toContain(
      'cha-r-bunks-bookshelves',
    )
    expect(viewsForSpace('tier-5-cha-r-family-office-monitor-room').map(({ id }) => id)).toContain(
      'cha-r-cctv-monitor-room',
    )
  })
})
