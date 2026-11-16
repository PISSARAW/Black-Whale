import { readFile } from 'node:fs/promises'
import type { Plugin } from 'vite'
import { DATA_MODULE, fragmentJson } from './jsonFragments'

const LARGE_JSON_BYTES = 200_000
interface StringArgument {
  type: string
  value?: unknown
  expressions?: unknown[]
  quasis?: { value: { cooked?: string | null } }[]
}

function stringArgument(argument?: StringArgument): string {
  if (argument?.type === 'Literal' && typeof argument.value === 'string') return argument.value
  if (argument?.type === 'TemplateLiteral' && argument.expressions?.length === 0) {
    return templateText(argument)
  }
  throw new Error('Unexpected generated ability presentation format')
}

function templateText(argument: StringArgument): string {
  const text = argument.quasis?.[0]?.value.cooked
  if (typeof text === 'string') return text
  throw new Error('Unexpected generated ability presentation template')
}

interface ExportStatement {
  type: string
  declaration?: {
    type: string
    declarations?: {
      id: { type: string; name?: string }
      init?: { type: string; arguments?: StringArgument[] } | null
    }[]
  } | null
}

function presentationPayload(statement: ExportStatement): string | null {
  if (
    statement.type !== 'ExportNamedDeclaration' ||
    statement.declaration?.type !== 'VariableDeclaration'
  )
    return null
  const declaration = statement.declaration.declarations?.[0]
  if (!declaration || declaration.id.name !== 'ABILITY_PRESENTATIONS') return null
  const call = declaration.init
  if (call?.type !== 'CallExpression')
    throw new Error('Unexpected generated ability presentation format')
  return stringArgument(call.arguments?.[0])
}
const validExport = (key: string) =>
  /^[A-Za-z_$][\w$]*$/.test(key) &&
  ![
    'default',
    'class',
    'function',
    'var',
    'let',
    'const',
    'new',
    'return',
    'import',
    'export',
  ].includes(key)

/** Build-only partitioning; canonical files and synchronous consumer APIs stay unchanged. */
export function dataChunks(): Plugin[] {
  const modules = new Map<string, string>()
  let client = false
  const configure: Plugin['configResolved'] = (config) => {
    client = !config.build.ssr
  }
  return [
    {
      name: 'large-json-chunks',
      apply: 'build',
      enforce: 'pre',
      configResolved: configure,
      async resolveId(source, importer) {
        if (source.startsWith(DATA_MODULE)) return source
        if (!client || !source.endsWith('.json')) return null
        const resolved = await this.resolve(source, importer, { skipSelf: true })
        if (!resolved || resolved.external) return null
        const raw = await readFile(resolved.id, 'utf8')
        if (Buffer.byteLength(raw) < LARGE_JSON_BYTES) return null
        this.addWatchFile(resolved.id)
        const value = JSON.parse(raw)
        const root = fragmentJson(value, resolved.id, modules)
        const entry = `${DATA_MODULE}${resolved.id}:entry`
        const names = Array.isArray(value) ? [] : Object.keys(value).filter(validExport)
        modules.set(
          entry,
          `import data from ${JSON.stringify(root)}\nexport default data\n${names.map((key) => `export const ${key} = data[${JSON.stringify(key)}]`).join('\n')}`,
        )
        return entry
      },
      load(id) {
        return modules.get(id) ?? null
      },
    },
    {
      name: 'ability-presentation-chunks',
      apply: 'build',
      enforce: 'post',
      configResolved: configure,
      transform(code, id) {
        if (!client || !id.endsWith('/abilityPresentations.gen.ts')) return null
        const tree = this.parse(code)
        for (const statement of tree.body) {
          const payload = presentationPayload(statement)
          if (payload === null) continue
          const root = fragmentJson(JSON.parse(payload), id, modules)
          return {
            code: `export { default as ABILITY_PRESENTATIONS } from ${JSON.stringify(root)}`,
            map: null,
          }
        }
        throw new Error('Missing generated ability presentation export')
      },
    },
  ]
}
