export interface RankingCredential {
  id: string
  token: string
  name: string
}
export const RANKING_STORAGE = 'black-whale:clash:ranking:1'
export function rankingCredential(storage?: Pick<Storage, 'getItem'>): RankingCredential | null {
  try {
    const value = JSON.parse(storage?.getItem(RANKING_STORAGE) ?? 'null')
    return value &&
      ['id', 'token', 'name'].every(
        (key) => typeof value[key] === 'string' && value[key].length <= 100,
      )
      ? value
      : null
  } catch {
    return null
  }
}
export function rankingToken(): string {
  try {
    return rankingCredential(localStorage)?.token ?? ''
  } catch {
    return ''
  }
}
