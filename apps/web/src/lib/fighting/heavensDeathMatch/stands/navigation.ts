import { HALL_HALF_WIDTH, PIT, TIERS, TRUSS, tierTop, tierZ } from '../../heavensArenaLayout'
import { AISLES, BALCONY, EXITS, STAND_FRONT, type Vec3 } from './geometry'

/**
 * How a body may cross from one place to another. Spectators walk; Chrollo and the
 * puppets also jump rows and drop from ledges; Hisoka also runs along walls and
 * swings on Bungee Gum.
 */
export type EdgeKind = 'walk' | 'stairs' | 'step' | 'jump' | 'drop' | 'wall-run' | 'gum'

export interface NavNode {
  id: string
  at: Vec3
}

export interface NavEdge {
  from: string
  to: string
  kind: EdgeKind
  cost: number
}

export interface NavGraph {
  nodes: ReadonlyMap<string, NavNode>
  edges: ReadonlyMap<string, readonly NavEdge[]>
}

export const SPECTATOR_MOVES: ReadonlySet<EdgeKind> = new Set(['walk', 'stairs', 'step'])
export const CHROLLO_MOVES: ReadonlySet<EdgeKind> = new Set([...SPECTATOR_MOVES, 'jump', 'drop'])
export const HISOKA_MOVES: ReadonlySet<EdgeKind> = new Set([...CHROLLO_MOVES, 'wall-run', 'gum'])

const COST: Record<EdgeKind, number> = {
  walk: 1,
  stairs: 1.3,
  step: 1.1,
  jump: 1.6,
  drop: 1.2,
  'wall-run': 1.4,
  gum: 0.8,
}

const ROW_SAMPLES: readonly number[] = [-20, -11.5, -5.75, 0, 5.75, 11.5, 20]
const PIT_SAMPLES: readonly number[] = [-20, -11.5, 0, 11.5, 20]
const PIT_Z = (STAND_FRONT + 4) / 2 - 2

class GraphBuilder {
  readonly nodes = new Map<string, NavNode>()
  readonly edges = new Map<string, NavEdge[]>()

  node(id: string, at: Vec3): void {
    this.nodes.set(id, { id, at })
    this.edges.set(id, [])
  }

  /** One-way edge; the cost is the straight distance weighted by the kind. */
  oneWay(from: string, to: string, kind: EdgeKind): void {
    const a = this.nodes.get(from)!.at
    const b = this.nodes.get(to)!.at
    const cost = Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z) * COST[kind]
    this.edges.get(from)!.push({ from, to, kind, cost })
  }

  link(a: string, b: string, kind: EdgeKind): void {
    this.oneWay(a, b, kind)
    this.oneWay(b, a, kind)
  }
}

const rowId = (tier: number, x: number) => `tier:${tier}:${x}`

function addRows(graph: GraphBuilder): void {
  for (let tier = 0; tier < TIERS; tier += 1) {
    for (const x of ROW_SAMPLES) graph.node(rowId(tier, x), { x, y: tierTop(tier), z: tierZ(tier) })
    for (let index = 1; index < ROW_SAMPLES.length; index += 1)
      graph.link(rowId(tier, ROW_SAMPLES[index - 1]), rowId(tier, ROW_SAMPLES[index]), 'walk')
    if (tier === 0) continue
    for (const x of ROW_SAMPLES) {
      const kind = AISLES.includes(x) ? 'stairs' : 'jump'
      graph.link(rowId(tier - 1, x), rowId(tier, x), kind)
    }
  }
}

function addPitAndRing(graph: GraphBuilder): void {
  for (const x of PIT_SAMPLES) graph.node(`pit:${x}`, { x, y: -PIT, z: PIT_Z })
  for (let index = 1; index < PIT_SAMPLES.length; index += 1)
    graph.link(`pit:${PIT_SAMPLES[index - 1]}`, `pit:${PIT_SAMPLES[index]}`, 'walk')
  // The barrier opens only at the aisle mouths; elsewhere it is jumped.
  for (const x of PIT_SAMPLES)
    graph.link(`pit:${x}`, rowId(0, x), AISLES.includes(x) ? 'stairs' : 'jump')
  for (const [id, x] of [
    ['ring:left', -5],
    ['ring:centre', 0],
    ['ring:right', 5],
  ] as const) {
    graph.node(id, { x, y: 0, z: 0.3 })
    graph.link(id, `pit:${x === 0 ? 0 : x < 0 ? -11.5 : 11.5}`, 'step')
  }
  graph.link('ring:left', 'ring:centre', 'walk')
  graph.link('ring:centre', 'ring:right', 'walk')
}

