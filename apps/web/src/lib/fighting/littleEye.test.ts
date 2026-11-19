import { localPerspective } from './pvp/view'
import { littleEyeAi } from './littleEyeAi'
import { advanceProjectiles, projectileProfile } from './projectiles'
import { speakPaperWords } from './kallutoListening'
import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performAttack, tickFight } from './engine'
import { advancePreparation } from './preparationSimulation'
import { controlledEntities } from './preparationActions'
import { updateEntity } from './preparationWorld'
import { arsenalOptions, performArsenalCommand } from './retrospectiveArsenal'
import { privatePvpState } from './pvp/view'
import { createReplayRecorder } from './fightReplayRecorder'
import { createReplayPlayer } from './fightReplayPlayer'
import { decodeFightReplay } from './fightReplayCodec'
import { executeReplayPacket } from './fightReplayCommands'
import { panelReplayCommand } from './fightReplayPanels'
import { fightReplayHash } from './fightReplayHash'
import type { ReplayPacket } from './fightReplayTypes'
import { EMPTY_INPUT, type FightState } from './types'

function scenario(): FightState {
  const state = beginFight(
    createFight('sayird', 'hisoka', {
      mode: 'versus-local',
      environment: { preparation: { mode: 'scenario', resources: ['animals'], cohorts: [] } },
    }),
  )
  return { ...state, player: { ...state.player, aura: 100 } }
}
function frames(state: FightState, count: number): FightState {
  for (let index = 0; index < count; index++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  return state
}
function captured(): FightState {
  return frames(performAttack(scenario(), 'player', 'special'), 8)
}

describe('Little Eye uses actual emitted capture and the animal’s senses', () => {
  it('travels before capture, can miss an escaping animal, and never damages or stuns a human', () => {
    const initial = scenario()
    const launched = performAttack(initial, 'player', 'special')
    expect(controlledEntities(launched, 'player')).toHaveLength(0)
    expect(launched.battlefield!.littleEyeShots).toHaveLength(1)
    expect(frames(launched, 8).battlefield!.littleEyeShots).toHaveLength(0)
    expect(controlledEntities(frames(launched, 8), 'player')).toHaveLength(1)
    const escaped = frames(updateEntity(launched, 'player:animal', { x: 65 }), 120)
    expect(controlledEntities(escaped, 'player')).toHaveLength(0)
    expect(escaped.battlefield!.littleEyeShots).toHaveLength(0)
    expect(escaped.opponent.health).toBe(initial.opponent.health)
    expect(escaped.opponent.hitStun).toBe(0)
  })
  it('rejects Nen creatures, dead animals, Gallery Fake imitations and living beings larger than a hamster', () => {
    const initial = scenario()
    for (const change of [
      { material: 'nen' as const },
      { health: 0 },
      { animalSize: 'larger' as const },
    ]) {
      const absent = updateEntity(initial, 'player:animal', change)
      expect(performAttack(absent, 'player', 'special')).toBe(absent)
    }
    const copied = structuredClone(initial)
    copied.battlefield!.entities[0].copy = {
      owner: 'player',
      originalId: 'player:animal',
      createdAt: 0,
      originalKind: 'animal',
      headAttached: true,
    }
    expect(performAttack(copied, 'player', 'special')).toBe(copied)
  })
  it('obeys the last destination while unconscious without tracking a moving opponent or receiving fresh observations', () => {
    const active = captured()
    const ordered = performArsenalCommand(active, 'player', { action: 'little-eye-right' })
    const asleep: FightState = {
      ...ordered,
      frame: ordered.frame + 1,
      player: { ...ordered.player, arsenalSleep: { owner: 'opponent', cause: 'cookie' } },
      opponent: { ...ordered.opponent, x: 5 },
    }
    const previous = controlledEntities(asleep, 'player')[0].x
    const advanced = advancePreparation(asleep, { player: EMPTY_INPUT })
    expect(controlledEntities(advanced, 'player')[0].x).toBeGreaterThan(previous)
    expect(advanced.player.littleEyeScreen).toEqual(ordered.player.littleEyeScreen)
    expect(performArsenalCommand(advanced, 'player', { action: 'little-eye-left' })).toBe(advanced)
    expect(
      arsenalOptions(advanced, 'player')
        .filter((option) => option.command.action.startsWith('little-eye-'))
        .every((option) => !option.ready),
    ).toBe(true)
  })
  it('receives sight and nearby speech, keeps concealed aura private, and uses the animal’s position rather than the user’s', () => {
    let state = captured()
    state = {
      ...state,
      player: { ...state.player, x: 5 },
      opponent: { ...state.opponent, x: 35, nen: { ...state.opponent.nen, in: true } },
    }
    state = advancePreparation(state, { player: EMPTY_INPUT })
    const picture = state.player.littleEyeScreen!.pictures.find(
      (entry) => entry.appearance === 'hisoka',
    )!
    expect(picture.x).toBe(35)
    expect(picture.auraVisible).toBe(false)
    const heard = speakPaperWords(state, 'opponent', {
      text: 'Je reste ici.',
      statementIntent: true,
    })
    expect(heard.player.littleEyeScreen!.words.at(-1)).toEqual({
      frame: state.frame,
      text: 'Je reste ici.',
    })
    expect(JSON.stringify(heard.player.littleEyeScreen)).not.toContain('deliberateLie')
    expect(heard.player.heardWords).toBeUndefined()
    const distant = { ...state, opponent: { ...state.opponent, x: 90 } }
    expect(
      speakPaperWords(distant, 'opponent', { text: 'Trop loin.', statementIntent: false }).player
        .littleEyeScreen!.words,
    ).toHaveLength(0)
    expect(privatePvpState(heard, 'opponent').opponent.littleEyeScreen).toBeUndefined()
  })
  it('lets a real damaging projectile kill the animal, ending observation without a fake fighter hit', () => {
    const active = captured()
    const animal = controlledEntities(active, 'player')[0]
    const state: FightState = {
      ...active,
      projectiles: [
        {
          ...projectileProfile('hisoka'),
          id: 9,
          owner: 'opponent',
          fighterId: 'hisoka',
          x: animal.x + 1,
          y: animal.y + 0.2,
          velocityX: -60,
          targetZone: 'feet',
          age: 0,
          lifetime: 120,
        },
      ],
    }
    const result = advanceProjectiles(state, 1 / 60)
    expect(result.hits).toHaveLength(0)
    expect(result.state.projectiles).toHaveLength(0)
    expect(result.state.battlefield!.entities.find((entry) => entry.id === animal.id)!.health).toBe(
      0,
    )
    const ended = advancePreparation(result.state, { player: EMPTY_INPUT })
    expect(controlledEntities(ended, 'player')).toHaveLength(0)
    expect(ended.player.littleEyeScreen).toEqual(active.player.littleEyeScreen)
    expect(ended.player.health).toBe(active.player.health)
  })
  it('lets the AI use its received picture while ignoring a later unseen change in the opponent’s position', () => {
    const state = localPerspective(captured(), true) as FightState
    state.frame = 60
    state.player.x = 5
    expect(state.opponent.littleEyeScreen!.pictures.some((picture) => picture.x === 78)).toBe(true)
    const ordered = littleEyeAi(state)!
    expect(controlledEntities(ordered, 'opponent')[0].littleEye!.destinationX).toBe(100)
    expect(
      littleEyeAi({ ...state, opponent: { ...state.opponent, littleEyeScreen: undefined } }),
    ).toBeNull()
  })
  it('keeps canonical shot identities for P2 and obtains private sensory information from the referee', () => {
    const initial = beginFight(
      createFight('hisoka', 'sayird', {
        mode: 'versus-local',
        environment: { preparation: { mode: 'scenario', resources: ['animals'], cohorts: [] } },
      }),
    )
    let canonical = performAttack(initial, 'opponent', 'special')
    let local = performAttack(privatePvpState(initial, 'opponent'), 'player', 'special')
    expect(local.battlefield!.littleEyeShots).toEqual(
      privatePvpState(canonical, 'opponent').battlefield!.littleEyeShots,
    )
    canonical = frames(canonical, 8)
    local = frames(local, 8)
    expect(local.player.littleEyeScreen).toBeUndefined()
    const received = privatePvpState(canonical, 'opponent')
    expect(received.player.littleEyeScreen).toBeDefined()
    expect(frames(received, 2).player.littleEyeScreen).toEqual(received.player.littleEyeScreen)
  })
  it('turns, stops and releases the real animal, and replays its capture, sensory feed and commands exactly', () => {
    let state = scenario()
    const recorder = createReplayRecorder(state)!
    function apply(next: FightState) {
      const packet: ReplayPacket = [0, 0, 0, [panelReplayCommand(state, next)]]
      recorder.append(state, packet, executeReplayPacket(state, packet))
      state = next
    }
    apply(performAttack(state, 'player', 'special'))
    for (let index = 0; index < 8; index++) {
      const packet: ReplayPacket = [1 / 60, 0, 0, []]
      const next = executeReplayPacket(state, packet)
      recorder.append(state, packet, next)
      state = next
    }
    apply(performArsenalCommand(state, 'player', { action: 'little-eye-left' }))
    expect(controlledEntities(state, 'player')[0].littleEye!.facing).toBe(-1)
    apply(performArsenalCommand(state, 'player', { action: 'little-eye-stay' }))
    expect(controlledEntities(state, 'player')[0].littleEye!.destinationX).toBeUndefined()
    apply(performArsenalCommand(state, 'player', { action: 'little-eye-release' }))
    expect(controlledEntities(state, 'player')).toHaveLength(0)
    const player = createReplayPlayer(decodeFightReplay(JSON.stringify(recorder.snapshot())))
    for (let index = 0; !player.done && index < 100; index++) player.advance(0.05, 2)
    expect(player.error).toBe('')
    expect(player.done).toBe(true)
    expect(fightReplayHash(player.state)).toBe(fightReplayHash(state))
  })
})
