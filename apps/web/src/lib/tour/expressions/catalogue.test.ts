import { describe, expect, it } from 'vitest'
import { Group } from 'three'
import { EXPRESSION_CATALOGUE, EXPRESSION_FAMILIES, expressionDefinition } from './catalogue'
import { EXPRESSION_CONTROLS, EXPRESSION_REST } from './types'
import {
  expressionEnvelope,
  registerExpressionOwner,
  sampleExpression,
  sampleHumanExpression,
  setFrameExpression,
  setHumanExpression,
} from './expressionPlayer'

const cue = { id: 'colere/furieux', fade: 0 }
describe('complete expression catalogue', () => {
  it('contains every announced family and gesture as a distinct authored pose', () => {
    expect(EXPRESSION_FAMILIES).toHaveLength(29)
    expect(EXPRESSION_CATALOGUE).toHaveLength(238)
    expect(new Set(EXPRESSION_CATALOGUE.map((e) => e.id)).size).toBe(238)
    expect(new Set(EXPRESSION_CATALOGUE.map((e) => JSON.stringify(e.pose))).size).toBe(238)
    expect(EXPRESSION_FAMILIES.every((f) => f.entries.length >= 5)).toBe(true)
  })
  it.each(EXPRESSION_CATALOGUE)(
    '$id has complete, finite, reproducible controls and a real deformation',
    (entry) => {
      expect(expressionDefinition(entry.id)).toBe(entry)
      expect(Object.keys(entry.pose).sort()).toEqual([...EXPRESSION_CONTROLS].sort())
      for (const time of [0, 0.08, 0.35, 1, 7]) {
        const pose = sampleExpression({ id: entry.id, fade: 0 }, time)!
        expect(pose).toEqual(sampleExpression({ id: entry.id, fade: 0 }, time))
        expect(Object.values(pose).every(Number.isFinite)).toBe(true)
        expect(pose.eye).toBeGreaterThanOrEqual(0)
        expect(pose.jaw).toBeLessThanOrEqual(1.2)
      }
    },
  )
  it('honours start, duration, smooth entry and exit, and backward clocks', () => {
    const timed = { ...cue, start: 2, duration: 2, fade: 0.2 }
    expect(sampleExpression(timed, 1)).toBeUndefined()
    expect(expressionEnvelope(timed, 2.1)).toBeCloseTo(0.5)
    expect(expressionEnvelope(timed, 3)).toBe(1)
    expect(expressionEnvelope(timed, 3.9)).toBeCloseTo(0.5)
    expect(sampleExpression(timed, 4)).toBeUndefined()
    expect(sampleExpression(timed, 3)).toEqual(sampleExpression(timed, 3))
    expect(expressionEnvelope({ ...timed, duration: 0 }, 2)).toBe(0)
  })
  it('mixes two expressions with bounded intensity', () => {
    const first = sampleExpression(cue, 1)!
    const second = sampleExpression({ ...cue, id: 'sourire/sourire-chaleureux' }, 1)!
    const mixed = sampleExpression(
      { ...cue, secondary: { id: 'sourire/sourire-chaleureux', weight: 0.5 } },
      1,
    )!
    for (const key of EXPRESSION_CONTROLS)
      expect(mixed[key]).toBeCloseTo((first[key] + second[key]) / 2)
    expect(sampleExpression({ ...cue, intensity: 0 }, 1)).toEqual(EXPRESSION_REST)
    expect(sampleExpression({ ...cue, intensity: 100 }, 1)).toEqual(first)
  })
  it('isolates queues between actors and lets frame cues override and release persistent cues', () => {
    const root = new Group(),
      figure = new Group(),
      other = new Group()
    registerExpressionOwner(root, figure)
    setHumanExpression(root, cue)
    expect(sampleHumanExpression(figure, 1)).toEqual(sampleExpression(cue, 1))
    expect(sampleHumanExpression(other, 1)).toBeUndefined()
    setFrameExpression(figure, { expression: { id: 'signes/larmes', fade: 0 } })
    expect(sampleHumanExpression(root, 1)!.tears).toBeGreaterThan(0)
    setFrameExpression(figure)
    expect(sampleHumanExpression(root, 1)!.tears).toBe(0)
    setHumanExpression(root)
    expect(sampleHumanExpression(figure, 1)).toBeUndefined()
  })
  it('rejects invalid cues and keeps registered cues independent of caller mutations', () => {
    const root = new Group()
    expect(() => setHumanExpression(root, { id: 'missing' })).toThrow()
    expect(() => setHumanExpression(root, { ...cue, duration: -1 })).toThrow()
    expect(() => setHumanExpression(root, { ...cue, intensity: NaN })).toThrow()
    expect(() => setFrameExpression(root, { expression: { ...cue, intensity: NaN } })).toThrow()
    expect(() =>
      setHumanExpression(root, { ...cue, secondary: { id: 'missing', weight: 0.5 } }),
    ).toThrow()
    const mutable = { ...cue }
    setHumanExpression(root, mutable)
    mutable.id = 'signes/larmes'
    expect(sampleHumanExpression(root, 1)!.tears).toBe(0)
  })
  it('animates slow and fast blinks, gaze, laughter, and tremors over time', () => {
    for (const id of [
      'paupieres/clignement-lent',
      'paupieres/clignement-rapide',
      'regard/balayage-inquiet',
      'joie/rire-franc',
      'signes/tremblements',
    ]) {
      expect(sampleExpression({ id, fade: 0 }, 0.07)).not.toEqual(
        sampleExpression({ id, fade: 0 }, 0.35),
      )
    }
  })
})
