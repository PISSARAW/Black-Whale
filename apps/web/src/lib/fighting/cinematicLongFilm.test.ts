import { describe, expect, it } from 'vitest'
import {
  makeLongFilm,
  sampleLong,
  longAudioStates,
} from '../../../demos/fighting-camera-showcase/longFilm'

describe('long 1080p camera presentation', () => {
  it('covers forty continuous duels with longer shots and a strictly advancing presentation cursor', () => {
    const film = makeLongFilm()
    expect(film).toHaveLength(40)
    for (const chapter of film) {
      expect(chapter.shots.length).toBeGreaterThan(0)
      expect(chapter.shots.every((s) => s.seconds >= 3)).toBe(true)
      expect(
        chapter.frames.every((f, i) => i === 0 || f.cursor > chapter.frames[i - 1].cursor),
      ).toBe(true)
      expect(chapter.frames.every((f) => f.speed > 0 && f.speed <= 1)).toBe(true)
      const evidence = () =>
        chapter.states.map((s) => [
          s.frame,
          s.player.x,
          s.player.y,
          s.player.health,
          s.opponent.x,
          s.opponent.y,
          s.opponent.health,
          s.impact?.sequence,
        ])
      const before = evidence()
      const moving = chapter.frames.findIndex(
        (f) => f.cursor % 1 > 0.01 && f.cursor < chapter.states.length - 1,
      )
      if (moving >= 0) {
        const shown = sampleLong(chapter, moving)
        const source = chapter.states[Math.floor(chapter.frames[moving].cursor)]
        expect(shown.state.player.health).toBe(source.player.health)
        expect(shown.state.opponent.health).toBe(source.opponent.health)
        expect(shown.state.impact).toBe(source.impact)
      }
      expect(evidence()).toEqual(before)
    }
    const audio = longAudioStates(film.find((c) => c.id === 'camilla')!)
    expect(audio.length).toBe(film.find((c) => c.id === 'camilla')!.frames.length * 2)
  }, 30000)
})
