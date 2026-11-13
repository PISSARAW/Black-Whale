import { describe, expect, it } from 'vitest'
import { discoverySources } from './hooks.server'

describe('AI discovery logs', () => {
  it.each(['GPTBot', 'OAI-SearchBot', 'ClaudeBot', 'PerplexityBot'])(
    'recognises %s without retaining an address',
    (crawler) => {
      const sources = discoverySources(
        new Request('https://exploreblackwhale.com/abilities', {
          headers: { 'user-agent': `Mozilla/5.0 compatible; ${crawler}/1.0` },
        }),
      )
      expect(sources).toEqual([{ sourceType: 'crawler', source: crawler }])
      expect(JSON.stringify(sources)).not.toMatch(/ip|address/i)
    },
  )

  it('recognises supported referral hosts but not lookalikes', () => {
    expect(
      discoverySources(
        new Request('https://exploreblackwhale.com/', {
          headers: { referer: 'https://chatgpt.com/c/abc' },
        }),
      ),
    ).toEqual([{ sourceType: 'referral', source: 'chatgpt.com' }])
    expect(
      discoverySources(
        new Request('https://exploreblackwhale.com/', {
          headers: { referer: 'https://chatgpt.com.example.test/' },
        }),
      ),
    ).toEqual([])
  })
})
