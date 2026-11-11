import type { Doorway, WallSegment } from '../tour/types'
import type { NavGraph } from './navmesh'
import type { ContractEnvironment } from './contracts/types'

export const NORMAL_ENVIRONMENT: ContractEnvironment = {
  lighting: 'normal',
  acoustics: 'clear',
  sealableExits: false,
}

export interface EnvironmentModifiers {
  vision: number
  hearing: number
  gyoRequired: boolean
}

export interface SealedExit {
  a: string
  b: string
}

export type SealRequest = SealedExit & { existing?: readonly SealedExit[] }

export function environmentModifiers(environment: ContractEnvironment): EnvironmentModifiers {
  return {
    vision: environment.lighting === 'normal' ? 1 : environment.lighting === 'low' ? 0.55 : 0.15,
    hearing:
      environment.acoustics === 'clear' ? 1 : environment.acoustics === 'reverberant' ? 1.45 : 0.55,
    gyoRequired: environment.lighting === 'blackout',
  }
}

/** Reliable visual range in the contract's light; Gyo defeats a blackout. */
export function canSeeAtDistance(
  environment: ContractEnvironment,
  distance: number,
  gyo: boolean,
): boolean {
  const modifiers = environmentModifiers(environment)
  if (gyo) return true
  return distance <= 12 * modifiers.vision && (!modifiers.gyoRequired || distance <= 2)
}

export function graphWithSeals(graph: NavGraph, seals: readonly SealedExit[]): NavGraph {
  const blocked = new Set(seals.map((seal) => key(seal.a, seal.b)))
  return {
    ...graph,
    edges: new Map(
      [...graph.edges].map(([id, neighbours]) => [
        id,
        neighbours.filter((other) => !blocked.has(key(id, other))),
      ]),
    ),
  }
}

export function canSealExit(
  environment: ContractEnvironment,
  graph: NavGraph,
  seal: SealRequest,
): boolean {
  if (
    !environment.sealableExits ||
    graph.edges.get(seal.a)?.includes(seal.b) !== true ||
    graph.edges.get(seal.b)?.includes(seal.a) !== true
  )
    return false

  return isConnected(graphWithSeals(graph, [...(seal.existing ?? []), seal]))
}

/** The same sealed exits as physical collision segments for the player's walk. */
export function wallsForSeals(
  doorways: readonly Doorway[],
  seals: readonly SealedExit[],
): WallSegment[] {
  const blocked = new Set(seals.map((seal) => key(seal.a, seal.b)))
  return doorways
    .filter((door) => blocked.has(key(door.a, door.b)))
    .map((door) => ({ spaceId: door.a, start: door.start, end: door.end }))
}

function isConnected(graph: NavGraph): boolean {
  const first = graph.nodes[0]
  if (!first) return true
  const reached = new Set([first])
  const queue = [first]
  while (queue.length > 0) {
    for (const next of graph.edges.get(queue.shift()!) ?? []) {
      if (reached.has(next)) continue
      reached.add(next)
      queue.push(next)
    }
  }
  return reached.size === graph.nodes.length
}

function key(a: string, b: string): string {
  return [a, b].sort().join('|')
}
