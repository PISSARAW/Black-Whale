import { expect, it } from 'vitest'
import { get } from 'svelte/store'
import { createFight } from '../engine'
import { FIGHT_STAGES } from '../stages'
import { FIGHTING_ROSTER } from '../roster'
import { troupeMember } from '../troupeMembership'
import type { FightSide, FightState } from '../types'
import { selectVictory } from './catalogue'
import { createVictoryPlayback } from './playback'

const MEMBERS = [
  'chrollo',
  'feitan',
  'phinks',
  'franklin',
  'illumi',
  'machi',
  'kalluto',
  'bonolenov',
  'shizuku',
] as const

it('explicitly covers every current playable Spider and excludes Hisoka', () => {
  expect(
    FIGHTING_ROSTER.filter(({ id }) => troupeMember(id))
      .map(({ id }) => id)
      .sort(),
  ).toEqual([...MEMBERS].sort())
  expect(troupeMember('hisoka')).toBe(false)
})

it.each(MEMBERS)('replays Scarlet Fury after every victory against %s', (target) => {
  for (const side of ['player', 'opponent'] as const satisfies readonly FightSide[])
    for (const mode of ['versus-ai', 'versus-local'] as const)
      for (const stage of FIGHT_STAGES) {
        const playback = createVictoryPlayback()
        playback.sceneReady()
        const fresh = createFight(
          side === 'player' ? 'kurapika' : target,
          side === 'player' ? target : 'kurapika',
          { mode, environment: { stageId: stage.id } },
        )
        for (let round = 1; round <= 2; round++) {
          playback.observe(fresh)
          const won: FightState = {
            ...fresh,
            phase: 'finished',
            winner: side,
            frame: 600 + round,
            roundNumber: round,
          }
          expect(selectVictory(won)?.variant).toBe('kurapika-troupe')
          playback.observe(won)
          expect(get(playback)).toMatchObject({
            active: true,
            elapsed: 0,
            winner: side,
            loser: side === 'player' ? 'opponent' : 'player',
            variant: 'kurapika-troupe',
          })
          playback.advance(10)
          expect(get(playback)).toMatchObject({ active: false, elapsed: 10 })
          playback.observe(won)
          expect(get(playback)?.active).toBe(false)
        }
      }
})
