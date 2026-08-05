import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { globSync } from 'fast-glob'
import { Project } from 'ts-morph'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))

const INDEX_PATTERNS = ['packages/*/src/index.ts', 'apps/web/src/lib/*/index.ts']

export function generateSymbols(): string {
  const project = new Project()
  const indexFiles = globSync(INDEX_PATTERNS, { cwd: ROOT, onlyFiles: true, dot: true })
  for (const file of indexFiles) project.addSourceFileAtPath(join(ROOT, file))

  const sections: { heading: string; rows: string[] }[] = []

  for (const sourceFile of project.getSourceFiles().sort((a, b) =>
    a.getFilePath().localeCompare(b.getFilePath()),
  )) {
    const filePath = relative(ROOT, sourceFile.getFilePath())
    const exports = sourceFile.getExportedDeclarations()
    const sourceLines = sourceFile.getFullText().split('\n')
    const rows: string[] = []
    for (const [name, decls] of exports) {
      const decl = decls[0]
      if (!decl) continue
      const origin = decl.getSourceFile()
      let originPath = relative(ROOT, origin.getFilePath())
      let line = decl.getStartLineNumber()
      if (originPath.includes('node_modules')) {
        originPath = filePath
        const exportLine = sourceLines.findIndex((l) => new RegExp(`\\bexport\\b.*\\b${name}\\b`).test(l))
        line = exportLine === -1 ? decl.getStartLineNumber() : exportLine + 1
      }
      rows.push(`| \`${name}\` | \`${originPath}:${line}\` |`)
    }
    if (!rows.length) continue
    sections.push({ heading: `## \`${filePath}\``, rows: rows.sort() })
  }

  let out = '# Index des symboles publics\n\n'
  out += `Entrées analysées : ${sections.length}\n\n`
  for (const section of sections) {
    out += `${section.heading}\n\n`
    out += '| Symbole | Définition |\n| ------- | ---------- |\n'
    out += `${section.rows.join('\n')}\n\n`
  }
  return out
}
