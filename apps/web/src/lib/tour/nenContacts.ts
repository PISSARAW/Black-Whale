import type { NenTechniqueAction } from '@black-whale/nen-engine'
import type { Post } from './cast/types'
import type { NenCause } from './nenFeedback'
import type { Vec2 } from './types'

export function noteEnContacts(
  action: NenTechniqueAction,
  posts: readonly Post[],
  context: { position: Vec2; note: (cause: NenCause) => void },
): void {
  if (action.type === 'EN' && action.radius !== null)
    for (const post of posts) {
      const distance = Math.hypot(
        post.at[0] - context.position[0],
        post.at[1] - context.position[1],
      )
      if (distance <= action.radius) context.note({ code: 'EN_CONTACT', name: post.member.name })
    }
}

export function pressureOf(nen: { on: boolean; mode: string }): 'on' | 'ren' | 'none' {
  return nen.on ? 'on' : nen.mode === 'ren' ? 'ren' : 'none'
}
