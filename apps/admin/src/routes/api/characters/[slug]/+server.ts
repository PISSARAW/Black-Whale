import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { getPrisma } from '$lib/server/db'

export const GET: RequestHandler = async ({ params }) => {
  try {
    const prisma = await getPrisma()

    const character = await prisma.character.findUnique({
      where: { slug: params.slug },
    })

    if (!character) {
      return json({ error: 'Character not found' }, { status: 404 })
    }

    return json(character)
  } catch (error) {
    return json({ error: 'Failed to fetch character' }, { status: 500 })
  }
}
