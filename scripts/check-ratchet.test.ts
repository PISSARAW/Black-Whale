import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * The ADR-002 ratchet, checked rather than trusted.
 *
 * `eslint.config.js` grandfathers the files that were over the length and
 * complexity bounds the day those bounds were set. That list is only useful if
 * it can shrink and cannot grow: an entry added is a file that was allowed past
 * the limit instead of being split, which is the one thing the rule exists to
 * prevent. ESLint cannot tell the difference — both states lint green — so the
 * comparison is made here, against the same file as of the baseline commit.
 *
 * The second test closes the other door. An inline disable directive exempts a
 * file just as effectively as a list entry, and nothing counts it, so those
 * directives are banned outright: past the bound, a file either gets split or
 * gets named in the list, where the next reader can see the debt.
 */

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const CONFIG = 'eslint.config.js'
const SELF = 'scripts/check-ratchet.test.ts'

const RATCHETS = ['max-lines', 'complexity'] as const

/** The paths named between a ratchet's two sentinel comments. */
function entriesOf(source: string, ratchet: string): string[] | null {
  const between = source.match(
    new RegExp(`>>> cliquet ADR-002 \\(${ratchet}\\)([\\s\\S]*?)<<< cliquet ADR-002`),
  )
  if (!between) return null
  return [...between[1].matchAll(/'([^']+)'/g)].map((m) => m[1])
}

const git = (args: string[]) =>
  execFileSync('git', args, {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 16,
    stdio: ['ignore', 'pipe', 'ignore'],
  })

/**
 * The commit this branch is measured against: where it left `main`, so a branch
 * cannot add an entry in one commit and be judged only on the next. Falls back
 * to the parent commit when `main` is not fetched, and throws when neither
 * exists — an unverifiable ratchet is a ratchet that is not holding.
 */
function baselineRef(): string {
  for (const candidate of ['origin/main', 'main']) {
    try {
      return git(['merge-base', 'HEAD', candidate]).trim()
    } catch {
      /* that ref is not in this checkout */
    }
  }
  return git(['rev-parse', 'HEAD~1']).trim()
}

const current = readFileSync(ROOT + CONFIG, 'utf8')
const baseline = git(['show', `${baselineRef()}:${CONFIG}`])

describe('ADR-002 ratchet', () => {
  it.each(RATCHETS)('the %s exemption list can only shrink', (ratchet) => {
    const now = entriesOf(current, ratchet)
    if (now === null) throw new Error(`the ${ratchet} sentinel comments are missing from ${CONFIG}`)

    expect([...new Set(now)], 'the list has duplicate entries').toEqual(now)

    const before = entriesOf(baseline, ratchet)
    // The commit that introduces the sentinels has nothing to be compared to.
    if (before === null) return

    const added = now.filter((path) => !before.includes(path))
    expect(
      added,
      `added to the ${ratchet} exemption list. Split the file instead of exempting it.`,
    ).toEqual([])
  })

  it('no file exempts itself with an inline disable', () => {
    const banned = new RegExp(
      ['eslint', 'disable'].join('-') + String.raw`[^\n]*\b(max-lines|complexity|max-params)\b`,
    )
    const offenders = git(['ls-files', 'apps', 'packages', 'scripts'])
      .split('\n')
      .filter((path) => /\.(ts|js|mjs|svelte)$/.test(path) && path !== SELF)
      .filter((path) => banned.test(readFileSync(ROOT + path, 'utf8')))

    expect(offenders, 'these files silence a ratchet rule in place').toEqual([])
  })
})
