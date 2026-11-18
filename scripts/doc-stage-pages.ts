import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

export const DOCUMENTATION_IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  '.svelte-kit',
  '.gen',
  'coverage',
  'archive',
  'dist',
])

/** A nested checkout owns its documentation and resolves paths against its own root. */
export function findDocumentationFiles(dir: string): string[] {
  const files: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (DOCUMENTATION_IGNORED_DIRS.has(entry.name) || existsSync(join(path, '.git'))) continue
      files.push(...findDocumentationFiles(path))
    } else if (entry.isFile() && entry.name.endsWith('.md')) files.push(path)
  }
  return files
}
