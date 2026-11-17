import { describe, expect, it } from 'vitest'
import { get } from 'svelte/store'
import { createFight } from '../engine'
import { FIGHTING_ROSTER } from '../roster'
import { fightReplayHash } from '../fightReplayHash'
import { introduction, ending, resolvedCeremonyWinner } from './ceremony'
import { characterLine, DIALOGUES } from './dialogues'
import { rivalLine, RIVALS } from './rivals'
import { defaultPreferences } from './collection'
import { createPresentationProfile, PRESENTATION_STORAGE } from './profile'
import { emptySoloSave, SOLO_STORAGE } from '../solo/storage'

function memory() {
  const data = new Map<string, string>()
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value)
    },
  }
}
describe('original presentation without private knowledge or Nen changes', () => {
  it('covers precisely the forty selected fighters with distinct bilingual lines', () => {
    const ids = FIGHTING_ROSTER.map(({ id }) => id)
    expect(Object.keys(DIALOGUES).sort()).toEqual(ids.sort())
    for (const language of ['fr', 'en'] as const) {
      expect(new Set(ids.map((id) => characterLine(id, language))).size).toBe(40)
      expect(new Set(ids.map((id) => characterLine(id, language, true))).size).toBe(40)
    }
  })
  it.each(RIVALS)('has reciprocal original introductions for $pair', ({ pair }) => {
    for (const language of ['fr', 'en'] as const) {
      for (const [actor, other] of [pair, [...pair].reverse()] as const) {
        const state = createFight(actor, other)
        const hash = fightReplayHash(state)
        const text = introduction(state, language, 'player')
        expect(text).toBe(rivalLine({ actor, other, language }))
        expect(text).not.toBe(characterLine(actor, language))
        state.opponent.secretWindow = {
          target: 'player',
          attachedAt: 1,
          observation: { frame: 1, action: 'special' },
        }
        expect(introduction(state, language, 'player')).toBe(text)
        state.opponent.secretWindow = undefined
        expect(fightReplayHash(state)).toBe(hash)
      }
    }
  })
  it('uses no rival text for a mirror, or an unrelated pairing', () => {
    expect(rivalLine({ actor: 'hisoka', other: 'hisoka', language: 'fr' })).toBeNull()
    expect(introduction(createFight('bill', 'hisoka'), 'en', 'player')).toBe(
      characterLine('bill', 'en'),
    )
  })
  it('waits for the real verdict including Cat’s Name and forecasts, and distinguishes round/time/match', () => {
    const state = createFight('kurapika', 'camilla')
    expect(ending(state, 'fr')).toBeNull()
    state.phase = 'finished'
    state.winner = 'player'
    expect(ending(state, 'fr')).toContain('Manche terminée.')
    state.finishReason = 'time'
    state.matchWinner = 'player'
    const hash = fightReplayHash(state)
    expect(ending(state, 'en')).toContain('Match complete. Time has expired.')
    expect(fightReplayHash(state)).toBe(hash)
    state.catsName = { victimSide: 'opponent', killerSide: 'player', frame: 1 }
    expect(ending(state, 'fr')).toBeNull()
    state.catsName = undefined
    state.forecastSimulation = true
    expect(resolvedCeremonyWinner(state)).toBeNull()
    state.forecastSimulation = false
    state.winner = 'draw'
    expect(ending(state, 'en')).toBeNull()
    state.winner = 'player'
    state.parallelFuture = {
      owner: 'player',
      phase: 'vision',
      preparation: 0,
      cursor: 0,
      previewCursor: 0,
      frames: [],
      controls: null,
    }
    expect(ending(state, 'en')).toBeNull()
  })
})
describe('local earned collection', () => {
  it('rejects locked titles and palettes; loads earned rewards without altering solo data', () => {
    const storage = memory(),
      profile = createPresentationProfile(() => storage)
    profile.configure({ title: 'escort', player: 'ivory', opponent: 'slate' })
    expect(get(profile).preferences).toEqual({ ...defaultPreferences(), opponent: 'slate' })
    const save = JSON.stringify({ ...emptySoloSave(), routes: ['escort', 'reading'] })
    storage.setItem(SOLO_STORAGE, save)
    profile.configure({ title: 'reading', player: 'ivory' })
    const loaded = createPresentationProfile(() => storage)
    loaded.load()
    expect(get(loaded).preferences).toEqual({
      version: 1,
      title: 'reading',
      player: 'ivory',
      opponent: 'slate',
    })
    expect(storage.getItem(SOLO_STORAGE)).toBe(save)
    storage.setItem(SOLO_STORAGE, JSON.stringify(emptySoloSave()))
    loaded.load()
    expect(get(loaded).preferences.title).toBe('none')
    expect(get(loaded).preferences.player).toBe('native')
  })
  it.each(['{', '{"version":99}', '{"version":1,"player":"bogus","title":"admin"}'])(
    'sanitizes invalid saves: %s',
    (text) => {
      const storage = memory()
      storage.setItem(PRESENTATION_STORAGE, text)
      const profile = createPresentationProfile(() => storage)
      profile.load()
      expect(get(profile).preferences).toEqual(defaultPreferences())
    },
  )
  it('revalidates unlocks and preserves another tab’s unrelated selection on configure', () => {
    const storage = memory(),
      a = createPresentationProfile(() => storage),
      b = createPresentationProfile(() => storage)
    a.load()
    b.load()
    a.configure({ player: 'slate' })
    b.configure({ opponent: 'slate' })
    a.load()
    expect(get(a).preferences).toEqual({
      ...defaultPreferences(),
      player: 'slate',
      opponent: 'slate',
    })
    storage.setItem(SOLO_STORAGE, 'invalid')
    a.configure({ title: 'duelist' })
    expect(get(a).preferences.title).toBe('none')
  })
  it('resets preferences when their persisted key is removed in another tab', () => {
    const storage = memory(),
      profile = createPresentationProfile(() => storage)
    profile.configure({ player: 'slate' })
    storage.setItem(PRESENTATION_STORAGE, '')
    profile.load()
    expect(get(profile).preferences).toEqual(defaultPreferences())
  })
  it('retains session colours with unavailable storage and never grants locked rewards', () => {
    const profile = createPresentationProfile(() => undefined)
    profile.load()
    profile.configure({ player: 'slate' })
    profile.ensureLoaded()
    expect(get(profile).preferences.player).toBe('slate')
    expect(get(profile).persisted).toBe(false)
    profile.configure({ title: 'reading', opponent: 'ivory' })
    expect(get(profile).preferences.title).toBe('none')
    expect(get(profile).preferences.opponent).toBe('native')
    const denied = createPresentationProfile(() => {
      throw Error('denied')
    })
    expect(() => denied.configure({ player: 'slate' })).not.toThrow()
    expect(get(denied).preferences.player).toBe('slate')
  })
})
