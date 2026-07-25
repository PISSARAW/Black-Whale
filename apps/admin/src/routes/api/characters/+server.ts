import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { getPrisma } from '$lib/server/db'

export const GET: RequestHandler = async () => {
  try {
    const prisma = await getPrisma()
    
    const characters = await prisma.character.findMany({
      orderBy: { canonicalName: 'asc' }
    })
    
    return json(characters)
  } catch (error) {
    return json({ error: 'Failed to fetch characters' }, { status: 500 })
  }
}
