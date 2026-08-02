import { describe, expect, it } from 'vitest'
import { hearingStrength } from './sound'
import type { NavGraph } from '../hunt/navmesh'
import type { Witness, InfiltrationState } from './state'

const graph: NavGraph = {
  nodes: ['a', 'b', 'c'],
  edges: new Map([
    ['a', ['b']],
    ['b', ['a', 'c']],
    ['c', ['b']],
  ]),
  centers: new Map(),
}
const witness = { position: [0, 0], spaceId: 'a' } as Witness
const player = (spaceId: string, speed: number) =>
  ({
    position: [8, 0],
    spaceId,
    moving: speed > 0,
    speed,
    nen: 'ten',
  }) as InfiltrationState['player']

describe('infiltration sound', () => {
  it('makes running louder than walking', () => {
    expect(hearingStrength(witness, player('a', 4.2), graph)).toBeGreaterThan(
      hearingStrength(witness, player('a', 2.1), graph),
    )
  })
  it('attenuates through each doorway', () => {
    expect(hearingStrength(witness, player('a', 2.1), graph)).toBeGreaterThan(
      hearingStrength(witness, player('b', 2.1), graph),
    )
    expect(hearingStrength(witness, player('b', 2.1), graph)).toBeGreaterThan(
      hearingStrength(witness, player('c', 2.1), graph),
    )
  })
  it('does not confuse Zetsu with silence', () => {
    const inZetsu = { ...player('a', 2.1), nen: 'zetsu' as const }
    expect(hearingStrength(witness, inZetsu, graph)).toBeGreaterThan(0)
  })
})
