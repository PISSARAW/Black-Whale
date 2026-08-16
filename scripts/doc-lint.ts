import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs'
import { join, relative, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import fastGlob from 'fast-glob'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const DOCS = join(ROOT, 'docs')

const LIMITS: Record<number, number> = { 0: 150, 1: 400, 2: 200 }

interface FrontMatter {
  titre?: string
  etage?: number
  couvre?: string[]
  'depend-de'?: string[]
  'revu-le'?: string
  empreinte?: string
  decisions?: string[]
}

function parseFrontMatter(source: string): FrontMatter | null {
  const match = source.match(/^---\n([\s\S]*?)\n---/)
  if (!match) return null
  const body = match[1]
  const result: FrontMatter = {}
  const lines = body.split('\n')
  let currentKey: keyof FrontMatter | null = null
  for (const line of lines) {
    const keyMatch = line.match(/^(\w[\w-]*):\s*(.*)$/)
    if (keyMatch) {
      const key = keyMatch[1] as keyof FrontMatter
      const value = keyMatch[2].trim()
      if (value.startsWith('[') && value.endsWith(']')) {
        result[key] = value
          .slice(1, -1)
          .split(',')
          .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
          .filter(Boolean)
      } else if (value === '' || value === '[]') {
        result[key] = []
        currentKey = key
      } else {
        result[key] = [value]
        currentKey = null
      }
    } else if (line.trim().startsWith('- ') && currentKey) {
      const value = line
        .trim()
        .slice(2)
        .trim()
        .replace(/^['"]|['"]$/g, '')
      const arr = (result[currentKey] as string[]) || []
      arr.push(value)
      result[currentKey] = arr
    }
  }
  if (result.etage !== undefined && typeof result.etage !== 'number') {
    result.etage = Number((result.etage as string[])[0])
  }
  for (const scalar of ['titre', 'revu-le', 'empreinte'] as const) {
    if (result[scalar] !== undefined && Array.isArray(result[scalar])) {
      result[scalar] = (result[scalar] as string[])[0]
    }
  }
  return result
}

function listDocs(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...listDocs(path))
    else if (entry.isFile() && entry.name.endsWith('.md')) out.push(path)
  }
  return out
}

const IGNORED_DIRS = new Set(['node_modules', '.svelte-kit', '.gen', 'coverage', 'archive', 'dist'])

function findStagePages(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (IGNORED_DIRS.has(entry.name)) continue
      out.push(...findStagePages(path))
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      const source = readFileSync(path, 'utf8')
      const fm = parseFrontMatter(source)
      if (fm && (fm.etage === 1 || fm.etage === 2)) out.push(path)
    }
  }
  return out
}

function globExists(pattern: string): boolean {
  if (!pattern.includes('*')) return existsSync(join(ROOT, pattern))
  const matches = fastGlob.sync(pattern, { cwd: ROOT, dot: true })
  return matches.length > 0
}

function pathExists(rawPath: string, baseDir: string): boolean {
  if (rawPath.startsWith('/')) return existsSync(rawPath)
  const isRelativeToFile = rawPath.startsWith('./') || rawPath.startsWith('../')
  if (!isRelativeToFile) {
    if (!rawPath.includes('*')) return existsSync(join(ROOT, rawPath))
    return globExists(rawPath)
  }
  const fromBase = resolve(baseDir, rawPath)
  if (!rawPath.includes('*')) return existsSync(fromBase)
  return globExists(relative(ROOT, fromBase))
}

function extractCodePaths(source: string): string[] {
  const paths = new Set<string>()
  const body = source.replace(/^---\n[\s\S]*?\n---/, '')
  for (const match of body.matchAll(/`([^`\n]+)`/g)) {
    const text = match[1].trim()
    if (!text.includes('/') && !text.includes('\\')) continue
    if (/^https?:\/\//.test(text)) continue
    if (/^\//.test(text)) continue
    if (/\s/.test(text)) continue
    if (text.length < 3) continue
    paths.add(text.replace(/^\.\//, ''))
  }
  return [...paths]
}

function checkCodePaths(source: string, filePath: string): string[] {
  const errors: string[] = []
  const baseDir = dirname(filePath)
  for (const rawPath of extractCodePaths(source)) {
    if (!pathExists(rawPath, baseDir)) {
      errors.push(`chemin de code introuvable dans ${relative(ROOT, filePath)} : \`${rawPath}\``)
    }
  }
  return errors
}

