import { describe, expect, it } from 'vitest'
import { POSTCARD_STAMPS, POSTCARD_STAMP_BACKING } from './postcardStamps'

function luminance(hex: string): number {
  const channels = [hex.slice(1, 3), hex.slice(3, 5), hex.slice(5, 7)].map((channel) => {
    const value = Number.parseInt(channel, 16) / 255
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
}

function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((left, right) => right - left)
  return (light + 0.05) / (dark + 0.05)
}

describe('postcard stamp legibility', () => {
  it('keeps every ink readable against the scene-independent paper backing', () => {
    for (const stamp of POSTCARD_STAMPS) {
      expect(contrast(stamp.ink, POSTCARD_STAMP_BACKING), stamp.id).toBeGreaterThanOrEqual(4.5)
    }
  })
})
