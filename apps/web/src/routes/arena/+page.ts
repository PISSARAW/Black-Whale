import { arenaTerrainId } from '$lib/arena/terrain'
import { ARENA_CHALLENGES } from '$lib/arena/challenges/catalogue'
import type { ArenaDifficulty, OpponentDoctrine } from '$lib/arena/ai'
import type { PageLoad } from './$types'

export const load: PageLoad = ({ url }) => ({
  terrainId: arenaTerrainId(url.searchParams.get('terrain')),
  challengeId: ARENA_CHALLENGES.some(({ id }) => id === url.searchParams.get('challenge'))
    ? url.searchParams.get('challenge')
    : null,
  doctrine: option(
    url.searchParams.get('doctrine'),
    ['counter', 'binder', 'artillery', 'deceiver'],
    'counter',
  ) as OpponentDoctrine,
  difficulty: option(
    url.searchParams.get('difficulty'),
    ['initiate', 'fighter', 'master'],
    'fighter',
  ) as ArenaDifficulty,
})

function option(value: string | null, allowed: string[], fallback: string): string {
  return value && allowed.includes(value) ? value : fallback
}
