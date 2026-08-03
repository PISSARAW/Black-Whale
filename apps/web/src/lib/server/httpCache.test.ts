import { describe, expect, it } from 'vitest'
import { cachePolicyFor, cannotLeakAcrossReaders } from './httpCache'

/**
 * The property that matters is not how long a page is cached but that no cache
 * can hand one reader a page built for another. Everything the archive serves
 * depends on the reader's spoiler cap, so it is asserted over routes rather
 * than over the handful somebody remembered to list.
 */

const ROUTES = [
  '/',
  '/characters',
  '/characters/hisoka',
  '/abilities',
  '/timeline',
  '/tour',
  '/tour/sources',
  '/ship',
  '/map',
  '/compare',
  '/relationships',
  '/reconstruction',
  '/investigation',
  '/arena',
  '/hunt',
  '/simulations',
  '/simulations/branch-1',
  '/spoiler-limit',
  '/health',
]

describe('what may be cached', () => {
  it('never lets a cache mix two readers, whatever the route', () => {
    for (const path of ROUTES) {
      expect(cannotLeakAcrossReaders(cachePolicyFor({ method: 'GET', path })), path).toBe(true)
    }
  })

  it('stores nothing that carries visitor state', () => {
    for (const path of ['/simulations', '/simulations/branch-1', '/spoiler-limit', '/health']) {
      expect(cachePolicyFor({ method: 'GET', path }).cacheControl, path).toBe('no-store')
    }
  })

  it('covers the sub-paths of a stateful route, not just its root', () => {
    expect(cachePolicyFor({ method: 'GET', path: '/simulations/x/y' }).cacheControl).toBe(
      'no-store',
    )
    // …and does not swallow a route that merely starts with the same letters.
    expect(cachePolicyFor({ method: 'GET', path: '/simulationsummary' }).cacheControl).not.toBe(
      'no-store',
    )
  })

  it('stores no response to a write', () => {
    for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
      expect(cachePolicyFor({ method, path: '/characters' }).cacheControl, method).toBe('no-store')
    }
  })

  it('lets a shared cache hold a canon page, keyed by the cookie', () => {
    const policy = cachePolicyFor({ method: 'GET', path: '/characters/hisoka' })

    expect(policy.cacheControl).toContain('s-maxage=600')
    expect(policy.cacheControl).toContain('stale-while-revalidate=86400')
    expect(policy.vary).toBe('Cookie')
  })
})
