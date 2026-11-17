import { describe, it, expect } from 'vitest'
import { competitionFixture } from './testFixture'
import { readCompetitionSnapshot } from './validation'
describe('online brackets advance only from assigned server series', () => {
  function tournament() {
    const f = competitionFixture()
    const invitation = f.service.createTournament(f.profiles[0], {
      name: 'Clash Cup',
      fighter: 'theta',
    })
    for (let index = 1; index < 4; index++)
      f.service.joinTournament(f.profiles[index], {
        id: invitation.id,
        secret: invitation.invitation,
        fighter: 'hisoka',
      })
    return { ...f, invitation }
  }
  it('requires the invitation, consent and owner authority, then exposes no access secrets', () => {
    const f = competitionFixture(),
      inv = f.service.createTournament(f.profiles[0], { name: 'Cup', fighter: 'theta' })
    expect(() =>
      f.service.joinTournament(f.profiles[1], { id: inv.id, secret: 'wrong', fighter: 'hisoka' }),
    ).toThrow('UNAUTHORIZED')
    expect(() => f.service.startTournament(f.profiles[1], inv.id)).toThrow('UNAUTHORIZED')
    expect(() => f.service.startTournament(f.profiles[0], inv.id)).toThrow('TOURNAMENT')
    f.service.joinTournament(f.profiles[1], {
      id: inv.id,
      secret: inv.invitation,
      fighter: 'hisoka',
    })
    f.service.startTournament(f.profiles[0], inv.id)
    const view = f.service.tournament(inv.id)!
    expect(view).not.toHaveProperty('joinHash')
    expect(JSON.stringify(view)).not.toContain(inv.invitation)
    expect(() => f.enqueue(0)).toThrow('BUSY')
    expect(() =>
      f.service.joinTournament(f.profiles[2], {
        id: inv.id,
        secret: inv.invitation,
        fighter: 'hisoka',
      }),
    ).toThrow('TOURNAMENT')
  })
  it('joins both owners to the same real match, records labelled forfeits and produces a verified champion', () => {
    const f = tournament()
    f.service.startTournament(f.profiles[0], f.invitation.id)
    function win(index: number) {
      const current = f.service.playTournament(f.profiles[index], f.invitation.id)
      const series = current.series!
      const profiles = series.players.map((p) => f.profiles.find((profile) => profile.id === p.id)!)
      const sessions = profiles.map((p) => f.service.view(p).session!) as ReturnType<
        typeof f.sessions
      >
      f.ready(sessions)
      f.advance(100)
      f.registry.view(sessions[0].matchId, sessions[0].token)
      f.registry.leave(sessions[1].matchId, sessions[1].token)
    }
    win(0)
    expect(f.service.tournament(f.invitation.id)?.bracket?.champion).toBeNull()
    win(1)
    win(0)
    const publicView = f.service.tournament(f.invitation.id)!
    expect(publicView.bracket?.champion).toBe(f.profiles[0].id)
    expect(publicView.results).toHaveLength(3)
    expect(publicView.results.every((s) => s.games[0].reason === 'forfeit')).toBe(true)
    expect(f.seasons.leaderboard().entries).toEqual([])
    expect(readCompetitionSnapshot(f.service.store.data).tournaments[0].bracket?.champion).toBe(
      f.profiles[0].id,
    )
    const forged = structuredClone(f.service.store.data)
    forged.tournaments[0].bracket!.champion = f.profiles[3].id
    expect(() => readCompetitionSnapshot(forged)).toThrow('COMPETITION_STORAGE')
  })
  it('cancels only an unstarted owner’s bracket and releases its participants', () => {
    const f = tournament()
    expect(() => f.service.cancelTournament(f.profiles[1], f.invitation.id)).toThrow('UNAUTHORIZED')
    f.service.cancelTournament(f.profiles[0], f.invitation.id)
    expect(f.service.tournament(f.invitation.id)).toBeNull()
    expect(f.enqueue(0).ticket).not.toBeNull()
  })
})
