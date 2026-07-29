import type { Reroute } from '@sveltejs/kit'
import { parsePathname } from '$lib/i18n/config'

/**
 * `/fr/characters` is the French rendering of the `/characters` route, not a
 * route of its own — stripping the prefix here lets one set of route files
 * serve every locale. It runs on the server and on client-side navigation, so
 * the prefix survives both.
 */
export const reroute: Reroute = ({ url }) => parsePathname(url.pathname).path
