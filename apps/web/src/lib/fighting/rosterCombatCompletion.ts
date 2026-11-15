import type { FighterDefinition } from './types'

interface FighterSpec {
  id: FighterDefinition['id']
  modelId: string
  name: string
  special: string
  colours: [string, string]
  stats: [number, number, number]
}

const SPECS: readonly FighterSpec[] = [
  {
    id: 'longhi',
    modelId: 'longhi',
    name: 'Longhi',
    special: 'Moonlight Act',
    colours: ['#334155', '#c4b5fd'],
    stats: [0.98, 1.02, 26],
  },
  {
    id: 'musse',
    modelId: 'musse',
    name: 'Musse',
    special: 'Secret Window',
    colours: ['#3f4a3b', '#d4af37'],
    stats: [1, 1.02, 28],
  },
  {
    id: 'padaille',
    modelId: 'padaille',
    name: 'Padaille',
    special: 'I’m Coming to Get You',
    colours: ['#44403c', '#f97316'],
    stats: [1.12, 0.98, 18],
  },
  {
    id: 'sayird',
    modelId: 'sayird',
    name: 'Sayird',
    special: 'Little Eye',
    colours: ['#3f4a58', '#60a5fa'],
    stats: [0.96, 1.04, 30],
  },
  {
    id: 'silentmajority',
    modelId: 'silent-majority-user',
    name: 'Silent Majority',
    special: 'Silent Majority',
    colours: ['#1f2937', '#ef4444'],
    stats: [1.06, 1, 32],
  },
  {
    id: 'terebellum',
    modelId: 'terebellum',
    name: 'Terebellum',
    special: 'Damage: Sweet Home',
    colours: ['#3f3f46', '#fb7185'],
    stats: [1.04, 1, 19],
  },
  {
    id: 'voconte',
    modelId: 'voconte',
    name: 'Voconte',
    special: 'Hideout Doors',
    colours: ['#422006', '#f59e0b'],
    stats: [1, 1.08, 25],
  },
  {
    id: 'yokotani',
    modelId: 'yokotani',
    name: 'Yokotani',
    special: 'A Battle of Wits: LSDF',
    colours: ['#1e293b', '#f8fafc'],
    stats: [1.02, 0.92, 26],
  },
]

export const COMBAT_COMPLETION_ROSTER: readonly FighterDefinition[] = SPECS.map((spec) => {
  const [colour, accent] = spec.colours
  const [power, speed, specialRange] = spec.stats
  return {
    id: spec.id,
    modelId: spec.modelId,
    modelRole: 'fighter',
    name: spec.name,
    titleFr: 'Utilisateur de Nen de combat',
    titleEn: 'Combat Nen User',
    specialFr: spec.special,
    specialEn: spec.special,
    colour,
    accent,
    power,
    speed,
    reach: 7.6,
    specialRange,
  }
})
