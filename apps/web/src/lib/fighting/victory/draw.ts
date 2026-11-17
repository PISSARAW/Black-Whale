import type { createVictoryRenderer } from './renderer'

type Renderer = ReturnType<typeof createVictoryRenderer>

/** A missing cinematic asset must still let the finished match show its results. */
export function drawVictoryFrame(options: {
  victory: Renderer
  input: Parameters<Renderer['apply']>[0]
  draw: () => void
  failed: () => void
}) {
  let restore: (() => void) | null = null
  try {
    restore = options.victory.apply(options.input)
  } catch (error) {
    console.error('Clash victory cinematic failed', error)
    options.failed()
  }
  try {
    options.draw()
  } finally {
    restore?.()
  }
}
