import { describe, expect, it } from 'vitest'
import { ARENA_CAMPAIGN, missionStatus, unmetRequirements } from './campaign'
import { freshArenaProfile } from './profile'

describe('Arena V3 campaign', () => {
  it('starts with foundations and exposes deterministic mission presets', () => {
    const profile = freshArenaProfile()
    expect(missionStatus(ARENA_CAMPAIGN[0], profile)).toBe('available')
    expect(ARENA_CAMPAIGN.at(-1)).toMatchObject({
      boss: true,
      doctrine: 'binder',
      difficulty: 'master',
    })
  })

  it('explains every lock and unlocks chapters from proof of mastery', () => {
    const profile = freshArenaProfile()
    const hidden = ARENA_CAMPAIGN.find((mission) => mission.id === 'hidden-aura')!
    expect(unmetRequirements(hidden, profile)).toEqual(['challenge:guard', 'mastery:gyo:1'])
    profile.unlocked.push('guard')
    profile.mastery.gyo = 1
    expect(missionStatus(hidden, profile)).toBe('available')
  })
})
