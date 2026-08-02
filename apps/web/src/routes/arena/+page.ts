import { arenaTerrainId } from '$lib/arena/terrain'
import type { PageLoad } from './$types'

export const load: PageLoad = ({ url }) => ({
  terrainId: arenaTerrainId(url.searchParams.get('terrain')),
})
