import { localizedLoad } from '$lib/server/localized-load'
import type { PageServerLoad } from './$types'
import { loadShipPage } from './shipPage.server'

export const load: PageServerLoad = localizedLoad(loadShipPage)