function checkLinks(source: string, filePath: string): string[] {
  const errors: string[] = []
  const baseDir = dirname(filePath)
  for (const match of source.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)) {
    const target = match[2]
    if (!target.endsWith('.md')) continue
    const [cleanTarget] = target.split('#')
    const resolved = resolve(baseDir, cleanTarget)
    if (!existsSync(resolved)) {
      errors.push(`lien mort dans ${relative(ROOT, filePath)} : ${target}`)
    }
  }
  return errors
}

async function checkGenFiles(): Promise<string[]> {
  const errors: string[] = []
  const { generateRoutes, generateTests } = await import('./doc-gen/generate.ts')
  const expectedRoutes = generateRoutes()
  const expectedTests = generateTests()
  const actualRoutes = readFileSync(join(DOCS, '.gen', 'routes.md'), 'utf8').replace(
    /^<!-- généré par pnpm doc:gen — ne pas éditer -->\n\n/,
    '',
  )
  const actualTests = readFileSync(join(DOCS, '.gen', 'tests.md'), 'utf8').replace(
    /^<!-- généré par pnpm doc:gen — ne pas éditer -->\n\n/,
    '',
  )
  if (actualRoutes !== expectedRoutes)
    errors.push('docs/.gen/routes.md est désynchronisé (pnpm doc:gen)')
  if (actualTests !== expectedTests)
    errors.push('docs/.gen/tests.md est désynchronisé (pnpm doc:gen)')
  return errors
}

const COVERAGE_FILE = join(DOCS, '.couverture.json')
const DRIFT_THRESHOLD = 0.15

interface CoverageFile {
  sealedAt: string
  coveredPaths: string[]
  snapshots: Record<string, { revuLe: string; empreinte: string; codeLines: number }>
}

function computeEmpreinte(patterns: string[]): string {
  const sorted = [...patterns].sort()
  return createHash('sha256').update(sorted.join('\n')).digest('hex').slice(0, 7)
}

function countCodeLines(patterns: string[]): number {
  let total = 0
  const seen = new Set<string>()
  for (const pattern of patterns) {
    const files = fastGlob.sync(pattern, {
      cwd: ROOT,
      dot: true,
      onlyFiles: true,
      ignore: [
        '**/node_modules/**',
        '**/.svelte-kit/**',
        '**/.gen/**',
        '**/coverage/**',
        '**/dist/**',
      ],
    })
    for (const file of files) {
      if (seen.has(file)) continue
      seen.add(file)
      const content = readFileSync(join(ROOT, file), 'utf8')
      total += content.split('\n').length
    }
  }
  return total
}

function loadCoverage(): CoverageFile | null {
  if (!existsSync(COVERAGE_FILE)) return null
  return JSON.parse(readFileSync(COVERAGE_FILE, 'utf8')) as CoverageFile
}

