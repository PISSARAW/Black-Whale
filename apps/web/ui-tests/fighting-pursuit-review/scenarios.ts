import { airRecoveryAvailable } from '$lib/fighting/airRecovery'
import { prepareCombatRoute } from '$lib/fighting/combatRouteSetup'
import { beginFight, createFight, performMove, tickFight } from '$lib/fighting/engine'
import { attackData } from '$lib/fighting/frameData'
import { HANZO_PROJECTION_STARTUP } from '$lib/fighting/hanzoProjection'
import { EMPTY_INPUT, type FightState, type FightInput, type MoveAction } from '$lib/fighting/types'

export type PursuitReviewId = 'centre' | 'coin' | 'hanzo' | 'kurapika'

export function pursuitReview(id: PursuitReviewId) {
  const corner = id === 'coin' || id === 'hanzo'
  const fighter = id === 'hanzo' || id === 'kurapika' ? id : 'hisoka'
  const defender = fighter === 'kurapika' ? 'hisoka' : 'kurapika'
  const start = beginFight(createFight(fighter, defender, { mode: 'versus-local' }))
  const initial = {
    ...start,
    player: { ...start.player, x: fighter === 'hanzo' ? 76 : 44, aura: 100 },
    opponent: { ...start.opponent, x: fighter === 'hanzo' ? 93 : 50 },
  }
  const prepared = prepare(initial)
  const states: FightState[] = [
    {
      ...prepared,
      player: { ...prepared.player, x: corner ? 87 : 44 },
      opponent: { ...prepared.opponent, x: corner ? 93 : 50 },
    },
  ]
  const command = launch(states)
  const launchFrame = states.length - 1
  const offset = fighter === 'hisoka' ? 10 : 0
  const result = followPursuit(states, offset)
  for (let f = 0; f < 18; f++) states.push(step(states.at(-1)!))
  return { states, command, launch: launchFrame, ...result }
}

function prepare(state: FightState) {
  if (state.player.id === 'hisoka') return prepareCombatRoute(state, 'bungee')
  if (state.player.id !== 'hanzo') return state
  let projected = tap(state, 'special')
  for (let f = 0; f < HANZO_PROJECTION_STARTUP; f++) projected = step(projected)
  if (!projected.player.hanzoProjection) throw new Error('Le double de Hanzo doit être actif')
  return projected
}

function step(state: FightState, guard = false) {
  return tickFight(state, EMPTY_INPUT, {
    dt: 1 / 60,
    ai: false,
    opponentInput: { ...EMPTY_INPUT, guard },
  })
}

function tap(state: FightState, action: MoveAction, input: Partial<FightInput> = {}) {
  return performMove({ state, side: 'player', action, input: { ...EMPTY_INPUT, ...input } })
}

function playUntil(states: FightState[], limit: number, end: (state: FightState) => boolean) {
  for (let f = 0; f < limit; f++) {
    const current = step(states.at(-1)!, true)
    states.push(current)
    if (end(current)) return
  }
  throw new Error(`Poursuite incomplète à l’étape ${states.length}`)
}

function launch(states: FightState[]) {
  states[0] = tap(states[0], 'light')
  // The first hit starts from neutral and is not guarded.
  for (let f = 0; f < 20 && !states.at(-1)!.impact; f++) states.push(step(states.at(-1)!))
  states[states.length - 1] = tap(states.at(-1)!, 'light')
  playUntil(states, 60, (state) => state.impact?.comboHits === 2)
  const command = states.length - 1
  states[command] = tap(states[command], 'light', { jump: true })
  playUntil(states, 60, (state) => state.impact?.comboHits === 3)
  return command
}

function followPursuit(states: FightState[], offset: number) {
  const origin = states.at(-1)!
  const { startup, active } = attackData(origin.player.attack!.kind, origin.player)
  if (offset)
    playUntil(states, 60, (state) => (state.player.attack?.frame ?? 0) >= startup + active + offset)
  let current = tap(states.at(-1)!, 'special', { right: true })
  states[states.length - 1] = current
  let opening = -1
  for (let f = 0; f < 80; f++) {
    if (opening < 0 && !current.hitstop && airRecoveryAvailable(current.opponent)) {
      opening = states.length - 1
      current = performMove({
        state: current,
        side: 'opponent',
        action: 'light',
        input: EMPTY_INPUT,
      })
    }
    current = step(current, true)
    states.push(current)
    if (current.impact?.sequence !== origin.impact?.sequence)
      return { opening, contact: states.length - 1, winner: current.impact?.attacker }
  }
  throw new Error('La poursuite ne produit aucun contact')
}
