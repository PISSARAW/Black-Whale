import type { PageLoad } from './$types'

export const load: PageLoad = async ({ fetch, params }) => {
  const res = await fetch(`/api/v1/characters/${params.slug}`)
  const character = res.ok ? await res.json() : null
  return { character }
}
