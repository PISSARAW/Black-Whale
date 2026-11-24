import { describe, expect, it } from 'vitest'
import {
  readHudModePreference,
  resolveFightHudMode,
  saveHudModePreference,
  toggleHudModePreference,
} from './hudMode'

describe('resolveFightHudMode', () => {
  it('defaults to tactical in versus-ai combat', () => {
    expect(resolveFightHudMode({ state: { mode: 'versus-ai' } })).toBe('tactical')
  })

  it('defaults to omniscient in training, versus-local, and replays', () => {
    expect(resolveFightHudMode({ state: { mode: 'training' } })).toBe('omniscient')
    expect(resolveFightHudMode({ state: { mode: 'versus-local' } })).toBe('omniscient')
    expect(resolveFightHudMode({ state: { mode: 'versus-ai' }, replay: true })).toBe('omniscient')
  })

  it('respects explicit player preference overrides', () => {
    expect(resolveFightHudMode({ state: { mode: 'versus-ai' }, preference: 'omniscient' })).toBe(
      'omniscient',
    )
    expect(resolveFightHudMode({ state: { mode: 'training' }, preference: 'tactical' })).toBe(
      'tactical',
    )
  })

  it('persists and restores the player HUD preference safely', () => {
    const data = new Map<string, string>()
    const storage = {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => {
        data.set(key, value)
      },
    }
    expect(readHudModePreference(storage)).toBe('auto')
    saveHudModePreference('omniscient', storage)
    expect(readHudModePreference(storage)).toBe('omniscient')
    data.set('black-whale:clash-hud-mode:v1', 'invalid')
    expect(readHudModePreference(storage)).toBe('auto')
    expect(toggleHudModePreference('tactical')).toBe('omniscient')
    expect(toggleHudModePreference('omniscient')).toBe('tactical')
  })
})
