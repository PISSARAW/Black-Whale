import { describe, expect, it } from 'vitest'
import { createFight } from '../engine'
import { recordFightDeath } from '../fightDeaths'
import { finishExpiredFight } from '../fightTimeout'
import { resolveFightOutcome } from '../fightOutcome'
import { PICKABLE_FIGHT_FORMATS, fightFormat } from '../formats'
import type { FightState } from '../types'
import { DEATH_MATCH_BEATS, DEATH_MATCH_CHAPTERS, puppetCensusWithin } from './acts'
import {
  DEATH_MATCH_GALLERY,
  chapterCheckpoint,
  decodeCheckpoint,
  encodeCheckpoint,
  gallerySequence,
} from './checkpoints'
import { deathMatchView, hisokaCopyEstimate, hisokaDeductions } from './knowledge'
import { CANONICAL_DEATH_MATCH_PAGES, DEATH_MATCH_FORMAT } from './loadout'
import {
  advanceDeathMatch,
  createDeathMatch,
  deathMatchComplete,
  nextCanonicalBeat,
} from './scenario'
import { CANONICAL_SCRIPT, deathMatchDigest, replayDeathMatch, scriptBefore } from './script'
import { RESCUE_DELAY_FRAMES } from './verdict'

const fight = () => createFight('hisoka', 'chrollo', { formatId: DEATH_MATCH_FORMAT })
const fighting = (state: FightState): FightState => ({ ...state, phase: 'fighting' })

describe('death-match rules', () => {
  it('has no points, TKO, rounds or clock, and stays out of the free picker', () => {
    const format = fightFormat(DEATH_MATCH_FORMAT)
    expect(format).toMatchObject({ hitTarget: null, knockdownTarget: null, singleBout: true })
    expect(PICKABLE_FIGHT_FORMATS.map(({ id }) => id)).not.toContain(DEATH_MATCH_FORMAT)
  })

  it('keeps the bout going at zero HP when nobody died', () => {
    const state = fighting(fight())
    const out = resolveFightOutcome({ ...state, player: { ...state.player, health: 0 } })
    expect(out.phase).toBe('fighting')
    expect(out.player.health).toBe(1)
  })

  it('ends on a recorded death with an immediate match verdict', () => {
    const state = fighting(fight())
    const dead = recordFightDeath(
      { ...state, player: { ...state.player, health: 0 } },
      { victimSide: 'player', killerSide: 'opponent', cause: 'asphyxia', fatalCondition: true },
    )
    const out = resolveFightOutcome(dead)
    expect(out.phase).toBe('finished')
    expect(out.matchWinner).toBe('opponent')
  })

  it('never expires on the clock', () => {
    const state = { ...fighting(fight()), remainingFrames: 0 }
    expect(finishExpiredFight(state)).toBe(state)
  })

  it('opens with Chrollo’s full prepared book', () => {
    expect(fight().opponent.chrolloBook?.pages).toEqual(CANONICAL_DEATH_MATCH_PAGES)
    const anyone = createFight('kurapika', 'chrollo', { formatId: DEATH_MATCH_FORMAT })
    expect(anyone.opponent.chrolloBook?.pages).toEqual(CANONICAL_DEATH_MATCH_PAGES)
    expect(createFight('kurapika', 'chrollo').opponent.chrolloBook?.pages).toEqual([
      'sun-and-moon',
      'black-voice',
    ])
  })
})

