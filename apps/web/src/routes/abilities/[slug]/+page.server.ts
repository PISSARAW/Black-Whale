import { error } from '@sveltejs/kit'
import { localizedLoad } from '$lib/server/localized-load'
import { readDataFile } from '$lib/server/data-files'
import { loadAbilityVisibility } from '$lib/server/ability-visibility'
import { publishAbilityDetail, type AbilityDetailRecord } from '$lib/server/ability-detail-safety'
import { readSpoilerLimit } from '$lib/server/spoiler'
import type { PageServerLoad } from './$types'

interface CharacterRecord {
  id: string
  canonicalName: string
}

interface AbilityUseRecord {
  id: string
  chapter: number
  eventTitle?: string
  abilityId: string
  userId: string
  status: string
  note: string
}

export const load: PageServerLoad = localizedLoad(
  async ({ params, cookies }: Parameters<PageServerLoad>[0]) => {
    const [abilities, characters, uses, visibility, chapters] = await Promise.all([
      readDataFile<AbilityDetailRecord[]>('abilities/abilities.json'),
      readDataFile<CharacterRecord[]>('characters/characters.json'),
      readDataFile<AbilityUseRecord[]>('abilities/uses.json'),
      loadAbilityVisibility(),
      readDataFile<Array<{ number: number }>>('chapters/chapters.json'),
    ])
    const spoilerLimit = readSpoilerLimit(cookies)
    const ability = abilities.find((candidate) => candidate.id === params.slug)
    if (!ability || !visibility.isVisible(ability.id, spoilerLimit)) {
      throw error(404, 'Ability not found')
    }
    const catalogueCapped =
      spoilerLimit !== undefined && spoilerLimit < Math.max(...chapters.map(({ number }) => number))

    const characterById = new Map(characters.map((character) => [character.id, character]))
    const owner = ability.ownerId ? (characterById.get(ability.ownerId) ?? null) : null
    const userIds = [...new Set([ability.ownerId, ...(ability.userIds ?? [])].filter(Boolean))]
    const users = userIds.flatMap((id) => {
      const character = characterById.get(id as string)
      return character ? [character] : []
    })
    const related = abilities
      .filter(
        (candidate) =>
          candidate.id !== ability.id &&
          ability.ownerId !== undefined &&
          candidate.ownerId === ability.ownerId &&
          visibility.isVisible(candidate.id, spoilerLimit),
      )
      .map(({ id, name }) => ({ id, name }))

    return {
      ...publishAbilityDetail(
        { ability, owner, users, related },
        catalogueCapped ? spoilerLimit : undefined,
      ),
      uses: uses
        .filter((use) => use.abilityId === ability.id)
        .filter((use) => spoilerLimit === undefined || use.chapter <= spoilerLimit)
        .map((use) => ({
          ...use,
          userName: characterById.get(use.userId)?.canonicalName ?? use.userId,
        }))
        .sort((left, right) => left.chapter - right.chapter),
    }
  },
)
