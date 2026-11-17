import type { WebGLRenderer } from 'three'

export interface DrawnFight {
  frame: number
  player: string
  moveId: string | null
  attackFrame: number | null
}
export function installQualificationProbe() {
  const original = requestAnimationFrame.bind(window)
  const ids = new WeakMap<FrameRequestCallback, number>()
  let sequence = 0,
    active = 0,
    render = 0,
    previous = 0,
    enabled = false
  let renderer: WebGLRenderer | null = null
  let drawn: DrawnFight | null = null
  let samples: {
    at: number
    interval: number
    work: number
    geometries: number
    textures: number
    calls: number
    fighter: string
  }[] = []
  let dropped = 0
  let observer: (sample: DrawnFight) => void = () => {}
  window.requestAnimationFrame = (callback) => {
    if (!ids.has(callback)) ids.set(callback, ++sequence)
    const id = ids.get(callback)!
    return original((now) => {
      active = id
      const start = performance.now()
      if (id === render) renderer?.info.reset()
      callback(now)
      const work = performance.now() - start
      if (enabled && id === render && renderer && drawn) {
        if (previous && samples.length < 40000)
          samples.push({
            at: now,
            interval: now - previous,
            work,
            geometries: renderer.info.memory.geometries,
            textures: renderer.info.memory.textures,
            calls: renderer.info.render.calls,
            fighter: drawn.player,
          })
        else if (samples.length >= 40000) dropped++
        previous = now
      }
      active = 0
    })
  }
  return {
    draw(current: WebGLRenderer, data: DrawnFight | undefined) {
      if (renderer !== current) drawn = null
      renderer = current
      renderer.info.autoReset = false
      render = active
      if (data) {
        drawn = data
        observer(data)
      }
    },
    observe(next: (sample: DrawnFight) => void) {
      observer = next
    },
    reset() {
      samples = []
      dropped = 0
      previous = 0
      enabled = true
    },
    stop() {
      enabled = false
    },
    result() {
      const gl = renderer?.getContext()
      const extension = gl?.getExtension('WEBGL_debug_renderer_info')
      return {
        samples: samples.slice(),
        dropped,
        renderer:
          gl && extension ? String(gl.getParameter(extension.UNMASKED_RENDERER_WEBGL)) : 'unknown',
        resolution: renderer ? [renderer.domElement.width, renderer.domElement.height] : [],
        pixelRatio: renderer?.getPixelRatio() ?? 0,
      }
    },
  }
}
