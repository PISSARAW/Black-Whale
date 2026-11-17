/** Different commands can belong to the same Hatsu. */
const DISTINCT_GROUPS: Record<string, string> = {
  'hisoka:downSpecial': 'texture-surprise',
  'biscuit:cookie': 'cookie',
  'kalluto:backSpecial': 'paper-listening',
  'chrollo:neutralSpecial': 'skill-hunter',
  'chrollo:forwardSpecial': 'black-voice',
}
const DEFAULT_GROUPS: Record<string, string> = {
  hisoka: 'bungee-gum',
  biscuit: 'biscuit-body',
  kalluto: 'paper-manipulation',
  chrollo: 'sun-and-moon',
}
export function chainAbilityGroup(moveId: string): string {
  const source = moveId.split(':')[0]
  if (source === 'kurapika' || source === 'benjamin') return moveId
  return DISTINCT_GROUPS[moveId] ?? DEFAULT_GROUPS[source] ?? source
}