function addBalcony(graph: GraphBuilder): void {
  const z = (BALCONY.zFront + BALCONY.zBack) / 2
  const xs = [-20, -10, 0, 10, 20]
  for (const x of xs) graph.node(`balcony:${x}`, { x, y: BALCONY.y, z })
  for (let index = 1; index < xs.length; index += 1)
    graph.link(`balcony:${xs[index - 1]}`, `balcony:${xs[index]}`, 'walk')
  for (const x of [-20, 20]) {
    graph.link(rowId(TIERS - 1, x), `balcony:${x}`, 'stairs')
    graph.link(`pit:${x}`, `balcony:${x}`, 'wall-run')
  }
  for (const x of [-10, 0, 10])
    graph.oneWay(`balcony:${x}`, rowId(TIERS - 1, x === 0 ? 0 : x < 0 ? -11.5 : 11.5), 'drop')
}

function addExitsAndTruss(graph: GraphBuilder): void {
  const nearest: Record<string, string> = {
    'exit:back-left': rowId(TIERS - 1, -11.5),
    'exit:back-right': rowId(TIERS - 1, 11.5),
    'exit:side-left': 'pit:-20',
    'exit:side-right': 'pit:20',
    'exit:balcony': 'balcony:0',
  }
  for (const exit of EXITS) {
    graph.node(exit.id, exit.at)
    graph.link(exit.id, nearest[exit.id], 'walk')
  }
  graph.node('truss', { x: 0, y: TRUSS.y, z: TRUSS.z })
  for (const id of ['ring:centre', 'balcony:0', 'pit:-20', 'pit:20']) graph.link(id, 'truss', 'gum')
  for (const tier of [3, 6]) graph.link(rowId(tier, 0), 'truss', 'gum')
}

/** The navigation graph of the hall: ring, pit, rows, aisles, balcony, exits and truss. */
export function buildArenaGraph(): NavGraph {
  const graph = new GraphBuilder()
  addRows(graph)
  addPitAndRing(graph)
  addBalcony(graph)
  addExitsAndTruss(graph)
  return { nodes: graph.nodes, edges: graph.edges }
}

let shared: NavGraph | null = null
/** One graph per page: the hall never changes shape, only its damage does. */
export function arenaGraph(): NavGraph {
  shared ??= buildArenaGraph()
  return shared
}

export function nearestNode(graph: NavGraph, point: Vec3): NavNode {
  let best: NavNode | null = null
  let bestDistance = Infinity
  for (const node of graph.nodes.values()) {
    const distance = Math.hypot(node.at.x - point.x, (node.at.y - point.y) * 2, node.at.z - point.z)
    if (distance < bestDistance) [best, bestDistance] = [node, distance]
  }
  return best!
}

export interface PathQuery {
  from: string
  to: string
  moves: ReadonlySet<EdgeKind>
}

/** Dijkstra over the allowed kinds of move; null when no way exists. */
export function findPath(graph: NavGraph, query: PathQuery): string[] | null {
  const distance = new Map<string, number>([[query.from, 0]])
  const previous = new Map<string, string>()
  const open = new Set([query.from])
  while (open.size) {
    const current = closest(open, distance)
    if (current === query.to) return unwind(previous, current)
    open.delete(current)
    for (const edge of graph.edges.get(current) ?? []) {
      if (!query.moves.has(edge.kind)) continue
      const candidate = distance.get(current)! + edge.cost
      if (candidate >= (distance.get(edge.to) ?? Infinity)) continue
      distance.set(edge.to, candidate)
      previous.set(edge.to, current)
      open.add(edge.to)
    }
  }
  return null
}

function closest(open: Set<string>, distance: Map<string, number>): string {
  let best = ''
  let bestDistance = Infinity
  for (const id of open) {
    const value = distance.get(id)!
    if (value < bestDistance) [best, bestDistance] = [id, value]
  }
  return best
}

function unwind(previous: Map<string, string>, end: string): string[] {
  const path = [end]
  while (previous.has(path[0])) path.unshift(previous.get(path[0])!)
  return path
}

/** The exit a spectator at `point` reaches the soonest, with the route to it. */
export function nearestExitRoute(graph: NavGraph, point: Vec3): string[] {
  const start = nearestNode(graph, point).id
  let best: string[] = [start]
  let bestLength = Infinity
  for (const exit of EXITS) {
    const path = findPath(graph, { from: start, to: exit.id, moves: SPECTATOR_MOVES })
    const length = path ? routeLength(graph, path) : Infinity
    if (length < bestLength) [best, bestLength] = [path!, length]
  }
  return best
}

function routeLength(graph: NavGraph, path: readonly string[]): number {
  let total = 0
  for (let index = 1; index < path.length; index += 1) {
    const a = graph.nodes.get(path[index - 1])!.at
    const b = graph.nodes.get(path[index])!.at
    total += Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)
  }
  return total
}

export const HALL_LIMIT = HALL_HALF_WIDTH
