type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue }
export const DATA_MODULE = '\0bundle-data:'
const PAYLOAD_BYTES = 160_000
const bytes = (value: unknown) => Buffer.byteLength(JSON.stringify(value))

/** Consecutive records stay together, preserving array and object insertion order. */
function groups<T>(items: T[]): T[][] {
  const result: T[][] = []
  let group: T[] = []
  let size = 2
  for (const item of items) {
    const added = bytes(item) + 1
    if (group.length && size + added > PAYLOAD_BYTES) {
      result.push(group)
      group = []
      size = 2
    }
    group.push(item)
    size += added
  }
  if (group.length) result.push(group)
  return result
}

export function fragmentJson(value: JsonValue, rootId: string, modules: Map<string, string>) {
  let sequence = 0
  function emit(data: JsonValue): string {
    const id = `${DATA_MODULE}${rootId}:${sequence++}`
    const imports: string[] = []
    const reference = (child: JsonValue) => {
      const name = `part${imports.length}`
      imports.push(`import ${name} from ${JSON.stringify(emit(child))}`)
      return name
    }
    const expression = serialize(data, reference)
    modules.set(id, `${imports.join('\n')}\nexport default ${expression}`)
    return id
  }
  return emit(value)
}

function serialize(data: JsonValue, reference: (child: JsonValue) => string): string {
  if (bytes(data) <= PAYLOAD_BYTES) return `JSON.parse(${JSON.stringify(JSON.stringify(data))})`
  if (typeof data !== 'object' || data === null)
    throw new Error('A JSON scalar exceeds the bundle data budget')
  if (Array.isArray(data)) {
    if (data.length === 1) return `[${reference(data[0])}]`
    return `[${groups(data)
      .map((group) => `...${reference(group)}`)
      .join(',')}]`
  }
  const entries = Object.entries(data)
  if (entries.length === 1) {
    const [key, child] = entries[0]
    return `Object.fromEntries([[${JSON.stringify(key)},${reference(child)}]])`
  }
  return `Object.fromEntries([${groups(entries)
    .map((group) => `...Object.entries(${reference(Object.fromEntries(group))})`)
    .join(',')}])`
}

export function fragmentChunkName(id: string): string | undefined {
  if (!id.startsWith(DATA_MODULE)) return undefined
  const name = id.slice(DATA_MODULE.length).split('/').pop()!
  return `data-${name.replace(/[^\w-]/g, '-')}`
}
