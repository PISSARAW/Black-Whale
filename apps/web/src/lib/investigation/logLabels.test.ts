import { describe, expect, it } from 'vitest'
import { localizedRoom1014Case } from './localizedCase'
import { logEntryLabel } from './logLabels'

const english = localizedRoom1014Case('en')

describe('notebook log labels', () => {
  it('reads entries written in French back in the current language', () => {
    expect(
      logEntryLabel({ id: 'discovery:wounds', kind: 'DISCOVERY', label: 'Perforations' }, english),
    ).toBe('Multiple puncture wounds')
    expect(
      logEntryLabel({ id: 'hypothesis:hidden-nen', kind: 'HYPOTHESIS', label: 'x' }, english),
    ).toBe('A hidden user triggered a remote Nen ability')
    expect(
      logEntryLabel({ id: 'question:bill:bill-seen', kind: 'DISCOVERY', label: 'x' }, english),
    ).toBe('What did you see when the attack happened?')
  })

  it('keeps the stored label for what the case cannot name again', () => {
    expect(logEntryLabel({ id: 'verdict:1', kind: 'VERDICT', label: 'Dossier' }, english)).toBe(
      'Dossier',
    )
  })
})
