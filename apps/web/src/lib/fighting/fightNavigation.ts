import { parsePathname } from '$lib/i18n/config'

export const FIGHT_SCREENS = [
  'characters',
  'stage',
  'options',
  'academy',
  'replays',
  'battle',
] as const
export type FightScreen = 'menu' | (typeof FIGHT_SCREENS)[number]

export function fightScreen(pathname: string): FightScreen {
  const segment = parsePathname(pathname).path.split('/')[2]
  return FIGHT_SCREENS.find((screen) => screen === segment) ?? 'menu'
}

/** Keep the match runtime mounted across the preparation pages. */
export function routeTransitionKey(pathname: string): string {
  const { path, locale } = parsePathname(pathname)
  if (path === '/fighting') return `${locale}:clash`
  if (FIGHT_SCREENS.some((screen) => path === `/fighting/${screen}`)) return `${locale}:clash`
  return pathname
}
