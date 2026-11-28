/**
 * Applies the blocking drawn by a manga panel to the otherwise approximate
 * metre-level cast distribution.
 *
 * The catalogue proves that a body is in a room. A manga view may prove more:
 * where the body is in that room and whether it is sitting. While that view is
 * active, the stronger panel evidence wins — including relocating a body whose
 * event-level projection only remembers where it went after the panel. Bodies
 * not drawn in the source panel are left out of that room's shot, but posts
 * elsewhere on the ship are untouched. An explicitly empty plan keeps its
 * whole viewed level unpopulated, including rooms seen through open doorways.
 */
import type { MangaView } from '../mangaViews'
import type { Post } from './types'

export function stagePostsForMangaView(
  posts: readonly Post[],
  view: MangaView | null,
  viewTierId: string,
): Post[] {
  if (!view?.staging) return [...posts]
  // An empty apartment plan also leaves its adjoining rooms unpopulated through open doors.
  if (view.staging.length === 0) return posts.filter((post) => post.tierId !== viewTierId)

  const staging = view.staging
  return posts.flatMap((post) => {
    const entries = staging.filter((entry) => entry.characterId === post.member.characterId)
    if (entries.length === 0) return post.spaceId === view.spaceId ? [] : [post]
    return entries.map((entry) => ({
      ...post,
      spaceId: entry.spaceId ?? view.spaceId,
      tierId: viewTierId,
      inside: true,
      at: entry.at,
      ...(entry.heading === undefined ? {} : { heading: entry.heading }),
      ...(entry.pose === undefined ? {} : { pose: entry.pose }),
      ...(entry.floorOffset === undefined ? {} : { floorOffset: entry.floorOffset }),
      ...(entry.projection ? { projection: true } : {}),
      ...(entry.unmasked ? { unmasked: true } : {}),
      ...(entry.bonolenovDisguise ? { bonolenovDisguise: entry.bonolenovDisguise } : {}),
    }))
  })
}
