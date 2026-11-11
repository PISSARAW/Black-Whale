import { describe, expect, it } from 'vitest'
import type { Apparition } from '../apparitions'
import { MANGA_ZHANG_LEI_VIEWS } from '../mangaZhangLeiViews'
import { stageBeastsForMangaView } from './mangaBeastStage'

const view = MANGA_ZHANG_LEI_VIEWS[0]
const beast: Apparition = {
  id: 'cast-beast:prince-zhanglei',
  at: [8, -1],
  heading: 0,
  y: 2,
  spaceId: view.spaceId,
  tierId: 'interior-room-1003',
  kind: 'wheel',
  size: 0.7,
  colour: 0x9aa6c4,
  stage: 0,
  hidden: false,
}

describe('source-panel guardian blocking', () => {
  it('locates an existing guardian behind Zhang Lei, without changing its height or visibility', () => {
    expect(stageBeastsForMangaView([beast], view)).toEqual([
      { ...beast, at: [2.75, -2.7], heading: Math.PI / 2 },
    ])
  })
  it('omits only the guardian explicitly absent from a Zetsu panel', () => {
    const omitted = { ...view, beastStaging: [{ ownerId: 'prince-zhanglei', omit: true }] }
    expect(stageBeastsForMangaView([beast], omitted)).toEqual([])
    const elsewhere = { ...beast, spaceId: 'another-room' }
    expect(stageBeastsForMangaView([elsewhere], omitted)).toEqual([elsewhere])
  })
  it('never creates an absent or spoiler-hidden guardian', () => {
    expect(stageBeastsForMangaView([], view)).toEqual([])
  })
  it('leaves ordinary navigation and beasts in other rooms unchanged', () => {
    expect(stageBeastsForMangaView([beast], null)).toEqual([beast])
    const elsewhere = { ...beast, spaceId: 'another-room' }
    expect(stageBeastsForMangaView([elsewhere], view)).toEqual([elsewhere])
  })
})
