import { describe, expect, it } from 'vitest'
import { princeApartmentPlan } from '$lib/components/map/projection/princeApartmentPlan'
import { theShip, validateBlueprint } from './blueprint'
import { PRINCE_APARTMENT_PARTITIONS } from './princeApartmentPlans'

const ship = theShip()

const signature = (room: number) => {
  const prefix = `tier-1-royal-residential-sector-room-${room}-`
  return JSON.stringify(
    ship.plans
      .get(`interior-room-${room}`)!
      .spaces.map((space) => [space.id.replace(prefix, ''), space.footprint]),
  )
}

describe('the fourteen chapter 363 prince-apartment transcriptions', () => {
  it('keeps one explicit partition record and one distinct plan per prince', () => {
    expect(PRINCE_APARTMENT_PARTITIONS.map(({ room }) => room)).toEqual(
      Array.from({ length: 14 }, (_, index) => 1001 + index),
    )
    expect(new Set(PRINCE_APARTMENT_PARTITIONS.map(({ room }) => signature(room))).size).toBe(14)
  })

  it('projects the exact Tour walls into the Ship local map', () => {
    for (let room = 1001; room <= 1014; room += 1) {
      const tourWalls = ship.plans
        .get(`interior-room-${room}`)!
        .walls.filter((wall) => !wall.structureId && !wall.jambOf)
      expect(princeApartmentPlan(room)?.walls, String(room)).toHaveLength(tourWalls.length)
    }
  })

  it('keeps every transcribed apartment navigable and every moved fixture valid', () => {
    expect(validateBlueprint()).toEqual([])
  })
})
