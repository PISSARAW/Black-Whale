import type { CastPayload, Post } from './types'

export function dressBlackWhaleCast(
  posts: Post[],
  { chapterNumber, eventId }: Pick<CastPayload, 'chapterNumber' | 'eventId'>,
): Post[] {
  const disguise =
    eventId === 'ch-392-lynch-exposes-the-false-hisoka'
      ? 'hisoka'
      : eventId === 'ch-393-bonolenov-kills-lynch'
        ? 'lynch'
        : null
  const darkSuit = chapterNumber !== null && chapterNumber >= 392 && chapterNumber <= 399
  return posts.map((post) => {
    const id = post.member.characterId
    if (id === 'keni-wang' && darkSuit) return { ...post, plainSuit: true }
    if (id === 'bonolenov-ndongo' && disguise) return { ...post, bonolenovDisguise: disguise }
    return post
  })
}
