import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performAttack } from '../engine'
import { resolveMeleePair } from '../combatImpact'
import { attackData } from '../frameData'
import { fightReplayHash } from '../fightReplayHash'
import { withKameos } from '../kameos/state'
import type { FightSide, FightState } from '../types'
import { fightSoundEvents } from './events'
import { retainSoundContacts } from './impactHistory'
import { fightCueMix } from './cueMix'

function duel() {
  const state = beginFight(withKameos(createFight('kurapika', 'chrollo'), { player: 'luzurus' }))
  return {
    ...state,
    player: { ...state.player, x: 46, aura: 100 },
    opponent: { ...state.opponent, x: 51, aura: 100 },
  }
}

function activeStrike(state: FightState, side: FightSide) {
  const next = performAttack(state, side, 'light')
  const fighter = next[side]
  return {
    ...next,
    [side]: {
      ...fighter,
      attack: { ...fighter.attack!, frame: attackData('light', fighter).startup },
    },
  }
}

describe('tactical audio events', () => {
  it('renders both actual sides of a trade exactly once, retaining the move IDs', () => {
    const state = activeStrike(activeStrike(duel(), 'player'), 'opponent')
    const traded = resolveMeleePair(state)
    const contacts = fightSoundEvents(state, traded).filter(({ kind }) => kind === 'impact')
    expect(contacts).toEqual([
      expect.objectContaining({ side: 'player', moveId: 'kurapika:standingLight' }),
      expect.objectContaining({ side: 'opponent', moveId: 'chrollo:standingLight' }),
    ])
    expect(fightSoundEvents(traded, traded)).toEqual([])
    expect(fightReplayHash(traded)).toBe(fightReplayHash({ ...traded, audioContacts: undefined }))
  })

  it('retains two contacts across a skipped render and drops consumed contacts', () => {
    const state = activeStrike(duel(), 'player')
    const first = resolveMeleePair(state)
    const later: FightState = retainSoundContacts(first, {
      ...first,
      frame: first.frame + 2,
      impact: { ...first.impact!, sequence: first.impact!.sequence + 1 },
    })
    expect(fightSoundEvents(state, later).filter(({ kind }) => kind === 'impact')).toHaveLength(2)
    expect(fightSoundEvents(first, later).filter(({ kind }) => kind === 'impact')).toHaveLength(1)
    expect(fightSoundEvents(later, later)).toEqual([])
    const stale = { ...later, frame: later.frame + 60 }
    expect(fightSoundEvents(state, stale).filter(({ kind }) => kind === 'impact')).toEqual([])
  })

  it('keeps resources and refusals private and honors In on attack audio', () => {
    const state = duel()
    const exposed = activeStrike(state, 'opponent')
    const after = {
      ...exposed,
      player: { ...state.player, aura: 12 },
      opponent: { ...exposed.opponent, attack: { ...exposed.opponent.attack!, concealed: true } },
      commandFeedback: { player: { frame: 0, sequence: 1, outcome: 'refused' as const } },
    }
    const player = fightSoundEvents(state, after, 'player').map(({ kind }) => kind)
    const opponent = fightSoundEvents(state, after, 'opponent').map(({ kind }) => kind)
    expect(player).toEqual(expect.arrayContaining(['nen-low', 'refused']))
    expect(player).not.toContain('windup')
    expect(opponent).not.toContain('refused')
    expect(opponent).not.toContain('nen-low')
    expect(opponent).toContain('windup')
  })

  it('gives decisive cues precedence over repeated strikes and movement', () => {
    const state = activeStrike(duel(), 'player')
    const hit = resolveMeleePair(state).impact!
    const cue = { kind: 'impact' as const, x: 50, impact: hit }
    const parry = fightCueMix({ ...cue, impact: { ...hit, parried: true } })
    expect(parry.priority).toBeGreaterThan(fightCueMix(cue).priority)
    expect(fightCueMix({ kind: 'burst', x: 50 }).priority).toBe(parry.priority)
    expect(fightCueMix({ kind: 'step', x: 50 })).toEqual({ channel: 'movement', priority: 0 })
  })
})
