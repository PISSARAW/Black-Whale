const STOP = new Set(
  'a an the of and or to for with that who where how show me find all using use can i want are is which please les des le la un une de du et ou qui que quoi quel quels quelle quelles dans sur avec sans moi montre montrer trouve trouver cherche rechercher tous toutes utiliser utilisant utilise peuvent peut est sont je veux les personnages pouvoirs capacites abilities characters powers personnage pouvoir capacite ability character power'.split(
    ' ',
  ),
)

export function foldSearch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}

export function searchWords(text: string): string[] {
  return [
    ...new Set(
      foldSearch(text)
        .split(' ')
        .filter((word) => word.length >= 2 && !STOP.has(word)),
    ),
  ]
}
