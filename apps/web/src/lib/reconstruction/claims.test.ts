import { describe, expect, it } from 'vitest'
import { claimAppliesAt, defineReconstructionClaim } from './claims'

const claim = () =>
  defineReconstructionClaim({
    id: ' presence:body-1:event-10 ',
    eventId: ' event-10 ',
    subject: { type: 'BODY', id: ' body-1 ' },
    predicate: 'location',
    value: { locationId: 'room-1014' },
    interval: {
      from: { eventId: ' event-10 ', ordinal: 10 },
      until: { eventId: ' event-20 ', ordinal: 20 },
    },
    precision: 'EXACT_ROOM',
    certainty: 'CONFIRMED',
    sourceIds: [' source-1 ', 'source-1', '', 'source-2'],
    method: 'explicit',
  })

describe('ReconstructionClaim', () => {
  it('normalizes identifiers and deduplicates sources', () => {
    expect(claim()).toMatchObject({
      id: 'presence:body-1:event-10',
      eventId: 'event-10',
      subject: { type: 'BODY', id: 'body-1' },
      sourceIds: ['source-1', 'source-2'],
      interval: {
        from: { eventId: 'event-10', ordinal: 10 },
        until: { eventId: 'event-20', ordinal: 20 },
      },
    })
  })

  it('uses a half-open narrative interval', () => {
    expect(claimAppliesAt(claim(), 9)).toBe(false)
    expect(claimAppliesAt(claim(), 10)).toBe(true)
    expect(claimAppliesAt(claim(), 19)).toBe(true)
    expect(claimAppliesAt(claim(), 20)).toBe(false)
  })

  it('accepts undated boundaries without inventing an ordinal', () => {
    const undated = defineReconstructionClaim({
      ...claim(),
      id: 'undated',
      interval: { from: { eventId: 'event-x', ordinal: null }, until: null },
    })
    expect(claimAppliesAt(undated, 0)).toBe(true)
  })

  it('rejects structurally unusable identifiers', () => {
    expect(() => defineReconstructionClaim({ ...claim(), id: ' ' })).toThrow('requires an id')
    expect(() =>
      defineReconstructionClaim({
        ...claim(),
        subject: { type: 'BODY', id: '' },
      }),
    ).toThrow('requires a subject id')
  })
})
