import type { PvpClient } from './client'

/** Input/render clock is independent of response time. There is no queue of RAF requests. */
export function mountPvpDuelLoop(options: {
  client: PvpClient
  joined: () => boolean
  input: () => number
  poll: () => void
}) {
  let stopped = false
  let frame = 0
  let last = performance.now()
  let timer: ReturnType<typeof setTimeout>
  function network() {
    if (stopped) return
    if (options.joined()) options.client.pump(options.input())
    timer = setTimeout(network, 50)
  }
  function render(now: number) {
    options.poll()
    const input = options.input()
    options.client.advance(Math.min(0.05, Math.max(0, (now - last) / 1000)), input)
    if (options.joined()) options.client.pump(input)
    last = now
    frame = requestAnimationFrame(render)
  }
  frame = requestAnimationFrame(render)
  timer = setTimeout(network, 50)
  return () => {
    stopped = true
    cancelAnimationFrame(frame)
    clearTimeout(timer)
  }
}
