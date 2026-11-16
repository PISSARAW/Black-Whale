import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { createFeitanScene } from './feitanScene'
import { createPainPacker } from './feitanPain'
import { createRisingSun } from './feitanSun'
import { createFightState } from './fightState'

describe('Pain Packer presentation', () => {
  it('attaches the outfit to the current rig and keeps the heat boundary fixed in world space', () => {
    const scene = new THREE.Scene()
    const figures = { player: new THREE.Group(), opponent: new THREE.Group() }
    const effects = createFeitanScene({
      THREE,
      scene,
      figureOf: (side) => figures[side],
      worldX: (x) => (x - 50) * 0.115,
      worldY: (y) => y * 0.12,
    })
    const base = createFightState('feitan', 'hisoka')
    const sun = createRisingSun(base.player, 60)
    const state = {
      ...base,
      phase: 'fighting' as const,
      player: {
        ...base.player,
        hatsuEffects: {
          ...base.player.hatsuEffects,
          painPacker: { ...createPainPacker(), armour: true, sun },
        },
      },
    }
    effects.sync(state, 1)
    expect(figures.player.getObjectByName('pain-packer:player')?.visible).toBe(true)
    const heat = scene.getObjectByName('solar-heat:player')!
    expect(heat.visible).toBe(true)
    expect(heat.scale.x).toBeCloseTo(sun.radius * 0.115)
    expect(heat.scale.y).toBeCloseTo(sun.radius * 0.12)
    const position = heat.position.clone()
    figures.player = new THREE.Group()
    effects.sync({ ...state, player: { ...state.player, x: 90 } }, 2)
    expect(figures.player.getObjectByName('pain-packer:player')).toBeDefined()
    expect(heat.position).toEqual(position)
    effects.sync({ ...state, phase: 'finished' }, 3)
    expect(heat.visible).toBe(false)
    expect(scene.getObjectByName('rising-sun:player')?.visible).toBe(false)
    effects.dispose()
    expect(scene.children).toHaveLength(0)
    expect(figures.player.children).toHaveLength(0)
  })
})
