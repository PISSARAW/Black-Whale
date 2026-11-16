import { cloneReplayValue, safeReplayKey, type ReplayValue } from './clashReplayCodec'

export interface ReplayPatch {
  path: string[]
  remove?: true
  value?: ReplayValue
}
export function replayChanges(before: unknown, after: unknown): ReplayPatch[] {
  const patches: ReplayPatch[] = []
  diff({ before, after, path: [] }, patches)
  return patches
}
function record(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}
function diff(
  context: { before: unknown; after: unknown; path: string[] },
  patches: ReplayPatch[],
) {
  const { before, after, path } = context
  if (Object.is(before, after)) return
  if (!record(before) || !record(after)) {
    patches.push({ path, value: cloneReplayValue(after) as ReplayValue })
    return
  }
  for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
    const child = [...path, key]
    if (!Object.hasOwn(after, key)) patches.push({ path: child, remove: true })
    else if (!Object.hasOwn(before, key))
      patches.push({ path: child, value: cloneReplayValue(after[key]) as ReplayValue })
    else diff({ before: before[key], after: after[key], path: child }, patches)
  }
}
export function applyReplayChanges<T>(state: T, patches: readonly ReplayPatch[]): T {
  if (!patches.length) return state
  const result = cloneReplayValue(state)
  for (const patch of patches) applyPatch(result as Record<string, unknown>, patch)
  return result
}
function applyPatch(root: Record<string, unknown>, patch: ReplayPatch) {
  if (!patch.path.length || patch.path.some((key) => !safeReplayKey(key)))
    throw Error('replay-path')
  let target = root
  for (const key of patch.path.slice(0, -1)) {
    const next = target[key]
    if (!next || typeof next !== 'object') throw Error('replay-path')
    target = next as Record<string, unknown>
  }
  const key = patch.path.at(-1)!
  if (patch.remove) delete target[key]
  else target[key] = cloneReplayValue(patch.value)
}
