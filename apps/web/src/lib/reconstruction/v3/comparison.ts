export interface ComparableWorldState {
  presences: Readonly<Record<string, { locationId?: string; precision: string; certainty: string }>>
  bodyStates: Readonly<Record<string, string>>
  consciousnessByBody: Readonly<Record<string, string | null>>
  abilitiesByOwner: Readonly<Record<string, readonly string[]>>
}

export interface BranchDifference {
  subjectId: string
  axis: 'location' | 'body-state' | 'consciousness' | 'ability'
  status: 'added' | 'removed' | 'changed'
  canonical: unknown
  branch: unknown
}

export function compareWorldBranches(
  canonical: ComparableWorldState,
  branch: ComparableWorldState,
): BranchDifference[] {
  return [
    ...compareRecords('location', canonical.presences, branch.presences),
    ...compareRecords('body-state', canonical.bodyStates, branch.bodyStates),
    ...compareRecords('consciousness', canonical.consciousnessByBody, branch.consciousnessByBody),
    ...compareRecords(
      'ability',
      normalizeLists(canonical.abilitiesByOwner),
      normalizeLists(branch.abilitiesByOwner),
    ),
  ].sort(
    (left, right) =>
      left.subjectId.localeCompare(right.subjectId) || left.axis.localeCompare(right.axis),
  )
}

function compareRecords(
  axis: BranchDifference['axis'],
  canonical: Readonly<Record<string, unknown>>,
  branch: Readonly<Record<string, unknown>>,
): BranchDifference[] {
  const ids = new Set([...Object.keys(canonical), ...Object.keys(branch)])
  const differences: BranchDifference[] = []
  for (const subjectId of ids) {
    const before = canonical[subjectId]
    const after = branch[subjectId]
    if (canonicalJson(before) === canonicalJson(after)) continue
    differences.push({
      subjectId,
      axis,
      status: before === undefined ? 'added' : after === undefined ? 'removed' : 'changed',
      canonical: before ?? null,
      branch: after ?? null,
    })
  }
  return differences
}

function normalizeLists(
  records: Readonly<Record<string, readonly string[]>>,
): Record<string, string[]> {
  return Object.fromEntries(
    Object.entries(records).map(([id, values]) => [id, [...new Set(values)].sort()]),
  )
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${key}:${canonicalJson(entry)}`)
      .join(',')}}`
  }
  return JSON.stringify(value)
}
