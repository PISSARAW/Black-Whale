import type { Locale } from '$lib/i18n'
import type { ConfrontationDefinition } from '../definition'

/**
 * The two cross-examinations the Eleven seconds file allows. The wording used
 * to be written into `confrontation.ts` against hard-coded witness ids, which
 * made the engine work for this case only.
 */
export function elevenSecondsConfrontations(locale: Locale): ConfrontationDefinition[] {
  const fr = locale === 'fr'
  return [
    {
      id: 'loberry-furykov-visibility',
      subjectIds: ['loberry', 'furykov'],
      requiredEvidenceIds: ['loberry-vision', 'bill-testimony'],
      evidenceIds: ['visibility-split'],
      tone: 'deduction',
      title: fr ? 'Deux règles de visibilité' : 'Two visibility rules',
      finding: fr
        ? 'Loberry voit la poupée derrière Furykov; Furykov ne la voit pas. Tous voient ensuite les créatures. La poupée et les attaquants obéissent donc à deux conditions de perception distinctes.'
        : 'Loberry sees the doll behind Furykov; Furykov does not. Everyone then sees the creatures. The doll and the attackers therefore follow two distinct perception conditions.',
      incompleteFinding: fr
        ? "Interrogez d'abord Loberry sur la poupée et un témoin sur les créatures."
        : 'First question Loberry about the doll and a witness about the creatures.',
    },
    {
      id: 'bill-sakata-corroboration',
      subjectIds: ['bill', 'sakata'],
      requiredEvidenceIds: ['bill-testimony'],
      evidenceIds: [],
      tone: 'corroboration',
      title: fr ? 'Observation corroborée' : 'Corroborated observation',
      finding: fr
        ? 'Leurs récits concordent: les quatre créatures étaient matérielles, visibles et assez solides pour être visées et saisies.'
        : 'Their accounts agree: the four creatures were material, visible and solid enough to be shot at and grabbed.',
      incompleteFinding: fr
        ? "Recueillez d'abord ce que Bill ou Sakata a vu pendant l'attaque."
        : 'First gather what Bill or Sakata saw during the attack.',
    },
  ]
}
