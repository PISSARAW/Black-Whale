import { describe, expect, it } from 'vitest'
import abilities from '../../../../../data/abilities/abilities.json'
import events from '../../../../../data/events/events.json'
import { GET } from './+server'

describe('discovery documents', () => {
  it('lists every localized ability and event with stable catalogue dates', async () => {
    const response = GET({} as never) as Response
    const xml = await response.text()
    expect(xml).toContain(`/abilities/${abilities[0].id}`)
    expect(xml).toContain(`/fr/abilities/${abilities[0].id}`)
    expect(xml).toContain(`/events/${events[0].id}`)
    expect(xml).toContain(`/fr/events/${events[0].id}`)
    expect(xml).toContain(`<lastmod>${abilities[0].modifiedAt}</lastmod>`)
    expect(xml).not.toContain(new Date().toISOString())
  })
})
