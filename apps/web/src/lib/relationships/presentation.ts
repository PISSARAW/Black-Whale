export type CharacterRecord = {
  id: string
  canonicalName: string
  factionId?: string | null
  aliases?: string[]
  shipLocation?: { role?: string | null } | null
}

export const palette: Record<string, { color: string; mark: string }> = {
  alliance: { color: '#75c9b8', mark: '↔' },
  cooperation: { color: '#70bdc1', mark: '◇' },
  conflict: { color: '#df746b', mark: '×' },
  patronage: { color: '#e6b661', mark: '◆' },
  control: { color: '#c99d66', mark: '↓' },
}
