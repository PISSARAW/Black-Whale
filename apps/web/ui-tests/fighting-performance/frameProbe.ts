import type { WebGLRenderer } from 'three'

interface Sample {
  interval: number
  work: number
  calls: number
  triangles: number
  geometries: number
  textures: number
  gpuMs?: number
}
const LIMIT = 40000
export function installFrameProbe() {
  const original = requestAnimationFrame.bind(window)
  const ids = new WeakMap<FrameRequestCallback, number>()
  let sequence = 0,
    active = 0,
    render = 0,
    previous = 0
  let renderTime: number | null = null
  let enabled = false
  let renderer: WebGLRenderer | null = null
  let samples: Sample[] = []
  let droppedSamples = 0
  let gpuSupported = false
  let gpuDisjoint = 0
  let gpuTiming = false
  const pending: Array<{ query: WebGLQuery; sample: Sample }> = []
  let callbacks: Record<number, { name: string; count: number; total: number; max: number }> = {}
  window.requestAnimationFrame = (callback) => {
    if (!ids.has(callback)) ids.set(callback, ++sequence)
    const id = ids.get(callback)!
    return original((now) => {
      active = id
      const start = performance.now()
      if (id === render) renderer?.info.reset()
      const context = gpuTiming && id === render ? renderer?.getContext() : null
      const gl = context instanceof WebGL2RenderingContext ? context : null
      const timer = gl?.getExtension('EXT_disjoint_timer_query_webgl2')
      if (gl && timer) {
        gpuSupported = true
        const disjoint = gl.getParameter(timer.GPU_DISJOINT_EXT)
        if (disjoint) gpuDisjoint++
        while (
          pending.length &&
          (disjoint || gl.getQueryParameter(pending[0].query, gl.QUERY_RESULT_AVAILABLE))
        ) {
          const held = pending.shift()!
          if (!disjoint) held.sample.gpuMs = gl.getQueryParameter(held.query, gl.QUERY_RESULT) / 1e6
          gl.deleteQuery(held.query)
        }
      }
      const query = enabled && gl && timer && pending.length < 8 ? gl.createQuery() : null
      if (query && gl && timer) gl.beginQuery(timer.TIME_ELAPSED_EXT, query)
      callback(renderTime ?? now)
      if (query && gl && timer) gl.endQuery(timer.TIME_ELAPSED_EXT)
      const work = performance.now() - start
      if (enabled) {
        const row = (callbacks[id] ??= {
          name: callback.name || `callback-${id}`,
          count: 0,
          total: 0,
          max: 0,
        })
        row.count++
        row.total += work
        row.max = Math.max(row.max, work)
        if (id === render && renderer && samples.length >= LIMIT) {
          droppedSamples++
          if (query && gl) gl.deleteQuery(query)
        }
        if (id === render && renderer && samples.length < LIMIT) {
          if (previous) {
            const sample = {
              interval: now - previous,
              work,
              calls: renderer.info.render.calls,
              triangles: renderer.info.render.triangles,
              geometries: renderer.info.memory.geometries,
              textures: renderer.info.memory.textures,
            }
            samples.push(sample)
            if (query) pending.push({ query, sample })
          } else if (query && gl) gl.deleteQuery(query)
          previous = now
        }
      }
      active = 0
    })
  }
  return {
    gpuTiming(value: boolean) {
      gpuTiming = value
    },
    draw(current: WebGLRenderer) {
      renderer = current
      renderer.info.autoReset = false
      render = active
    },
    freezeTime(value: number) {
      renderTime = value
    },
    reset() {
      renderTime = null
      samples = []
      droppedSamples = 0
      callbacks = {}
      gpuDisjoint = 0
      previous = 0
      enabled = true
    },
    stop() {
      enabled = false
    },
    result() {
      return {
        samples: samples.slice(),
        droppedSamples,
        callbacks,
        renderCallback: render,
        gpuSupported,
        gpuTiming,
        gpuDisjoint,
        resolution: renderer ? [renderer.domElement.width, renderer.domElement.height] : [],
        pixelRatio: renderer?.getPixelRatio() ?? 0,
        renderer: rendererName(renderer),
      }
    },
  }
}
function rendererName(renderer: WebGLRenderer | null) {
  const gl = renderer?.getContext()
  const info = gl?.getExtension('WEBGL_debug_renderer_info')
  return gl && info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : 'unknown'
}
