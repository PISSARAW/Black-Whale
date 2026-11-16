export interface TournamentPlayer {
  id: string
  name: string
}
export interface TournamentBout {
  id: string
  round: number
  index: number
  seats: [string | null, string | null]
  winner: string | null
  automatic: boolean
}
export interface ClashTournament {
  version: 1
  name: string
  players: TournamentPlayer[]
  bouts: TournamentBout[]
  champion: string | null
}
export function createTournament(names: string[], name = 'Clash Cup'): ClashTournament {
  validatePlayers(names)
  const players = names.map((entry, index) => ({ id: `p${index + 1}`, name: entry.trim() }))
  const size = 2 ** Math.ceil(Math.log2(players.length)),
    seeds = seedOrder(size)
  const bouts: TournamentBout[] = []
  for (let round = 0, count = size / 2; count >= 1; round++, count /= 2)
    for (let index = 0; index < count; index++)
      bouts.push({
        id: `${round}:${index}`,
        round,
        index,
        seats:
          round === 0
            ? [
                players[seeds[index * 2] - 1]?.id ?? null,
                players[seeds[index * 2 + 1] - 1]?.id ?? null,
              ]
            : [null, null],
        winner: null,
        automatic: false,
      })
  return advanceTournament({
    version: 1,
    name: name.trim().slice(0, 40),
    players,
    bouts,
    champion: null,
  })
}
function validatePlayers(names: string[]) {
  if (
    names.length < 2 ||
    names.length > 16 ||
    names.some((entry) => !entry.trim() || entry.length > 24)
  )
    throw Error('INVALID_PLAYERS')
  if (new Set(names.map((entry) => entry.trim().toLocaleLowerCase())).size !== names.length)
    throw Error('DUPLICATE_PLAYERS')
}
function seedOrder(size: number): number[] {
  let order = [1, 2]
  while (order.length < size) {
    const total = order.length * 2 + 1
    order = order.flatMap((seed) => [seed, total - seed])
  }
  return order
}
export function tournamentWinner(
  tournament: ClashTournament,
  id: string,
  winner: string,
): ClashTournament {
  const bout = tournament.bouts.find((entry) => entry.id === id)
  if (!bout || bout.winner || !bout.seats[0] || !bout.seats[1] || !bout.seats.includes(winner))
    throw Error('INVALID_RESULT')
  return advanceTournament({
    ...tournament,
    bouts: tournament.bouts.map((entry) =>
      entry.id === id ? { ...entry, winner } : { ...entry, seats: [...entry.seats] },
    ),
  })
}
function advanceTournament(tournament: ClashTournament) {
  for (const bout of tournament.bouts) {
    const previous = tournament.bouts.filter(
      (entry) => entry.round === bout.round - 1 && Math.floor(entry.index / 2) === bout.index,
    )
    if (bout.round > 0) {
      if (previous.some((entry) => !entry.winner)) continue
      bout.seats = [previous[0].winner, previous[1].winner]
    }
    const available = bout.seats.filter(Boolean)
    if (available.length === 1) {
      bout.winner = available[0]
      bout.automatic = true
    }
  }
  tournament.champion = tournament.bouts.at(-1)?.winner ?? null
  return tournament
}
export function readTournament(text: string): ClashTournament | null {
  try {
    if (text.length > 20_000) return null
    const value = JSON.parse(text)
    if (
      value.version !== 1 ||
      typeof value.name !== 'string' ||
      !Array.isArray(value.players) ||
      !Array.isArray(value.bouts)
    )
      return null
    let rebuilt = createTournament(
      value.players.map((player: TournamentPlayer) => player.name),
      value.name,
    )
    for (const bout of value.bouts)
      if (bout.winner && !bout.automatic) rebuilt = tournamentWinner(rebuilt, bout.id, bout.winner)
    return rebuilt
  } catch {
    return null
  }
}
