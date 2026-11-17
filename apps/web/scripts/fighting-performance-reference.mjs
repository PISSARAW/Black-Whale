import { execFileSync } from 'node:child_process'
import path from 'node:path'

const FILES = [
  'src/lib/fighting/fightRenderer.ts',
  'src/lib/fighting/lsdfScene.ts',
  'src/lib/fighting/stageShipRoom.ts',
  'src/lib/fighting/fightReplayHash.ts',
  'src/lib/fighting/parallelFutureForecast.ts',
]

/** A/B the rendering changes with the very same current engine, fixture and probe. */
export function renderReference(root, ref, files = FILES) {
  if (!ref) return null
  if (!files.every((file) => FILES.includes(file)))
    throw Error('Unknown performance reference file')
  const revision = execFileSync('git', ['rev-parse', '--verify', `${ref}^{commit}`], {
    cwd: root,
    encoding: 'utf8',
  }).trim()
  const sources = new Map(
    files.map((file) => [
      path.join(root, file),
      execFileSync('git', ['show', `${revision}:apps/web/${file}`], {
        cwd: root,
        encoding: 'utf8',
      }),
    ]),
  )
  return {
    revision,
    files,
    plugin: {
      name: 'fight-render-reference',
      enforce: 'pre',
      load(id) {
        return sources.get(id) ?? null
      },
    },
  }
}