describe('death-match scenario', () => {
  it('replays every canonical beat deterministically', () => {
    const first = replayDeathMatch(CANONICAL_SCRIPT)
    const second = replayDeathMatch(CANONICAL_SCRIPT)
    expect(first.done).toHaveLength(DEATH_MATCH_BEATS.length)
    expect(deathMatchComplete(first)).toBe(true)
    expect(deathMatchDigest(first)).toBe(deathMatchDigest(second))
    expect(first.chapter).toBe(357)
  })

  it('declares Chrollo the winner by asphyxia before the revival', () => {
    const end = replayDeathMatch(CANONICAL_SCRIPT)
    expect(end.verdict).toMatchObject({ winner: 'opponent', cause: 'asphyxia' })
    expect(end.survival.hisoka).toBe('revived')
    expect(end.verdict!.frame).toBeLessThan(end.survival.revivedFrame!)
  })

  it('follows the chosen side for the verdict', () => {
    const end = replayDeathMatch(CANONICAL_SCRIPT, { chrolloSide: 'player' })
    expect(end.verdict?.winner).toBe('player')
  })

  it('refuses out-of-order beats in the scripted mode', () => {
    const start = createDeathMatch()
    expect(advanceDeathMatch(start, { beat: 'first-explosion', frame: 10 })).toBe(start)
    expect(advanceDeathMatch(start, { beat: 'unknown', frame: 10 })).toBe(start)
  })

  it('lets the semi-free mode change only branchable beats', () => {
    const before = replayDeathMatch(scriptBefore('chrollo-feint-kick-flurry'), {
      playMode: 'semi-free',
    })
    const skipped = advanceDeathMatch(before, { beat: 'abilities-presented', frame: 99_999 })
    expect(skipped.divergences).toEqual(['chrollo-feint-kick-flurry'])
    expect(nextCanonicalBeat(skipped)).toBe('hisoka-gum-to-referee')
    const atThroat = replayDeathMatch(scriptBefore('referee-throat-cut'), { playMode: 'semi-free' })
    expect(advanceDeathMatch(atThroat, { beat: 'first-explosion', frame: 99_999 })).toBe(atThroat)
  })

  it('holds causality even in the free mode', () => {
    const free = createDeathMatch({ playMode: 'free' })
    expect(advanceDeathMatch(free, { beat: 'resuscitation', frame: 1 })).toBe(free)
    const moved = advanceDeathMatch(free, { beat: 'hisoka-retreats-ceiling', frame: 1 })
    expect(moved.done).toEqual(['hisoka-retreats-ceiling'])
  })

  it('waits about ten minutes before the rescue arrives', () => {
    const declared = replayDeathMatch(scriptBefore('rescue-arrives'))
    const death = declared.survival.deathFrame!
    const early = advanceDeathMatch(declared, { beat: 'rescue-arrives', frame: death + 60 })
    expect(early).toBe(declared)
    const late = advanceDeathMatch(declared, {
      beat: 'rescue-arrives',
      frame: death + RESCUE_DELAY_FRAMES,
    })
    expect(late.done).toContain('rescue-arrives')
  })
})

describe('death-match checkpoints and gallery', () => {
  it('round-trips a save and rejects a damaged one', () => {
    const mid = replayDeathMatch(scriptBefore('microphone-taken'))
    expect(decodeCheckpoint(encodeCheckpoint(mid))?.log).toEqual(mid.log)
    expect(decodeCheckpoint('{')).toBeNull()
    expect(
      decodeCheckpoint(JSON.stringify({ version: 1, options: {}, log: [{ beat: 'x' }] })),
    ).toBe(null)
  })

  it('restarts at the first beat of each chapter', () => {
    for (const chapter of DEATH_MATCH_CHAPTERS) {
      const state = chapterCheckpoint(chapter)
      const next = DEATH_MATCH_BEATS.find((spec) => spec.id === nextCanonicalBeat(state))
      expect(next?.chapter).toBe(chapter)
    }
  })

  it('replays each gallery sequence on its own', () => {
    for (const { id } of DEATH_MATCH_GALLERY) {
      const run = gallerySequence(id)!
      const end = run.events.reduce(advanceDeathMatch, run.start)
      expect(end.log.length - run.start.log.length).toBe(run.events.length)
    }
  })
})

describe('Hisoka’s knowledge', () => {
  it('hides Chrollo’s secrets from the Hisoka player until he deduces them', () => {
    const early = replayDeathMatch(scriptBefore('puppets-decapitated'))
    expect(deathMatchView(early, 'hisoka').secrets).toEqual([])
    expect(deathMatchView(early, 'chrollo').secrets).toContain('fake-chrollo-identity')
    const late = replayDeathMatch(scriptBefore('hand-destroyed'))
    expect(deathMatchView(late, 'hisoka').secrets).toContain('fake-chrollo-identity')
    expect(deathMatchView(late, 'hisoka').secrets).not.toContain('head-owners')
  })

  it('switches the deduction fragments off without changing what Hisoka knows', () => {
    const state = replayDeathMatch(scriptBefore('hand-destroyed'), { deductionAssists: false })
    expect(deathMatchView(state, 'hisoka').deductions).toEqual([])
    expect(hisokaDeductions(state)).toContain('fake-chrollo')
  })

  it('corrects the copy estimate once the reserve is understood', () => {
    const census = { visible: 25, reserve: 40 }
    expect(hisokaCopyEstimate(replayDeathMatch(scriptBefore('puppets-decapitated')), census)).toBe(
      0,
    )
    expect(hisokaCopyEstimate(replayDeathMatch(scriptBefore('crowd-launched')), census)).toBe(25)
    expect(hisokaCopyEstimate(replayDeathMatch(scriptBefore('fake-chrollo-decoy')), census)).toBe(
      65,
    )
  })

  it('checks puppet censuses against the chapter estimates', () => {
    expect(puppetCensusWithin(352, 25)).toBe(true)
    expect(puppetCensusWithin(356, 50)).toBe(false)
    expect(puppetCensusWithin(357, 0)).toBe(true)
  })
})
