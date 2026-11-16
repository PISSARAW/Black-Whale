import { describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { render } from 'svelte/server'
import FightMachiStatus from '../components/fighting/FightMachiStatus.svelte'
import { beginFight, createFight } from './engine'
import { createMachiThreadScene } from './machiThreadScene'

vi.mock('$app/stores', async () => {
  const { readable } = await import('svelte/store')
  return { page: readable({ data: { localizedContent: {} } }) }
})
vi.mock('$lib/i18n', async () => {
  const { readable } = await import('svelte/store')
  return { locale: readable('fr') }
})

describe('Machi thread presentation uses actual engine links', () => {
  it('renders a thread to the attached target, hides it after release and disposes its resources', () => {
    const scene = new THREE.Scene()
    const effect = createMachiThreadScene({ THREE, scene, worldX: (x) => x / 10, worldY: (y) => y / 10 })
    const state = beginFight(createFight('machi', 'hisoka'))
    state.opponent.machiThread = { owner: 'player', kind: 'bind', x: state.opponent.x, y: state.opponent.y }
    effect.sync(state, 0)
    const line = scene.children.find((item) => item instanceof THREE.Line && item.visible) as THREE.Line
    expect(line.visible).toBe(true)
    const points = line.geometry.getAttribute('position')
    expect(points.getX(0)).toBeCloseTo(state.player.x / 10 + 0.18)
    expect(points.getX(points.count - 1)).toBeCloseTo(state.opponent.x / 10)
    const dispose = vi.spyOn(line.geometry, 'dispose')
    effect.sync({ ...state, opponent: { ...state.opponent, machiThread: undefined } }, 1)
    expect(line.visible).toBe(false)
    effect.dispose()
    expect(scene.children).toHaveLength(0)
    expect(dispose).toHaveBeenCalledOnce()
  })

  it('shows a tracking direction and distance without claiming that a mark immobilizes', () => {
    const state = beginFight(createFight('machi', 'hisoka'))
    state.opponent.machiThread = { owner: 'player', kind: 'mark', x: state.opponent.x, y: 0 }
    const body = render(FightMachiStatus, { props: { state, side: 'player', language: 'fr' } }).body.replace(/<!--.*?-->/gs, '')
    expect(body).toContain('Pistage · aucune immobilisation')
    expect(body.replace(/\s+/g, ' ')).toContain('→ 56.0')
    expect(body).not.toContain('Ligature · fil court maintenu')
  })
})