function saveCoverage(coverage: CoverageFile): void {
  writeFileSync(COVERAGE_FILE, JSON.stringify(coverage, null, 2) + '\n')
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function updateFrontMatter(
  source: string,
  values: { 'revu-le': string; empreinte: string },
): string {
  return source
    .replace(/^revu-le:\s*[^\n]+/m, `revu-le: ${values['revu-le']}`)
    .replace(/^empreinte:\s*[^\n]+/m, `empreinte: ${values.empreinte}`)
}

function sealPages(files: string[]): CoverageFile {
  const coverage: CoverageFile = { sealedAt: today(), coveredPaths: [], snapshots: {} }
  for (const file of files) {
    const rel = relative(ROOT, file)
    const source = readFileSync(file, 'utf8')
    const fm = parseFrontMatter(source)
    if (!fm || (fm.etage !== 1 && fm.etage !== 2)) continue
    if (!fm.couvre || fm.couvre.length === 0) continue

    const empreinte = computeEmpreinte(fm.couvre)
    const codeLines = countCodeLines(fm.couvre)
    const revuLe = today()

    writeFileSync(file, updateFrontMatter(source, { 'revu-le': revuLe, empreinte }))

    coverage.snapshots[rel] = { revuLe, empreinte, codeLines }
    for (const pattern of fm.couvre) coverage.coveredPaths.push(pattern)
  }
  coverage.coveredPaths = [...new Set(coverage.coveredPaths)].sort()
  return coverage
}

function checkSeals(files: string[], coverage: CoverageFile | null): string[] {
  const warnings: string[] = []
  if (!coverage) return warnings
  for (const file of files) {
    const rel = relative(ROOT, file)
    const snapshot = coverage.snapshots[rel]
    if (!snapshot) continue
    const source = readFileSync(file, 'utf8')
    const fm = parseFrontMatter(source)
    if (!fm || !fm.couvre) continue

    const currentEmpreinte = computeEmpreinte(fm.couvre)
    if (fm.empreinte !== snapshot.empreinte || currentEmpreinte !== snapshot.empreinte) {
      warnings.push(
        `${rel}: couvre ou empreinte a changé depuis le dernier sceau (${snapshot.revuLe})`,
      )
    }

    const currentLines = countCodeLines(fm.couvre)
    const drift = Math.abs(currentLines - snapshot.codeLines) / Math.max(1, snapshot.codeLines)
    if (drift > DRIFT_THRESHOLD) {
      warnings.push(
        `${rel}: le code sous couvre a dérivé de ${Math.round(drift * 100)}% depuis ${snapshot.revuLe} (${snapshot.codeLines} → ${currentLines})`,
      )
    }
  }
  return warnings
}

function extractCoveredDirs(coverage: CoverageFile): string[] {
  const dirs = new Set<string>()
  for (const pattern of coverage.coveredPaths) {
    if (pattern.endsWith('/**')) {
      dirs.add(pattern.slice(0, -3))
    } else if (pattern.endsWith('/')) {
      dirs.add(pattern.slice(0, -1))
    }
  }
  return [...dirs].sort()
}

function checkCoveredReadmes(coverage: CoverageFile): { errors: string[]; warnings: string[] } {
  const errors: string[] = []
  const warnings: string[] = []
  for (const dir of extractCoveredDirs(coverage)) {
    const readme = join(ROOT, dir, 'README.md')
    if (!existsSync(readme)) {
      warnings.push(`dossier couvert sans README : ${dir}/`)
      continue
    }
    const source = readFileSync(readme, 'utf8')
    const fm = parseFrontMatter(source)
    if (!fm || fm.etage !== 2) {
      errors.push(`${dir}/README.md n'est pas une fiche étage 2`)
    }
  }
  return { errors, warnings }
}

function computeCoveredPaths(files: string[]): string[] {
  const paths = new Set<string>()
  for (const file of files) {
    const source = readFileSync(file, 'utf8')
    const fm = parseFrontMatter(source)
    if (!fm || !fm.couvre) continue
    for (const pattern of fm.couvre) paths.add(pattern)
  }
  return [...paths].sort()
}

function checkCoverageRatchet(coverage: CoverageFile | null, currentPaths: string[]): string[] {
  const errors: string[] = []
  if (!coverage) {
    errors.push('docs/.couverture.json manquant — lancer pnpm doc-lint --seal')
    return errors
  }
  const previous = new Set(coverage.coveredPaths)
  for (const path of previous) {
    if (!currentPaths.includes(path)) {
      errors.push(`la couverture a rétréci : ${path} n'est plus couvert`)
    }
  }
  return errors
}

const LARGE_DIR_THRESHOLD = 8

function countFilesRecursively(dir: string): number {
  let count = 0
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (IGNORED_DIRS.has(entry.name)) continue
      count += countFilesRecursively(path)
    } else if (entry.isFile()) {
      count++
    }
  }
  return count
}

