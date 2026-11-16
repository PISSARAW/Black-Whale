import type { PageServerLoad } from './$types'

/** Keep the route boundary explicit even though the arcade state stays in the browser. */
export const load: PageServerLoad = () => ({})
