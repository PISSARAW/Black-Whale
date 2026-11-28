import { test } from 'vitest'
import assert from 'node:assert/strict'
import { COMBAT_FIGHTERS } from '../../src/lib/fighting/combatRoutes'
import { recordClips, orderClips, simulationFrame, impactCues, LENGTH } from './film'

const clips = recordClips()
test('every combat fighter performs its real signature route completely', () => {
  assert.equal(clips.length, COMBAT_FIGHTERS.length)
  assert.equal(clips.length, 40)
  assert.deepEqual(new Set(clips.map((c) => c.id)), new Set(COMBAT_FIGHTERS))
  for (const clip of clips) {
    assert.equal(clip.error, undefined, `${clip.id}: ${clip.error}`)
    assert.ok(clip.contacts >= clip.expected, clip.id)
  }
})
test('matching preserves every fighter once and every route plays forwards within bounds', () => {
  const ordered = orderClips(clips)
  assert.equal(new Set(ordered.map((c) => c.id)).size, clips.length)
  assert.deepEqual(
    orderClips(clips).map((c) => c.id),
    ordered.map((c) => c.id),
  )
  for (const clip of ordered) {
    const frames = Array.from({ length: LENGTH }, (_, local) => simulationFrame(clip, local))
    assert.equal(frames[0], clip.from)
    assert.equal(frames.at(-1), clip.to)
    assert.ok(
      frames.every((f, i) => f >= 0 && f < clip.states.length && (!i || f >= frames[i - 1])),
    )
    assert.ok(impactCues(clip, 0).every((c) => c.at >= 0 && c.at < LENGTH))
  }
})
