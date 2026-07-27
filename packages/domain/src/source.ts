export type SourceType = 'manga' | 'anime' | 'databook' | 'interview' | 'community'

export interface Source {
  id: string
  type: SourceType
  chapter?: number
  page?: number
  panel?: string
  description: string
}
