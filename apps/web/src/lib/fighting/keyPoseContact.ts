import type { MoveTimeline } from './keyPoseTimeline'
import type { FightPose } from './fightPose'
import type { MoveSlot } from './types'

/** Wind up, hold the contact silhouette while its hitbox is live, then recover. */
export function strikeTimeline(
  windup: FightPose,
  contact: FightPose,
  follow: FightPose,
): MoveTimeline {
  return [
    { phase: 'startup', at: 0.65, pose: windup, ease: 'out' },
    { phase: 'active', at: 0, pose: contact, ease: 'snap' },
    { phase: 'active', at: 1, pose: contact },
    { phase: 'recovery', at: 0.45, pose: follow, ease: 'out' },
  ]
}

/** Older authored normals omitted the active hold and began recovering before the hitbox ended. */
export function holdNormalContacts(
  poses: Partial<Record<MoveSlot, MoveTimeline>>,
): Partial<Record<MoveSlot, MoveTimeline>> {
  return Object.fromEntries(
    Object.entries(poses).map(([slot, timeline]) => {
      if (!/^(standing|low|air)(Light|Heavy)$/.test(slot)) return [slot, timeline]
      const contacts = timeline.filter((key) => key.phase === 'active')
      if (contacts.length !== 1 || contacts[0].at !== 0) return [slot, timeline]
      const contact = contacts[0]
      const index = timeline.indexOf(contact)
      return [
        slot,
        [...timeline.slice(0, index + 1), { ...contact, at: 1 }, ...timeline.slice(index + 1)],
      ]
    }),
  )
}
