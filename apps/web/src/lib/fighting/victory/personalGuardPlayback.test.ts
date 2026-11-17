import { expect, it } from 'vitest'
import { get } from 'svelte/store'
import { createFight } from '../engine'
import { FIGHTING_ROSTER } from '../roster'
import { FIGHT_STAGES } from '../stages'
import type { FightState } from '../types'
import { selectVictory } from './catalogue'
import { createVictoryPlayback } from './playback'

it.each(['longhi', 'furykov'] as const)(
  'replays %s’s ten-second scene after every eligible win and rematch',
  (winner) => {
    for (const target of FIGHTING_ROSTER)
      for (const side of ['player', 'opponent'] as const)
        for (const mode of ['versus-ai', 'versus-local'] as const) {
          const fresh = createFight(
            side === 'player' ? winner : target.id,
            side === 'player' ? target.id : winner,
            { mode },
          )
          for (const stage of FIGHT_STAGES) {
            const playback = createVictoryPlayback()
            playback.sceneReady()
            for (const finishReason of [
              'knockout',
              'time',
              'hits',
              'technical-knockout',
            ] as const) {
              playback.observe(fresh)
              const won: FightState = {
                ...fresh,
                environment: { ...fresh.environment, stageId: stage.id },
                phase: 'finished',
                winner: side,
                finishReason,
                frame: 600,
              }
              const selected = selectVictory(won)!
              expect(selected.fighter).toBe(winner)
              expect(won[selected.loser].id).toBe(target.id)
              playback.observe(won)
              expect(get(playback)).toMatchObject({
                fighter: winner,
                winner: side,
                active: true,
                elapsed: 0,
              })
              playback.advance(10)
              expect(get(playback)).toMatchObject({ active: false, elapsed: 10 })
              playback.observe(won)
              expect(get(playback)?.active).toBe(false)
            }
          }
        }
  },
)
