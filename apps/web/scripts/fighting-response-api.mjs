import { Readable } from 'node:stream'

/** Test-only latency shaper around the production API and filtered snapshot stream. */
export function responseApi(api) {
  const stats = { requests: 0, droppedReceipts: 0, droppedViews: 0, streams: 0, views: 0 }
  const lost = new Set()
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
  async function serve(req, res, next) {
    if (!req.url?.startsWith('/__response/')) return next()
    stats.requests++
    const url = new URL(req.url, 'http://localhost')
    const [, , profile, id] = url.pathname.split('/')
    const latency = Number(profile.split('-')[0]) || 0
    const jitter = profile.includes('jitter') ? 15 * Math.sin(stats.requests * 1.73) : 0
    const outbound = Math.max(0, latency / 2 - jitter)
    const abort = new AbortController()
    res.once('close', () => abort.abort())
    const chunks = []
    for await (const chunk of req) chunks.push(chunk)
    await wait(Math.max(0, latency / 2 + jitter))
    const request = new Request('http://localhost' + req.url, {
      method: req.method,
      headers: req.headers,
      signal: abort.signal,
      body: req.method === 'POST' ? Buffer.concat(chunks) : undefined,
    })
    let response
    try {
      if (!id) response = api.createClashLobby(await api.clashBody(request))
      else if (url.searchParams.has('stream')) {
        stats.streams++
        response = api.openClashPvpStream({
          id,
          token: api.clashBearer(request),
          signal: abort.signal,
        })
      } else if (req.method === 'POST') {
        const body = await api.clashBody(request)
        response = api.updateClashLobby(id, request, body)
        const key = id + ':' + api.clashBearer(request)
        if (
          profile.includes('loss') &&
          body?.kind === 'input' &&
          body.packet.sequence === 3 &&
          !lost.has(key)
        ) {
          lost.add(key)
          stats.droppedReceipts++
          res.destroy()
          return
        }
      } else response = Response.json(api.clashPvpRegistry.view(id, api.clashBearer(request)))
    } catch (error) {
      response = api.clashPvpFailure(error)
    }
    res.statusCode = response.status
    for (const [name, value] of response.headers) res.setHeader(name, value)
    if (response.headers.get('content-type')?.startsWith('text/event-stream')) {
      return stream(response, res, { outbound, loss: profile.includes('loss'), stats })
    }
    const text = await response.text()
    await wait(outbound)
    if (!res.destroyed) res.end(text)
  }
  return { serve, stats }
}
async function stream(response, res, options) {
  const timers = new Set()
  let sequence = 0,
    lastDue = 0
  const reader = Readable.fromWeb(response.body)
  res.once('close', () => {
    for (const timer of timers) clearTimeout(timer)
    reader.destroy()
  })
  reader.on('error', () => {
    if (!res.destroyed) res.end()
  })
  for await (const chunk of reader) {
    options.stats.views++
    if (res.destroyed) break
    if (options.loss && ++sequence % 100 === 0) {
      options.stats.droppedViews++
      continue
    }
    const due = Math.max(lastDue + 0.01, performance.now() + options.outbound)
    lastDue = due
    const timer = setTimeout(
      () => {
        timers.delete(timer)
        if (!res.destroyed) res.write(chunk)
      },
      Math.max(0, due - performance.now()),
    )
    timers.add(timer)
  }
  const finish = setTimeout(
    () => {
      if (!res.destroyed) res.end()
    },
    Math.max(0, lastDue - performance.now()) + 1,
  )
  timers.add(finish)
}
