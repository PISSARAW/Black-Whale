import { describe, it, expect } from 'vitest'
import { fullPool, poolOf } from '../aura'
import { EN_COST, EN_RADIUS, sweepEn, type EnBody } from './en'

const inside: EnBody = { id: 'player', position: [5, 0], nen: 'ten' }
const outside: EnBody = { id: 'far', position: [EN_RADIUS + 1, 0], nen: 'ten' }

function cast(bodies: EnBody[], pool = fullPool()) {
  return sweepEn(pool, { origin: [0, 0], caster: 'ten', bodies })
}

describe('a sweep of En', () => {
  it('costs fifteen and finds what is inside the radius', () => {
    const { pool, sweep } = cast([inside, outside])
    expect(pool.available).toBe(100 - EN_COST)
    expect(sweep?.found).toEqual(['player'])
  })

  it('is felt by everything it finds — looking is not quiet', () => {
    expect(cast([inside]).sweep?.felt).toEqual(['player'])
  })

  it('does not reach past its radius, either way', () => {
    const { sweep } = cast([outside])
    expect(sweep?.found).toEqual([])
    expect(sweep?.felt).toEqual([])
  })

  it('is refused when the fifteen is not there', () => {
    const { pool, sweep } = cast([inside], poolOf(10))
    expect(sweep).toBeNull()
    expect(pool.available).toBe(10)
  })

  it('cannot be cast from Zetsu', () => {
    const { sweep, pool } = sweepEn(fullPool(), {
      origin: [0, 0],
      caster: 'zetsu',
      bodies: [inside],
    })
    expect(sweep).toBeNull()
    expect(pool.available).toBe(100)
  })
})

describe('Zetsu against a sweep', () => {
  const hidden: EnBody = { id: 'player', position: [5, 0], nen: 'zetsu' }

  it('is found as a physical intrusion without exposing an aura signature', () => {
    expect(cast([hidden]).sweep?.found).toEqual(['player'])
    expect(cast([hidden]).sweep?.auraRead).toEqual([])
  })

  it('does not feel the sweep go past — invisibility costs the warning', () => {
    expect(cast([hidden]).sweep?.felt).toEqual([])
  })

  it('still costs the caster the fifteen: he does not know he found nothing cheaply', () => {
    expect(cast([hidden]).pool.available).toBe(100 - EN_COST)
  })
})
