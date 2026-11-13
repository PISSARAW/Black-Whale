import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * The ADR-002 ratchet, checked rather than trusted.
 *
 * `eslint.config.js` grandfathers the files that were over the length and
 * complexity bounds the day those bounds were set. That list is only useful if
 * it can shrink and cannot grow. It may follow a byte-identical file across a
 * move — splitting a route shell from its existing implementation must not
 * strand the debt at the URL-shaped filename — but it may not cover one new
 * line. ESLint cannot tell the difference, so the comparison is made here,
 * against the same files as of the baseline commit.
 *
 * The second test closes the other door. An inline disable directive exempts a
 * file just as effectively as a list entry, and nothing counts it, so those
 * directives are banned outright: past the bound, a file either gets split or
 * gets named in the list, where the next reader can see the debt.
 */

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const CONFIG = 'eslint.config.js'
const SELF = 'scripts/check-ratchet.test.ts'
const LINE_CEILINGS = 'scripts/ratchet-lines.json'

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
 *
 * `BW_RATCHET_BASE` names another ref instead, which is how the check itself
 * gets exercised: run it against HEAD with an entry added by hand and it must
 * go red.
 */
function baselineRef(): string {
  const forced = process.env.BW_RATCHET_BASE
  if (forced) return git(['rev-parse', forced]).trim()
  for (const candidate of ['origin/main', 'main']) {
    try {
      return git(['merge-base', 'HEAD', candidate]).trim()
    } catch {
      /* that ref is not in this checkout */
    }
  }
  return git(['rev-parse', 'HEAD~1']).trim()
}

const BASELINE = baselineRef()
const current = readFileSync(ROOT + CONFIG, 'utf8')
const baseline = git(['show', `${BASELINE}:${CONFIG}`])

type LineCeilings = Record<string, number>

function lineCount(path: string): number {
  return readFileSync(ROOT + path, 'utf8')
    .replace(/\r?\n$/, '')
    .split(/\r?\n/).length
}

function baselineCeilings(): LineCeilings | null {
  try {
    return JSON.parse(git(['show', `${BASELINE}:${LINE_CEILINGS}`])) as LineCeilings
  } catch {
    // The file introduces this stricter half of the ratchet. Once it is on
    // main, every branch is compared with it like the exemption lists above.
    return null
  }
}

/** True only when `to` is the baseline file moved without changing one byte. */
function unchangedMove(from: string, to: string): boolean {
  if (!existsSync(ROOT + to)) return false
  try {
    return readFileSync(ROOT + to, 'utf8') === git(['show', `${BASELINE}:${from}`])
  } catch {
    return false
  }
}

describe('ADR-002 ratchet', () => {
  it.each(RATCHETS)('the %s exemption list can only shrink', (ratchet) => {
    const now = entriesOf(current, ratchet)
    if (now === null) throw new Error(`the ${ratchet} sentinel comments are missing from ${CONFIG}`)

    expect([...new Set(now)], 'the list has duplicate entries').toEqual(now)

    const before = entriesOf(baseline, ratchet)
    // The commit that introduces the sentinels has nothing to be compared to.
    if (before === null) return

    const removed = before.filter((path) => !now.includes(path))
    const added = now
      .filter((path) => !before.includes(path))
      .filter((path) => !removed.some((oldPath) => unchangedMove(oldPath, path)))
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
      .filter((path) => {
        // Still tracked, already deleted on disk: a split in progress, mid-commit.
        if (!existsSync(ROOT + path)) return false
        return banned.test(readFileSync(ROOT + path, 'utf8'))
      })

    expect(offenders, 'these files silence a ratchet rule in place').toEqual([])
  })

  it('grandfathered tour files cannot grow past their recorded ceiling', () => {
    const ceilings = JSON.parse(readFileSync(ROOT + LINE_CEILINGS, 'utf8')) as LineCeilings
    const over = Object.entries(ceilings)
      .filter(([path, ceiling]) => !existsSync(ROOT + path) || lineCount(path) > ceiling)
      .map(
        ([path, ceiling]) =>
          `${path}: ${existsSync(ROOT + path) ? lineCount(path) : 'missing'} > ${ceiling}`,
      )
    expect(over, 'split the file or lower its line count; never raise the ceiling').toEqual([])
  })

  it('recorded line ceilings can only shrink', () => {
    const before = baselineCeilings()
    if (!before) return
    const now = JSON.parse(readFileSync(ROOT + LINE_CEILINGS, 'utf8')) as LineCeilings
    const removed = Object.keys(before).filter((path) => !(path in now))
    const raised = Object.entries(now)
      .filter(([path, ceiling]) => {
        if (path in before) return ceiling > before[path]!
        return !removed.some(
          (oldPath) => ceiling <= before[oldPath]! && unchangedMove(oldPath, path),
        )
      })
      .map(([path]) => path)
    expect(raised, 'line ceilings were added or raised').toEqual([])
  })
})
