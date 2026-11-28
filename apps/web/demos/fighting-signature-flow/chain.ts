import type { Route, Strike } from './routes'

/** One fighter's slice: enter on one strike, leave on a later one. */
export interface Shot {
  route: Route
  /** First simulation frame shown. */
  from: number
  /** Exclusive end: one past the exit strike's first active frame. */
  to: number
  entry?: Strike
  exit?: Strike
}

const MIN_SPAN = 48
const MAX_SPAN = 150

/** Allowed slice length in simulation frames; `ideal` scores closeness instead of length. */
export interface SpanRule {
  min: number
  max: number
  ideal?: number
}
const FLOW_RULE: SpanRule = { min: MIN_SPAN, max: MAX_SPAN }

export interface PlanOptions {
  /** Span rule at each chain position (default: the flow film's long slices). */
  ruleAt?: (index: number) => SpanRule
  /** Every slice, first and last included, enters and leaves on a strike. */
  open?: boolean
}

/** How far apart two strikes look: shape, direction, body height, momentum and spacing. */
export function strikeDistance(out: Strike, into: Strike) {
  if (out.facing !== into.facing) return 50
  const shape =
    Math.abs((out.hit.x - out.root.x) * out.facing - (into.hit.x - into.root.x) * into.facing) +
    Math.abs(out.hit.y - out.root.y - (into.hit.y - into.root.y))
  return (
    shape * 4 +
    (out.kind === into.kind ? 0 : 0.3) +
    Math.abs(out.root.y - into.root.y) * 2 +
    // Off-centre spark: the cut would need a large camera shift and push the pair aside.
    Math.abs(out.hit.x - out.centre - (into.hit.x - into.centre)) * 3 +
    Math.abs(out.velocity - into.velocity) * 20 +
    Math.min(1.5, Math.abs(out.reach - into.reach) * 0.5)
  )
}

type Place = 'first' | 'middle' | 'last'

/** Slices a route may contribute at a place in the chain; longer slices show more of the combo. */
export function candidates(route: Route, place: Place, rule: SpanRule = FLOW_RULE): Shot[] {
  const entries: (Strike | undefined)[] = place === 'first' ? [undefined] : route.strikes
  const exits: (Strike | undefined)[] = place === 'last' ? [undefined] : route.strikes
  const all: Shot[] = []
  for (const entry of entries)
    for (const exit of exits) {
      // The outgoing fighter shows the strike's first active frame; the next one carries on.
      const from = entry ? entry.sim + 1 : route.from
      const to = exit ? exit.sim + 1 : route.to + 1
      if (to - from > 2 * 4 && (to - from <= rule.max || place !== 'middle'))
        all.push({ route, from, to, entry, exit })
    }
  // A short route still gets its longest slices rather than dropping out of the film.
  const long = all.filter((s) => s.to - s.from >= rule.min)
  if (long.length || rule !== FLOW_RULE) return long
  const longest = Math.max(...all.map((s) => s.to - s.from))
  return all.filter((s) => s.to - s.from >= longest - 12)
}

function shotCost(shot: Shot, rule: SpanRule) {
  const span = shot.to - shot.from
  if (rule.ideal !== undefined) return Math.abs(span - rule.ideal) * 0.03
  return -0.01 * Math.min(rule.max, span)
}

/** Best slices for a fixed fighter order (dynamic programming over each fighter's candidates). */
export function planOrder(groups: readonly Route[][], options: PlanOptions = {}) {
  let layer: { shot: Shot; cost: number; back: number }[] = []
  const layers: (typeof layer)[] = []
  groups.forEach((routes, index) => {
    const rule = options.ruleAt?.(index) ?? FLOW_RULE
    const shots = routes.flatMap((r) => candidates(r, placeAt(index, groups.length, options), rule))
    layer = shots.map((shot) => linkBest(layer, { shot, rule }))
    layers.push(layer)
  })
  return unwind(layers)
}

function placeAt(index: number, count: number, options: PlanOptions): Place {
  if (options.open) return 'middle'
  return index === 0 ? 'first' : index === count - 1 ? 'last' : 'middle'
}

function linkBest(
  previous: { shot: Shot; cost: number }[],
  { shot, rule }: { shot: Shot; rule: SpanRule },
) {
  if (!previous.length) return { shot, cost: shotCost(shot, rule), back: -1 }
  let best = { shot, cost: Infinity, back: -1 }
  previous.forEach((p, back) => {
    const cost = p.cost + strikeDistance(p.shot.exit!, shot.entry!) + shotCost(shot, rule)
    if (cost < best.cost) best = { shot, cost, back }
  })
  return best
}

function unwind(layers: { shot: Shot; cost: number; back: number }[][]) {
  const last = layers.at(-1) ?? []
  if (!last.length) return { cost: Infinity, shots: [] as Shot[] }
  let at = last.reduce((b, n, i) => (n.cost < last[b].cost ? i : b), 0)
  const cost = last[at].cost
  const shots: Shot[] = []
  for (let i = layers.length - 1; i >= 0; i--) {
    shots.unshift(layers[i][at].shot)
    at = layers[i][at].back
  }
  return { cost, shots }
}

/** Deterministic order search: greedy start, then single-fighter relocations while they help. */
export function chainShots(routes: readonly Route[], options: PlanOptions = {}) {
  const byFighter = new Map<string, Route[]>()
  for (const r of routes) byFighter.set(r.id, [...(byFighter.get(r.id) ?? []), r])
  let order = greedyOrder([...byFighter.values()])
  let best = planOrder(order, options)
  for (let pass = 0; pass < 60; pass++) {
    const improved = relocate(order, { cost: best.cost, options })
    if (!improved) break
    order = improved.order
    best = improved.plan
  }
  return best.shots
}

function relocate(order: Route[][], { cost, options }: { cost: number; options: PlanOptions }) {
  for (let from = 0; from < order.length; from++)
    for (let to = 0; to < order.length; to++) {
      if (from === to) continue
      const next = [...order]
      next.splice(to, 0, next.splice(from, 1)[0])
      const plan = planOrder(next, options)
      if (plan.cost < cost - 1e-9) return { order: next, plan }
    }
  return null
}

function pairCost(a: Route[], b: Route[]) {
  let best = Infinity
  for (const out of a.flatMap((r) => r.strikes))
    for (const into of b.flatMap((r) => r.strikes)) best = Math.min(best, strikeDistance(out, into))
  return best
}

function greedyOrder(groups: Route[][]) {
  const pool = [...groups]
  const order = pool.length ? [pool.shift()!] : []
  while (pool.length) {
    const previous = order.at(-1)!
    let best = 0
    for (let i = 1; i < pool.length; i++)
      if (pairCost(previous, pool[i]) < pairCost(previous, pool[best])) best = i
    order.push(pool.splice(best, 1)[0])
  }
  return order
}
