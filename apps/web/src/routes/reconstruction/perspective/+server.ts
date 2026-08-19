import { json } from '@sveltejs/kit'
import { buildPerspective } from '$lib/server/perspectives'
import type { RequestHandler } from './$types'
import { log, describeError } from '$lib/server/log'

export const GET: RequestHandler = async ({ url }) => {
  const observer = url.searchParams.get('observer')
  const event = url.searchParams.get('event')
  const spoilerParam = url.searchParams.get('spoiler')
  const spoiler = spoilerParam !== null ? Number(spoilerParam) : undefined
  if (!observer || !event)
    return json({ error: 'observer and event are required' }, { status: 400 })

  try {
    const view = await buildPerspective(
      observer,
      event,
      spoiler !== undefined && Number.isFinite(spoiler) && spoiler >= 0 ? spoiler : undefined,
    )
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
