import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const DOCS_GEN = join(ROOT, 'docs', '.gen')

const HEADER = '<!-- généré par pnpm doc:gen — ne pas éditer -->\n\n'

function* walk(dir: string): Generator<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) yield* walk(path)
    else if (entry.isFile()) yield path
  }
}

export function generateRoutes(): string {
  const apps = ['apps/web', 'apps/admin']
  const byApp = new Map<string, Map<string, string[]>>()

  for (const app of apps) {
    const routesDir = join(ROOT, app, 'src', 'routes')
    const routes = new Map<string, string[]>()
    try {
      for (const path of walk(routesDir)) {
        const rel = relative(routesDir, path)
        const parts = rel.split(sep)
        const file = parts.pop()!
        const route = parts.length ? parts.join('/') : '(root)'
        const key = `${app}/src/routes/${parts.length ? parts.join('/') : ''}`
        if (!routes.has(route)) routes.set(route, [])
        routes.get(route)!.push(file)
      }
    } catch {
      // app or routes dir missing
    }
    byApp.set(app, routes)
  }

  let out = '# Routes\n\n'
  for (const [app, routes] of byApp) {
    out += `## ${app}\n\n`
    out += '| Route | Fichiers |\n| ----- | -------- |\n'
    for (const [route, files] of [...routes.entries()].sort()) {
      const sorted = files.sort()
      out += `| \`${route}\` | ${sorted.map((f) => `\`${f}\``).join(', ')} |\n`
    }
    out += '\n'
  }
  return out
}

function extractTests(source: string): string[] {
  const lines = source.split('\n')
  const stack: string[] = []
  const results: string[] = []
  for (const raw of lines) {
    const line = raw.replace(/\/\/.*/, '').trim()
    const describeMatch = line.match(/describe\(['"]([^'"]+)['"],/)
    const itMatch = line.match(/it\(['"]([^'"]+)['"],/)
    if (describeMatch) {
      stack.push(describeMatch[1])
    } else if (itMatch && stack.length) {
      results.push(`${stack.join(' > ')} > ${itMatch[1]}`)
    } else if (line.includes('})') && stack.length && !line.includes('it(')) {
      stack.pop()
    }
  }
  return results
}

export function generateTests(): string {
  const testFiles: string[] = []
  for (const pattern of ['apps', 'packages', 'scripts']) {
    const dir = join(ROOT, pattern)
    try {
      for (const path of walk(dir)) {
        if (path.includes('node_modules')) continue
        if (path.endsWith('.test.ts') || path.endsWith('.spec.ts')) {
          testFiles.push(relative(ROOT, path))
        }
      }
    } catch {
      // dir missing
    }
  }

  let out = '# Index des tests\n\n'
  out += `Fichiers : ${testFiles.length}\n\n`
  for (const file of testFiles.sort()) {
    const source = readFileSync(join(ROOT, file), 'utf8')
    const cases = extractTests(source)
    if (!cases.length) continue
    out += `## \`${file}\`\n\n`
    for (const c of cases) {
      out += `- ${c}\n`
    }
    out += '\n'
  }
  return out
}

writeFileSync(join(DOCS_GEN, 'routes.md'), HEADER + generateRoutes())
writeFileSync(join(DOCS_GEN, 'tests.md'), HEADER + generateTests())
console.log('docs/.gen/{routes,tests}.md written')
