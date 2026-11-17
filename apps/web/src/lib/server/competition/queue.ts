import type { OnlineTicket } from '$lib/fighting/online/types'
import type { RankedProfile } from '../clashSeasons'
import { requireCompetition } from './error'

/** A nonce round trip measures server→client→server time; no client clock is trusted. */
export class CompetitionQueue {
  tickets = new Map<string, OnlineTicket>()
  private probes = new Map<string, { owner: string; at: number }>()
  constructor(
    private now: () => number,
    private random: () => string,
  ) {}
  probe(profile: RankedProfile) {
    this.sweep()
    requireCompetition(this.probes.size < 1000, 'CAPACITY')
    for (const [id, p] of this.probes) if (p.owner === profile.id) this.probes.delete(id)
    const nonce = this.random()
    this.probes.set(nonce, { owner: profile.id, at: this.now() })
    return { nonce }
  }
  measure(profile: RankedProfile, nonce: string) {
    const probe = this.probes.get(nonce)
    requireCompetition(probe?.owner === profile.id, 'INVALID_PROBE')
    this.probes.delete(nonce)
    const elapsed = this.now() - probe.at
    requireCompetition(elapsed >= 0 && elapsed <= 1000, 'CONNECTION')
    return Math.ceil(elapsed)
  }
  sweep() {
    for (const [id, p] of this.probes) if (this.now() - p.at > 30_000) this.probes.delete(id)
    for (const [id, t] of this.tickets) if (this.now() - t.seenAt > 15_000) this.tickets.delete(id)
  }
  opponent(ticket: OnlineTicket): OnlineTicket | undefined {
    this.sweep()
    return [...this.tickets.values()].find((other) => compatible(ticket, other, this.now()))
  }
}
function compatible(a: OnlineTicket, b: OnlineTicket, now: number) {
  if (now - a.measuredAt > 30_000 || now - b.measuredAt > 30_000) return false
  if (a.profile.id === b.profile.id || a.queue !== b.queue) return false
  if (a.rtt + b.rtt > Math.min(a.maxRtt, b.maxRtt)) return false
  if (a.queue === 'casual') return true
  const waited = now - Math.min(a.joinedAt, b.joinedAt)
  return Math.abs(a.rating - b.rating) <= Math.min(400, 150 + 25 * Math.floor(waited / 15000))
}
