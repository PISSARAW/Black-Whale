import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  analyticsContext,
  connectAnalytics,
  enableAnalytics,
  safeReferrer,
  trackEvent,
  trackHatsuUse,
  trackPage,
} from './client'

describe('private usage collection', () => {
  beforeEach(() => {
    enableAnalytics(false)
    vi.stubGlobal('window', { location: { pathname: '/fr/ship' } })
    vi.stubGlobal('navigator', { webdriver: false })
    vi.stubGlobal('localStorage', { getItem: () => null })
  })

  it('combines locales and distinguishes Morena from Tour', () => {
    expect(analyticsContext('/fr/tour/morena?challenge=private#cards')).toEqual({
      path: '/tour/morena',
      locale: 'fr',
      section: 'tour',
      mode: 'tour-morena',
    })
    expect(analyticsContext('/tour/modes').mode).toBe('tour')
    expect(analyticsContext('/timeline').mode).toBe('timeline')
    expect(safeReferrer('https://example.com/search?q=secret#name')).toBe('https://example.com')
  })

  it('preserves the route of queued events and removes private URL data', () => {
    const payloads: Record<string, unknown>[] = []
    enableAnalytics(true)
    trackPage('/fr/ship')
    window.location.pathname = '/tour'
    trackHatsuUse('bungee-gum', 'elastic', 'applied')
    connectAnalytics({
      track: (build) =>
        payloads.push(
          build({
            url: '/wrong?secret=yes',
            title: 'Private',
            referrer: 'https://example.com/?q=secret',
          }),
        ),
    })
    expect(payloads[0]).toMatchObject({
      url: '/ship',
      title: '/ship',
      referrer: 'https://example.com',
    })
    expect(payloads[1]).toMatchObject({
      name: 'section_enter',
      url: '/ship',
      data: { mode: 'ship', locale: 'fr' },
    })
    expect(payloads[2]).toMatchObject({
      name: 'hatsu_use',
      url: '/tour',
      data: { surface_hatsu: 'tour / bungee-gum' },
    })
    expect(JSON.stringify(payloads)).not.toContain('secret')
  })

  it('does not send before configuration, on duplicate navigation, or after opting out', () => {
    const track = vi.fn()
    connectAnalytics({ track })
    trackEvent('mode_start')
    expect(track).not.toHaveBeenCalled()
    enableAnalytics(true)
    trackPage('/ship')
    trackPage('/ship')
    expect(track).toHaveBeenCalledTimes(2)
    vi.stubGlobal('localStorage', { getItem: () => '1' })
    trackEvent('mode_start')
    expect(track).toHaveBeenCalledTimes(2)
  })

  it('ignores automation and collector failures without breaking play', () => {
    enableAnalytics(true)
    const track = vi.fn(() => {
      throw new Error('blocked')
    })
    connectAnalytics({ track })
    expect(() => trackEvent('mode_start')).not.toThrow()
    vi.stubGlobal('navigator', { webdriver: true })
    trackEvent('mode_start')
    expect(track).toHaveBeenCalledTimes(1)
  })
})
