import type { PageLoad } from './$types'

export const load: PageLoad = async ({ fetch }) => {
  // TODO: load map state for current chapter
  return { mapState: null }
}
