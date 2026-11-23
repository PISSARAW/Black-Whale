import { describe, expect, it } from 'vitest'
import { resolveFightHudMode } from './hudMode'

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
    expect(
      resolveFightHudMode({ state: { mode: 'versus-ai' }, preference: 'omniscient' }),
    ).toBe('omniscient')
    expect(
      resolveFightHudMode({ state: { mode: 'training' }, preference: 'tactical' }),
    ).toBe('tactical')
  })
})
