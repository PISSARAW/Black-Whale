import type { Locale } from '$lib/i18n/config'

/**
 * Everything the case view says in its own voice.
 *
 * The dossier's own words — evidence titles, testimony, objectives — come from
 * the localized case in `catalog`; these are the chrome around them, and they
 * lived inside the component as a hundred-line `$derived` that pushed the
 * thing past what one file can hold. Same two objects, same keys, read now by
 * the panels that each need a handful of them.
 */
export function caseUi(locale: Locale) {
  return locale === 'fr'
    ? {
        description:
          "Explorez la chambre 1014, confrontez les témoignages et reconstituez l'attaque de Silent Majority.",
        dossier: 'Dossier',
        chapter: 'chapitre',
        choose: 'Choisir',
        notebook: 'Carnet d’enquête',
        solved: 'Affaire résolue',
        items: 'éléments',
        people: 'Personnes et éléments',
        objectives: 'Objectifs',
        close: 'Fermer',
        closeTestimony: 'Fermer le témoignage',
        closeNotebook: 'Fermer le carnet',
        briefing: 'Briefing · Jour 2 · 09:00',
        briefingBody:
          'Le premier cours de Nen vient de devenir une scène de crime. Barrigen est mort devant toute la classe. Une seule personne affirme avoir vu une présence masquée ; plusieurs autres ont vu les créatures qui ont tué.',
        mission: 'Ordre de mission',
        canonLimit:
          'L’identité de l’utilisateur de Silent Majority n’est pas connue dans le canon. Une enquête rigoureuse doit savoir s’arrêter avant l’accusation.',
        saved: 'Progression sauvegardée sur cet appareil',
        enter: 'Entrer dans la scène',
        activeCase: 'dossier actif',
        needsEvidence: 'Nécessite un nouvel élément',
        nenAnalysis: 'Analyse Nen',
        noHatsu: 'Aucun Hatsu actif',
        useTarget: 'Utiliser sur cette cible',
        chooseHatsu: 'Choisir un Hatsu',
        inspectNotebook: 'Examiner dans le carnet',
        recorded: (count: number) =>
          `+ ${count} élément${count > 1 ? 's' : ''} consigné${count > 1 ? 's' : ''}`,
        tabs: [
          ['evidence', 'Preuves'],
          ['people', 'Personnes'],
          ['timeline', 'Chronologie'],
          ['deduction', 'Déduction'],
        ] as const,
        collected: 'Éléments collectés',
        sourceCaution: 'Une source n’est pas nécessairement une certitude.',
        emptyNotebook: 'Le carnet est vide. Examinez la scène et interrogez les témoins.',
        reset: 'Réinitialiser',
        spoilers: 'Spoilers',
        perspective: 'Perspective',
        approach: 'Posture',
        refused: 'Le témoin se referme. Changez de posture ou présentez un élément pertinent.',
        stances: {
          neutral: 'Neutre',
          empathetic: 'Empathique',
          pressing: 'Pressante',
          accusatory: 'Accusatrice',
        },
      }
    : {
        description:
          'Explore room 1014, compare testimony and reconstruct the Silent Majority attack.',
        dossier: 'Case file',
        chapter: 'chapter',
        choose: 'Choose',
        notebook: 'Investigation notebook',
        solved: 'Case solved',
        items: 'items',
        people: 'People and evidence',
        objectives: 'Objectives',
        close: 'Close',
        closeTestimony: 'Close testimony',
        closeNotebook: 'Close notebook',
        briefing: 'Briefing · Day 2 · 09:00',
        briefingBody:
          'The first Nen lesson has become a crime scene. Barrigen died in front of the entire class. One person claims to have seen a masked presence; several others saw the creatures that killed him.',
        mission: 'Mission order',
        canonLimit:
          'The identity of the Silent Majority user is not known in canon. A rigorous investigation must stop before making an accusation.',
        saved: 'Progress saved on this device',
        enter: 'Enter the scene',
        activeCase: 'active case',
        needsEvidence: 'Requires new evidence',
        nenAnalysis: 'Nen analysis',
        noHatsu: 'No active Hatsu',
        useTarget: 'Use on this target',
        chooseHatsu: 'Choose a Hatsu',
        inspectNotebook: 'Review in notebook',
        recorded: (count: number) => `+ ${count} evidence item${count > 1 ? 's' : ''} recorded`,
        tabs: [
          ['evidence', 'Evidence'],
          ['people', 'People'],
          ['timeline', 'Timeline'],
          ['deduction', 'Deduction'],
        ] as const,
        collected: 'Collected evidence',
        sourceCaution: 'A source is not necessarily a certainty.',
        emptyNotebook: 'The notebook is empty. Examine the scene and question the witnesses.',
        reset: 'Reset',
        spoilers: 'Spoilers',
        perspective: 'Perspective',
        approach: 'Approach',
        refused: 'The witness shuts down. Change approach or present relevant evidence.',
        stances: {
          neutral: 'Neutral',
          empathetic: 'Empathetic',
          pressing: 'Pressing',
          accusatory: 'Accusatory',
        },
      }
}
