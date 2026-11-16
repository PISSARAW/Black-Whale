import { addKurapikaSuit } from './kurapikaSuit'
import type { HumanClothesBuild } from './humanClothes'
import { addMangaSuit, addMangaUniform } from './mangaTailoring'
import { addKallutoKimonoDetails } from './mangaZoldyckClothes'
import { addMangaDress, addMangaKimono } from './mangaRobes'
import { addMangaCharacterClothes } from './mangaCharacterClothes'

export function addMangaGarments(build: HumanClothesBuild): void {
  if (addMangaCharacterClothes(build)) return
  const makers: Partial<
    Record<HumanClothesBuild['profile']['clothing'], (build: HumanClothesBuild) => void>
  > = {
    suit: addMangaSuit,
    uniform: addMangaUniform,
    gown: addMangaDress,
    kimono: addMangaKimono,
    changshan: addMangaKimono,
  }
  makers[build.profile.clothing]?.(build)
  if (build.profile.likeness === 'kalluto-zoldyck') addKallutoKimonoDetails(build)
}

export function addDeclaredGarments(build: HumanClothesBuild): boolean {
  const id = build.profile.likeness
  if (!id || id === 'morena-prudo') return false
  if (id === 'kurapika') addKurapikaSuit(build)
  else addMangaGarments(build)
  return true
}
