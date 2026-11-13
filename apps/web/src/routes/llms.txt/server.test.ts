import { describe, expect, it } from 'vitest'
import { GET } from './+server'

describe('llms.txt', () => {
  it('is a short, cached Markdown guide to the canonical indexes', async () => {
    const response = GET({} as never) as Response
    const body = await response.text()
    expect(response.headers.get('content-type')).toBe('text/plain; charset=utf-8')
    expect(response.headers.get('cache-control')).toContain('max-age=3600')
    expect(body).toContain('# Black Whale')
    expect(body).toContain('/abilities')
    expect(body).toContain('/sitemap.xml')
    expect(body.length).toBeLessThan(3_000)
  })
})
