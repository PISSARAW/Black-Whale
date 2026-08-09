import { json } from '@sveltejs/kit'
import { prisma } from '$lib/server/db'
import { nenRuntime, timeline } from '$lib/server/nen'
import { readSpoilerLimit } from '$lib/server/spoiler'
import { messagesFor } from '$lib/i18n'
import { isLocale } from '$lib/i18n/config'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ url, cookies }) => {
  const eventId = boundedQuery(url, 'event')
  const abilityId = boundedQuery(url, 'ability')
  const actorId = boundedQuery(url, 'actor')
  const targetId = optionalQuery(url, 'target')
  const requestedLocale = url.searchParams.get('locale')
  const copy = messagesFor(isLocale(requestedLocale) ? requestedLocale : 'en').reconstruction.v3
  if (!eventId || !abilityId || !actorId) {
    return json({ error: copy.errors.requiredFields }, { status: 400 })
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
  if (!event) return json({ error: copy.errors.unknownFork }, { status: 404 })

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
    return json({ error: copy.errors.actionsUnavailable }, { status: 400 })
  }
}

function boundedQuery(url: URL, name: string): string {
  const value = url.searchParams.get(name)?.trim() ?? ''
  return value.length <= 128 ? value : ''
}

function optionalQuery(url: URL, name: string): string | null {
  return boundedQuery(url, name) || null
}
