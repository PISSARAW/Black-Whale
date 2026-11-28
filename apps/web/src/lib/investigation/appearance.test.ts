import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import chapters from '../../../../../data/chapters/chapters.json'
import { buildHumanFigure } from '../tour/humanFigure'
import { humanProfile } from '../tour/humanProfiles'
import { room1014Case } from './case'
import { subjectSceneAppearance } from './appearance'

const glow = (color: number, opacity: number) => new THREE.MeshBasicMaterial({ color, opacity })

describe('investigation scene appearance', () => {
  it('keeps the victim larger, brighter and above the floor', () => {
    const victim = room1014Case.subjects.find((subject) => subject.isDead)!
    const appearance = subjectSceneAppearance(victim)
    expect(appearance.size).toBeGreaterThan(0.42)
    expect(appearance.y).toBeGreaterThan(0)
    expect(appearance.colour).not.toBe(victim.color)
    expect(appearance.human).toMatchObject({
      role: 'victim',
      identity: 'barrigen',
      pose: 'fallen',
    })
  })

  it.each(room1014Case.subjects)('draws $name with their shared likeness', (subject) => {
    const identity = subject.id === 'body' ? 'barrigen' : subject.id
    const seen = {
      ...subjectSceneAppearance(subject),
      id: subject.id,
      kind: 'avatar' as const,
      tierId: 'interior-room-1014',
      spaceId: 'tier-1-royal-residential-sector-room-1014-living',
      at: [0, 0] as const,
      stage: 0,
      hidden: false,
    }
    expect(humanProfile(seen).likeness).toBe(identity)
    const { root } = buildHumanFigure({ THREE, glow, seen })
    const head = identity === 'kurapika' ? 'kurapika-head' : `manga-head:${identity}`
    expect(root.getObjectByName(head)).toBeTruthy()
  })

  it('resolves the sixteen envoys in the chapter 369 catalogue to individual likenesses', () => {
    const envoys = chapters
      .find((chapter) => chapter.id === 'ch-369')!
      .timeline.find((event) => event.event.startsWith('The sixteen envoys'))!.charactersInvolved
    expect(envoys).toHaveLength(16)
    expect(new Set(envoys).size).toBe(16)
    for (const id of envoys) {
      const profile = humanProfile({
        id,
        kind: 'avatar',
        tierId: 'tier-1',
        spaceId: 'room-1014',
        at: [0, 0],
        y: 0,
        size: 0.42,
        colour: 0xffffff,
        stage: 0,
        hidden: false,
        human: { role: 'witness', identity: id, pose: 'idle', aura: 'none' },
      })
      expect(profile.likeness, id).toBe(id)
    }
  })
})
