import { describe, expect, it, vi } from 'vitest'
import type { PvpView } from './types'
import { createSnapshotStream, SNAPSHOT_STREAM_STALE_MS } from './snapshotStream'

async function settle() {
  for (let i = 0; i < 30; i++) await Promise.resolve()
}
function connection(options: { accept?: () => void; eventStream?: boolean } = {}) {
  let now = 1000
  let source!: ReadableStreamDefaultController<Uint8Array>
  const cancel = vi.fn(),
    failed = vi.fn()
  const accept = vi.fn((_view: PvpView) => options.accept?.())
  const fetcher = vi.fn(async function (
    this: unknown,
    _url: RequestInfo | URL,
    _init?: RequestInit,
  ) {
    // The native browser fetch rejects an object receiver (Illegal invocation).
    expect(this).toBeUndefined()
    return new Response(
      new ReadableStream({
        start(controller) {
          source = controller
        },
        cancel,
      }),
      {
        headers: {
          'content-type': options.eventStream === false ? 'application/json' : 'text/event-stream',
        },
      },
    )
  })
  const stream = createSnapshotStream({
    endpoint: '/match?example=1',
    fetch: fetcher as typeof fetch,
    headers: () => ({ authorization: 'Bearer private-seat' }),
    accept,
    failed,
    now: () => now,
  })
  return {
    stream,
    fetcher,
    accept,
    failed,
    cancel,
    time: (ms: number) => {
      now += ms
    },
    send: (text: string) => source.enqueue(new TextEncoder().encode(text)),
  }
}
describe('private view streaming lifecycle', () => {
  it('replaces a silent stream without retaining its reader or repeating an accepted event', async () => {
    const c = connection()
    c.stream.start()
    await settle()
    c.send('data: {"revision":1}\n\n')
    await settle()
    c.time(SNAPSHOT_STREAM_STALE_MS + 1)
    c.stream.start()
    await settle()
    expect(c.fetcher).toHaveBeenCalledTimes(2)
    expect(c.cancel).toHaveBeenCalledTimes(1)
    c.send('data: {"revision":2}\n\n')
    await settle()
    expect(c.accept.mock.calls.map(([view]) => view.revision)).toEqual([1, 2])
    expect(c.stream.connected).toBe(true)
    expect(c.failed).not.toHaveBeenCalled()
    c.stream.stop()
    await settle()
    expect(c.cancel).toHaveBeenCalledTimes(2)
  })
  it('keeps a healthy stream across many watchdog intervals', async () => {
    const c = connection()
    c.stream.start()
    await settle()
    for (let revision = 0; revision < 8; revision++) {
      c.time(1000)
      c.send(`data: ${JSON.stringify({ revision })}\n\n`)
      await settle()
      c.stream.start()
    }
    expect(c.fetcher).toHaveBeenCalledOnce()
    expect(c.accept).toHaveBeenCalledTimes(8)
    c.stream.stop()
    await settle()
  })
  it('parses split CRLF events and keeps the token in headers', async () => {
    const c = connection()
    c.stream.start()
    await settle()
    c.send('data: {"revision":1}\r')
    c.send('\n\r\ndata: {"revision":2}\n\n')
    await settle()
    expect(c.accept.mock.calls.map(([view]) => view.revision)).toEqual([1, 2])
    expect(c.fetcher.mock.calls[0][0]).toBe('/match?example=1&stream=1')
    expect((c.fetcher.mock.calls[0][1]!.headers as Record<string, string>).authorization).toBe(
      'Bearer private-seat',
    )
    c.stream.stop()
    await settle()
    expect(c.cancel).toHaveBeenCalledOnce()
    expect(c.stream.connected).toBe(false)
  })
  it('cancels unsupported bodies and leaves HTTP as the permanent fallback', async () => {
    const c = connection({ eventStream: false })
    c.stream.start()
    await settle()
    c.stream.start()
    expect(c.cancel).toHaveBeenCalledOnce()
    expect(c.fetcher).toHaveBeenCalledOnce()
    expect(c.failed).not.toHaveBeenCalled()
    c.stream.stop()
  })
  it.each(['DIVERGED', 'VERSION'])(
    'cancels a rejected %s stream and preserves its diagnostic',
    async (error) => {
      const c = connection({
        accept: () => {
          throw Error(error)
        },
      })
      c.stream.start()
      await settle()
      c.send('data: {}\n\n')
      await settle()
      expect(c.failed.mock.calls[0][0].message).toBe(error)
      expect(c.cancel).toHaveBeenCalledOnce()
      expect(c.stream.connected).toBe(false)
      c.stream.stop()
    },
  )
  it('classifies malformed JSON as divergence and releases the reader', async () => {
    const c = connection()
    c.stream.start()
    await settle()
    c.send('data: {bad}\n\n')
    await settle()
    expect(c.failed.mock.calls[0][0].message).toBe('DIVERGED')
    expect(c.cancel).toHaveBeenCalledOnce()
    c.stream.stop()
  })
})
