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

      const oneMetreAhead: [number, number] = [
        view.at[0] - Math.sin(view.heading),
        view.at[1] - Math.cos(view.heading),
      ]
      expect(pointInPolygon(oneMetreAhead, space!.footprint), `${view.id} faces out`).toBe(true)

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
})
