import { describe, expect, it, vi } from 'vitest'
import { Fog, Group, Scene, Vector4 } from 'three'
import type { WebGLRenderer } from 'three'
import { createFight } from './engine'
import { createCinematicDetailScene } from './cinematicDetailScene'
import type { CameraDetail } from './cinematicDirector'

function fixture() {
  const scene = new Scene()
  scene.fog = new Fog(0x123456, 8, 18)
  const figures = { player: new Group(), opponent: new Group() }
  const head = new Group()
  head.name = 'kurapika-head'
  head.position.y = 1.7
  figures.player.add(head)
  scene.add(figures.player, figures.opponent)
  const detailScene = createCinematicDetailScene({ scene, figureOf: (side) => figures[side] })
  let viewport = new Vector4(0, 0, 1440, 720)
  let scissor = new Vector4(1, 2, 300, 400)
  let scissorTest = false
  const renderer = {
    domElement: { clientWidth: 1440, clientHeight: 720 },
    autoClear: false,
    getRenderTarget: () => null,
    setRenderTarget: vi.fn(),
    getViewport: (out: Vector4) => out.copy(viewport),
    setViewport: (...args: number[] | [Vector4]) => {
      viewport =
        args[0] instanceof Vector4
          ? args[0].clone()
          : new Vector4(...(args as [number, number, number, number]))
    },
    getScissor: (out: Vector4) => out.copy(scissor),
    setScissor: (...args: number[] | [Vector4]) => {
      scissor =
        args[0] instanceof Vector4
          ? args[0].clone()
          : new Vector4(...(args as [number, number, number, number]))
    },
    getScissorTest: () => scissorTest,
    setScissorTest: (value: boolean) => {
      scissorTest = value
    },
    render: vi.fn(),
  }
  const detail: CameraDetail = {
    kind: 'eyes',
    side: 'player',
    labelFr: 'Emperor Time',
    labelEn: 'Emperor Time',
  }
  const options = {
    renderer: renderer as unknown as WebGLRenderer,
    state: createFight('kurapika', 'hisoka'),
    detail,
    rect: { x: 0.67, y: 0.26, width: 0.31, height: 0.36 },
  }
  return {
    scene,
    figures,
    renderer,
    detailScene,
    options,
    viewport: () => viewport,
    scissor: () => scissor,
  }
}

describe('second camera render isolation', () => {
  it.each([false, true])(
    'restores the main scene and renderer even when rendering throws: %s',
    (throws) => {
      const f = fixture()
      const fog = f.scene.fog
      f.renderer.render.mockImplementation(() => {
        expect(f.figures.opponent.visible).toBe(false)
        expect(f.scene.fog).toBeNull()
        if (throws) throw new Error('render failed')
      })
      if (throws) expect(() => f.detailScene.draw(f.options)).toThrow('render failed')
      else expect(f.detailScene.draw(f.options)).toBe(true)
      expect(f.figures.opponent.visible).toBe(true)
      expect(f.figures.player.visible).toBe(true)
      expect(f.scene.fog).toBe(fog)
      expect(f.viewport()).toEqual(new Vector4(0, 0, 1440, 720))
      expect(f.scissor()).toEqual(new Vector4(1, 2, 300, 400))
      expect(f.renderer.getScissorTest()).toBe(false)
      expect(f.renderer.autoClear).toBe(false)
    },
  )
  it('omits missing tips and concealed bodies without failing the main view', () => {
    const f = fixture()
    f.options.detail = { ...f.options.detail, kind: 'chain', tip: 'syringe' }
    expect(f.detailScene.draw(f.options)).toBe(false)
    f.options.detail.kind = 'eyes'
    f.figures.player.visible = false
    expect(f.detailScene.draw(f.options)).toBe(false)
    expect(f.renderer.render).not.toHaveBeenCalled()
  })
})
