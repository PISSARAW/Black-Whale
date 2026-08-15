/**
 * Applies the blocking drawn by a manga panel to the otherwise approximate
 * metre-level cast distribution.
 *
 * The catalogue proves that a body is in a room. A manga view may prove more:
 * where the body is in that room and whether it is sitting. While that view is
 * active, the stronger panel evidence wins — including relocating a body whose
 * event-level projection only remembers where it went after the panel. Bodies
 * not drawn in the source panel are left out of that room's shot, but posts
 * elsewhere on the ship are untouched.
 */
import type { MangaView } from '../mangaViews'
import type { Post } from './types'

export function stagePostsForMangaView(
  posts: readonly Post[],
  view: MangaView | null,
  viewTierId: string,
): Post[] {
  if (!view?.staging?.length) return [...posts]

  const staging = new Map(view.staging.map((entry) => [entry.characterId, entry]))
  return posts.flatMap((post) => {
    const entry = staging.get(post.member.characterId)
    if (!entry) return post.spaceId === view.spaceId ? [] : [post]
    return [
      {
        ...post,
        spaceId: view.spaceId,
        tierId: viewTierId,
        inside: true,
        at: entry.at,
        ...(entry.heading === undefined ? {} : { heading: entry.heading }),
        ...(entry.pose === undefined ? {} : { pose: entry.pose }),
      },
    ]
  })
}
