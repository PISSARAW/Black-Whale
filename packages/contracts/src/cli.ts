#!/usr/bin/env node
import { canonLint, formatFindings } from './lint.js'

/**
 * `pnpm canon-lint`. Answers non-zero on the first contradiction, so it can
 * gate a pull request the way lint and typecheck already do.
 */
const { findings } = canonLint()
// `console.warn` rather than `log`: the repo forbids `console.log` outside
// operator tools, and this is one — it writes to stderr on purpose so a build
// log keeps the report next to the failure.
console.warn(formatFindings(findings))
process.exit(findings.length === 0 ? 0 : 1)
