import { describe, it, expect } from 'vitest'
import { soulTeam, chainShot, landChainShot } from './halkenburgChainTestKit'
import { soulHit } from './halkenburgSoulTestKit'
import {
  nextTeamRound,
  startTeamFight,
  tickTeamFight,
  requestTeamAssist,
  createTeamFight,
} from './teamMatch'
import { teamLiving } from './teamTypes'
import { teamLivingForView, teamMemberForView, teamMemberStatus } from './teams/status'
import { collectSoulBodies } from './halkenburgSoulBodies'
import { resolveFightOutcome } from './fightOutcome'
import { settleTeamBodyOutcome } from './teamOutcome'
import { multiCommand } from './fourCombatTestKit'
import { EMPTY_INPUT, type FighterId } from './types'
import { recordFightDeath } from './fightDeaths'
import { advanceCatsName } from './camillaCat'
import { reconcileHalkenburgSouls } from './halkenburgSouls'
import { voluntaryNenAvailable } from './nenAccess'

function laterHalkenburg(fighter: FighterId = 'halkenburg') {
  let s = startTeamFight(
    createTeamFight(
      { player: ['halkenburg', 'hisoka', 'theta'], opponent: ['benjamin', fighter, 'leorio'] },
      {
        preparation: { mode: 'scenario', resources: [], cohorts: ['player', 'opponent'] },
      },
    ),
  )
  s = multiCommand(s, { action: 'halkenburg-mode', target: 'souls' })
  s = soulHit(
    { ...s, player: { ...s.player, x: 25, aura: 100 }, opponent: { ...s.opponent, x: 65 } },
    false,
  )
  return startTeamFight(
    nextTeamRound(
      settleTeamBodyOutcome({ ...s, phase: 'finished', winner: 'player', finishReason: 'time' }),
    ),
  )
}

