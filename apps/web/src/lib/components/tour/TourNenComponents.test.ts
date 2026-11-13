import { render } from 'svelte/server'
import { createNenTechniqueState } from '@black-whale/nen-engine'
import type { Writable } from 'svelte/store'
import { describe, expect, it, vi } from 'vitest'
import { nenCauseText, nenControlText, nenRefusalText } from '$lib/tour/nenText'
import type { NenCause, NenCauseEntry } from '$lib/tour/nenFeedback'
import type { NenRefusalCode } from '$lib/tour/nenRefusal'
import { page } from '$app/stores'
import TourNenControls from './TourNenControls.svelte'
import TourNenJournal from './TourNenJournal.svelte'

vi.mock('$app/stores', async () => {
  const { writable } = await import('svelte/store')
  return {
    page: writable({ url: new URL('https://example.test/'), data: { localizedContent: {} } }),
  }
})

const REFUSALS = [
  'RESERVE_TOO_LOW',
  'NODES_SHUT',
  'ZETSU_HAS_NO_AURA',
  'RADIUS_MUST_BE_POSITIVE',
  'RYU_DISTRIBUTION_EMPTY',
  'ON_FORCES_RYU',
] satisfies NenRefusalCode[]

const selectLocale = (french: boolean) =>
  (
    page as unknown as Writable<{
      url: URL
      data: { localizedContent: Record<string, string> }
    }>
  ).set({
    url: new URL(french ? 'https://example.test/fr/tour' : 'https://example.test/tour'),
    data: { localizedContent: {} },
  })

const controls = (french: boolean, reason: NenRefusalCode) => {
  selectLocale(french)
  return render(TourNenControls, {
    props: {
      nenState: createNenTechniqueState(),
      availability: { ren: reason },
      open: true,
      french,
      onAction: () => undefined,
    },
  }).body
}

const journalEntries = (): NenCauseEntry[] =>
  REFUSALS.map((reason, index) => ({
    id: index,
    cause: { code: 'ACTION_REFUSED', action: 'REN', reason },
  }))

const CAUSES: NenCause[] = [
  { code: 'ACTION_ACCEPTED', action: 'EN' },
  { code: 'EN_CONTACT', name: 'Sakata' },
  { code: 'PRESSURE_WITNESS', name: 'Babimyna', pressure: 'ren' },
  { code: 'EXHAUSTED' },
  { code: 'SHU_TRACE', objectId: 'glass' },
  { code: 'RUMOR_SPREAD', spaceId: 'room-1014' },
  { code: 'SECURITY_SWEEP', spaceId: 'room-1001' },
]

describe('the bilingual Nen controls', () => {
  it.each([false, true])('renders every refusal without leaking its code (fr=%s)', (french) => {
    for (const code of REFUSALS) {
      const body = controls(french, code)
      expect(body).toContain(nenRefusalText(code, french))
      expect(body).not.toContain(code)
    }
  })

  it.each([false, true])(
    'keeps zones, En radius and shortcuts in the selected language (fr=%s)',
    (french) => {
      const words = nenControlText(french)
      const body = controls(french, 'RESERVE_TOO_LOW')
      for (const zone of Object.values(words.zones)) expect(body).toContain(zone)
      expect(body).toContain(words.enRadius)
      expect(body).toContain(words.shortcuts)
      expect(body).toContain('min="1"')
      expect(body).toContain('max="50"')
      expect(body).toContain('step="1"')
    },
  )
})

describe('the bilingual Nen cause journal', () => {
  it.each([false, true])(
    'announces every localized refusal through aria-live (fr=%s)',
    (french) => {
      selectLocale(french)
      const body = render(TourNenJournal, {
        props: { entries: journalEntries(), french },
      }).body
      for (const code of REFUSALS) {
        expect(body).toContain(nenRefusalText(code, french, true))
        expect(body).not.toContain(code)
      }
      expect(body).toContain('aria-live="polite"')
      expect(body).toContain(french ? 'Journal causal du Nen' : 'Nen cause log')
    },
  )

  it.each([false, true])('renders every causal code in the selected language (fr=%s)', (french) => {
    selectLocale(french)
    const entries = CAUSES.map((cause, id) => ({ id, cause }))
    const body = render(TourNenJournal, { props: { entries, french } }).body
    for (const cause of CAUSES) expect(body).toContain(nenCauseText(cause, french))
  })
})
