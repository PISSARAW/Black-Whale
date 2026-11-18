import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performAuraAttack } from './engine'
import { commandMary } from './bloodyMaryAction'
import { advanceBloodyMary } from './bloodyMaryFrame'
import { maryState, MARY_SCOUT_LIFE, type MaryCommand } from './bloodyMary'
import { maryScoutSees } from './bloodyMaryScouts'
import { exposedBlinkyWounds } from './blinky'
import { createFightEnvironment } from './fightEnvironment'
import { updateEntity } from './preparationWorld'
import { privatePvpState } from './pvp/view'
import type { FightState } from './types'

function duel(): FightState {
  const environment = createFightEnvironment({
    preparation: { mode: 'scenario', resources: ['rooms'], cohorts: [] },
  })
  const state = beginFight(createFight('zakuro', 'hisoka', { mode: 'versus-local', environment }))
  return {
    ...state,
    player: { ...state.player, aura: 100, x: 22, openWounds: 1 },
    opponent: { ...state.opponent, x: 70 },
  }
}
function command(state: FightState, command: MaryCommand) {
  return commandMary({ state, side: 'player', command }, performAuraAttack)
}
function frames(state: FightState, count: number) {
  for (let i = 0; i < count; i++) state = advanceBloodyMary({ ...state, frame: state.frame + 1 })
  return state
}

describe('Zakuro’s two encounters: scouting and stopping his own bleeding', () => {
  it('uses an existing injury without another self-inflicted cut, then seals flow on recall without healing', () => {
    const initial = duel(),
      deployed = command(initial, 'scout')
    expect(deployed.player.health).toBe(initial.player.health)
    expect(deployed.player.openWounds).toBe(1)
    const recalled = command(deployed, 'recall')
    expect(exposedBlinkyWounds(recalled.player)).toBe(0)
    expect(recalled.player.openWounds).toBe(1)
    expect(recalled.player.health).toBe(initial.player.health)
    const returned = frames(recalled, 90)
    expect(returned.player.bloodyMary?.available).toBe(6)
    const redeployed = command(returned, 'scout')
    expect(exposedBlinkyWounds(redeployed.player)).toBe(1)
    expect(redeployed.player.health).toBe(returned.player.health)
  })
  it('does not seal a later wound or preserve blood control after losing Nen', () => {
    const sealed = command(command(duel(), 'scout'), 'recall')
    expect(exposedBlinkyWounds({ ...sealed.player, openWounds: 2 })).toBe(1)
    const lost = { ...sealed, player: { ...sealed.player, moonlightZetsu: true } }
    expect(exposedBlinkyWounds(lost.player)).toBe(1)
    const dropped = advanceBloodyMary(lost)
    expect(dropped.player.bloodyMary?.sealedWounds).toBe(0)
    expect(dropped.player.bloodyMary?.drops).toHaveLength(0)
    expect(dropped.player.bloodyMary?.available).toBe(3) // lost blood is not recovered
  })
  it('sends real blood to an existing wall and climbs without creating a surface or additional material', () => {
    const initial = duel(),
      started = command(initial, 'scout-wall')
    expect(started.player.aura).toBe(92)
    expect(started.player.bloodyMary?.available).toBe(3)
    expect(started.player.bloodyMary?.drops[0]).toMatchObject({
      wallId: 'player:room',
      remainingFrames: MARY_SCOUT_LIFE,
    })
    expect(started.player.bloodyMary?.drops[0].x).toBe(initial.player.x)
    const climbing = frames(started, 100)
    expect(climbing.player.bloodyMary?.drops.some((drop) => drop.y > 4)).toBe(true)
    expect(climbing.opponent.health).toBe(initial.opponent.health)
    const gone = updateEntity(climbing, 'player:room', { present: false })
    expect(frames(gone, 200).player.bloodyMary?.drops.every((drop) => drop.y === 1)).toBe(true)
    const empty = { ...initial, battlefield: { ...initial.battlefield!, entities: [] } }
    expect(command(empty, 'scout-wall')).toBe(empty)
  })
  it('recalls wall scouts through both coordinates and recovers only the blood that actually returns', () => {
    const climbed = frames(command(duel(), 'scout-wall'), 100)
    const returning = command(climbed, 'recall')
    expect(returning.player.bloodyMary?.available).toBe(3)
    const done = frames(returning, 150)
    expect(done.player.bloodyMary?.drops).toHaveLength(0)
    expect(done.player.bloodyMary?.available).toBe(6)
    expect(done.player.health).toBe(climbed.player.health)
    expect(done.player.bloodyMary?.bags).toBe(climbed.player.bloodyMary?.bags)
  })
  it('reports only what a live eye sees, respects cover, and keeps observations private for P1 and P2', () => {
    const initial = command(duel(), 'scout')
    const drop = { ...initial.player.bloodyMary!.drops[0], x: 30, y: 2 }
    const nearby = { ...initial, opponent: { ...initial.opponent, x: 35 } }
    expect(maryScoutSees(nearby, 'player', drop)).toBe(true)
    const cover = {
      ...nearby.battlefield!.entities[0],
      id: 'real:cover',
      kind: 'crate' as const,
      x: 32.5,
      y: 0,
      health: 20,
      present: true,
      arena: { width: 1, height: 8 },
    }
    const blocked = {
      ...nearby,
      battlefield: { ...nearby.battlefield!, entities: [...nearby.battlefield!.entities, cover] },
    }
    expect(maryScoutSees(blocked, 'player', drop)).toBe(false)
    expect(maryScoutSees(updateEntity(blocked, cover.id, { health: 0 }), 'player', drop)).toBe(true)
    expect(maryScoutSees(nearby, 'player', { ...drop, reformFrames: 1 })).toBe(false)
    const observed = advanceBloodyMary({
      ...nearby,
      player: { ...nearby.player, bloodyMary: { ...maryState(nearby.player), drops: [drop] } },
    })
    expect(observed.player.bloodyMary?.lastSeen?.x).toBe(35)
    expect(privatePvpState(observed, 'player').player.bloodyMary?.lastSeen?.x).toBe(35)
    expect(privatePvpState(observed, 'opponent').opponent.bloodyMary?.lastSeen).toBeUndefined()
  })
  it('lets Dolphin select the scouting application at its actual cost, with its own wound and infusion kit', () => {
    const base = duel(),
      actor = createFight('kurapika', 'hisoka').player
    const prepared = {
      ...base,
      player: {
        ...actor,
        x: 22,
        aura: 9,
        openWounds: 1,
        equipment: ['blood-infusion' as const],
        kurapika: {
          ...actor.kurapika!,
          emperorTime: true,
          held: {
            source: 'zakuro' as const,
            moveId: 'zakuro:neutralSpecial',
            victim: 'opponent' as const,
            loaded: true,
            used: false,
            sustainedKeys: [],
          },
        },
      },
    }
    const used = command(prepared, 'scout-wall')
    expect(used.player.id).toBe('kurapika')
    expect(used.player.bloodyMary?.drops).toHaveLength(3)
    expect(used.player.aura).toBe(1)
    expect(used.player.kurapika?.held?.used).toBe(true)
    expect(used.player.kurapika?.held?.moveId).toBe('zakuro:downSpecial')
  })
})
