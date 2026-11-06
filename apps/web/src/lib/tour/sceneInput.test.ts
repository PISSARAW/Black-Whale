import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { listenToSceneInput, sceneKeyIsForElsewhere, type SceneInputHandlers } from './sceneInput'

class Element extends EventTarget {
  isContentEditable = false
  focus = vi.fn(() => {
    focusState.current = this
  })
  constructor(readonly kind: 'canvas' | 'select' | 'button' | 'input' = 'canvas') {
    super()
  }
  closest(selector: string) {
    if (selector.includes(this.kind)) return this
    return this.kind === 'canvas' && selector.includes('[tabindex]') ? this : null
  }
}
const focusState: { current: Element | null } = { current: null }
const canvasElement = (element: Element) => element as unknown as HTMLCanvasElement
const key = (target: Element, code = 'ArrowUp') => ({ target, code }) as unknown as KeyboardEvent
const handlers = (): SceneInputHandlers => ({
  mouseDown: vi.fn(),
  mouseMove: vi.fn(),
  mouseUp: vi.fn(),
  touchStart: vi.fn(),
  touchMove: vi.fn(),
  touchEnd: vi.fn(),
  touchCancel: vi.fn(),
  keyDown: vi.fn(),
  keyUp: vi.fn(),
  pointerLockChange: vi.fn(),
})

beforeEach(() => {
  vi.stubGlobal('HTMLElement', Element)
  vi.stubGlobal('window', new EventTarget())
  vi.stubGlobal('document', new EventTarget())
  focusState.current = new Element('select')
})
afterEach(() => vi.unstubAllGlobals())

describe('entering the walk after using page controls', () => {
  it('hands the keyboard from the deck selector to the canvas before the mouse handler runs', () => {
    const canvas = new Element(),
      callbacks = handlers()
    callbacks.mouseDown = vi.fn(() => expect(focusState.current).toBe(canvas))
    const dispose = listenToSceneInput(canvasElement(canvas), callbacks)
    expect(sceneKeyIsForElsewhere(key(focusState.current!), canvas)).toBe(true)
    canvas.dispatchEvent(new Event('mousedown'))
    expect(canvas.focus).toHaveBeenCalledWith({ preventScroll: true })
    expect(callbacks.mouseDown).toHaveBeenCalledOnce()
    expect(sceneKeyIsForElsewhere(key(focusState.current!), canvas)).toBe(false)
    dispose()
  })

  it('also takes focus on touch, and disposes both focus listeners with the scene', () => {
    const canvas = new Element(),
      callbacks = handlers()
    const dispose = listenToSceneInput(canvasElement(canvas), callbacks)
    canvas.dispatchEvent(new Event('touchstart'))
    expect(focusState.current).toBe(canvas)
    expect(callbacks.touchStart).toHaveBeenCalledOnce()
    dispose()
    canvas.dispatchEvent(new Event('mousedown'))
    canvas.dispatchEvent(new Event('touchstart'))
    expect(canvas.focus).toHaveBeenCalledOnce()
    expect(callbacks.mouseDown).not.toHaveBeenCalled()
  })

  it('lets a keyboard-focused canvas use arrows, space and Enter while protecting page controls', () => {
    const canvas = new Element()
    for (const code of [
      'ArrowUp',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      'Space',
      'Enter',
      'KeyW',
    ]) {
      expect(sceneKeyIsForElsewhere(key(canvas, code), canvas)).toBe(false)
    }
    expect(sceneKeyIsForElsewhere(key(new Element('button')), canvas)).toBe(true)
    expect(sceneKeyIsForElsewhere(key(new Element('input'), 'KeyW'), canvas)).toBe(true)
    const editor = new Element('button')
    editor.isContentEditable = true
    expect(sceneKeyIsForElsewhere(key(editor, 'KeyW'), canvas)).toBe(true)
  })
})
