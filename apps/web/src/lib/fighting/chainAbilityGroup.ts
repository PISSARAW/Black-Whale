/** Different commands can belong to the same Hatsu. */
const DISTINCT_GROUPS: Record<string, string> = {
  'benjamin:forwardSpecial': 'secret-window',
  'benjamin:backSpecial': 'secret-window',
  'hisoka:downSpecial': 'texture-surprise',
  'biscuit:cookie': 'cookie',
  'kalluto:backSpecial': 'paper-listening',
  'chrollo:neutralSpecial': 'skill-hunter',
  'chrollo:forwardSpecial': 'black-voice',
}
const DEFAULT_GROUPS: Record<string, string> = {
  musse: 'secret-window',
  hisoka: 'bungee-gum',
  biscuit: 'biscuit-body',
  kalluto: 'paper-manipulation',
  chrollo: 'sun-and-moon',
}
export function chainAbilityGroup(moveId: string): string {
  const source = moveId.split(':')[0]
  if (DISTINCT_GROUPS[moveId]) return DISTINCT_GROUPS[moveId]
  if (source === 'kurapika' || source === 'benjamin') return moveId
  return DISTINCT_GROUPS[moveId] ?? DEFAULT_GROUPS[source] ?? source
}
