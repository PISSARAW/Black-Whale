import { json } from '@sveltejs/kit'
import { buildPerspective } from '$lib/server/perspectives'
import type { RequestHandler } from './$types'
import { log, describeError } from '$lib/server/log'
import { readSpoilerLimit } from '$lib/server/spoiler'

export const GET: RequestHandler = async ({ url, cookies }) => {
  const observer = url.searchParams.get('observer')
  const event = url.searchParams.get('event')
  // The cap is the reader's cookie, never the query string: a client-supplied
  // `?spoiler=` is exactly how the policy would be bypassed. The parameter is
  // still accepted, but it can only ever *lower* what the cookie allows.
  const cookieCap = readSpoilerLimit(cookies)
  const asked = Number(url.searchParams.get('spoiler'))
  const queryCap = Number.isSafeInteger(asked) && asked >= 0 ? asked : undefined
  const spoiler =
    cookieCap === undefined
      ? queryCap
      : queryCap === undefined
        ? cookieCap
        : Math.min(cookieCap, queryCap)

  if (!observer || !event)
    return json({ error: 'observer and event are required' }, { status: 400 })

  try {
    const view = await buildPerspective(observer, event, spoiler)
    return json({
      visibleBodyIds: view.visibleBodies,
      knownFactCount: view.knownFacts.length,
      beliefCount: view.beliefs.length,
    })
  } catch (error) {
    log.error('Failed to build reconstruction perspective:', describeError(error))
    return json({ error: 'perspective unavailable' }, { status: 503 })
  }
}
