import type { ArenaReplay } from './types'

/** Reopens a shared replay on the terrain and roster identities it recorded. */
export function replayArenaHref(currentHref: string, replay: ArenaReplay): string {
  const url = new URL(currentHref)
  const values = {
    terrain: replay.setup.terrain.id,
    doctrine: replay.doctrine,
    difficulty: replay.difficulty,
    format: replay.match.formatId,
    opponent: replay.match.opponentId,
    challenge: replay.match.challengeId,
    mission: replay.match.missionId,
    fighter: replay.match.fighterId,
    enemy: replay.match.opponentFighterId,
  }
  for (const [key, value] of Object.entries(values)) {
    if (value) url.searchParams.set(key, value)
    else url.searchParams.delete(key)
  }
  return url.toString()
}
