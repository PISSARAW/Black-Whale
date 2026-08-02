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

export function environmentModifiers(environment: ContractEnvironment): EnvironmentModifiers {
  return {
    vision: environment.lighting === 'normal' ? 1 : environment.lighting === 'low' ? 0.55 : 0.15,
    hearing:
      environment.acoustics === 'clear'
        ? 1
        : environment.acoustics === 'reverberant'
          ? 1.45
          : 0.55,
    gyoRequired: environment.lighting === 'blackout',
  }
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
  seal: SealedExit,
): boolean {
  return (
    environment.sealableExits &&
    graph.edges.get(seal.a)?.includes(seal.b) === true &&
    graph.edges.get(seal.b)?.includes(seal.a) === true
  )
}

function key(a: string, b: string): string {
  return [a, b].sort().join('|')
}
