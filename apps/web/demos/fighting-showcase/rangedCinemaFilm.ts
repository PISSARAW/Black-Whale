import { RangedCinemaDirector } from './rangedCinemaDirector'
import { selectVictory } from '../../src/lib/fighting/victory/catalogue'

export function createRangedCinemaFilm() {
  const f = new RangedCinemaDirector()
  f.cut({
    player: 'leorio',
    opponent: 'franklin',
    stageId: 'princes-burial-chamber',
    gap: 26,
    title: 'LEORIO × FRANKLIN',
    subtitle: 'Aucune ligne droite.',
    tags: ['CHAMBRE FUNÉRAIRE'],
  })
  for (const side of ['player', 'opponent'] as const)
    f.state[side] = { ...f.state[side], health: 500, maxHealth: 500 }
  f.advance(8)
  f.fire()
  f.remote(true)
  f.combos('player', 4)
  f.remote()
  f.combos('opponent', 2)
  f.gunCombo()
  f.fire('forwardSpecial')
  f.combos('player', 5)
  f.remote()
  f.gunCombo()
  f.combos('opponent', 3)
  f.combos('player', 4)
  f.remote()
  f.gunCombo()
  f.combos('opponent', 3)
  f.combos('player', 3)
  for (let i = 0; i < 12 && f.state.player.health > 75 && f.state.phase === 'fighting'; i++)
    f.physical('opponent')
  f.finishWithFranklin()
  const selection = selectVictory(f.state)
  if (!selection || selection.fighter !== 'franklin')
    throw new Error(
      JSON.stringify({
        health: f.report().finalHealth,
        aura: f.report().finalAura,
        commands: f.audit.filter((e) => e.kind === 'command' && !e.accepted),
      }),
    )
  return {
    director: f,
    selection,
    states: f.states,
    final: f.state,
    combatFrames: f.states.length,
    frameCount: f.states.length + 600,
  }
}
