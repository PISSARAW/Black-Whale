import { createHash } from 'node:crypto'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { join, dirname } from 'node:path'
import fg from 'fast-glob'
import type { FightReplay } from '../apps/web/src/lib/fighting/fightReplayTypes'

export const sha256 = (text: string) => createHash('sha256').update(text).digest('hex')

/** Content hashes include uncommitted code; no environment files or account data are read. */
export async function referenceSources(options: { copyTo?: string } = {}) {
  const paths = await fg(
    [
      'apps/web/src/**/*.{ts,svelte,json}',
      'packages/*/src/**/*.{ts,json}',
      'packages/*/dist/**/*.{js,json}',
      'packages/*/package.json',
      'data/**/*.json',
      'scripts/*combat-reference*.ts',
      'package.json',
      'pnpm-lock.yaml',
      'pnpm-workspace.yaml',
      'tsconfig.json',
      'apps/web/{package.json,tsconfig.json,vite.config.ts,svelte.config.js}',
    ],
    { ignore: ['**/*.test.ts', '**/*.spec.ts', '**/*.d.ts'], onlyFiles: true },
  )
  const files = await Promise.all(
    paths.sort().map(async (path) => {
      const content = await readFile(path, 'utf8')
      if (options.copyTo) {
        const destination = join(options.copyTo, path)
        await mkdir(dirname(destination), { recursive: true })
        await writeFile(destination, content)
      }
      return { path, sha256: sha256(content) }
    }),
  )
  return {
    runtime: {
      node: process.version,
      pnpm: execFileSync('pnpm', ['--version'], { encoding: 'utf8' }).trim(),
    },
    commit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
    trackedChanges: execFileSync('git', ['diff', '--name-only', 'HEAD'], { encoding: 'utf8' })
      .trim()
      .split('\n')
      .filter(Boolean),
    fingerprint: sha256(JSON.stringify(files)),
    files,
  }
}

export async function writeReferenceReplay(output: string, id: string, replay: FightReplay) {
  const directory = join(output, 'replays')
  await mkdir(directory, { recursive: true })
  const file = `${id}.bw-replay.json`
  await writeFile(join(directory, file), JSON.stringify(replay) + '\n')
  return `replays/${file}`
}

export async function writeReferenceJson(path: string, value: unknown) {
  await writeFile(path, JSON.stringify(value, null, 2) + '\n')
}

export function archiveReferenceReplays(options: { output: string; destination: string }) {
  execFileSync('tar', ['-czf', options.destination, '-C', options.output, 'replays'], {
    env: { ...process.env, COPYFILE_DISABLE: '1' },
  })
}

export async function archiveReferenceSources(options: {
  output: string
  destination: string
  files: { path: string }[]
}) {
  const list = join(options.output, 'source-files.txt')
  await writeFile(list, options.files.map((file) => file.path).join('\n') + '\n')
  execFileSync('tar', ['-czf', options.destination, '-T', list], {
    env: { ...process.env, COPYFILE_DISABLE: '1' },
  })
}
