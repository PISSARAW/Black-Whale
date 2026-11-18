import { ContinuousDirector } from './continuousDirector'
import { beginFight, createFight } from '../../src/lib/fighting/engine'
import { luiniAnchor, luiniDestination } from '../../src/lib/fighting/luiniSpatial'
import { interactWithPreparation } from '../../src/lib/fighting/preparationSimulation'
import { LUINI_TIMING } from '../../src/lib/fighting/victory/luiniTrack'
import type { FighterId, FightSide } from '../../src/lib/fighting/types'
import type { FightStageId } from '../../src/lib/fighting/stages'

function passages(f: ContinuousDirector, side: FightSide) {
  const loser = side === 'player' ? 'opponent' : 'player'
  const origin = f.state[side].x
  const health = f.state[loser].health
  f.move(side, 'neutralSpecial')
  const anchor = luiniAnchor(f.state, side)
  const anchored = Boolean(anchor?.sealed && anchor.singleDoor) && f.state[side].x === origin
  const destination = luiniDestination(f.state, side)
  const visited = Boolean(destination?.visitedBy?.includes(side))
  f.advance(18)
  const victimDepart = f.state[loser].x
  f.move(side, 'neutralSpecial')
  const onlyDeparture = f.state[loser].x === victimDepart
  const departed = f.state[side].x === destination?.x
  f.advance(18)
  const victimReturn = f.state[loser].x
  f.move(side, 'neutralSpecial')
  const returned = f.state[side].x === origin
  const harmless = f.state[loser].health === health
  const ownerOnly = onlyDeparture && f.state[loser].x === victimReturn
  f.advance(18)
  f.held[loser] = f.direction(loser)
  f.until(() => Math.abs(f.state[loser].x - origin) < 7, 480)
  f.held[loser] = {}
  f.advance()
  f.state = interactWithPreparation(f.state, loser)
  f.advance()
  const anchorLost = !luiniAnchor(f.state, side)
  return { anchored, visited, departed, returned, harmless, ownerOnly, anchorLost }
}
export function createLuiniFilm(
  options: { target?: FighterId; side?: FightSide; stageId?: FightStageId } = {},
) {
  const f = new ContinuousDirector(),
    side = options.side ?? 'player'
  const target = options.target ?? 'hinrigh',
    stageId = options.stageId ?? 'whale-hold'
  const loser = side === 'player' ? 'opponent' : 'player'
  const player = side === 'player' ? 'luini' : target,
    opponent = side === 'player' ? target : 'luini'
  f.cut({
    player,
    opponent,
    stageId,
    gap: 6,
    title: 'LUINI',
    subtitle: 'La mauvaise porte',
    tags: [],
    ren: false,
  })
  const fresh = beginFight(
    createFight(player, opponent, {
      mode: 'versus-local',
      formatId: 'knockout',
      environment: {
        stageId,
        preparation: { mode: 'scenario', resources: ['rooms'], cohorts: [] },
      },
    }),
  )
  const room = fresh.battlefield!.entities.find((e) => e.owner === side && e.kind === 'room')!
  const exit = fresh.battlefield!.entities.find(
    (e) => e.owner === side && e.kind === 'destination',
  )!
  // The prepared scenario and starting placement are installed before the first recorded tick.
  f.state = {
    ...fresh,
    [side]: { ...fresh[side], x: room.x, aura: 100 },
    [loser]: { ...fresh[loser], x: exit.x + (side === 'player' ? -5 : 5), aura: 100 },
  }
  f.advance()
  const proof = passages(f, side)
  for (let i = 0; f.state.phase === 'fighting' && i < 60; i++) {
    f.until(() => f.free(side) && f.free(loser), 300)
    f.close(side, 5)
    f.hit(side, 'standingHeavy')
  }
  const physicalKnockout = f.state.winner === side && f.state[loser].health === 0
  if (!Object.values(proof).every(Boolean) || !physicalKnockout)
    throw new Error(
      `Native Luini passage proof failed: ${JSON.stringify({ ...proof, physicalKnockout })}`,
    )
  return {
    state: f.state,
    report: {
      ...f.report(),
      duration: 10,
      frameCount: 600,
      hero: 'luini',
      target,
      stageId,
      winner: side,
      ...proof,
      physicalKnockout,
      victimTransported: false,
      portalDamage: 0,
      timings: LUINI_TIMING,
      source:
        'A real sealed single-door scenario room anchors without travel. Only Luini departs to his own visited destination and returns, without portal damage or target transport. The target physically walks to the room and opens its real door, invalidating the anchor. An ordinary physical knockout follows. The post-verdict ambush, service-room set and blade are cinematic choreography; no portal cutting or new combat rule is added.',
    },
  }
}
