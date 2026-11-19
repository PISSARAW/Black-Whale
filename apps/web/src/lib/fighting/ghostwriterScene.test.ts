import { describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { ghostwriterSetup, fortuneFrames, fortuneSheet } from './ghostwriterTestSetup'
import { performAuraAttack } from './engine'
import { createRetrospectiveScene } from './retrospectiveScene'
import { buildFightFigure } from './fighterFigure'
import { paintDocumentCanvas } from './paperDocumentPrint'

const glow = (color: number, opacity: number) => new THREE.MeshBasicMaterial({ color, opacity })
describe('the known ghostwriter and all written quatrains are visible through the real renderer', () => {
  it('uses the normal copied-Hatsu input and reuses the archive creature on its actual writing hand', () => {
    const state = ghostwriterSetup()
    const writing = performAuraAttack({
      state,
      side: 'player',
      kind: 'special',
      moveId: 'chrollo:neutralSpecial',
      auraCharged: false,
    })
    expect(writing.player.ghostwriterWriting).toBeDefined()
    const scene = new THREE.Scene()
    const figure = buildFightFigure({ THREE, glow, fighter: writing.player })
    const visual = createRetrospectiveScene({
      THREE,
      scene,
      worldX: (x) => x * 0.12,
      worldY: (y) => y * 0.12,
      figureOf: () => figure.root,
    })
    visual.sync(writing, 0)
    const ghost = scene.getObjectByName('chrollo-ghostwriter:player')!
    expect(ghost.userData.visitModel).toBe('ghostwriter')
    const hand = figure.root.getObjectByName('hand-right')!
    expect(ghost.position.distanceTo(hand.getWorldPosition(new THREE.Vector3()))).toBeLessThan(
      0.0001,
    )
    visual.sync(writing, 1)
    expect(scene.getObjectByName(ghost.name)).toBe(ghost)
    visual.sync(fortuneFrames(writing, 92), 2)
    expect(ghost.visible).toBe(false)
    visual.dispose()
  })
  it('prints the last quatrain inside the original paper canvas without dropping its final lines', () => {
    const state = ghostwriterSetup()
    const started = performAuraAttack({
      state,
      side: 'player',
      kind: 'special',
      moveId: 'chrollo:neutralSpecial',
      auraCharged: false,
    })
    const written = fortuneFrames(started, 92)
    const fillText = vi.fn()
    const context = {
      fillStyle: '',
      font: '',
      fillRect: vi.fn(),
      fillText,
    } as unknown as CanvasRenderingContext2D
    paintDocumentCanvas(context, fortuneSheet(written).document!.text)
    expect(fillText.mock.calls.some(([text]) => text.includes('Le mois s’achève'))).toBe(true)
    expect(fillText.mock.calls.every(([, , y]) => y < 320)).toBe(true)
    expect(fillText.mock.calls.length).toBeGreaterThanOrEqual(19)
  })
})
