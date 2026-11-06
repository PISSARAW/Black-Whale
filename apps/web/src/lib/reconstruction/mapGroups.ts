export function deckOf(tierId: string | null): string | null {
  return tierId?.split('-').slice(0, 2).join('-') ?? null
}

export function mapGroups(markers: { tierId: string; change: string }[]) {
  const counts = new Map<string, number>()
  for (const marker of markers) {
    if (marker.change === 'departed') continue
    const deck = deckOf(marker.tierId)!
    counts.set(deck, (counts.get(deck) ?? 0) + 1)
  }
  return [...counts]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, count]) => ({
      id,
      number: Number(id.split('-')[1]),
      count,
    }))
}
