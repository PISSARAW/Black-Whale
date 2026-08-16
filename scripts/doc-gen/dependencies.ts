import { existsSync, readFileSync } from 'node:fs'
import { join, relative, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import fastGlob from 'fast-glob'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))

interface Edge {
  from: string
  to: string
}

function packageName(dir: string): string | null {
  const pkg = join(dir, 'package.json')
  if (!existsSync(pkg)) return null
  try {
    return JSON.parse(readFileSync(pkg, 'utf8')).name as string
  } catch {
    return null
  }
}

function sourceContainer(filePath: string): { kind: 'package' | 'lib'; name: string } | null {
  const rel = relative(ROOT, filePath)
  const pkgMatch = rel.match(/^packages\/([^/]+)\//)
  if (pkgMatch)
    return {
      kind: 'package',
      name: packageName(join(ROOT, 'packages', pkgMatch[1])) || pkgMatch[1],
    }
  const libMatch = rel.match(/^apps\/web\/src\/lib\/([^/]+)\//)
  if (libMatch) return { kind: 'lib', name: libMatch[1] }
  return null
}

function targetContainer(
  specifier: string,
  sourceFile: string,
): { kind: 'package' | 'lib'; name: string } | null {
  if (specifier.startsWith('@black-whale/')) {
    return { kind: 'package', name: specifier.split('/').slice(0, 2).join('/') }
  }
  if (!specifier.startsWith('.')) return null
  const resolved = resolve(dirname(sourceFile), specifier)
  const rel = relative(ROOT, resolved)
  const pkgMatch = rel.match(/^packages\/([^/]+)\//)
  if (pkgMatch)
    return {
      kind: 'package',
      name: packageName(join(ROOT, 'packages', pkgMatch[1])) || pkgMatch[1],
    }
  const libMatch = rel.match(/^apps\/web\/src\/lib\/([^/]+)\//)
  if (libMatch) return { kind: 'lib', name: libMatch[1] }
  return null
}

function extractImports(source: string, filePath: string): Edge[] {
  const edges: Edge[] = []
  const from = sourceContainer(filePath)
  if (!from) return edges
  for (const match of source.matchAll(/import\s+[^'"]*\s+from\s+['"]([^'"]+)['"]/g)) {
    const to = targetContainer(match[1], filePath)
    if (to && (from.kind !== to.kind || from.name !== to.name)) {
      edges.push({ from: `${from.kind}:${from.name}`, to: `${to.kind}:${to.name}` })
    }
  }
  for (const match of source.matchAll(/import\s+['"]([^'"]+)['"]/g)) {
    const to = targetContainer(match[1], filePath)
    if (to && (from.kind !== to.kind || from.name !== to.name)) {
      edges.push({ from: `${from.kind}:${from.name}`, to: `${to.kind}:${to.name}` })
    }
  }
  return edges
}

function findCycles(nodes: string[], edges: Edge[]): string[][] {
  const adj = new Map<string, Set<string>>()
  for (const n of nodes) adj.set(n, new Set())
  for (const e of edges) adj.get(e.from)?.add(e.to)

  const cycles: string[][] = []
  const visiting = new Set<string>()
  const visited = new Set<string>()

  function dfs(node: string, stack: string[]) {
    if (visiting.has(node)) {
      const start = stack.indexOf(node)
      if (start !== -1) cycles.push(stack.slice(start).concat(node))
      return
    }
    if (visited.has(node)) return
    visiting.add(node)
    stack.push(node)
    for (const next of adj.get(node) || []) dfs(next, stack)
    stack.pop()
    visiting.delete(node)
    visited.add(node)
  }

  for (const n of nodes) dfs(n, [])
  return cycles
}

export function generateDependencies(): string {
  const files = fastGlob.sync(
    ['packages/*/src/**/*.ts', 'apps/web/src/lib/**/*.ts', 'apps/web/src/lib/**/*.svelte'],
    {
      cwd: ROOT,
      onlyFiles: true,
      dot: true,
      ignore: ['**/node_modules/**', '**/.svelte-kit/**', '**/.gen/**'],
    },
  )

  const edges: Edge[] = []
  for (const file of files) {
    const path = join(ROOT, file)
    const source = readFileSync(path, 'utf8')
    edges.push(...extractImports(source, path))
  }

  const uniqueEdges = new Map<string, number>()
  for (const e of edges) {
    const key = `${e.from} → ${e.to}`
    uniqueEdges.set(key, (uniqueEdges.get(key) || 0) + 1)
  }

  const nodes = new Set<string>()
  for (const e of edges) {
    nodes.add(e.from)
    nodes.add(e.to)
  }
  const nodeList = [...nodes].sort()
  const cycles = findCycles(nodeList, edges)

  let out = '# Graphe des dépendances\n\n'
  out += `Nœuds : ${nodeList.length} · Arêtes uniques : ${uniqueEdges.size}\n\n`

  out += '## Arêtes\n\n'
  out += '| Source | Cible | Occurrences |\n| ------ | ----- | ----------- |\n'
  for (const [key, count] of [...uniqueEdges.entries()].sort()) {
    const [from, to] = key.split(' → ')
    out += `| \`${from}\` | \`${to}\` | ${count} |\n`
  }

  out += '\n## Cycles\n\n'
  if (!cycles.length) {
    out += 'Aucun cycle détecté.\n'
  } else {
    for (const cycle of cycles) {
      out += `- ${cycle.map((n) => `\`${n}\``).join(' → ')}\n`
    }
  }
  return out
}
