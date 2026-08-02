import { describe, expect, it } from 'vitest'
import type { HatsuProfile } from '$lib/nen/hatsuRegistry'
import { arenaHatsuEffect, worksInArena } from './hatsu'

function profile(kind: HatsuProfile['kind']): HatsuProfile {
  return {
    id: kind,
    name: kind,
    owner: 'test',
    kind,
    instruction: '',
    rule: '',
    cost: '',
    color: '',
    action: '',
  }
}

describe('Arena Hatsu adapter', () => {
  it('maps canonical interaction kinds onto duel mechanics', () => {
    expect(arenaHatsuEffect(profile('elastic'))).toBe('bind')
    expect(arenaHatsuEffect(profile('barrage'))).toBe('barrage')
    expect(arenaHatsuEffect(profile('healing'))).toBe('restore')
    expect(arenaHatsuEffect(profile('rhythm'))).toBe('enhance')
  })

  it('rejects techniques whose rules have no direct duel expression', () => {
    expect(worksInArena('prophecy')).toBe(false)
    expect(arenaHatsuEffect(profile('prophecy'))).toBeNull()
  })
})
