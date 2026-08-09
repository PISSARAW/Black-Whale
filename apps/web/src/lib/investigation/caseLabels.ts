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
        binder: 'Carnet d’enquête',
        binderSections: 'Sections du carnet',
        investigationObjectives: 'Objectifs d’enquête',
        start: 'COMMENCER',
        deduction: {
          eyebrow: 'Construire la conclusion',
          title: 'Que s’est-il passé pendant ces onze secondes ?',
          intro:
            'Choisissez une hypothèse puis uniquement les éléments qui la soutiennent. Le verdict évaluera aussi les contradictions.',
          propositionsMissing: (count: number) =>
            `${count} proposition${count === 1 ? '' : 's'} à établir`,
          evidence: (count: number) => `Pièces versées au raisonnement · ${count}`,
          submit: 'Soumettre',
          analysis: 'Analyse du raisonnement',
          contradiction: 'Contradiction',
          establish: 'À établir',
          epistemicLimit:
            'Limite épistémique : l’enquêteur peut démontrer l’usage d’un Nen dissimulé, mais pas encore nommer son utilisateur. La vérité du lecteur reste séparée du verdict.',
        },
        evidence: {
          statuses: {
            CONFIRMED: 'confirmé',
            STRONGLY_IMPLIED: 'fortement impliqué',
            DEDUCTION: 'déduit',
            CONTESTED: 'contesté',
          },
          log: 'Journal du carnet',
          logKinds: {
            DISCOVERY: 'indice',
            HYPOTHESIS: 'piste',
            HATSU: 'hatsu',
            VERDICT: 'verdict',
          },
        },
        confrontation: {
          reviewed: 'Consigné · revoir',
          examine: 'À examiner',
          title: 'Confronter deux déclarations',
          intro: 'Sélectionnez deux témoins. Une divergence précise peut devenir une déduction.',
          action: 'Confronter les versions',
        },
        report: {
          final: 'Rapport final',
          close: 'Fermer le rapport',
          retained: 'Reconstitution retenue',
          unknowns: 'Inconnues persistantes',
          rejected: 'Hypothèses écartées',
          procedure: 'Conclusion procédurale',
          procedureBody: (chapter: number) =>
            `Le mécanisme peut être communiqué aux gardes. Toute accusation nominative dépasserait les éléments disponibles au chapitre ${chapter}.`,
          signed: 'Signé',
          review: 'Revoir les pièces (CARNET)',
          back: 'Retour à la scène',
        },
        timeline: {
          second: 'seconde',
          creaturesActive: (count: number) => `${count} créatures actives`,
          blood: 'volume sanguin',
          synchronized: 'Reconstitution synchronisée',
          slider: 'Seconde de la reconstitution',
          pause: 'Pause',
          replay: 'Rejouer',
          play: 'Lecture',
          sightLines: 'Plan des lignes de vue',
          relativePosition: 'Position relative au moment de l’attaque',
          doll: 'Poupée',
          creatures: 'Créatures',
          sightLinesLabel: (phenomenon: string) =>
            `Lignes de vue · ${phenomenon === 'doll' ? 'poupée' : 'créatures'}`,
          dollCaption: 'Poupée derrière Furykov · visible par Loberry seule',
          creaturesCaption: 'Créatures matérialisées · visibles par tous',
          events: [
            [
              'T − 00:11',
              'Loberry désigne une poupée que personne d’autre ne voit.',
              'loberry-vision',
            ],
            [
              'T − 00:08',
              'Quatre créatures blanches se fixent au cou de Barrigen.',
              'bill-testimony',
            ],
            ['T + 00:00', 'Barrigen s’effondre, entièrement vidé de son sang.', 'wounds'],
            ['Après', 'Kurapika recherche un mécanisme de Nen.', 'nen-residue'],
          ] as const,
        },
        lifeConsumed: (hours: number, total: number) =>
          `Vie consommée · +${hours} h · total ${total} h`,
        hatsuGateReason:
          'Seules les techniques capables d’observer, d’analyser ou de reproduire la scène ont une prise sur ce dossier.',
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
        binder: 'Investigation binder',
        binderSections: 'Notebook sections',
        investigationObjectives: 'Investigation objectives',
        start: 'BEGIN',
        deduction: {
          eyebrow: 'Build the conclusion',
          title: 'What happened during those eleven seconds?',
          intro:
            'Choose a hypothesis, then only the evidence supporting it. The verdict will also assess contradictions.',
          propositionsMissing: (count: number) =>
            `${count} proposition${count === 1 ? '' : 's'} still to establish`,
          evidence: (count: number) => `Evidence submitted for reasoning · ${count}`,
          submit: 'Submit',
          analysis: 'Reasoning analysis',
          contradiction: 'Contradiction',
          establish: 'Still to establish',
          epistemicLimit:
            'Epistemic limit: the investigator can demonstrate the use of concealed Nen, but cannot yet name its user. Reader truth remains separate from the verdict.',
        },
        evidence: {
          statuses: {
            CONFIRMED: 'confirmed',
            STRONGLY_IMPLIED: 'strongly implied',
            DEDUCTION: 'deduced',
            CONTESTED: 'contested',
          },
          log: 'Binder log',
          logKinds: { DISCOVERY: 'clue', HYPOTHESIS: 'lead', HATSU: 'hatsu', VERDICT: 'verdict' },
        },
        confrontation: {
          reviewed: 'Recorded · review',
          examine: 'Examine',
          title: 'Compare two statements',
          intro: 'Select two witnesses. A precise discrepancy may become a deduction.',
          action: 'Compare accounts',
        },
        report: {
          final: 'Final report',
          close: 'Close report',
          retained: 'Accepted reconstruction',
          unknowns: 'Remaining unknowns',
          rejected: 'Rejected hypotheses',
          procedure: 'Procedural conclusion',
          procedureBody: (chapter: number) =>
            `The mechanism may be communicated to the guards. Naming an accused person would go beyond the evidence available in chapter ${chapter}.`,
          signed: 'Signed',
          review: 'Review evidence (BOOK)',
          back: 'Back to scene',
        },
        timeline: {
          second: 'second',
          creaturesActive: (count: number) => `${count} active creatures`,
          blood: 'blood volume',
          synchronized: 'Synchronized reconstruction',
          slider: 'Reconstruction second',
          pause: 'Pause',
          replay: 'Replay',
          play: 'Play',
          sightLines: 'Line-of-sight plan',
          relativePosition: 'Relative position at the moment of the attack',
          doll: 'Doll',
          creatures: 'Creatures',
          sightLinesLabel: (phenomenon: string) =>
            `Lines of sight · ${phenomenon === 'doll' ? 'doll' : 'creatures'}`,
          dollCaption: 'Doll behind Furykov · visible only to Loberry',
          creaturesCaption: 'Materialized creatures · visible to everyone',
          events: [
            ['T − 00:11', 'Loberry points to a doll nobody else can see.', 'loberry-vision'],
            [
              'T − 00:08',
              'Four white creatures attach themselves to Barrigen’s neck.',
              'bill-testimony',
            ],
            ['T + 00:00', 'Barrigen collapses, completely drained of blood.', 'wounds'],
            ['After', 'Kurapika investigates a Nen mechanism.', 'nen-residue'],
          ] as const,
        },
        lifeConsumed: (hours: number, total: number) =>
          `Life consumed · +${hours} h · total ${total} h`,
        hatsuGateReason:
          'Only techniques able to observe, analyze or reproduce the scene can affect this case.',
      }
}
