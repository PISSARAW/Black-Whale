import { canonLint, findDataRoot, formatFindings, type Catalogue } from '@black-whale/contracts'

/**
 * `data/`, parsed and validated, or nothing.
 *
 * The compiler reads the same files canon-lint checks, through the same
 * schemas — so a field it relies on cannot quietly change shape. The deploy
 * runs canon-lint before this, but a compiler invoked by hand deserves the
 * same guarantee rather than a `TypeError` two hundred rows in.
 */
export function loadCatalogue(dataRoot: string = findDataRoot()): Catalogue {
  const { catalogue, findings } = canonLint(dataRoot)
  if (!catalogue) throw new Error(formatFindings(findings))
  return catalogue
}
