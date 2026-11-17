import { ContinuousDirector } from './continuousDirector'
import { toggleEmperorTime } from '../../src/lib/fighting/kurapikaActions'
import { troupeMember } from '../../src/lib/fighting/troupeMembership'
import type { FighterId, FightSide } from '../../src/lib/fighting/types'
import type { FightStageId } from '../../src/lib/fighting/stages'

/** Native Uvogin-style route: Emperor Time, Troupe-only Jail, then actual physical blows. */
export function createKurapikaTroupeFilm(
  options: { target?: FighterId; stageId?: FightStageId; side?: FightSide } = {},
) {
  const target = options.target ?? 'chrollo',
    stageId = options.stageId ?? 'whale-hold'
  const side = options.side ?? 'player',
    loser = side === 'player' ? 'opponent' : 'player'
  if (!troupeMember(target))
    throw new Error('Chain Jail is restricted to current Phantom Troupe members')
  const f = new ContinuousDirector()
  f.cut({
    player: side === 'player' ? 'kurapika' : target,
    opponent: side === 'player' ? target : 'kurapika',
    stageId,
    gap: 5,
    title: 'KURAPIKA — LA COLÈRE ÉCARLATE',
    subtitle: 'Chain Jail',
    tags: ['BRIGADE'],
    ren: false,
  })
  f.state = toggleEmperorTime(f.state, side)
  f.advance()
  const health = f.state[loser].health
  f.hit(side, 'neutralSpecial')
  const captured = f.state[loser].chainJail?.owner === side && f.state[loser].nen.mode === 'zetsu'
  const harmlessCapture = health === f.state[loser].health
  for (let i = 0; f.state.phase === 'fighting' && i < 65; i++) {
    f.until(() => f.free(side) && f.free(loser))
    f.close(side, 4)
    f.hit(side, i % 3 === 1 ? 'standingLight' : 'standingHeavy')
  }
  const nativeBlows = f.audit.filter(
    (event) => event.kind === 'impact' && event.attacker === side && Number(event.damage) > 0,
  ).length
  const capturedDuringBlows = f.states.some(
    (state, i) =>
      i > 0 &&
      state[loser].health < f.states[i - 1][loser].health &&
      state[loser].chainJail?.owner === side,
  )
  if (
    !captured ||
    !harmlessCapture ||
    !capturedDuringBlows ||
    !nativeBlows ||
    f.state.winner !== side ||
    f.state[loser].health !== 0
  )
    throw new Error(
      `Native Troupe capture and physical knockout required: ${JSON.stringify({ captured, harmlessCapture, capturedDuringBlows, nativeBlows, winner: f.state.winner, health: f.state[loser].health })}`,
    )
  return {
    state: f.state,
    report: {
      ...f.report(),
      frameCount: 600,
      duration: 10,
      character: 'Kurapika',
      target,
      stageId,
      winner: side,
      captured,
      harmlessCapture,
      capturedDuringBlows,
      nativeBlows,
      victory: {
        jailStartFrame: 33,
        jailFrame: 63,
        punches: [84, 114, 144, 174, 204, 234, 300],
        impactFrame: 300,
        releaseFrame: 368,
        portraitFrame: 420,
      },
      source:
        'One continuous native fight activates Emperor Time, captures a real Troupe member with harmless Chain Jail and forced Zetsu, then wins through actual physical attacks. Seven cinematic blows condense that defeat; no Judgment clause, extra damage or combat-state mutation is added.',
    },
  }
}
