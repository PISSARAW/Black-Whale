import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { frameDataMarkdown } from './frameDataTable'

describe('generated frame data table', () => {
  it('is up to date with the movesets (run `pnpm fighting:frames`)', () => {
    const file = fileURLToPath(new URL('./FRAME_DATA.md', import.meta.url))
    expect(readFileSync(file, 'utf8')).toBe(frameDataMarkdown())
  })
})
