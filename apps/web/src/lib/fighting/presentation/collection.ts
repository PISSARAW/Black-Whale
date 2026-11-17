import { SOLO_ROUTES } from '../solo/catalogue'
import type { SoloRouteId } from '../solo/types'
export type Palette = 'native' | 'slate' | 'ivory'
export type Title = 'none' | SoloRouteId
export interface PresentationPreferences {
  version: 1
  player: Palette
  opponent: Palette
  title: Title
}
export const defaultPreferences = (): PresentationPreferences => ({
  version: 1,
  player: 'native',
  opponent: 'native',
  title: 'none',
})
export const PALETTES: readonly {
  id: Palette
  label: readonly [string, string]
  colours: readonly [number, number, number]
  route?: SoloRouteId
}[] = [
  {
    id: 'native',
    label: ['Tenue de référence', 'Reference outfit'],
    colours: [0x334155, 0x172033, 0xe2e8f0],
  },
  {
    id: 'slate',
    label: ['Variante ardoise', 'Slate variant'],
    colours: [0x354c65, 0x192b40, 0xd9e8f5],
  },
  {
    id: 'ivory',
    label: ['Variante ivoire · récompense', 'Ivory variant · reward'],
    colours: [0xd5c8ab, 0x514535, 0xeee5d1],
    route: 'escort',
  },
]
export function paletteUnlocked(palette: Palette, routes: readonly SoloRouteId[]): boolean {
  const required = PALETTES.find(({ id }) => id === palette)?.route
  return !required || routes.includes(required)
}
export function titleLabel(title: Title, language: 'fr' | 'en'): string {
  return SOLO_ROUTES.find(({ id }) => id === title)?.reward[language === 'fr' ? 0 : 1] ?? ''
}
export function validatePreferences(
  value: unknown,
  routes: readonly SoloRouteId[],
): PresentationPreferences {
  const base = defaultPreferences()
  if (!currentVersion(value)) return base
  const data = value as Record<string, unknown>
  for (const side of ['player', 'opponent'] as const) {
    const chosen = PALETTES.find(({ id }) => id === data[side])?.id
    if (chosen && paletteUnlocked(chosen, routes)) base[side] = chosen
  }
  const title = SOLO_ROUTES.find(({ id }) => id === data.title)?.id
  if (title && routes.includes(title)) base.title = title
  return base
}

function currentVersion(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && 'version' in value && value.version === 1)
}
