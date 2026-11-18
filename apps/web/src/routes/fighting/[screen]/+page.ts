import { error } from '@sveltejs/kit'
import { FIGHT_SCREENS } from '$lib/fighting/fightNavigation'
import type { PageLoad } from './$types'

export const load: PageLoad = ({ params }) => {
  if (!FIGHT_SCREENS.some((screen) => screen === params.screen)) error(404, 'Unknown Clash screen')
  return {}
}
