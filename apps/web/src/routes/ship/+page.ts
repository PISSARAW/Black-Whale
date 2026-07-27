import type { PageLoad } from './$types'

export const load: PageLoad = async ({ data }) => {
  // TODO: load map state for current chapter
  return { ...data, mapState: null }
}
