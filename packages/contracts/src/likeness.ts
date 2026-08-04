import type { Catalogue, Finding } from './types.js'

/**
 * The rules `appearance.json` cannot state about itself — ADR-005 §2.1.
 *
 * A schema can say that a likeness is well formed. It cannot say that the
 * person it describes exists, and that is the only rule that matters here: the
 * whole doctrine of this file is that a face is declared against a panel, so an
 * entry naming somebody the catalogue has never heard of is an invented
 * passenger arriving by the one door ADR-003 left unlocked.
 *
 * Kept out of `invariants.ts` for the reason `inhabitants.ts` is: that file is
 * near the five hundred lines ADR-002 allows, and a rule is easier to find in
 * the file named after its subject.
 */

type Invariant = (catalogue: Catalogue) => Finding[]

function finding(rule: string, where: string, message: string): Finding {
  return { rule, where, message }
}

/**
 * Every likeness names somebody the catalogue holds, and names them once.
 *
 * Both halves of ADR-005 §2.1's anti-invention test. The duplicate check is not
 * decoration: two entries for one id is a face that silently wins or loses
 * depending on which the projection reads first, which is precisely the class
 * of defect a closed table is supposed to make impossible.
 */
const likenessesNameSomebodyReal: Invariant = ({ characters, appearance }) => {
  const known = new Set(characters.map((entry) => entry.id))
  const findings: Finding[] = []
  const seen = new Set<string>()

  const rows = [
    ...appearance.declared.map((entry) => ['declared', entry.id] as const),
    ...appearance.deferred.map((entry) => ['deferred', entry.id] as const),
  ]
  for (const [list, id] of rows) {
    if (!known.has(id)) {
      findings.push(
        finding(
          'likeness-names-somebody-real',
          `appearance.${list}#${id}`,
          'no character with this id: a likeness may only describe somebody the catalogue already holds',
        ),
      )
    }
    if (seen.has(id)) {
      findings.push(
        finding('likeness-names-somebody-real', `appearance#${id}`, 'declared more than once'),
      )
    }
    seen.add(id)
  }
  return findings
}

export const LIKENESS_INVARIANTS: ReadonlyArray<{ name: string; run: Invariant }> = [
  { name: 'likeness-names-somebody-real', run: likenessesNameSomebodyReal },
]
