import type { PageLoad } from './$types'

export const load: PageLoad = ({ params }) => ({ matchId: params.matchId })
