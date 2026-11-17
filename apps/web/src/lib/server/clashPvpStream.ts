import { clashPvpRegistry } from './clashPvp'
import { clashPvpFailure } from './clashPvpHttp'
import type { PvpView } from '$lib/fighting/pvp/types'

interface StreamOptions {
  id: string
  token: string
  signal: AbortSignal
  /** Injectable clock source for transport tests; the production path uses the registry. */
  peek?: () => PvpView
}
/** Authenticated, already redacted snapshots. An outgoing stream is not a heartbeat. */
export function openClashPvpStream(options: StreamOptions): Response {
  const peek = options.peek ?? (() => clashPvpRegistry.peek(options.id, options.token))
  let initial: PvpView
  try {
    initial = peek()
  } catch (error) {
    return clashPvpFailure(error)
  }
  let timer: ReturnType<typeof setTimeout> | undefined
  let closed = false
  let detach = () => {}
  const encoder = new TextEncoder()
  function stop() {
    if (closed) return
    closed = true
    clearTimeout(timer)
    detach()
  }
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      function send(view: PvpView) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(view)}\n\n`))
        if (['finished', 'abandoned'].includes(view.status)) {
          stop()
          controller.close()
        }
      }
      function next() {
        if (closed) return
        try {
          // Respect downstream backpressure without keeping a dead peer connected.
          if ((controller.desiredSize ?? 0) > 0) send(peek())
          if (!closed) timer = setTimeout(next, 1000 / 30)
        } catch {
          stop()
          controller.close()
        }
      }
      const abort = () => {
        stop()
        controller.close()
      }
      options.signal.addEventListener('abort', abort, { once: true })
      detach = () => options.signal.removeEventListener('abort', abort)
      if (options.signal.aborted) abort()
      else {
        send(initial)
        if (!closed) timer = setTimeout(next, 1000 / 30)
      }
    },
    cancel: stop,
  })
  return new Response(stream, {
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-store, no-transform',
      'x-accel-buffering': 'no',
    },
  })
}
