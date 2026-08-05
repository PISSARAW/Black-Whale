import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { join, relative, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

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
      const value = line.trim().slice(2).trim().replace(/^['"]|['"]$/g, '')
      const arr = (result[currentKey] as string[]) || []
      arr.push(value)
      result[currentKey] = arr
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

function globExists(pattern: string): boolean {
  if (!pattern.includes('*')) return existsSync(join(ROOT, pattern))
  const parts = pattern.split('/')
  const hasDouble = pattern.includes('**')
  if (hasDouble) {
    // Very rough check: at least one file exists under the prefix
    const prefix = parts.slice(0, parts.findIndex((p) => p.includes('*'))).join('/')
    return existsSync(join(ROOT, prefix))
  }
  const prefix = parts.slice(0, parts.findIndex((p) => p.includes('*'))).join('/')
  if (!existsSync(join(ROOT, prefix))) return false
  const suffix = parts.slice(parts.findIndex((p) => p.includes('*')) + 1).join('/')
  if (!suffix) return true
  const fullPrefix = join(ROOT, prefix)
  for (const entry of readdirSync(fullPrefix, { withFileTypes: true })) {
    if (entry.isDirectory() && existsSync(join(fullPrefix, entry.name, suffix))) return true
  }
  return false
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
  if (actualRoutes !== expectedRoutes) errors.push('docs/.gen/routes.md est désynchronisé (pnpm doc:gen)')
  if (actualTests !== expectedTests) errors.push('docs/.gen/tests.md est désynchronisé (pnpm doc:gen)')
  return errors
}

async function main() {
  const errors: string[] = []
  const files = listDocs(DOCS)

  for (const file of files) {
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

    // Rule 1: couvre paths exist
    for (const pattern of fm.couvre || []) {
      if (!globExists(pattern)) {
        errors.push(`${rel} couvre un chemin inexistant : ${pattern}`)
      }
    }

    // Rule 2: internal links resolve
    errors.push(...checkLinks(source, file))
  }

  // Rule 5: .gen.md is reproducible
  errors.push(...(await checkGenFiles()))

  if (errors.length) {
    for (const e of errors) console.error(`doc-lint: ${e}`)
    process.exit(1)
  }
  console.log('doc-lint: OK')
}

main()
