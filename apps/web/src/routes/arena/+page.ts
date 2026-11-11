import { arenaTerrainId } from '$lib/arena/terrain'
import { ARENA_CHALLENGES } from '$lib/arena/challenges/catalogue'
import type { ArenaDifficulty, OpponentDoctrine } from '$lib/arena/ai'
import type { ArenaFormatId } from '$lib/arena/formats'
import type { ArenaOpponentId } from '$lib/arena/experience'
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
  formatId: option(
    url.searchParams.get('format'),
    ['first-to-three', 'survival', 'forced-mastery', 'sudden-death'],
    'first-to-three',
  ) as ArenaFormatId,
  opponentId: option(
    url.searchParams.get('opponent'),
    ['adaptive', 'counter-student', 'gum-jailer', 'silent-gunner', 'in-examiner', 'aura-auditor'],
    'counter-student',
  ) as ArenaOpponentId,
})

function option(value: string | null, allowed: string[], fallback: string): string {
  return value && allowed.includes(value) ? value : fallback
}
