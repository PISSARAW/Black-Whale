import { describe, expect, it } from 'vitest'
import { combatRoute, COMBAT_ROUTES } from './combatRoutes'
import { createCombatRouteFight, combatRouteAction, combatRouteInput } from './combatRouteFight'
import { tickFight } from './engine'
import { performTrainingAction } from './trainingAction'
import { EMPTY_INPUT, type FightState } from './types'
import { canStartFighterAttack } from './fighterAttacks'
import { moveForSlot } from './movesets'
import { combatRouteContacts, routeHitsBefore } from './combatRouteContacts'

function step(state: FightState, guarding: boolean) {
  return tickFight(state, EMPTY_INPUT, {
    dt: 1 / 60,
    ai: false,
    opponentInput: { ...EMPTY_INPUT, guard: guarding },
  })
}
function prepare(id: string, options: { mirrored: boolean; corner: boolean; gap: number }) {
  const route = combatRoute(id)
  let state = createCombatRouteFight(route)
  const facing = options.mirrored ? -1 : 1
  const target = options.corner ? (options.mirrored ? 7 : 93) : 50
  const relocate = (x: number) => target + facing * (x - state.opponent.x)
  state = {
    ...state,
    battlefield: state.battlefield && {
      ...state.battlefield,
      entities: state.battlefield.entities.map((entity) =>
        entity.paperScatter ? { ...entity, x: relocate(entity.x) } : entity,
      ),
    },
    projectiles: state.projectiles.map((shot) =>
      shot.kallutoPaper
        ? { ...shot, x: relocate(shot.x), velocityX: shot.velocityX * facing }
        : shot,
    ),
    player: { ...state.player, x: target - facing * options.gap, facing },
    opponent: {
      ...state.opponent,
      x: target,
      facing: facing === 1 ? -1 : 1,
      ...(state.opponent.biohazardRestraint
        ? { biohazardRestraint: { ...state.opponent.biohazardRestraint, x: target } }
        : {}),
    },
  }
  if (route.kind === 'air') {
    state = tickFight(
      state,
      { ...EMPTY_INPUT, jump: true },
      { dt: 1 / 60, opponentInput: EMPTY_INPUT, ai: false },
    )
    for (let i = 0; i < 26; i++) state = step(state, false)
  }
  return state
}
function runRoute(id: string, options: { mirrored: boolean; corner: boolean; gap: number }) {
  const route = combatRoute(id)
  let state = prepare(id, options)
  const contacts: Array<{ move: string | undefined; combo: number }> = []
  let index = 0
  let lastImpact = 0
  for (let tick = 0; tick < 240 && contacts.length < combatRouteContacts(route).length; tick++) {
    const move = moveForSlot(route.fighter, route.moves[index])
    if (
      move &&
      (index === 0 || contacts.length === routeHitsBefore(route, index)) &&
      canStartFighterAttack(state.player, move.kind, move.id)
    ) {
      const slot = route.moves[index]
      const after = performTrainingAction({
        state,
        side: 'player',
        action: combatRouteAction(slot),
        input: combatRouteInput(slot, state.player.facing),
      })
      if (
        after.player.attack?.moveId === `${route.fighter}:${slot}` &&
        after.player.attack !== state.player.attack
      )
        index++
      state = after
    }
    state = step(state, contacts.length > 0)
    if (state.impact && state.impact.sequence !== lastImpact) {
      const gained = state.impact.sequence - lastImpact
      lastImpact = state.impact.sequence
      if (state.impact.attacker === 'player') {
        if (state.impact.blocked)
          throw Error(
            `Guard escaped at ${state.frame}: ${JSON.stringify(contacts)}; ${state.player.attack?.moveId}`,
          )
        const total = state.impact.comboHits ?? 0
        expect(total - contacts.length).toBe(gained)
        for (let combo = total - gained + 1; combo <= total; combo++)
          contacts.push({ move: state.player.attack?.moveId, combo })
      }
    }
  }
  return { state, contacts }
}

describe('all forty fighters’ combat routes against guard after the first hit', () => {
  for (const route of COMBAT_ROUTES)
    for (const mirrored of [false, true])
      for (const corner of [false, true])
        it.each([4, 6])(`${route.id}, mirrored=${mirrored}, corner=${corner}, gap=%s`, (gap) => {
          const { contacts } = runRoute(route.id, { mirrored, corner, gap })
          expect(contacts.map((hit) => hit.move)).toEqual(combatRouteContacts(route))
          expect(contacts.map((hit) => hit.combo)).toEqual(
            combatRouteContacts(route).map((_, index) => index + 1),
          )
        })
})
