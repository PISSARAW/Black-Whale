import type { FighterDefinition } from './types'

interface FighterSpec {
  id: FighterDefinition['id']
  modelId: string
  name: string
  title: readonly [string, string]
  special: string
  colours: [string, string]
  stats: [number, number, number]
}

const SPECS: readonly FighterSpec[] = [
  {
    id: 'longhi',
    modelId: 'longhi',
    name: 'Longhi',
    title: ['La négociatrice de Tubeppa', 'Tubeppa’s Negotiator'],
    special: 'Moonlight Act',
    colours: ['#334155', '#c4b5fd'],
    stats: [0.98, 1.02, 26],
  },
  {
    id: 'musse',
    modelId: 'musse',
    name: 'Musse',
    title: ['Le garde espion de Benjamin', 'Benjamin’s Spy Guard'],
    special: 'Secret Window',
    colours: ['#3f4a3b', '#d4af37'],
    stats: [1, 1.02, 6],
  },
  {
    id: 'padaille',
    modelId: 'padaille',
    name: 'Padaille',
    title: ['L’homme aux armes des Heil-Ly', 'Heil-Ly’s Living Arsenal'],
    special: 'I’m Coming to Get You',
    colours: ['#44403c', '#f97316'],
    stats: [1.12, 0.98, 18],
  },
  {
    id: 'sayird',
    modelId: 'sayird',
    name: 'Sayird',
    title: ['Le regard de Little Eye', 'Little Eye’s Watcher'],
    special: 'Little Eye',
    colours: ['#3f4a58', '#60a5fa'],
    stats: [0.96, 1.04, 30],
  },
  {
    id: 'terebellum',
    modelId: 'terebellum',
    name: 'Terebellum',
    title: ['Le relais de dégâts des Heil-Ly', 'Heil-Ly’s Damage Relay'],
    special: 'Damage: Sweet Home',
    colours: ['#3f3f46', '#fb7185'],
    stats: [1.04, 1, 19],
  },
  {
    id: 'voconte',
    modelId: 'voconte',
    name: 'Voconte',
    title: ['Le passeur des Heil-Ly', 'Heil-Ly’s Gatekeeper'],
    special: 'Door',
    colours: ['#422006', '#f59e0b'],
    stats: [1, 1.08, 25],
  },
  {
    id: 'yokotani',
    modelId: 'yokotani',
    name: 'Yokotani',
    title: ['L’avocat des Heil-Ly', 'Heil-Ly’s Lawyer'],
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
    titleFr: spec.title[0],
    titleEn: spec.title[1],
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
