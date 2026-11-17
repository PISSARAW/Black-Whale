import { afterEach, describe, expect, it, vi } from 'vitest'
import { createFightTouchPad, fightTouchDirections } from './fightTouchDirection'
import { enterFightFullscreen, exitFightFullscreen, mountFightViewport } from './fightFullscreen'
import { createHeldFightControl } from './heldFightControl'
import { fightTouchBindings } from './fightTouchHints'
import { moveInputHint } from './fightControlHints'
import { EMPTY_INPUT } from './types'

afterEach(() => vi.unstubAllGlobals())

describe('touch combat inputs', () => {
  it('supports eight directions and releases to neutral while sliding', () => {
    expect(fightTouchDirections({ x: 0, y: 0 })).toEqual([])
    expect(fightTouchDirections({ x: -0.8, y: -0.8 })).toEqual(['left', 'jump'])
    expect(fightTouchDirections({ x: 0.8, y: 0.8 })).toEqual(['right', 'down'])
    const input = { ...EMPTY_INPUT }
    const pad = createFightTouchPad((key, active) => {
      input[key] = active
    })
    pad.press(1, { x: 1, y: 0 })
    pad.move(1, { x: 0.8, y: 0.8 })
    expect(input.right && input.down).toBe(true)
    pad.move(1, { x: 0, y: 0 })
    expect(input).toEqual(EMPTY_INPUT)
    pad.move(1, { x: -1, y: -1 })
    expect(input.left && input.jump).toBe(true)
    pad.release(1)
    expect(input).toEqual(EMPTY_INPUT)
  })
  it('ignores another finger on the pad and preserves simultaneous guard', () => {
    const input = { ...EMPTY_INPUT }
    const change = (key: keyof typeof input, active: boolean) => {
      input[key] = active
    }
    const pad = createFightTouchPad(change)
    const guard = createHeldFightControl({ hold: (active) => change('guard', active) })
    pad.press(10, { x: 1, y: 0 })
    guard.press('pointer:11')
    expect(pad.press(12, { x: -1, y: -1 })).toBe(false)
    pad.move(12, { x: -1, y: 1 })
    pad.release(12)
    expect(input.right && input.guard).toBe(true)
    expect(input.left || input.down || input.jump).toBe(false)
    pad.cancel()
    expect(input.right).toBe(false)
    expect(input.guard).toBe(true)
    guard.cancel()
    expect(input).toEqual(EMPTY_INPUT)
  })
  it('never commits a charged technique after pause, blur or cancellation', () => {
    const commit = vi.fn()
    const hold = vi.fn()
    const special = createHeldFightControl({ hold, commit })
    expect(special.press('pointer:1')).toBe(true)
    expect(special.press('pointer:2')).toBe(false)
    special.release('pointer:2')
    special.cancel()
    special.release('pointer:1')
    expect(commit).not.toHaveBeenCalled()
    expect(hold.mock.calls).toEqual([[true], [false]])
  })
  it('prints the actual touch button names in the French and English combo lists', () => {
    expect(moveInputHint('→ J > K > L > H', fightTouchBindings('fr'))).toBe(
      '→ Léger > Lourd > Hatsu > Ultime',
    )
    expect(moveInputHint('↓ U > O', fightTouchBindings('en'))).toBe('↓ Shot > Throw')
  })
})

describe('mobile fullscreen and viewport fallback', () => {
  function context() {
    const orientation = { lock: vi.fn().mockResolvedValue(undefined), unlock: vi.fn() }
    const doc = {
      fullscreenElement: null as HTMLElement | null,
      exitFullscreen: vi.fn().mockResolvedValue(undefined),
      documentElement: { classList: { add: vi.fn(), remove: vi.fn() } },
    }
    const win = { scrollX: 5, scrollY: 80, scrollTo: vi.fn() }
    vi.stubGlobal('document', doc)
    vi.stubGlobal('window', win)
    vi.stubGlobal('screen', { orientation })
    return { doc, orientation, win }
  }
  it('requests hidden browser chrome before attempting landscape lock', async () => {
    const { orientation } = context()
    const requestFullscreen = vi.fn().mockResolvedValue(undefined)
    expect(await enterFightFullscreen({ requestFullscreen } as unknown as HTMLElement)).toBe(
      'native',
    )
    expect(requestFullscreen).toHaveBeenCalledWith({ navigationUI: 'hide' })
    expect(orientation.lock).toHaveBeenCalledWith('landscape')
    expect(requestFullscreen.mock.invocationCallOrder[0]).toBeLessThan(
      orientation.lock.mock.invocationCallOrder[0],
    )
  })
  it('uses the prefixed fullscreen API when it is the available implementation', async () => {
    context()
    const webkitRequestFullscreen = vi.fn()
    expect(await enterFightFullscreen({ webkitRequestFullscreen } as unknown as HTMLElement)).toBe(
      'native',
    )
    expect(webkitRequestFullscreen).toHaveBeenCalledOnce()
  })
  it('retains native fullscreen when orientation lock is unsupported', async () => {
    const { orientation } = context()
    orientation.lock.mockRejectedValue(new Error('Unsupported'))
    expect(
      await enterFightFullscreen({ requestFullscreen: vi.fn() } as unknown as HTMLElement),
    ).toBe('native')
  })
  it('keeps the viewport layout usable when iPhone has no element fullscreen API', async () => {
    const { orientation } = context()
    expect(await enterFightFullscreen({} as HTMLElement)).toBe('viewport')
    expect(orientation.lock).not.toHaveBeenCalled()
  })
  it('falls back without an unhandled rejection when the fullscreen request is refused', async () => {
    const { orientation } = context()
    expect(
      await enterFightFullscreen({
        requestFullscreen: vi.fn().mockRejectedValue(new Error('Denied')),
      } as unknown as HTMLElement),
    ).toBe('viewport')
    expect(orientation.lock).not.toHaveBeenCalled()
  })
  it('unlocks scrolling and orientation and restores the page after leaving the fight', () => {
    const { doc, orientation, win } = context()
    const mounted = mountFightViewport({} as HTMLElement)
    expect(doc.documentElement.classList.add).toHaveBeenCalledWith('clash-immersive')
    mounted.destroy()
    expect(doc.documentElement.classList.remove).toHaveBeenCalledWith('clash-immersive')
    expect(orientation.unlock).toHaveBeenCalledOnce()
    expect(win.scrollTo).toHaveBeenCalledWith(5, 80)
  })
  it('can exit prefixed native fullscreen', async () => {
    context()
    const webkitExitFullscreen = vi.fn()
    vi.stubGlobal('document', { webkitFullscreenElement: {}, webkitExitFullscreen })
    await exitFightFullscreen()
    expect(webkitExitFullscreen).toHaveBeenCalledOnce()
  })
})
