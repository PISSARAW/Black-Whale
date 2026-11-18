import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { beginFight, createFight } from './engine'
import { buildFightFigure, fightFigureKey } from './fighterFigure'
import { hatsuDamageFactor, hatsuDefenceFactor } from './hatsu'

describe('the body keeps its own eyes, hair, clothes, joints and abilities under Illumi’s face alteration', () => {
  it('uses Hisoka’s facial shell and marks while preserving the owner’s actual eyes and combat body', () => {
    const actor = beginFight(createFight('illumi', 'hisoka')).player
    const disguised = {
      ...actor,
      illumi: {
        order: 'stay' as const,
        disguised: true,
        preparation: 0,
        disguiseMode: 'unpinned-hisoka' as const,
      },
    }
    const glow = (colour: number, opacity: number) =>
      new THREE.MeshBasicMaterial({ color: colour, opacity })
    const original = buildFightFigure({ THREE, glow, fighter: actor })
    const altered = buildFightFigure({ THREE, glow, fighter: disguised })
    const reference = buildFightFigure({ THREE, glow, fighter: { ...actor, id: 'hisoka' } })
    const part = (root: THREE.Object3D, name: string) => root.getObjectByName(name) as THREE.Mesh
    const geometry = (root: THREE.Object3D, name: string) => part(root, name).geometry
    expect(geometry(altered.root, 'manga-face')).toBe(geometry(reference.root, 'manga-face'))
    expect(geometry(altered.root, 'face-eye-left')).toBe(geometry(original.root, 'face-eye-left'))
    expect(geometry(altered.root, 'face-eye-left')).not.toBe(
      geometry(reference.root, 'face-eye-left'),
    )
    expect(altered.root.getObjectByName('signature-star')).toBeTruthy()
    expect(altered.root.getObjectByName('signature-tear')).toBeTruthy()
    expect(altered.root.getObjectByName('illumi-physical-needle')).toBeUndefined()
    for (const name of ['hand-left', 'hand-right', 'knee-left', 'knee-right']) {
      expect(altered.root.getObjectByName(name)!.position).toEqual(
        original.root.getObjectByName(name)!.position,
      )
      expect(altered.root.getObjectByName(name)!.scale).toEqual(
        original.root.getObjectByName(name)!.scale,
      )
    }
    expect(hatsuDamageFactor(disguised)).toBe(hatsuDamageFactor(actor))
    expect(hatsuDefenceFactor(disguised)).toBe(hatsuDefenceFactor(actor))
    expect(fightFigureKey(disguised)).not.toBe(fightFigureKey(actor))
    expect(disguised.id).toBe('illumi')
  })
})
