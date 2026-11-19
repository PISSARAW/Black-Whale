export function fortunePaperLabel(
  id: string | undefined,
  language: 'fr' | 'en',
): string | undefined {
  if (id === 'scenario:fortune-identity')
    return language === 'fr' ? 'la feuille du participant' : 'the participant’s sheet'
  if (id === 'scenario:fortune-portrait')
    return language === 'fr' ? 'le portrait du participant' : 'the participant’s portrait'
  return undefined
}

export const GHOSTWRITER_CONDITIONS = {
  fr: 'Identité authentique écrite par le sujet sur cette feuille, sujet ou portrait visible, instrument et encre réels, main libre et mois de scénario défini. Jamais son propre avenir.',
  en: 'Authentic identity handwritten by the subject on this sheet, visible subject or portrait, real writing tool and ink, a free hand and defined scenario month. Never the caster’s own future.',
}
