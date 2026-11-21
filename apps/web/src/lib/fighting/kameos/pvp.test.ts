import { describe, expect, it } from 'vitest'
import { ClashPvpRegistry } from '$lib/server/clashPvp'
import { createFight } from '../engine'
import { createFightEnvironment } from '../fightEnvironment'
import { decodePvpView } from '../pvp/client'
import { pvpConfigHash } from '../pvp/config'
import { parsePvpSetup } from '../pvp/protocol'
import { PVP_RULESET, type PvpSetup } from '../pvp/types'
import { privatePvpState } from '../pvp/view'
import { kameoSetupField, parseKameoPicks } from './pvp'
import { withKameos } from './state'

const base = () => ({
  player: 'kurapika',
  opponent: 'hisoka',
  formatId: 'knockout',
  environment: createFightEnvironment(),
})

describe('kameos in private PvP (lot 8)', () => {
  it('accepts only catalogue kameos keyed by seat', () => {
    expect(parseKameoPicks(undefined)).toEqual({})
    expect(parseKameoPicks({ player: 'tubeppa', opponent: 'morena' })).toEqual({
      player: 'tubeppa',
      opponent: 'morena',
    })
    expect(parseKameoPicks({ player: 'illumi' })).toBeNull()
    expect(parseKameoPicks({ referee: 'tubeppa' })).toBeNull()
    expect(parseKameoPicks(['tubeppa'])).toBeNull()
    expect(parseKameoPicks('tubeppa')).toBeNull()
  })

  it('carries kameos through the setup parser, and omits an empty choice', () => {
    expect(parsePvpSetup({ ...base(), kameos: { player: 'luzurus' } })?.kameos).toEqual({
      player: 'luzurus',
    })
    expect(parsePvpSetup({ ...base(), kameos: { player: 'illumi' } })).toBeNull()
    expect(parsePvpSetup(base())).not.toHaveProperty('kameos')
    expect(parsePvpSetup({ ...base(), kameos: {} })).not.toHaveProperty('kameos')
    expect(kameoSetupField({ player: undefined })).toEqual({})
  })

  it('hashes a setup without kameos like one that never mentions them', () => {
    const plain = parsePvpSetup(base()) as PvpSetup
    const empty = parsePvpSetup({ ...base(), kameos: {} }) as PvpSetup
    expect(pvpConfigHash(empty)).toBe(pvpConfigHash(plain))
    const partnered = parsePvpSetup({ ...base(), kameos: { opponent: 'marayam' } }) as PvpSetup
    expect(pvpConfigHash(partnered)).not.toBe(pvpConfigHash(plain))
  })

  it('starts the authoritative match with the setup kameos', () => {
    const registry = new ClashPvpRegistry(
      () => 1_000,
      () => 'id',
    )
    const setup = parsePvpSetup({ ...base(), kameos: { player: 'tubeppa', opponent: 'morena' } })!
    const host = registry.create(setup)
    const view = decodePvpView(registry.view(host.matchId, host.token))
    expect(view.kameos?.player?.fighter.id).toBe('tubeppa')
    expect(view.kameos?.opponent?.fighter.id).toBe('morena')
  })

  it('shows each seat its own kameo as the player and redacts the opposing one', () => {
    const state = withKameos(createFight('kurapika', 'hisoka'), {
      player: 'tubeppa',
      opponent: 'morena',
    })
    const secret = {
      ...state,
      kameos: {
        player: {
          ...state.kameos!.player!,
          fighter: { ...state.kameos!.player!.fighter, heardWords: ['a'] },
        },
        opponent: {
          ...state.kameos!.opponent!,
          fighter: { ...state.kameos!.opponent!.fighter, heardWords: ['b'] },
        },
      },
    } as unknown as typeof state
    const host = privatePvpState(secret, 'player')
    expect(host.kameos?.player?.fighter.heardWords).toEqual(['a'])
    expect(host.kameos?.opponent?.fighter.heardWords).toBeUndefined()
    const guest = privatePvpState(secret, 'opponent')
    expect(guest.kameos?.player?.fighter.id).toBe('morena')
    expect(guest.kameos?.player?.fighter.heardWords).toEqual(['b'])
    expect(guest.kameos?.opponent?.fighter.id).toBe('tubeppa')
    expect(guest.kameos?.opponent?.fighter.heardWords).toBeUndefined()
  })

  it('names the new ruleset', () => {
    expect(PVP_RULESET.startsWith('clash-pvp-7:')).toBe(true)
  })
})
