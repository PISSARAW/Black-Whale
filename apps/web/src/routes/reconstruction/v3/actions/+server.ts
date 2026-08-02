import { json } from '@sveltejs/kit'
import { prisma } from '$lib/server/db'
import { nenRuntime, timeline } from '$lib/server/nen'
import { readSpoilerLimit } from '$lib/server/spoiler'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ url, cookies }) => {
  const eventId = boundedQuery(url, 'event')
  const abilityId = boundedQuery(url, 'ability')
  const actorId = boundedQuery(url, 'actor')
  const targetId = optionalQuery(url, 'target')
  if (!eventId || !abilityId || !actorId) {
    return json({ error: 'Événement, Hatsu et acteur requis.' }, { status: 400 })
  }

  const spoilerLimit = readSpoilerLimit(cookies)
  const event = await prisma.narrativeEvent.findFirst({
    where: {
      id: eventId,
      occursOnBlackWhale: true,
      ...(spoilerLimit === undefined ? {} : { chapter: { number: { lte: spoilerLimit } } }),
    },
    select: { id: true },
  })
  if (!event) return json({ error: 'Point de divergence inconnu ou masqué.' }, { status: 404 })

  try {
    const state = await timeline.getKernelState({ eventId })
    const actions = await nenRuntime.actionsInState(
      abilityId,
      {
        actorId,
        interaction: 'activate',
        targets: targetId ? [targetId] : [],
        eventId,
      },
      state,
    )
    return json({ actions })
  } catch {
    return json({ error: 'Actions du Hatsu indisponibles.' }, { status: 400 })
  }
}

function boundedQuery(url: URL, name: string): string {
  const value = url.searchParams.get(name)?.trim() ?? ''
  return value.length <= 128 ? value : ''
}

function optionalQuery(url: URL, name: string): string | null {
  return boundedQuery(url, name) || null
}