function findLargeUndocumentedDirs(): string[] {
  const warnings: string[] = []
  const roots = [join(ROOT, 'apps/web/src/lib'), join(ROOT, 'packages')]
  for (const root of roots) {
    if (!existsSync(root)) continue
    for (const entry of readdirSync(root, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      const dir = join(root, entry.name)
      if (IGNORED_DIRS.has(entry.name)) continue
      const readme = join(dir, 'README.md')
      if (existsSync(readme)) {
        const source = readFileSync(readme, 'utf8')
        const fm = parseFrontMatter(source)
        if (fm && fm.etage === 2) continue
      }
      if (countFilesRecursively(dir) > LARGE_DIR_THRESHOLD) {
        warnings.push(
          `${relative(ROOT, dir)}/ a plus de ${LARGE_DIR_THRESHOLD} fichiers sans fiche étage 2`,
        )
      }
    }
  }
  return warnings
}

async function main() {
  const sealMode = process.argv.includes('--seal')
  const errors: string[] = []
  const warnings: string[] = []
  const docsFiles = listDocs(DOCS)
  const stageFiles = findStagePages(ROOT)
  const allFiles = [...new Set([...docsFiles, ...stageFiles])]

  if (sealMode) {
    const coverage = sealPages(stageFiles)
    saveCoverage(coverage)
    console.log(
      `doc-lint --seal: ${Object.keys(coverage.snapshots).length} pages scellées, ${coverage.coveredPaths.length} chemins couverts`,
    )
    return
  }

  const coverage = loadCoverage()
  warnings.push(...checkSeals(stageFiles, coverage))
  errors.push(...checkCoverageRatchet(coverage, computeCoveredPaths(stageFiles)))
  if (coverage) {
    const readmeChecks = checkCoveredReadmes(coverage)
    errors.push(...readmeChecks.errors)
    warnings.push(...readmeChecks.warnings)
  }
  warnings.push(...findLargeUndocumentedDirs())

  for (const file of allFiles) {
    const rel = relative(ROOT, file)
    if (rel.startsWith('docs/.gen/')) continue
    const source = readFileSync(file, 'utf8')
    const fm = parseFrontMatter(source)

    const needsFrontMatter =
      rel.startsWith('docs/carte/') ||
      rel.startsWith('docs/geste/') ||
      (rel.endsWith('/README.md') && !rel.startsWith('docs/'))

    if (!fm) {
      if (needsFrontMatter) errors.push(`${rel} n'a pas de front-matter`)
      continue
    }

    // Rule 6: size limits by etage
    if (fm.etage !== undefined && LIMITS[fm.etage] !== undefined) {
      const lines = source.split('\n').length
      if (lines > LIMITS[fm.etage]) {
        errors.push(`${rel} dépasse la limite ${fm.etage} (${lines} > ${LIMITS[fm.etage]})`)
      }
    }

    // Rule 1: couvre paths exist and non-empty for stage 1/2
    if ((fm.etage === 1 || fm.etage === 2) && (!fm.couvre || fm.couvre.length === 0)) {
      errors.push(`${rel} a un couvre: vide`)
    }

    for (const pattern of fm.couvre || []) {
      if (!globExists(pattern)) {
        errors.push(`${rel} couvre un chemin inexistant : ${pattern}`)
      }
    }

    // Rule 2: internal links resolve
    errors.push(...checkLinks(source, file))

    // Code paths cited in the body must exist
    errors.push(...checkCodePaths(source, file))
  }

  // Rule 5: .gen.md is reproducible
  errors.push(...(await checkGenFiles()))

  if (warnings.length) {
    for (const w of warnings) console.warn(`doc-lint (avertissement): ${w}`)
  }

  if (errors.length) {
    for (const e of errors) console.error(`doc-lint: ${e}`)
    process.exit(1)
  }
  console.log('doc-lint: OK')
}

main()
