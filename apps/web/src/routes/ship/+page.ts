import type { PageLoad } from './$types'

export const load: PageLoad = async ({ fetch, data }) => {
  // TODO: load map state for current chapter
  return { ...data, mapState: null }
}
