import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'
import { findDocumentationFiles } from './doc-stage-pages'

describe('documentation checkout boundaries', () => {
  it('visits the current checkout, including hidden docs, but excludes nested repositories', () => {
    const root = mkdtempSync(join(tmpdir(), 'bw-docs-'))
    try {
      const docs = ['README.md', 'docs/guide.md', '.agents/README.md']
      const excluded = [
        '.git/internal.md',
        'node_modules/pkg/README.md',
        '.claude/worktrees/other/docs/README.md',
        'vendor/repository/README.md',
      ]
      for (const file of [...docs, ...excluded]) {
        const path = join(root, file)
        mkdirSync(join(path, '..'), { recursive: true })
        writeFileSync(path, '# Documentation\n')
      }
      writeFileSync(join(root, '.claude/worktrees/other/.git'), 'gitdir: /elsewhere\n')
      mkdirSync(join(root, 'vendor/repository/.git'))
      expect(
        findDocumentationFiles(root)
          .map((path) => relative(root, path))
          .sort(),
      ).toEqual(docs.sort())
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
})
