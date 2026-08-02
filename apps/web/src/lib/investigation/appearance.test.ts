import { describe, expect, it } from 'vitest'
import { room1014Case } from './case'
import { subjectSceneAppearance } from './appearance'

describe('investigation scene appearance', () => {
  it('keeps the victim larger, brighter and above the floor', () => {
    const victim = room1014Case.subjects.find((subject) => subject.isDead)!
    const appearance = subjectSceneAppearance(victim)
    expect(appearance.size).toBeGreaterThan(0.42)
    expect(appearance.y).toBeGreaterThan(0)
    expect(appearance.colour).not.toBe(victim.color)
  })
})
