import { describe, it, expect, vi } from 'vitest'
import { render } from 'svelte/server'
import * as THREE from 'three'
import Status from '$lib/components/fighting/FightHalkenburgStatus.svelte'
import TeamRoster from '$lib/components/fighting/FightTeamRoster.svelte'
import { soulTeam } from './halkenburgChainTestKit'
import { soulDuel, soulHit } from './halkenburgSoulTestKit'
import { multiCommand, multiActive } from './fourCombatTestKit'
import { createFight, performMove, nextRound, performAuraAttack } from './engine'
import { privatePvpState } from './pvp/view'
import { spectatorSnapshot } from './pvp/spectator'
import { decodeFightSnapshot } from './fightReplaySnapshot'
import { applyPvpCommand } from './pvp/commands'
import { parsePvpPacket } from './pvp/protocol'
import { createReplayRecorder } from './fightReplayRecorder'
import { createReplayPlayer } from './fightReplayPlayer'
import { executeReplayPacket } from './fightReplayCommands'
import { panelReplayCommand } from './fightReplayPanels'
import { decodeFightReplay } from './fightReplayCodec'
import { fightReplayHash } from './fightReplayHash'
import { resolveFightImpacts } from './combatImpact'
import { resolveFightOutcome } from './fightOutcome'
import { advanceRosterGuestActors } from './rosterGuestActors'
import { futureBodyKey } from './futureParticipants'
import { guestProjection } from './rosterGuests'
import { lynchTargetConscious } from './lynchRules'
import { createExtraBodyScenes } from './rosterGuestScene'
import { lynchReplyText } from './lynchPresentation'
import { arsenalOptions } from './retrospectiveArsenal'
import { EMPTY_INPUT } from './types'
import type { ReplayPacket } from './fightReplayTypes'

vi.mock('$app/stores', async () => {
  const { readable } = await import('svelte/store')
  return { page: readable({ url: new URL('http://localhost/fr/fighting'), data: {} }) }
})

