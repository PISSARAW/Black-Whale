import type { HatsuProfile } from '@black-whale/nen-engine'

/**
 * The entries a locale catalogue is missing, ready to paste and translate.
 *
 * The translations themselves are written by hand — that is what a translation
 * is — but *which* abilities need one is a fact of the catalogue, and working
 * it out by reading a type error and eighty-two lines of French is a chore no
 * one should repeat. The English text comes along as the thing to translate,
 * not as a default: an entry left as it arrives is visibly untranslated.
 */

/** Fields a locale overlays. `owner` is deliberately absent — see hatsu-fr.ts. */
const TRANSLATED = ['name', 'action', 'instruction', 'rule', 'cost'] as const

function literal(value: string): string {
  const escaped = value.replace(/\\/g, '\\\\')
  return escaped.includes("'") ? `"${escaped.replace(/"/g, '\\"')}"` : `'${escaped}'`
}

export function emitLocaleSkeleton(
  profiles: readonly HatsuProfile[],
  translated: ReadonlySet<string>,
): string {
  const missing = profiles.filter((profile) => !translated.has(profile.id))
  if (missing.length === 0) return ''

  return missing
    .map((profile) => {
      const fields = TRANSLATED.map((field) => `    ${field}: ${literal(profile[field])},`)
      return `  ${literal(profile.id)}: {\n${fields.join('\n')}\n  },`
    })
    .join('\n')
}
