import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { createChrolloEffectScene } from './chrolloEffectScene'
import { buildFightFigure } from './fighterFigure'
import { beginFight, createFight, performAuraAttack } from './engine'
import { CHROLLO_TURN } from './chrolloBook'
import { defaultFightComfort } from './fightComfort'
import { createVictoryRenderer } from './victory/renderer'
import { selectVictory } from './victory/catalogue'
import type { FightSide } from './types'

function setup() {
  const state = beginFight(createFight('chrollo', 'illumi', { mode: 'versus-local' }))
  const scene = new THREE.Scene(),
    scenery = new THREE.Group()
  let comfort = defaultFightComfort()
  const build = (side: FightSide) =>
    buildFightFigure({
      THREE,
      fighter: state[side],
      glow: (color, opacity) => new THREE.MeshBasicMaterial({ color, opacity }),
    }).root
  const models = { player: build('player'), opponent: build('opponent') }
  scene.add(scenery, models.player, models.opponent)
  const effects = createChrolloEffectScene({
    THREE,
    scene,
    worldX: (x) => x,
    worldY: (y) => y,
    figureOf: (side) => models[side],
    comfort: () => comfort,
  })
  return {
    state,
    scene,
    models,
    effects,
    scenery,
    settings: (value: typeof comfort) => {
      comfort = value
    },
  }
}
describe('Chrollo live presentation owns its transient resources', () => {
  it('moves the actual book leaf, restores it after the accent, and survives a rig rebuild', () => {
    const f = setup()
    const leaf = f.models.player.getObjectByName('book-leaf:1:combat-joint')!
    const base = leaf.rotation.z
    f.effects.sync(f.state, 0)
    const turn = performAuraAttack({
      state: f.state,
      side: 'player',
      kind: 'special',
      moveId: CHROLLO_TURN,
      auraCharged: false,
    })
    f.effects.sync(turn, 0)
    f.effects.sync({ ...turn, frame: 9 }, 0)
    expect(leaf.rotation.z - base).toBeCloseTo(0.65)
    const material = (
      f.models.player
        .getObjectByName('torso')!
        .children.find((n) => n instanceof THREE.Mesh) as THREE.Mesh
    )?.material
    f.effects.sync({ ...turn, frame: 18 }, 0)
    expect(leaf.rotation.z).toBe(base)
    f.models.player = f.models.player.clone(true)
    expect(() => f.effects.sync({ ...turn, frame: 19 }, 0)).not.toThrow()
    f.effects.dispose()
    expect(f.scene.getObjectByName('chrollo-reveals:player')).toBeUndefined()
    expect(material).toBeDefined()
  })
  it('suppresses reveal effects in reduced motion and respects an opponent’s In', () => {
    const f = setup()
    f.settings({ ...defaultFightComfort(), camera: 0, flashes: false })
    f.effects.sync(f.state, 0)
    expect(f.scene.getObjectByName('chrollo-reveals:player')!.visible).toBe(false)
    f.settings(defaultFightComfort())
    const mirror = {
      ...f.state,
      opponent: {
        ...f.state.opponent,
        id: 'chrollo' as const,
        nen: { ...f.state.opponent.nen, in: true },
      },
    }
    f.effects.sync(mirror, 0)
    expect(f.scene.getObjectByName('chrollo-reveals:opponent')!.visible).toBe(false)
    f.effects.dispose()
  })
  it('draws the decisive insert transactionally, with no phantom fish or gameplay mutation', () => {
    const f = setup(),
      camera = new THREE.PerspectiveCamera(34, 1.6, 0.1, 100)
    const state = {
      ...f.state,
      phase: 'finished' as const,
      winner: 'player' as const,
      opponent: { ...f.state.opponent, health: 0 },
    }
    const renderer = createVictoryRenderer({ scene: f.scene, camera, scenery: f.scenery })
    const snapshot = () => {
      const result: unknown[] = []
      f.scene.traverse((n) =>
        result.push([
          n.uuid,
          n.position.toArray(),
          n.quaternion.toArray(),
          n.scale.toArray(),
          n.visible,
        ]),
      )
      return result
    }
    const before = snapshot(),
      game = JSON.stringify(state)
    for (const elapsed of [0, 0.2, 0.5, 1.3, 2.6]) {
      const restore = renderer.apply({
        state,
        models: f.models,
        comfort: defaultFightComfort(),
        frame: {
          ...selectVictory(state)!,
          variant: 'chrollo-sun-moon',
          duration: 3,
          active: true,
          elapsed,
        },
      })!
      expect(f.scene.getObjectByName('chrollo-spectacle-detonation')).toBeDefined()
      expect(f.scene.getObjectByName('chrollo-decisive-seals')).toBeDefined()
      expect(f.scene.children.some((n) => n.name.includes('indoor-fish'))).toBe(false)
      restore()
      expect(snapshot()).toEqual(before)
      expect(JSON.stringify(state)).toBe(game)
    }
    renderer.dispose()
    f.effects.dispose()
  })
})
