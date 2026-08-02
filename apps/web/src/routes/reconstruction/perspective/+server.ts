import { json } from '@sveltejs/kit'
import { buildPerspective } from '$lib/server/perspectives'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ url }) => {
  const observer = url.searchParams.get('observer')
  const event = url.searchParams.get('event')
  const spoiler = Number(url.searchParams.get('spoiler'))
  if (!observer || !event)
    return json({ error: 'observer and event are required' }, { status: 400 })

  try {
    const view = await buildPerspective(
      observer,
      event,
      Number.isFinite(spoiler) && spoiler > 0 ? spoiler : undefined,
    )
    return json({
      visibleBodyIds: view.visibleBodies,
      knownFactCount: view.knownFacts.length,
      beliefCount: view.beliefs.length,
    })
  } catch (error) {
    console.error('Failed to build reconstruction perspective:', error)
    return json({ error: 'perspective unavailable' }, { status: 503 })
  }
}
