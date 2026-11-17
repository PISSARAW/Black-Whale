interface Reference {
  version: number
  ruleset: string
  protocol: string
  replayVersion: number
  seed: number
  premises: unknown
  catalog: unknown
  sourceFingerprint: string
  rows: { id: string; digest: string }[]
}

export function compareCombatReference(expected: Reference, actual: Reference) {
  const before = new Map(expected.rows.map((row) => [row.id, row.digest]))
  const after = new Map(actual.rows.map((row) => [row.id, row.digest]))
  const changed = [...new Set([...before.keys(), ...after.keys()])].filter(
    (id) => before.get(id) !== after.get(id),
  )
  const versionChanged = versions(expected) !== versions(actual)
  const definitionsChanged =
    JSON.stringify([expected.premises, expected.catalog]) !==
    JSON.stringify([actual.premises, actual.catalog])
  const duplicateIds = before.size !== expected.rows.length || after.size !== actual.rows.length
  return {
    pass: !versionChanged && !definitionsChanged && !duplicateIds && changed.length === 0,
    versionChanged,
    definitionsChanged,
    duplicateIds,
    changed,
    sourceChanged: expected.sourceFingerprint !== actual.sourceFingerprint,
  }
}

function versions(reference: Reference) {
  return JSON.stringify([
    reference.version,
    reference.ruleset,
    reference.protocol,
    reference.replayVersion,
    reference.seed,
  ])
}