describe('Halkenburg’s material minds in three-member team sets', () => {
  it('keeps an untouched Camilla’s actual Cat’s Name revival in the stock count despite an earlier transfer chain', () => {
    const base = laterHalkenburg('camilla')
    let s = resolveFightOutcome(
      recordFightDeath(
        { ...base, opponent: { ...base.opponent, health: 0 } },
        {
          victimSide: 'opponent',
          killerSide: 'player',
          cause: 'strike',
        },
      ),
    )
    expect(s.catsName).toBeDefined()
    expect(teamLivingForView(s, 'opponent')).toBe(2)
    for (let n = 0; n < 300 && s.catsName; n++) s = advanceCatsName(s)
    expect(s.winner).toBe('opponent')
    expect(s.opponent.health).toBe(s.opponent.maxHealth)
    expect(s.opponent.halkSoulAlive).toBe(true)
    expect(teamLiving(s.teamMatch!.seats.opponent)).toBe(2)
    expect(teamLiving(s.teamMatch!.seats.player)).toBe(2)
    expect(nextTeamRound(s).opponent.id).toBe('camilla')
  })
  it('immediately restores an untouched Hisoka’s stock after his genuinely prepared asphyxia restart', () => {
    const base = laterHalkenburg('hisoka')
    const s = resolveFightOutcome(
      recordFightDeath(
        { ...base, opponent: { ...base.opponent, health: 0, gumHeartArmed: true } },
        {
          victimSide: 'opponent',
          killerSide: 'player',
          cause: 'asphyxia',
        },
      ),
    )
    expect(s.phase).toBe('fighting')
    expect(s.opponent.health).toBe(1)
    expect(s.opponent.gumHeartSpent).toBe(true)
    expect(s.opponent.halkSoulAlive).toBe(true)
    expect(teamLiving(s.teamMatch!.seats.opponent)).toBe(2)
  })
  it('retires an untouched native member forfeiting on time without killing it or adding a free ally', () => {
    const base = laterHalkenburg('camilla'),
      key = base.opponent.halkSoul!.key
    const out = settleTeamBodyOutcome({
      ...base,
      phase: 'finished',
      winner: 'player',
      finishReason: 'time',
    })
    const s = nextTeamRound(out)
    expect(s.opponent.id).toBe('leorio')
    expect(s.rosterGuests!.some((guest) => guest.fighter.halkSoul?.key === key)).toBe(false)
    const retired = collectSoulBodies(s).find((record) => record.key === key)!.body
    expect(retired.halkSoul?.offstage).toBe(true)
    expect(retired.health).toBe(base.opponent.health)
    expect(teamLiving(s.teamMatch!.seats.opponent)).toBe(1)
  })
  it('lets a later reserve Halkenburg choose mind transfer while the earlier chain is still active', () => {
    let s = laterHalkenburg()
    expect(s.opponent.id).toBe('halkenburg')
    expect(s.teamMatch!.seats.opponent.active).toBe(1)
    expect(s.halkSoulLinks).toHaveLength(1)
    s = multiCommand(s, { action: 'halkenburg-mode', target: 'souls' }, 'opponent')
    expect(s.halkenburgModes?.opponent).toBe('souls')
    s = landChainShot(chainShot(s, 'opponent'))
    expect(s.halkSoulLinks).toHaveLength(2)
    expect(s.opponent.halkSoul?.mind?.key).toBe('mind:opponent:1')
    expect(collectSoulBodies(s)).toHaveLength(7)
    expect(teamLiving(s.teamMatch!.seats.opponent)).toBe(2)
  })
  it('keeps the default roster variant’s original slot and granted techniques when it enters an existing mind-transfer world', () => {
    const before = laterHalkenburg(),
      key = before.opponent.halkSoul!.key
    const prepared = {
      ...before,
      opponent: {
        ...before.opponent,
        aura: 100,
        hatsuEffects: { ...before.opponent.hatsuEffects, cohortWillFrames: 480 },
      },
    }
    const drawn = multiCommand(prepared, { action: 'halkenburg-transfer' }, 'opponent')
    expect(drawn.opponent.id).not.toBe('halkenburg')
    expect(drawn.opponent.halkSoul?.key).toBe(key)
    const s = reconcileHalkenburgSouls(drawn)
    expect(s.opponent.halkSoul?.mind?.key).toBe('mind:opponent:1')
    expect(s.opponent.halkSoulAlive).toBe(true)
    expect(s.opponent.halkForeignMind).toBe(false)
    expect(voluntaryNenAvailable(s.opponent)).toBe(true)
    expect(collectSoulBodies(s)).toHaveLength(7)
    expect(s.halkSoulMinds).toHaveLength(7)
    expect(teamLiving(s.teamMatch!.seats.opponent)).toBe(2)
  })
  it.each(['player', 'opponent'] as const)(
    'transfers the active member of either team, without touching reserves (%s)',
    (side) => {
      const base = soulTeam(side),
        other = side === 'player' ? 'opponent' : 'player'
      const s = soulHit(base, true, side)
      expect(s.halkenburgModes?.[side]).toBe('souls')
      expect(s[side].id).toBe('benjamin')
      expect(s[side].health).toBe(base[other].health)
      expect(s[other].halkSoulSleep).toBe(true)
      expect(s[side].halkSoul?.mind?.key).toBe(`mind:${side}:0`)
      expect(s[side].halkSoul?.key).toBe(`team:${other}:0`)
      expect(teamLiving(s.teamMatch!.seats.player)).toBe(3)
      expect(teamLiving(s.teamMatch!.seats.opponent)).toBe(3)
      expect(s.rosterGuests).toBeUndefined()
      const offstage = collectSoulBodies(s).filter(({ body }) => body.halkSoul?.offstage)
      expect(offstage).toHaveLength(4)
      expect(offstage.map(({ body }) => body.health)).toEqual([300, 300, 300, 300])
    },
  )
  it('keeps a living mind in the team count after its original body dies, including under the team clock', () => {
    const s = soulHit(soulTeam()),
      dead = resolveFightOutcome({ ...s, opponent: { ...s.opponent, health: 0 } })
    expect(dead.phase).toBe('fighting')
    expect(dead.player.health).toBe(0)
    expect(dead.player.halkSoulAlive).toBe(true)
    expect(teamLivingForView(dead, 'player')).toBe(3)
    const ticked = tickTeamFight(dead, { player: EMPTY_INPUT, opponent: EMPTY_INPUT }, 1 / 60)
    expect(ticked.phase).toBe('fighting')
    expect(teamLiving(ticked.teamMatch!.seats.player)).toBe(3)
    expect(ticked.player.health).toBe(0)
  })
  it('loses the actual mind’s stock, then brings in a reserve while preserving the occupied enemy body and all corpses', () => {
    const s = soulHit(soulTeam()),
      dead = resolveFightOutcome({ ...s, frame: 721, player: { ...s.player, health: 0 } })
    expect(dead.winner).toBe('opponent')
    expect(dead.teamMatch!.winner).toBeNull()
    expect(teamLiving(dead.teamMatch!.seats.player)).toBe(2)
    expect(teamLiving(dead.teamMatch!.seats.opponent)).toBe(3)
    const next = nextTeamRound(dead)
    expect(next.phase).toBe('ready')
    expect(next.frame).toBe(721)
    expect(next.roundsWon).toEqual({ player: 1, opponent: 1 })
    expect(next.teamMatch!.seats.player.active).toBe(1)
    expect(next.player.id).toBe('hisoka')
    expect(next.opponent.id).toBe('halkenburg')
    expect(next.opponent.halkSoul?.mind?.identity).toBe('benjamin')
    expect(next.opponent.health).toBe(81)
    expect(next.halkSoulLinks).toHaveLength(1)
    const bodies = collectSoulBodies(next)
    expect(bodies).toHaveLength(6)
    expect(bodies.find(({ key }) => key === 'team:opponent:0')?.body.health).toBe(0)
    expect(next.battlefield!.entities).toEqual(dead.battlefield!.entities)
    expect(startTeamFight(next).halkSoulMinds).toEqual(next.halkSoulMinds)
  })
  it('carries both teams’ next reserves after both remaining minds die in a shared body', () => {
    let s = soulHit(soulTeam())
    s = resolveFightOutcome({ ...s, opponent: { ...s.opponent, health: 0 } })
    s = resolveFightOutcome({ ...s, opponent: { ...s.opponent, health: 0 } })
    expect(s.winner).toBe('draw')
    expect(teamLiving(s.teamMatch!.seats.player)).toBe(2)
    expect(teamLiving(s.teamMatch!.seats.opponent)).toBe(2)
    const next = nextTeamRound(s)
    expect(next.player.id).toBe('hisoka')
    expect(next.opponent.id).toBe('shizuku')
    expect(collectSoulBodies(next)).toHaveLength(6)
    expect(next.rosterGuests!.filter((guest) => guest.fighter.health <= 0)).toHaveLength(2)
  })
  it('finishes the set only after all three roster minds are out and never duplicates a body between stocks', () => {
    let s = soulHit(soulTeam())
    for (let stock = 0; stock < 3; stock++) {
      s = resolveFightOutcome({ ...s, player: { ...s.player, health: 0 } })
      expect(teamLiving(s.teamMatch!.seats.player)).toBe(2 - stock)
      expect(teamLiving(s.teamMatch!.seats.opponent)).toBe(3)
      expect(collectSoulBodies(s)).toHaveLength(6)
      expect(
        collectSoulBodies(s).filter(({ body }) => body.health <= 0 && body.halkSoul?.offstage),
      ).toHaveLength(0)
      if (stock < 2) {
        expect(s.teamMatch!.winner).toBeNull()
        s = startTeamFight(nextTeamRound(s))
        expect(s.opponent.health).toBe(81)
      }
    }
    expect(s.teamMatch!.winner).toBe('opponent')
    expect(nextTeamRound(s)).toBe(s)
  })
  it('keeps a committed chain on stage rather than benching its sleep, wounds or aura through a relay', () => {
    const s = soulHit(soulTeam())
    const gate = { ...s, player: { ...s.player, x: 7, attack: null } }
    expect(requestTeamAssist(gate, 'player', 1)).toBe(gate)
    expect(multiCommand(gate, { action: 'halkenburg-mode', target: 'roster' })).toBe(gate)
  })
  it('binds a reserve Halkenburg to his own roster slot and stops the relay’s automatic retreat after a transfer', () => {
    let s = startTeamFight(
      createTeamFight(
        { player: ['theta', 'halkenburg', 'hisoka'], opponent: ['benjamin', 'shizuku', 'leorio'] },
        {
          preparation: { mode: 'scenario', resources: [], cohorts: ['player'] },
        },
      ),
    )
    s = requestTeamAssist({ ...s, player: { ...s.player, x: 7 } }, 'player', 1)
    expect(s.teamMatch!.seats.player.active).toBe(1)
    expect(s.teamMatch!.seats.player.relay).not.toBeNull()
    s = multiCommand(s, { action: 'halkenburg-mode', target: 'souls' })
    s = soulHit({
      ...s,
      player: { ...s.player, x: 25, aura: 100 },
      opponent: { ...s.opponent, x: 65 },
    })
    expect(s.player.halkSoul?.mind?.key).toBe('mind:player:1')
    expect(s.teamMatch!.seats.player.relay).toBeNull()
    expect(s.teamMatch!.seats.player.assistUsed).toBe(true)
    expect(s.teamMatch!.seats.player.members[0].id).toBe('theta')
    expect(teamMemberForView(s, 'player', 1).id).toBe('benjamin')
    expect(teamMemberStatus(s, 'opponent', 0)[0]).toBe('Conscience en attente')
    expect(teamLiving(s.teamMatch!.seats.player)).toBe(3)
  })
  it('extends a chain to the next opponent after a time verdict, without killing or refilling the forfeiting body', () => {
    const base = soulHit(soulTeam(), false)
    let s = landChainShot(
      chainShot({
        ...base,
        player: { ...base.player, x: 25, facing: 1 },
        opponent: { ...base.opponent, x: 65 },
      }),
    )
    const oldVictim = s.opponent.halkSoul!.key,
      oldHP = s.opponent.health
    s = settleTeamBodyOutcome({ ...s, phase: 'finished', winner: 'player', finishReason: 'time' })
    expect(teamLiving(s.teamMatch!.seats.opponent)).toBe(2)
    expect(s.halkSoulMinds!.find((item) => item.mind.key === 'mind:opponent:0')?.alive).toBe(true)
    s = startTeamFight(nextTeamRound(s))
    expect(s.opponent.id).toBe('shizuku')
    expect(collectSoulBodies(s).find(({ key }) => key === oldVictim)?.body.health).toBe(oldHP)
    s = landChainShot(
      chainShot({
        ...s,
        player: { ...s.player, facing: 1, aura: 100 },
        opponent: { ...s.opponent, x: 85 },
      }),
    )
    expect(s.halkSoulLinks).toHaveLength(3)
    const involved = collectSoulBodies(s).filter(({ body }) => body.halkSoul?.linked)
    expect(involved).toHaveLength(4)
    expect(s.player.id).toBe('shizuku')
    expect(s.player.halkSoul?.mind?.identity).toBe('halkenburg')
    expect(s.opponent.halkCohortBody).toBeDefined()
    expect(new Set(s.halkSoulMinds!.map((item) => item.mind.key)).size).toBe(7)
    expect(collectSoulBodies(s)).toHaveLength(7)
  })
  it('moves only Halkenburg out of a shared host when the next opponent enters, without dragging the other mind', () => {
    const base = soulHit(soulTeam())
    let s = resolveFightOutcome({ ...base, opponent: { ...base.opponent, health: 0 } })
    s = multiCommand(s, { action: 'halkenburg-sleep' }, 'opponent')
    const sharedBody = s.player.halkSoul!.key,
      hp = s.player.health
    expect(s.player.halkSoul?.mind?.identity).toBe('halkenburg')
    s = settleTeamBodyOutcome({ ...s, phase: 'finished', winner: 'player', finishReason: 'time' })
    s = startTeamFight(nextTeamRound(s))
    s = landChainShot(
      chainShot({ ...s, player: { ...s.player, facing: 1 }, opponent: { ...s.opponent, x: 85 } }),
    )
    expect(s.player.id).toBe('shizuku')
    expect(s.player.halkSoul?.mind?.identity).toBe('halkenburg')
    const remained = s.halkSoulMinds!.find((item) => item.mind.identity === 'benjamin')!
    expect(remained.alive).toBe(true)
    expect(remained.body).toBe(sharedBody)
    expect(s.halkSoulMinds!.filter((item) => item.body === sharedBody && item.alive)).toHaveLength(
      2,
    )
    expect(collectSoulBodies(s).find(({ key }) => key === sharedBody)?.body.health).toBe(hp)
    expect(new Set(collectSoulBodies(s).map(({ key }) => key)).size).toBe(6)
  })
  it('hits a real extra body, then a cohabiting enemy host, while keeping the unselected occupant in place', () => {
    let s = startTeamFight(
      createTeamFight(
        {
          player: ['halkenburg', 'hisoka', 'theta'],
          opponent: ['halkenburg', 'shizuku', 'leorio'],
        },
        {
          preparation: { mode: 'scenario', resources: [], cohorts: ['player', 'opponent'] },
        },
      ),
    )
    for (const side of ['player', 'opponent'] as const)
      s = multiCommand(s, { action: 'halkenburg-mode', target: 'souls' }, side)
    s = soulHit(
      {
        ...s,
        player: { ...s.player, x: 25, aura: 100 },
        opponent: { ...s.opponent, x: 65, aura: 100 },
      },
      false,
    )
    s = landChainShot(
      chainShot({
        ...s,
        player: { ...s.player, x: 25, facing: 1 },
        opponent: { ...s.opponent, x: 65 },
        rosterGuests: s.rosterGuests!.map((guest) => ({
          ...guest,
          fighter: { ...guest.fighter, x: 85 },
        })),
      }),
    )
    s = resolveFightOutcome({ ...s, opponent: { ...s.opponent, health: 0 } })
    expect(s.opponent.halkSoul?.mind?.key).toBe('mind:opponent:0')
    s = landChainShot(chainShot({ ...s, opponent: { ...s.opponent, facing: 1 } }, 'opponent'))
    const bystander = s.halkSoulMinds!.find((item) => !item.mind.principal)!,
      shared = bystander.body
    expect(s.halkSoulMinds!.filter((item) => item.alive && item.body === shared)).toHaveLength(2)
    s = landChainShot(chainShot({ ...s, opponent: { ...s.opponent, facing: -1 } }, 'opponent'))
    expect(s.halkSoulLinks).toHaveLength(4)
    expect(s.halkSoulMinds!.find((item) => item.mind.key === bystander.mind.key)?.body).toBe(shared)
    expect(s.halkSoulMinds!.find((item) => item.mind.key === 'mind:opponent:0')?.body).toBe(shared)
    expect(s.halkSoulMinds!.find((item) => item.mind.key === 'mind:player:0')?.body).not.toBe(
      shared,
    )
    expect(collectSoulBodies(s)).toHaveLength(7)
    expect(new Set(s.halkSoulMinds!.map((item) => item.mind.key)).size).toBe(7)
  })
})
