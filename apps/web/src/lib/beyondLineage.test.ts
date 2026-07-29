import { describe, expect, it } from 'vitest'
import {
  BEYOND_LINEAGE_CONFIRMED_CHAPTER,
  BEYOND_LINEAGE_SUSPECTED_CHAPTER,
  isLineageVisible,
  visibleLineage,
  type BeyondLineage,
} from './beyondLineage'

const marked: BeyondLineage = {
  status: 'confirmed',
  revealedInChapterId: 'ch-415',
  evidence: 'birthmark',
}
const rumoured: BeyondLineage = {
  status: 'suspected',
  revealedInChapterId: 'ch-401',
  evidence: 'Longhi’s hypothesis',
}

describe('Beyond lineage spoiler gating', () => {
  it('shows both claims when the reader has no cap', () => {
    expect(isLineageVisible(marked)).toBe(true)
    expect(isLineageVisible(rumoured)).toBe(true)
  })

  it('releases the hypothesis before the birthmark', () => {
    const between = BEYOND_LINEAGE_CONFIRMED_CHAPTER - 1
    expect(BEYOND_LINEAGE_SUSPECTED_CHAPTER).toBeLessThan(BEYOND_LINEAGE_CONFIRMED_CHAPTER)
    expect(isLineageVisible(rumoured, between)).toBe(true)
    expect(isLineageVisible(marked, between)).toBe(false)
  })

  it('reveals each claim exactly on its own chapter', () => {
    expect(isLineageVisible(rumoured, BEYOND_LINEAGE_SUSPECTED_CHAPTER)).toBe(true)
    expect(isLineageVisible(rumoured, BEYOND_LINEAGE_SUSPECTED_CHAPTER - 1)).toBe(false)
    expect(isLineageVisible(marked, BEYOND_LINEAGE_CONFIRMED_CHAPTER)).toBe(true)
  })

  it('drops the field rather than returning a censored one', () => {
    expect(visibleLineage(marked, 400)).toBeUndefined()
    expect(visibleLineage(undefined, 999)).toBeUndefined()
    expect(visibleLineage(marked, 999)).toBe(marked)
  })
})
