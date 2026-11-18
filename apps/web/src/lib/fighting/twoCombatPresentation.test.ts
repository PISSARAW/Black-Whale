import { describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { render } from 'svelte/server'
import MaryPanel from '$lib/components/fighting/FightBloodyMary.svelte'
import Arsenal from '$lib/components/fighting/FightRetrospectiveArsenal.svelte'
import { buildFightFigure } from './fighterFigure'
import { fightBodyMotion } from './fightBodyMotion'
import { createLuiniPassageScene } from './luiniPassageScene'
import { projectionCameraSpan } from './hanzoProjectionScene'
import { beginFight, createFight } from './engine'
import { maryState } from './bloodyMary'
import type { FightState } from './types'

vi.mock('$app/stores', async () => {
  const { readable } = await import('svelte/store')
  return { page: readable({ url: new URL('http://localhost/fr/fighting'), data: {} }) }
})
function exposed(mode: 'door' | 'ceiling'): FightState {
  const state = beginFight(createFight('luini', 'hisoka', { mode: 'versus-local' }))
  return {
    ...state,
    player: {
      ...state.player,
      x: 85,
      y: mode === 'ceiling' ? 4 : 0,
      luiniPassage: {
        mode,
        originX: 20,
        originY: 0,
        destinationId: 'player:destination',
        exitX: 85,
        exitY: mode === 'ceiling' ? 4 : 0,
        floorY: 0,
      },
    },
  }
}
describe('visible applications from the two-encounter audit', () => {
  it.each(['door', 'ceiling'] as const)(
    'splits the production rig for the %s and restores all parts on exit',
    (mode) => {
      const state = exposed(mode),
        scene = new THREE.Scene()
      const model = buildFightFigure({
        THREE,
        glow: (color) => new THREE.MeshBasicMaterial({ color }),
        fighter: state.player,
      })
      scene.add(model.root)
      model.animate(0, 'idle', {
        motion: fightBodyMotion({ fighter: state.player, seconds: 0, progress: 0 }),
      })
      const original = new Map(model.turns.children.map((part) => [part, part.visible]))
      const effect = createLuiniPassageScene({
        THREE,
        scene,
        worldX: (x) => x / 10,
        worldY: (y) => y / 10,
        figureOf: (side) => (side === 'player' ? model.turns : undefined),
      })
      effect.sync(state, 0)
      expect(model.turns.getObjectByName('fight-chest')?.visible).toBe(true)
      expect(
        model.root.getObjectByName('hand-right')?.getObjectByName('luini-physical-knife'),
      ).toBeDefined()
      expect(
        model.turns.children
          .filter((part) => part.name !== 'fight-chest')
          .every((part) => !part.visible),
      ).toBe(true)
      const lower = scene.getObjectByName('luini-origin:player')!
      expect(lower.visible).toBe(true)
      expect(lower.position.x).toBe(2)
      expect(lower.getObjectByName('fight-chest')?.visible).toBe(false)
      expect(scene.getObjectByName('luini-aperture:player')?.visible).toBe(true)
      if (mode === 'ceiling') {
        expect(model.turns.rotation.z).toBeCloseTo(Math.PI)
        const height = model.turns.position.y
        effect.sync(state, 0)
        expect(model.turns.position.y).toBe(height)
      }
      effect.sync({ ...state, player: { ...state.player, luiniPassage: undefined } }, 0)
      for (const [part, visible] of original) expect(part.visible).toBe(visible)
      expect(lower.visible).toBe(false)
      expect(model.turns.rotation.z).toBeCloseTo(0)
      expect(projectionCameraSpan(state, [8.5, 7], (x) => x / 10)).toEqual({
        centre: 5.25,
        gap: 6.5,
      })
      effect.dispose()
      expect(scene.children).toEqual([model.root])
    },
  )
  it('shows the new controls and physiological seal but hides another owner’s observations', () => {
    const base = beginFight(createFight('zakuro', 'zakuro', { mode: 'versus-ai' }))
    const state = {
      ...base,
      player: {
        ...base.player,
        openWounds: 1,
        bloodyMary: { ...maryState(base.player), sealedWounds: 1 },
      },
      opponent: {
        ...base.opponent,
        bloodyMary: { ...maryState(base.opponent), lastSeen: { x: 12345, y: 0, frame: 0 } },
      },
    }
    const body = render(MaryPanel, { props: { state, language: 'fr', onCommand: () => {} } }).body
    expect(body).toContain('Gouttes-yeux sur une paroi réelle')
    expect(body).toContain('Saignement arrêté')
    expect(body).not.toContain('12345')
    const partial = exposed('door')
    const panel = render(Arsenal, {
      props: { state: partial, language: 'fr', onUse: () => {} },
    }).body
    expect(panel).toContain('Sortir complètement')
    expect(panel).toContain('Rentrer dans la pièce')
  })
})
