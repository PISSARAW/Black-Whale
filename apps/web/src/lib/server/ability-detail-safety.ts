export interface AbilityDetailRecord {
  id: string
  ownerId?: string | null
  userIds?: string[]
  name: string
  alternateNames?: string[]
  category: string
  secondaryCategories?: string[]
  description: string
  canonStatus: string
  modifiedAt: string
  sources: Array<{ chapterId: string; note?: string }>
}

/** The name is dated by ability visibility; current prose and ownership are not. */
export function maskAbilityDetail(ability: AbilityDetailRecord, cap: number): AbilityDetailRecord {
  return {
    id: ability.id,
    name: ability.name,
    category: 'unknown',
    description: '',
    alternateNames: [],
    secondaryCategories: [],
    canonStatus: ability.canonStatus,
    modifiedAt: ability.modifiedAt,
    sources: ability.sources
      .filter((source) => {
        const chapter = Number(source.chapterId.match(/^ch-(\d+)/)?.[1])
        return Number.isFinite(chapter) && chapter <= cap
      })
      .map(({ chapterId }) => ({ chapterId })),
  }
}

export function publishAbilityDetail<Character>(
  input: {
    ability: AbilityDetailRecord
    owner: Character | null
    users: Character[]
    related: Array<{ id: string; name: string }>
  },
  cap: number | undefined,
) {
  if (cap === undefined) return { ...input, catalogueCapped: false }
  return {
    ability: maskAbilityDetail(input.ability, cap),
    owner: null,
    users: [],
    related: [],
    catalogueCapped: true,
  }
}
