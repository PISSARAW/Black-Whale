import type { PageLoad } from './$types'

export const load: PageLoad = async ({ fetch }) => {
  const res = await fetch('/api/v1/characters')
  const characters = res.ok ? await res.json() : []
  return { characters }
}
