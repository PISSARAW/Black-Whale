import { describe, expect, it } from 'vitest'
import { emissionTarget } from '../space'
import { hatsuAudioGraph, withHatsuAudioGraph, type Graph } from './mixer'

describe('mode-owned Hatsu routing', () => {
  it('restores nested routes, including when a borrowed sound throws', () => {
    const outside = hatsuAudioGraph()
    const game = {} as Graph
    const nested = {} as Graph
    withHatsuAudioGraph(game, () => {
      expect(hatsuAudioGraph()).toBe(game)
      expect(() =>
        withHatsuAudioGraph(nested, () => {
          expect(hatsuAudioGraph()).toBe(nested)
          throw new Error('broken recipe')
        }),
      ).toThrow('broken recipe')
      expect(hatsuAudioGraph()).toBe(game)
    })
    expect(hatsuAudioGraph()).toBe(outside)
  })

  it('uses the isolated mode destination without consulting the tour room or listener', () => {
    const target = {} as AudioNode
    const graph = { oneShotTarget: target } as Graph
    expect(emissionTarget(graph)).toBe(target)
  })
})
