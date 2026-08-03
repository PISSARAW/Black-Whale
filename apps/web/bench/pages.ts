/**
 * What each page costs to produce and to receive, against the built server.
 *
 * Two numbers, kept apart on purpose: a page can be quick to render and heavy
 * to download. `/ship` is exactly that — it renders in tens of milliseconds and
 * hands the browser hundreds of kilobytes of inlined world state.
 */

const ORIGIN = process.env.BENCH_ORIGIN ?? 'http://localhost:4180'

const PATHS = [
  '/',
  '/ship',
  '/tour',
  '/tour/sources',
  '/abilities',
  '/reconstruction',
  '/hunt',
  '/arena',
  '/infiltration',
  '/strategy',
]

async function timePage(path: string): Promise<void> {
  const url = `${ORIGIN}${path}`
  await fetch(url).then((response) => response.text()) // warm the module graph

  let best = Number.POSITIVE_INFINITY
  let status = 0
  let bytes = 0
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const start = performance.now()
    const response = await fetch(url)
    const body = await response.text()
    best = Math.min(best, performance.now() - start)
    status = response.status
    bytes = body.length
  }
  const time = `${Math.round(best)} ms`.padStart(7)
  const size = `${Math.round(bytes / 1000)} kB`.padStart(8)
  console.log(`${path.padEnd(18)} ${status} ${time} ${size} html`)
}

/**
 * What a page's loader actually serialises, field by field.
 *
 * SvelteKit's `__data.json` is deduplicated into a flat array of nodes, so a
 * value shared by two fields is stored once and the naive size of the second is
 * zero. The walk below rebuilds each field's subtree with a per-field `seen`
 * set, which charges every field for what it would cost alone — the question
 * being asked is "what is this field worth cutting", not "what would the page
 * save if it vanished".
 */
async function describePayload(path: string): Promise<void> {
  const response = await fetch(`${ORIGIN}${path}/__data.json`)
  if (!response.ok) {
    console.log(`${path}: pas de charge utile (${response.status})`)
    return
  }
  const flat = (JSON.parse(await response.text()) as { nodes: Array<{ data?: unknown[] }> }).nodes
    .map((node) => node.data)
    .filter((data): data is unknown[] => Array.isArray(data))
    .at(-1)
  if (!flat) return

  const rebuild = (index: unknown, seen: Set<number>): unknown => {
    if (typeof index !== 'number') return index
    if (seen.has(index)) return 0
    seen.add(index)
    const value = flat[index]
    if (Array.isArray(value)) return value.map((entry) => rebuild(entry, seen))
    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value).map(([key, entry]) => [key, rebuild(entry, seen)]),
      )
    }
    return value ?? null
  }

  const root = flat[0] as Record<string, unknown>
  const weigh = (source: Record<string, unknown>) =>
    Object.entries(source)
      .map(([key, index]) => [key, JSON.stringify(rebuild(index, new Set())).length] as const)
      .sort((left, right) => right[1] - left[1])

  console.log(`\n${path} — charge utile par champ`)
  for (const [key, size] of weigh(root)) {
    console.log(`  ${key.padEnd(24)} ${String(Math.round(size / 1000)).padStart(6)} kB`)
    const nested = typeof root[key] === 'number' ? flat[root[key] as number] : null
    if (!nested || Array.isArray(nested) || typeof nested !== 'object') continue
    for (const [inner, innerSize] of weigh(nested as Record<string, unknown>)) {
      console.log(`    ${inner.padEnd(22)} ${String(Math.round(innerSize / 1000)).padStart(6)} kB`)
    }
  }
}

for (const path of PATHS) await timePage(path)
if (process.argv.includes('--data')) await describePayload('/ship')
