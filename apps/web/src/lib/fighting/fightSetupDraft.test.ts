import { afterEach, describe, expect, it, vi } from 'vitest'
import { defaultFightSetup, readFightSetup, saveFightSetup } from './fightSetupDraft'

afterEach(() => vi.unstubAllGlobals())

function storage() {
  const values = new Map<string, string>()
  vi.stubGlobal('sessionStorage', {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  })
  return values
}

describe('Clash setup restoration', () => {
  it('restores the selected matchup, mode, format and stage after a refresh', () => {
    storage()
    const draft = defaultFightSetup()
    draft.player = 'benjamin'
    draft.opponent = 'chrollo'
    draft.mode = 'versus-local'
    draft.format = 'knockout'
    draft.environment.stageId = 'heavens-arena'
    draft.environment.arenaInteractions = false
    saveFightSetup(draft)
    expect(readFightSetup()).toEqual(draft)
  })

  it('restores support choices and rejects invalid support ids', () => {
    const values = storage()
    const draft = {
      ...defaultFightSetup(),
      kameos: { player: 'tubeppa' as const, opponent: 'morena' as const },
    }
    saveFightSetup(draft)
    expect(readFightSetup()).toEqual(draft)
    const key = [...values.keys()][0]
    values.set(
      key,
      JSON.stringify({ ...JSON.parse(values.get(key)!), kameos: { player: 'missing' } }),
    )
    expect(readFightSetup()).not.toHaveProperty('kameos')
  })

  it('rejects obsolete selections and malformed browser storage', () => {
    const values = storage()
    saveFightSetup(defaultFightSetup())
    const key = [...values.keys()][0]
    for (const data of [
      '{',
      'null',
      '42',
      '{"player":"missing","stageId":"missing","mode":"missing","format":null}',
    ]) {
      values.set(key, data)
      expect(readFightSetup()).toEqual(defaultFightSetup())
    }
  })

  it('remains playable when browser storage is unavailable', () => {
    vi.stubGlobal('sessionStorage', {
      getItem: () => {
        throw new Error('disabled')
      },
      setItem: () => {
        throw new Error('disabled')
      },
    })
    expect(() => saveFightSetup(defaultFightSetup())).not.toThrow()
    expect(readFightSetup()).toEqual(defaultFightSetup())
  })
})
