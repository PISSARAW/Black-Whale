import { describe, expect, it } from 'vitest'
import { resolveRegionLocationSlug } from './mapAssetRegistry'

/**
 * The deck SVGs name their clickable regions independently of the catalogue, so
 * every region has to be translated before it is compared to a location slug.
 * These cases are the ones a suffix match used to get wrong: the room rendered,
 * and it rendered empty however many people the archive placed inside it.
 */
describe('resolveRegionLocationSlug', () => {
  it('translates regions whose name is not a suffix of their slug', () => {
    expect(resolveRegionLocationSlug('king-quarters')).toBe('tier-1-king-living-quarters')
    expect(resolveRegionLocationSlug('t5-warehouses')).toBe('tier-5-warehouse')
    expect(resolveRegionLocationSlug('t3-cinema')).toBe('tier-3-cineplex')
    expect(resolveRegionLocationSlug('t3-residential-ord')).toBe('tier-3-residential-standard')
    expect(resolveRegionLocationSlug('vip-detention')).toBe('tier-1-vip-jail')
    expect(resolveRegionLocationSlug('beyond-cell')).toBe('tier-1-vvip-prison-beyond')
    expect(resolveRegionLocationSlug('t2-screening-room')).toBe('tier-2-screening-room')
  })

  it('resolves prince apartments from their room number', () => {
    expect(resolveRegionLocationSlug('room-1014')).toBe('tier-1-royal-residential-sector-room-1014')
    expect(resolveRegionLocationSlug('room-1001')).toBe('tier-1-royal-residential-sector-room-1001')
  })

  it('does not mistake other numbered rooms for prince apartments', () => {
    expect(resolveRegionLocationSlug('room-3101')).toBe('tier-3-residential-room-3101')
    expect(resolveRegionLocationSlug('room-37564')).toBe('tier-5-area-37564')
  })

  it('returns null for regions the catalogue does not cover yet', () => {
    expect(resolveRegionLocationSlug('t4-dist-west')).toBeNull()
    expect(resolveRegionLocationSlug('t4-medical-limited')).toBeNull()
    expect(resolveRegionLocationSlug(null)).toBeNull()
  })
})
