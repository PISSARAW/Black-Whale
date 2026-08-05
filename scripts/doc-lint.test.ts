import { execFileSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'

const ROOT = new URL('..', import.meta.url).pathname

describe('doc-lint', () => {
  it('passes on the real docs tree', () => {
    const out = execFileSync('pnpm', ['doc-lint'], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    expect(out).toContain('doc-lint: OK')
  })
})
