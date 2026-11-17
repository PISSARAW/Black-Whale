import { tickFight } from '../../src/lib/fighting/engine'
import { EMPTY_INPUT } from '../../src/lib/fighting/types'
import { ContinuousDirector } from './continuousDirector'
import { attackData } from '../../src/lib/fighting/frameData'
import { moveForSlot } from '../../src/lib/fighting/movesets'
import type { FighterId, FightSide } from '../../src/lib/fighting/types'
import type { FightStageId } from '../../src/lib/fighting/stages'

function counter(f: ContinuousDirector, side: FightSide) {
  const loser = side === 'player' ? 'opponent' : 'player'
  const light = moveForSlot(f.state[loser].id, 'standingLight')!
  const source = { ...f.state[loser], attack: { ...f.state[loser].attack!, moveId: light.id } }
  const delay = 12 - attackData('light', source).startup
  f.until(() => f.free(side) && f.free(loser))
  f.close(side, 5)
  f.move(side, 'neutralSpecial')
  f.advance(delay)
  f.move(loser, 'standingLight')
  let control = {
    ...f.state,
    [side]: { ...f.state[side], attack: { ...f.state[side].attack!, hatsuSource: null } },
  }
  f.advance(50)
  for (let i = 0; i < 50; i++)
    control = tickFight(control, EMPTY_INPUT, { dt: 1 / 60, ai: false, opponentInput: EMPTY_INPUT })
  return {
    transferred:
      f.state[side].health > control[side].health && f.state[loser].health < control[loser].health,
    reflectedKnockout: f.state[loser].health === 0 && control[loser].health > 0,
  }
}
export function createTerebellumFatalityFilm(
  options: { target?: FighterId; stageId?: FightStageId; side?: FightSide } = {},
) {
  const f = new ContinuousDirector(),
    side = options.side ?? 'player'
  const loser = side === 'player' ? 'opponent' : 'player'
  const target = options.target ?? 'hinrigh',
    stageId = options.stageId ?? 'whale-hold'
  f.cut({
    player: side === 'player' ? 'terebellum' : target,
    opponent: side === 'player' ? target : 'terebellum',
    stageId,
    gap: 5,
    title: 'TEREBELLUM — RETOUR À L’ENVOYEUR',
    subtitle: 'Damage: Sweet Home',
    tags: ['ÉMISSION'],
    ren: false,
  })
  f.advance()
  const first = counter(f, side)
  const transferred = first.transferred
  for (let i = 0; f.state.phase === 'fighting' && f.state[loser].health > 32 && i < 100; i++) {
    f.until(() => f.free(side) && f.free(loser))
    f.close(side, 4)
    f.hit(side, f.state[loser].health > 65 ? 'standingHeavy' : 'standingLight')
  }
  const final = counter(f, side)
  const reflectedKnockout = final.reflectedKnockout
  const uninjured = f.states.every((s) => s[side].health === s[side].maxHealth)
  if (!transferred || !reflectedKnockout || !uninjured || f.state.winner !== side)
    throw new Error(
      `Native Sweet Home verdict required: ${JSON.stringify({ transferred, reflectedKnockout, uninjured, winner: f.state.winner, health: f.state[loser].health })}`,
    )
  return {
    state: f.state,
    report: {
      ...f.report(),
      duration: 10,
      frameCount: 600,
      character: 'Terebellum',
      target,
      stageId,
      winner: side,
      transferred,
      reflectedKnockout,
      uninjured,
      victory: {
        canTransferFrame: 120,
        chestTransferFrame: 240,
        finalTransferFrame: 360,
        fallFrame: 384,
        sipFrame: 486,
      },
      source:
        'A single native fight proves instant self-wound redirection with a left-hand recipient and a real reflected knockout. The can and same transferred knife stage chapter 399 after the verdict. No old wound is healed, stored, accumulated or released later, and no remote injury or extra damage is added to the result.',
    },
  }
}
