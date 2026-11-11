import { describe, expect, it } from 'vitest'
import type { Cookies } from '@sveltejs/kit'
import { SPOILER_COOKIE } from '$lib/server/spoiler'
import { load } from './+page.server'

function cookiesWith(cap?: number): Cookies {
  return {
    get: (name: string) => (name === SPOILER_COOKIE && cap !== undefined ? String(cap) : undefined),
  } as unknown as Cookies
}

function run(cap?: number) {
  return load({ params: { caseId: 'eleven-seconds' }, cookies: cookiesWith(cap) } as never)
}

describe('investigation case spoiler boundary', () => {
  it('opens a case when the reader reached its required chapter', () => {
    expect(run(370)).toMatchObject({ caseId: 'eleven-seconds' })
  })

  it('answers as missing before the required chapter', () => {
    expect(() => run(369)).toThrowError(expect.objectContaining({ status: 404 }))
  })

  it('opens the case when no spoiler cap is configured', () => {
    expect(run()).toMatchObject({ spoilerLimit: null })
  })
})
