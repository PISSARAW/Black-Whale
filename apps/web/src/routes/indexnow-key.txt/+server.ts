import type { RequestHandler } from './$types'

export const GET: RequestHandler = () => {
  const key = process.env.INDEXNOW_KEY?.trim()
  if (!key || !/^[A-Za-z0-9-]{8,128}$/.test(key)) {
    return new Response('Not configured\n', {
      status: 404,
      headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' },
    })
  }
  return new Response(`${key}\n`, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  })
}
