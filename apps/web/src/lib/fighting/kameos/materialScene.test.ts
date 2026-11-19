import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { beginFight, createFight } from '../engine'
import { withKameos } from './state'
import { createKameoScene } from './scene'
import { buildFightFigure } from '../fighterFigure'

describe('support scene material changes follow the actual body geometry', () => {
  it('rebuilds the face when physical pins appear or end, while movement alone keeps the existing rig', () => {
    const state = beginFight(withKameos(createFight('illumi', 'theta'), { opponent: 'tubeppa' }))
    const slot = { ...state.kameos!.opponent!, phase: 'acting' as const }
    const scene = new THREE.Scene()
    const glow = (color: number, opacity: number) => new THREE.MeshBasicMaterial({ color, opacity })
    let builds = 0
    const draw = createKameoScene({
      scene,
      worldX: (x) => x,
      buildFighter: (fighter) => {
        builds++
        return buildFightFigure({ THREE, glow, fighter })
      },
    })
    const base = { ...state, kameos: { opponent: slot } }
    draw.sync(base, 0)
    const original = scene.getObjectByName('kameo:opponent')!
    expect(original.getObjectByName('illumi-face-warp-needle')).toBeUndefined()
    const hit = {
      ...base,
      kameos: {
        opponent: {
          ...slot,
          fighter: {
            ...slot.fighter,
            needleFace: {
              owner: 'player' as const,
              member: 0,
              origin: { source: 'personal' as const },
              needles: ['pin-a', 'pin-b', 'pin-c'] as const,
              reshaping: true,
            },
          },
        },
      },
    }
    draw.sync(hit, 1)
    const changed = scene.getObjectByName('kameo:opponent')!
    expect(changed).not.toBe(original)
    expect(changed.getObjectByName('illumi-face-warp-needle')).toBeTruthy()
    draw.sync(
      {
        ...hit,
        kameos: {
          opponent: { ...hit.kameos.opponent, fighter: { ...hit.kameos.opponent.fighter, x: 55 } },
        },
      },
      2,
    )
    expect(scene.getObjectByName('kameo:opponent')).toBe(changed)
    expect(builds).toBe(2)
    draw.sync(base, 3)
    expect(
      scene.getObjectByName('kameo:opponent')!.getObjectByName('illumi-face-warp-needle'),
    ).toBeUndefined()
    draw.dispose()
    expect(scene.getObjectByName('kameo:opponent')).toBeUndefined()
  })
})
