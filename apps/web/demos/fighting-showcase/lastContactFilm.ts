import { LastContactDirector } from './lastContactDirector'
import { lastContactOpening, lastContactCopies } from './lastContactOpening'
import { lastContactRoom, lastContactTheft, lastContactControl } from './lastContactPages'
import { lastContactOn, lastContactFinale } from './lastContactFinale'
export function createLastContactFilm() {
  const f = new LastContactDirector()
  f.setup()
  lastContactOpening(f)
  lastContactCopies(f)
  lastContactRoom(f)
  lastContactTheft(f)
  lastContactControl(f)
  lastContactOn(f)
  lastContactFinale(f)
  return {
    koFrame: f.states.findIndex((s) => s.phase === 'finished'),
    director: f,
    states: f.states,
    final: f.state,
    combatFrames: f.states.length,
    frameCount: f.states.length,
  }
}
