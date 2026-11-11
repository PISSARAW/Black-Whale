import type { InvestigationCase } from '../case'

/**
 * Room 1014: Barrigen's death, as the manga shows it.
 *
 * It lives in its own file because it is a *case*, not the machinery that
 * reads one — `case.ts` holds the vocabulary and the verdict rule, which apply
 * to every case, and this is the first of them.
 */
export const room1014Case: InvestigationCase = {
  id: 'room-1014-silent-majority',
  title: 'Onze secondes',
  subtitle: 'Incident de la chambre 1014',
  location: 'Pont 1 · Appartement 1014',
  chapter: 370,
  objective: "Établir le mécanisme de l'attaque sans prétendre connaître l'assassin.",
  investigator: 'Kurapika',
  subjects: [
    {
      id: 'kurapika',
      name: 'Kurapika',
      role: 'Enquêteur',
      status: 'Utilisateur de Nen · attentif',
      color: 0xffd166,
      posOffset: [2.4, 0],
      dialogue:
        'Une attaque a eu lieu au milieu du groupe. Ne confondons pas ce que nous soupçonnons avec ce que nous pouvons prouver.',
      // His analysis comes from the testimony, or from Emperor Time, not from a glance.
      evidenceIds: [],
      questions: [
        {
          id: 'kurapika-method',
          prompt: 'Que peut-on déjà affirmer sur la capacité ?',
          response:
            "Les créatures sont matérialisées et dirigées. La poupée obéit à une autre règle de visibilité. Ce sont des propriétés, pas l'identité de l'utilisateur.",
          cooperativeResponse:
            "Les témoignages concordent : les créatures sont matérialisées et téléguidées, tandis que la poupée obéit à une condition de perception distincte. Cela décrit deux fonctions d'une même attaque, jamais l'identité de son utilisateur.",
          preferredStances: ['neutral'],
          resistedStances: ['accusatory'],
          requiredTrust: 75,
          requiredEvidenceIds: ['bill-testimony', 'loberry-vision'],
          evidenceIds: ['nen-residue'],
          cooperativeEvidenceIds: [],
        },
      ],
    },
    {
      id: 'bill',
      name: 'Bill',
      role: 'Témoin',
      status: 'Utilisateur de Nen · coopératif',
      color: 0x83d483,
      posOffset: [-2.4, 1.2],
      dialogue:
        "J'étais face à la pièce. J'ai vu le garde s'effondrer, mais aucune arme ni aucun assaillant ne l'a touché.",
      evidenceIds: [],
      questions: [
        {
          id: 'bill-seen',
          prompt: 'Qu’avez-vous vu au moment de l’attaque ?',
          response:
            'Quatre formes blanches autour du cou de Barrigen. Elles étaient visibles et les gardes ont essayé de les arracher.',
          cooperativeResponse:
            "Je les ai vues apparaître ensemble autour de son cou. Sakata a tiré et d'autres gardes ont tenté de les arracher : ce n'était ni une illusion isolée, ni une attaque portée par quelqu'un dans la pièce.",
          preferredStances: ['neutral'],
          resistedStances: ['accusatory'],
          requiredTrust: 45,
          requiredEvidenceIds: [],
          evidenceIds: ['bill-testimony'],
          cooperativeEvidenceIds: [],
        },
        {
          id: 'bill-duration',
          prompt: 'Combien de temps avons-nous eu pour réagir ?',
          response:
            "Presque rien. Onze secondes au plus entre l'apparition des créatures et sa mort.",
          cooperativeResponse:
            "Onze secondes au plus. Je comptais les réactions autour de moi : l'apparition, les tirs, nos tentatives pour les retirer, puis l'effondrement. Tout s'est produit dans cette fenêtre.",
          preferredStances: ['pressing'],
          resistedStances: ['accusatory'],
          requiredTrust: 50,
          requiredEvidenceIds: ['wounds'],
          evidenceIds: ['death-window'],
          cooperativeEvidenceIds: [],
        },
      ],
    },
    {
      id: 'loberry',
      name: 'Loberry',
      role: 'Témoin central',
      status: 'Possédée · seule à voir la poupée',
      color: 0xe8a6c8,
      posOffset: [0, -2.4],
      dialogue:
        "Une fille masquée se tenait derrière Furykov. Je vous jure qu'elle était là, mais personne d'autre ne semblait la voir.",
      evidenceIds: [],
      questions: [
        {
          id: 'loberry-figure',
          prompt: 'Décrivez exactement la présence masquée.',
          response:
            "Une petite fille décorative avec un masque. Elle se tenait derrière Furykov. Quand je l'ai montrée, personne ne regardait au bon endroit.",
          cooperativeResponse:
            "Elle ressemblait à une petite fille décorative masquée, immobile derrière Furykov. Je sentais sa présence comme une pression qui m'obligeait à la regarder ; quand j'ai crié, tous les regards se sont détournés de Barrigen.",
          preferredStances: ['empathetic'],
          resistedStances: ['pressing', 'accusatory'],
          requiredTrust: 45,
          requiredEvidenceIds: [],
          evidenceIds: ['loberry-vision'],
          cooperativeEvidenceIds: [],
        },
        {
          id: 'loberry-control',
          prompt: 'La contrôliez-vous ?',
          response:
            "Non. Je ne pouvais que la voir. Elle s'est imposée à moi et ma panique a attiré tous les regards.",
          cooperativeResponse:
            "Je ne la contrôlais pas. Elle a forcé mon attention, puis ma peur a fait le reste : j'ai désigné Furykov et détourné la classe au moment exact où Barrigen était attaqué.",
          preferredStances: ['empathetic'],
          resistedStances: ['accusatory'],
          requiredTrust: 55,
          requiredEvidenceIds: ['loberry-vision'],
          evidenceIds: [],
          cooperativeEvidenceIds: [],
        },
      ],
    },
    {
      id: 'furykov',
      name: 'Furykov',
      role: 'Garde de Benjamin',
      status: 'Utilisateur de Nen déclaré · observateur hostile',
      color: 0xb8a1d9,
      posOffset: [-1.5, -1.7],
      dialogue:
        "Je n'ai vu aucune fille masquée derrière moi. En revanche, les créatures fixées au cou de Barrigen étaient matérialisées et visibles de tous.",
      // What the creatures looked like is Bill's and Sakata's to tell.
      evidenceIds: [],
      questions: [
        {
          id: 'furykov-doll',
          prompt: 'La poupée se trouvait-elle derrière vous ?',
          response:
            "Loberry l'affirme. Moi, je n'ai rien vu derrière mon dos. Cela indique une condition de perception, pas une absence.",
          cooperativeResponse:
            "Je n'ai rien vu, même après l'alerte de Loberry. Pourtant sa réaction était trop précise pour être feinte. Si une poupée se trouvait là, sa visibilité devait être conditionnelle et distincte de celle des créatures.",
          preferredStances: ['pressing'],
          resistedStances: ['accusatory'],
          requiredTrust: 50,
          requiredEvidenceIds: ['loberry-vision'],
          evidenceIds: [],
          cooperativeEvidenceIds: [],
        },
      ],
    },
    {
      id: 'belerainte',
      name: 'Belerainte',
      role: 'Garde de Tubeppa',
      status: 'Utilisateur de Nen déclaré · coopératif',
      color: 0x7db8da,
      posOffset: [1.6, -1.6],
      dialogue:
        "Six personnes dans cette salle savent déjà utiliser le Nen, mais seules Furykov et moi l'avons déclaré. Le meurtrier peut se cacher parmi ceux qui se taisent.",
      evidenceIds: [],
      questions: [
        {
          id: 'belerainte-users',
          prompt: 'Combien de participants savent utiliser le Nen ?',
          response:
            'Six selon le décompte entendu dans la salle. Furykov et moi nous sommes déclarés; quatre autres se taisent.',
          cooperativeResponse:
            "Le décompte donne six utilisateurs. Furykov et moi nous sommes déclarés ; quatre autres ont choisi le silence. Ce fait élargit la liste des possibilités, mais n'autorise à accuser aucun d'entre eux.",
          preferredStances: ['neutral'],
          resistedStances: ['accusatory'],
          requiredTrust: 45,
          requiredEvidenceIds: [],
          evidenceIds: ['six-nen-users'],
          cooperativeEvidenceIds: [],
        },
      ],
    },
    {
      id: 'sakata',
      name: 'Sakata',
      role: 'Garde de Zhang Lei',
      status: 'Témoin armé · non-initié au Nen',
      color: 0xd08c60,
      posOffset: [-2.2, -1],
      dialogue:
        "J'ai tiré sur les créatures lorsqu'elles sont apparues autour de son cou. Les balles les ont atteintes, mais Barrigen était déjà condamné.",
      evidenceIds: [],
      questions: [
        {
          id: 'sakata-shots',
          prompt: 'Sur quoi avez-vous tiré ?',
          response:
            "Sur les créatures blanches. Mes tirs les atteignaient; elles n'étaient donc ni une hallucination de Loberry, ni invisibles.",
          cooperativeResponse:
            "J'ai aligné les formes blanches au cou, puis tiré. Les impacts les ont atteintes et les autres gardes les saisissaient aussi : elles avaient une présence matérielle que nous pouvions tous percevoir.",
          preferredStances: ['pressing'],
          resistedStances: ['accusatory'],
          requiredTrust: 50,
          requiredEvidenceIds: ['loberry-vision'],
          evidenceIds: ['bill-testimony'],
          cooperativeEvidenceIds: [],
        },
        {
          id: 'sakata-time',
          prompt: 'Auriez-vous pu sauver Barrigen en tirant plus tôt ?',
          response:
            "Non. Leur action combinée était trop rapide; nous n'avions qu'environ onze secondes.",
          cooperativeResponse:
            "Non. Même en réagissant dès leur apparition, il fallait viser sans toucher Barrigen pendant que les autres essayaient de les arracher. Leur action combinée l'a vidé de son sang en onze secondes environ.",
          preferredStances: ['empathetic'],
          resistedStances: ['accusatory'],
          requiredTrust: 55,
          requiredEvidenceIds: ['wounds'],
          evidenceIds: ['death-window'],
          cooperativeEvidenceIds: [],
        },
      ],
    },
    {
      id: 'body',
      name: 'Corps de Barrigen',
      role: 'Victime',
      status: 'À examiner',
      color: 0x7f1d1d,
      posOffset: [0, 2.4],
      isDead: true,
      dialogue:
        'Le corps est exsangue. Quatre créatures blanches se sont fixées à son cou; les gardes ont pu les voir et tenter de les arracher.',
      // The body shows the wounds; how fast they killed is the witnesses' account.
      evidenceIds: ['wounds'],
      questions: [],
    },
  ],
  evidence: [
    {
      id: 'visibility-split',
      title: 'Deux règles de visibilité',
      claim:
        'La poupée n’est visible que de Loberry et de son utilisateur, tandis que les quatre créatures matérialisées sont visibles de tous.',
      source: 'Confrontation de Loberry et Furykov',
      chapter: 370,
      kind: 'NEN',
      method: 'DEDUCTION',
      truthStatus: 'DEDUCTION',
      reliability: 'TRUSTED',
      subjectId: 'loberry',
      canonicalRefs: [
        {
          type: 'EVENT',
          id: 'ch-369-seq-5',
          label: 'Silent Majority possesses Loberry',
          href: '/timeline#chapter-369',
        },
        {
          type: 'EVENT',
          id: 'ch-370-seq-1',
          label: 'Silent Majority kills Barrigen',
          href: '/timeline#chapter-370',
        },
      ],
    },
    {
      id: 'six-nen-users',
      title: 'Six utilisateurs dans la classe',
      claim:
        "Six participants savent déjà utiliser le Nen; seuls Furykov et Belerainte l'ont déclaré.",
      source: 'Décompte pendant le cours',
      chapter: 369,
      kind: 'TESTIMONY',
      method: 'TOLD_BY_OTHER',
      truthStatus: 'STRONGLY_IMPLIED',
      reliability: 'UNVERIFIED',
      subjectId: 'belerainte',
      canonicalRefs: [
        {
          type: 'EVENT',
          id: 'ch-369-seq-6',
          label: 'Kurapika asks who already knows Nen',
          href: '/timeline#chapter-369',
        },
      ],
    },
    {
      id: 'wounds',
      title: 'Perforations multiples',
      claim: 'Quatre créatures matérialisées ont perforé Barrigen et drainé son sang.',
      source: 'Examen du corps',
      chapter: 370,
      kind: 'OBSERVATION',
      method: 'DIRECT_OBSERVATION',
      truthStatus: 'CONFIRMED',
      reliability: 'TRUSTED',
      subjectId: 'body',
      canonicalRefs: [
        {
          type: 'EVENT',
          id: 'ch-370-seq-1',
          label: 'Silent Majority kills Barrigen',
          href: '/timeline#chapter-370',
        },
      ],
    },
    {
      id: 'death-window',
      title: 'Onze secondes',
      claim:
        "Quatre créatures agissant ensemble n'ont besoin que d'environ onze secondes pour tuer.",
      source: 'État du corps et séquence observée',
      chapter: 370,
      kind: 'TIMELINE',
      method: 'DEDUCTION',
      truthStatus: 'DEDUCTION',
      reliability: 'TRUSTED',
      subjectId: 'body',
      canonicalRefs: [
        {
          type: 'EVENT',
          id: 'ch-370-seq-1',
          label: 'Silent Majority kills Barrigen',
          href: '/timeline#chapter-370',
        },
      ],
    },
    {
      id: 'bill-testimony',
      title: 'Créatures visibles',
      claim:
        'Bill et les gardes ont vu les créatures blanches et tenté de les arracher à la victime.',
      source: 'Témoignage de Bill',
      chapter: 370,
      kind: 'TESTIMONY',
      method: 'TOLD_BY_OTHER',
      truthStatus: 'STRONGLY_IMPLIED',
      reliability: 'UNVERIFIED',
      subjectId: 'bill',
      canonicalRefs: [
        {
          type: 'EVENT',
          id: 'ch-370-seq-1',
          label: 'Silent Majority kills Barrigen',
          href: '/timeline#chapter-370',
        },
      ],
    },
    {
      id: 'loberry-vision',
      title: 'La poupée que personne ne voit',
      claim:
        "Loberry est la seule témoin à voir la poupée masquée qui détourne l'attention du groupe.",
      source: 'Témoignage de Loberry',
      chapter: 370,
      kind: 'TESTIMONY',
      method: 'TOLD_BY_OTHER',
      truthStatus: 'STRONGLY_IMPLIED',
      reliability: 'UNVERIFIED',
      subjectId: 'loberry',
      canonicalRefs: [
        {
          type: 'EVENT',
          id: 'ch-369-seq-5',
          label: 'Silent Majority possesses Loberry',
          href: '/timeline#chapter-369',
        },
      ],
    },
    {
      id: 'nen-residue',
      title: "Anomalie d'aura",
      claim:
        'Les attaquants sont matérialisés et dirigés à distance; la poupée suit une règle de visibilité différente.',
      source: 'Analyse de Kurapika',
      chapter: 370,
      kind: 'NEN',
      method: 'NEN_ABILITY',
      truthStatus: 'DEDUCTION',
      reliability: 'TRUSTED',
      subjectId: 'kurapika',
      canonicalRefs: [
        {
          type: 'EVENT',
          id: 'ch-370-seq-1',
          label: 'Silent Majority kills Barrigen',
          href: '/timeline#chapter-370',
        },
      ],
    },
  ],
  hypotheses: [
    {
      id: 'ordinary-weapon',
      label: 'Des animaux ordinaires ont attaqué Barrigen',
      explanation:
        "Cette piste n'explique ni la vitesse du drainage, ni la poupée visible par une seule personne.",
      requiredEvidenceIds: ['wounds'],
      contradictionEvidenceIds: ['death-window', 'loberry-vision', 'nen-residue'],
    },
    {
      id: 'accident',
      label: 'Loberry a elle-même tué Barrigen',
      explanation:
        "Son témoignage est central, mais voir la poupée ne démontre pas qu'elle contrôle les créatures.",
      requiredEvidenceIds: ['loberry-vision'],
      contradictionEvidenceIds: ['bill-testimony', 'nen-residue'],
    },
    {
      id: 'hidden-nen',
      label: 'Un utilisateur caché a déclenché une capacité de Nen à distance',
      explanation:
        "Cette conclusion relie la diversion imposée à Loberry, les quatre créatures matérialisées et la mise à mort coordonnée. Elle ne révèle pas l'identité de l'utilisateur.",
      requiredEvidenceIds: [
        'wounds',
        'death-window',
        'bill-testimony',
        'loberry-vision',
        'visibility-split',
        'nen-residue',
      ],
      contradictionEvidenceIds: [],
    },
  ],
  canonicalHypothesisId: 'hidden-nen',
  solvedSummary:
    "Les faits établissent une attaque de Nen matérialisée et commandée à distance, mais l'identité de l'utilisateur reste inconnue à ce stade.",
  objectives: [
    {
      id: 'inspect-victim',
      label: 'Établir la cause de la mort',
      requiredEvidenceIds: ['wounds', 'death-window'],
    },
    {
      id: 'compare-witnesses',
      label: 'Comparer ce que chacun pouvait voir',
      requiredEvidenceIds: ['bill-testimony', 'loberry-vision', 'visibility-split'],
    },
    {
      id: 'identify-method',
      label: 'Qualifier le mécanisme de Nen',
      requiredEvidenceIds: ['nen-residue'],
    },
  ],
}