describe('Halkenburg’s selectable mind mode in the complete duel', () => {
  it('keeps both prepared bodies physically vulnerable and resolves a real low strike on the sleeping one', () => {
    let s = soulHit()
    s = {
      ...s,
      player: { ...s.player, x: s.opponent.x + 5, facing: -1 },
      opponent: { ...s.opponent, health: 1 },
    }
    const cast = performMove({
      state: s,
      side: 'player',
      action: 'light',
      input: { ...EMPTY_INPUT, down: true },
    })
    const hit = resolveFightImpacts(multiActive(cast), [])
    expect(hit.halkSoulLinks![0].phase).toBe('cohabiting')
    expect(hit.player.health).toBe(0)
    expect(hit.opponent.id).toBe('benjamin')
    expect(hit.phase).toBe('fighting')
  })
  it('renders a dormant body as a body, not an invisible incapacitation timer', () => {
    const s = soulHit(soulDuel(), false)
    const html = render(Status, { props: { state: s, side: 'opponent', language: 'fr' } }).body
    expect(html).toContain('Partisan du scénario')
    expect(html).toContain('Conscience assoupie')
    expect(html).toContain('Benjamin')
    expect(html).toContain('Transfert de conscience')
    expect(html).not.toContain('Variante du roster')
    expect(lynchTargetConscious(s.opponent)).toBe(false)
    expect(
      lynchReplyText(
        {
          frame: 0,
          question: 'identity',
          questioner: 'player',
          target: 'opponent',
          cohortIdentity: true,
        },
        'fr',
      ),
    ).toContain('partisan')
  })
  it('renders a team’s surviving minds by original roster slot when a stock’s original body is dead', () => {
    const base = soulHit(soulTeam())
    const s = resolveFightOutcome({ ...base, opponent: { ...base.opponent, health: 0 } })
    const roster = render(TeamRoster, {
      props: { state: s, side: 'player', language: 'fr', paused: false, onAssist: () => {} },
    }).body
    expect(roster).toContain('3/3')
    expect(roster).toContain('Halkenburg')
    expect(roster).toContain('Corps occupé')
    expect(roster).toContain('Benjamin')
    expect(roster).toContain('Conscience en attente')
    expect(roster).not.toContain('Éliminé')
    const html = render(Status, { props: { state: s, side: 'player', language: 'fr' } }).body
    expect(html).toContain('consciences vivantes')
    expect(html).toContain('corps mort')
  })
  it('keeps the inherited body and its ally active without Black Voice or an extra body appearing', () => {
    const s = soulHit(soulDuel(), false),
      before = s.rosterGuests![0].fighter.x
    const stepped = advanceRosterGuestActors(s, performAuraAttack)
    expect(stepped.rosterGuests![0].role).toBe('soul')
    expect(stepped.rosterGuests![0].phase).toBe('acting')
    expect(stepped.rosterGuests![0].fighter.x).toBeLessThan(before)
    const livingBodies =
      2 +
      stepped.rosterGuests!.filter((g) => g.fighter.health > 0).length +
      stepped.battlefield!.entities.filter((e) => e.kind === 'supporter' && e.present).length
    expect(livingBodies).toBe(5)
  })
  it('keeps bodily identity stable for observers and projections when a main body becomes an ally', () => {
    const base = soulDuel(),
      key = futureBodyKey(base, 'opponent'),
      self = soulHit(base)
    expect(futureBodyKey(self, 'player')).toBe(key)
    const npc = soulHit(base, false),
      guest = npc.rosterGuests![0]
    expect(futureBodyKey(guestProjection(npc, guest), 'player')).toBe(key)
  })
  it('keeps the same extra mesh on its material body and disposes it when leaving the match', () => {
    const s = soulHit(soulDuel(), false),
      scene = new THREE.Scene(),
      animate = vi.fn()
    const effect = createExtraBodyScenes({
      scene,
      worldX: (x) => x,
      buildFighter: () => ({ root: new THREE.Group(), animate }),
    })
    effect.sync(s, 0)
    const guest = s.rosterGuests![0],
      root = scene.getObjectByName(`roster-guest:${guest.id}`)!
    expect(root.position.x).toBe(guest.fighter.x)
    const sleeping = multiCommand(
      { ...s, player: { ...s.player, x: 60, attack: null } },
      { action: 'halkenburg-sleep', target: 'ally:1' },
    )
    effect.sync(sleeping, 1)
    expect(scene.getObjectByName(`roster-guest:${guest.id}`)).toBe(root)
    expect(animate).toHaveBeenLastCalledWith(1, 'fallen')
    effect.dispose()
    expect(scene.children).toHaveLength(0)
  })
  it('lets P2 choose the mode using semantic network commands and rejects supplied minds', () => {
    const s = soulDuel('opponent')
    const base = { ...s, halkenburgModes: undefined }
    const command = { action: 'halkenburg-mode' as const, target: 'souls' }
    const packet = { sequence: 0, input: 0, commands: [{ kind: 'arsenal', command }] }
    expect(parsePvpPacket(packet)).toEqual(packet)
    expect(
      parsePvpPacket({
        ...packet,
        commands: [{ kind: 'arsenal', command: { ...command, sourceMind: { side: 'opponent' } } }],
      }),
    ).toBeNull()
    expect(
      applyPvpCommand(base, 'opponent', { kind: 'arsenal', command }).halkenburgModes?.opponent,
    ).toBe('souls')
  })
  it('keeps the other mind, control plans and scenario preparation out of opponent and spectator snapshots', () => {
    const s = multiCommand(soulHit(), { action: 'halkenburg-sedative' }),
      view = privatePvpState(s, 'opponent')
    expect(s.player.halkSedativeSpent).toBe(true)
    expect(view.opponent.halkSedativeSpent).toBeUndefined()
    expect(view.halkSoulLinks![0].preparedSedative).toBe(0)
    expect(view.player.halkSoul?.mind?.identity).toBe('benjamin')
    expect(view.opponent.halkSoul?.mind).toBeUndefined()
    expect(view.halkSoulLinks![0].sourceMind.identity).toBeUndefined()
    expect(view.halkSoulLinks![0].targetMind.identity).toBe('benjamin')
    const publicState = decodeFightSnapshot(spectatorSnapshot(s).snapshot, {
      player: 'halkenburg',
      opponent: 'benjamin',
      mode: 'versus-local',
      formatId: s.formatId,
      environment: s.environment,
    })
    expect(publicState.player.halkSoul?.mind).toBeUndefined()
    expect(publicState.opponent.halkSoul?.mind).toBeUndefined()
    expect(publicState.player.halkSedativeSpent).toBeUndefined()
    expect(publicState.opponent.halkSedativeSpent).toBeUndefined()
    expect(publicState.halkSoulLinks![0].sourceMind.identity).toBeUndefined()
    expect(publicState.halkSoulLinks![0].targetMind.identity).toBeUndefined()
  })
  it('lets the awakened P2 mind yield control through its private panel and the authoritative server', () => {
    const swapped = soulHit(),
      s = resolveFightOutcome({ ...swapped, opponent: { ...swapped.opponent, health: 0 } }),
      view = privatePvpState(s, 'opponent')
    const command = { action: 'halkenburg-sleep' as const }
    expect(view.player.halkSoul?.mind?.key).toBe('mind:player')
    expect(
      arsenalOptions(view, 'player').find((option) => option.command.action === command.action)
        ?.ready,
    ).toBe(true)
    const after = applyPvpCommand(s, 'opponent', { kind: 'arsenal', command })
    expect(after.halkSoulLinks![0].targetSleep).toBe(180)
    expect(after.player.halkSoul?.mind?.identity).toBe('halkenburg')
    expect(after.player.id).toBe('benjamin')
    expect(after.opponent.halkSoulAlive).toBe(true)
  })
  it('restarts the original chosen roster bodies next round and retains the selected mode', () => {
    const s = soulHit()
    const reset = nextRound({ ...s, phase: 'finished', winner: 'player', matchWinner: null })
    expect(reset.player.id).toBe('halkenburg')
    expect(reset.opponent.id).toBe('benjamin')
    expect(reset.halkSoulLinks).toBeUndefined()
    expect(reset.player.halkSoul).toBeUndefined()
    expect(reset.halkenburgModes?.player).toBe('souls')
  })
  it('does not accidentally enable the host’s post-mortem Nen for a foreign mind', () => {
    const base = soulDuel(),
      camilla = createFight('camilla', 'halkenburg').player
    const before = { ...base, opponent: { ...camilla, x: 65, health: 47 } }
    const s = soulHit(before)
    const dead = resolveFightOutcome({ ...s, player: { ...s.player, health: 0 } })
    expect(dead.catsName).toBeUndefined()
    expect(dead.player.health).toBe(0)
  })
  it('replays mode selection, a real transfer and the sleep transition deterministically', () => {
    let s = createFight('halkenburg', 'benjamin', {
      mode: 'versus-local',
      formatId: 'knockout',
      environment: {
        preparation: { mode: 'scenario', resources: ['sedatives'], cohorts: ['player'] },
      },
    })
    s = {
      ...s,
      rng: 0,
      player: {
        ...s.player,
        x: 25,
        aura: 100,
        hatsuEffects: { ...s.player.hatsuEffects, cohortWillFrames: 480 },
      },
      opponent: { ...s.opponent, x: 65 },
    }
    const recorder = createReplayRecorder(s)!
    function packet(p: ReplayPacket) {
      const after = executeReplayPacket(s, p)
      recorder.append(s, p, after)
      s = after
    }
    packet([0, 0, 0, [{ kind: 'start' }]])
    const mode = multiCommand(s, { action: 'halkenburg-mode', target: 'souls' })
    packet([0, 0, 0, [panelReplayCommand(s, mode)]])
    packet([0, 0, 0, [{ kind: 'move', side: 'player', action: 'special', input: 0 }]])
    for (let i = 0; i < 80; i++) packet([1 / 60, 0, 0, []])
    expect(s.halkSoulLinks).toHaveLength(1)
    expect(s.halkSoulLinks![0].sourceMind.principal).toBe(true)
    const sleep = multiCommand(s, {
      action: 'halkenburg-sleep',
      ...(s.halkSoulLinks![0].sourceMind.principal ? {} : { target: 'ally:1' }),
    })
    expect(sleep).not.toBe(s)
    packet([0, 0, 0, [panelReplayCommand(s, sleep)]])
    for (let i = 0; i < 10; i++) packet([1 / 60, 0, 0, []])
    const replay = createReplayPlayer(decodeFightReplay(JSON.stringify(recorder.snapshot())))
    for (let i = 0; i < 400 && !replay.done; i++) replay.advance(0.05, 3)
    expect(replay.error).toBe('')
    expect(replay.done).toBe(true)
    expect(fightReplayHash(replay.state)).toBe(fightReplayHash(s))
  })
})
