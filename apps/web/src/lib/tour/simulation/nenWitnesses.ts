import { auraFor, type Post, type Situation } from '$lib/tour/cast'
import type { TourNenWitness } from './systemicNen'

/** Whether a posted observer can see through the visitor's In with En or active Gyo. */
export function detectsConcealedVisitor(post: Post, situation: Situation): boolean {
  const id = post.member.characterId
  return Boolean(situation.sensedBy[id] || auraFor(post, situation).nen?.gyo)
}

/** Bodies that can actually attribute a rising pressure to the visitor. */
export function pressureWitnesses(posts: readonly Post[], situation: Situation): Post[] {
  if (!situation.visitorHidden) return [...posts]
  return posts.filter((post) => detectsConcealedVisitor(post, situation))
}

const isHighSecurity = (post: Post) =>
  post.tierId === 'tier-1' || post.spaceId.includes('royal') || post.spaceId.includes('security')

/** Social witnesses, trimmed to factions the simulation can affect. */
export function systemicNenWitnesses(
  posts: readonly Post[],
  situation: Situation,
): TourNenWitness[] {
  return pressureWitnesses(posts, situation).flatMap((post) =>
    post.member.factionId
      ? [
          {
            id: post.member.characterId,
            factionId: post.member.factionId,
            spaceId: post.spaceId,
            detectsConcealedVisitor: detectsConcealedVisitor(post, situation),
            highSecurity: isHighSecurity(post),
          },
        ]
      : [],
  )
}
