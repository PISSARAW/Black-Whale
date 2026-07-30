import { describe, expect, it } from 'vitest'
import { beliefStateFor, visualStateFor } from './knowledge-map.js'

describe('visualStateFor', () => {
  it('reads a closed interval as outdated whatever the observer held', () => {
    expect(visualStateFor('KNOWN', 'DIRECT_OBSERVATION', true)).toBe('outdated')
    expect(visualStateFor('SUSPECTED', 'RUMOR', true)).toBe('outdated')
  })

  it('keeps a rumour a rumour even when it is held as known', () => {
    expect(visualStateFor('KNOWN', 'RUMOR', false)).toBe('rumor')
  })

  it('distinguishes what was seen from what was reported', () => {
    expect(visualStateFor('KNOWN', 'DIRECT_OBSERVATION', false)).toBe('known')
    expect(visualStateFor('KNOWN', 'TOLD_BY_OTHER', false)).toBe('reported')
    expect(visualStateFor('KNOWN', 'DOCUMENT', false)).toBe('reported')
  })

  it('maps the remaining epistemic states, and falls back rather than guessing', () => {
    expect(visualStateFor('BELIEVED', null, false)).toBe('believed')
    expect(visualStateFor('SUSPECTED', null, false)).toBe('suspected')
    expect(visualStateFor('DOUBTED', null, false)).toBe('contradicted')
    expect(visualStateFor('REJECTED', null, false)).toBe('rejected')
    expect(visualStateFor('SOMETHING_NEW', null, false)).toBe('unknown')
  })
})

describe('beliefStateFor', () => {
  it('grades a bare belief by the confidence the archive stored', () => {
    expect(beliefStateFor(0.9, false)).toBe('believed')
    expect(beliefStateFor(0.5, false)).toBe('suspected')
    expect(beliefStateFor(0.1, false)).toBe('rumor')
  })

  it('reports a superseded belief as outdated', () => {
    expect(beliefStateFor(0.9, true)).toBe('outdated')
  })
})
