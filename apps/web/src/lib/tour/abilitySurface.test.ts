import { describe, expect, it, vi } from 'vitest'
import { presentationFor } from '$lib/nen/abilityPresentation'
import {
  tourAbilitySurfaceAdapter,
  tourActionAvailability,
  tourCommandFor,
  tourSupportsAbility,
} from './abilitySurface'

const reasons = {
  unsupported: 'unsupported',
  targetRequired: 'target required',
  inRequired: 'In required',
  nothingHeld: 'nothing held',
}

describe('the tour ability surface', () => {
  it('routes all eight families to the existing ship and body reducers', () => {
    expect(tourCommandFor('bungee-gum', 'attach')).toBe('cast-primary')
    expect(tourCommandFor('bungee-gum', 'release')).toBe('release-world')
    expect(tourCommandFor('illumi-needle-people', 'plant-needle')).toBe('cast-body')
    expect(tourCommandFor('illumi-needle-people', 'remove-needle')).toBe('release-bodies')
    expect(tourCommandFor('theta-aura-projectile', 'test')).toBe('cast-body')
    expect(tourCommandFor('yomotsu-hegui', 'consummate')).toBe('cast-body')
    expect(tourCommandFor('body-and-soul', 'interrogate')).toBe('cast-body')
    expect(tourCommandFor('damage-sweet-home', 'link')).toBe('cast-body')
    expect(tourCommandFor('stand-by-me', 'lend')).toBe('cast-body')
    expect(tourCommandFor('bohemian-rhapsody', 'merge')).toBe('cast-body')
    expect(tourCommandFor('bungee-gum', 'program-post-mortem')).toBeNull()
    expect(tourSupportsAbility('stand-by-me')).toBe(true)
    expect(tourSupportsAbility('contagion')).toBe(false)
  })

  it('keeps a non-representable use visible but inexecutable', () => {
    const presentation = presentationFor('bungee-gum')!
    expect(
      tourActionAvailability(
        {
          presentation,
          targetId: 'target',
          bodyTargetId: 'target',
          bodyRefusal: null,
          concealed: false,
          bodyHolds: 0,
          worldHolds: 0,
          reasons,
        },
        'program-post-mortem',
      ),
    ).toEqual({ executable: false, reason: 'unsupported' })
  })

  it('requires a body for Needle People and In for a concealed trap', () => {
    const needle = presentationFor('illumi-needle-people')!
    const gum = presentationFor('bungee-gum')!
    const state = {
      targetId: null,
      bodyTargetId: null,
      bodyRefusal: null,
      concealed: false,
      bodyHolds: 0,
      worldHolds: 0,
      reasons,
    }
    expect(tourActionAvailability({ ...state, presentation: needle }, 'plant-needle')).toEqual({
      executable: false,
      reason: 'target required',
    })
    expect(tourActionAvailability({ ...state, presentation: gum }, 'set-trap')).toEqual({
      executable: false,
      reason: 'In required',
    })
  })

  it('builds a live view model and dispatches only executable actions', () => {
    const presentation = presentationFor('bungee-gum')!
    const execute = vi.fn()
    const adapter = tourAbilitySurfaceAdapter({
      presentation,
      name: 'Bungee Gum',
      owner: 'Hisoka',
      reducedMotion: false,
      targetId: 'body-hisoka',
      bodyTargetId: 'body-hisoka',
      bodyRefusal: null,
      concealed: true,
      bodyHolds: 1,
      worldHolds: 2,
      reasons,
      execute,
    })
    const model = adapter.modelFor(presentation, 'attach')!
    expect(model.preview).toBe(false)
    expect(model.targets).toEqual(['body-hisoka'])
    expect(model.metrics).toMatchObject({ bodyHolds: 1, worldHolds: 2, concealed: true })
    adapter.dispatch('attach')
    adapter.dispatch('program-post-mortem')
    expect(execute).toHaveBeenCalledOnce()
    expect(execute).toHaveBeenCalledWith('cast-primary')
    expect(adapter.supports?.('attach')).toBe(true)
    expect(adapter.supports?.('program-post-mortem')).toBe(false)
  })

  it('does not mistake a room target for a person required by a body action', () => {
    const presentation = presentationFor('stand-by-me')!
    expect(
      tourActionAvailability(
        {
          presentation,
          targetId: 'tier-1-room-1001',
          bodyTargetId: null,
          bodyRefusal: null,
          concealed: false,
          bodyHolds: 0,
          worldHolds: 0,
          reasons,
        },
        'lend',
      ),
    ).toEqual({ executable: false, reason: 'target required' })
  })

  it('publishes a canon body refusal before dispatching the action', () => {
    const presentation = presentationFor('bohemian-rhapsody')!
    expect(
      tourActionAvailability(
        {
          presentation,
          targetId: 'prince-zhang-lei',
          bodyTargetId: 'prince-zhang-lei',
          bodyRefusal: 'Benjamin is alive',
          concealed: false,
          bodyHolds: 0,
          worldHolds: 0,
          reasons,
        },
        'merge',
      ),
    ).toEqual({ executable: false, reason: 'Benjamin is alive' })
  })
})
