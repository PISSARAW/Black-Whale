import type { PvpView } from './types'

const MAX_EVENT_BYTES = 16_000_000
export const SNAPSHOT_STREAM_STALE_MS = 1500
interface SnapshotStreamOptions {
  endpoint: string
  fetch: typeof fetch
  headers: () => Record<string, string>
  accept: (view: PvpView) => void
  failed: (error: unknown) => void
  now: () => number
}
/** Fetch streaming keeps the seat token in headers, never in a URL or invitation. */
export function createSnapshotStream(options: SnapshotStreamOptions) {
  const transport = options.fetch
  let controller: AbortController | null = null
  let retryAt = 0
  let unsupported = false
  let connected = false
  let messageAt = 0
  async function read(response: Response, signal: AbortSignal) {
    if (signal.aborted) {
      await response.body?.cancel()
      return
    }
    if (!response.ok) throw Error('NETWORK')
    if (!isEventStream(response)) {
      unsupported = true
      await response.body?.cancel()
      return
    }
    const reader = response.body?.getReader()
    if (!reader) throw Error('NETWORK')
    const abort = () => {
      void reader.cancel().catch(() => {})
    }
    signal.addEventListener('abort', abort, { once: true })
    connected = true
    try {
      await consumeEvents(reader, (view) => {
        if (signal.aborted) return
        options.accept(view)
        messageAt = options.now()
      })
    } finally {
      signal.removeEventListener('abort', abort)
      await reader.cancel().catch(() => {})
      reader.releaseLock()
    }
  }
  return {
    start() {
      if (controller && options.now() - messageAt > SNAPSHOT_STREAM_STALE_MS) {
        controller.abort()
        controller = null
        connected = false
      }
      if (controller || unsupported || options.now() < retryAt) return
      const active = new AbortController()
      controller = active
      messageAt = options.now()
      const separator = options.endpoint.includes('?') ? '&' : '?'
      void transport(options.endpoint + separator + 'stream=1', {
        headers: options.headers(),
        cache: 'no-store',
        signal: active.signal,
      })
        .then((response) => read(response, active.signal))
        .catch((error) => {
          if (!active.signal.aborted) options.failed(error)
        })
        .finally(() => {
          if (controller === active) {
            connected = false
            controller = null
            retryAt = options.now() + 500
          }
        })
    },
    stop() {
      controller?.abort()
      controller = null
      connected = false
    },
    get connected() {
      return connected
    },
  }
}

function acceptMessage(message: string, accept: (view: PvpView) => void) {
  const data = message
    .split('\n')
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trimStart())
    .join('\n')
  if (!data) return
  let view: PvpView
  try {
    view = JSON.parse(data) as PvpView
  } catch {
    throw Error('DIVERGED')
  }
  accept(view)
}

function isEventStream(response: Response) {
  return Boolean(response.headers.get('content-type')?.startsWith('text/event-stream'))
}

async function consumeEvents(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  accept: (view: PvpView) => void,
) {
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    buffer = buffer.replace(/\r\n/g, '\n')
    if (buffer.length > MAX_EVENT_BYTES) throw Error('DIVERGED')
    let boundary = buffer.indexOf('\n\n')
    while (boundary >= 0) {
      const message = buffer.slice(0, boundary)
      buffer = buffer.slice(boundary + 2)
      acceptMessage(message, accept)
      boundary = buffer.indexOf('\n\n')
    }
  }
}
