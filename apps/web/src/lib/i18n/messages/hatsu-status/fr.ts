import type { HatsuStatusMessages } from '$lib/i18n/hatsuStatus'

/** The French rendering of what each Hatsu says while it runs. */
export const hatsuStatusFr: HatsuStatusMessages = {
  disguise: {
    forged: (a0: string, a1: string) =>
      `Les vraies informations de ${a0} sont cachées sous « ${a1} » · sa fonction d’origine subsiste dessous`,
  },

  scarlet: {
    swept: (a0: string, a1: number, a2: number) =>
      a1
        ? `${a0} à 100 % dans toutes les catégories · ${a1} élément${a1 > 1 ? 's' : ''} scellé${a1 > 1 ? 's' : ''} débloqué${a1 > 1 ? 's' : ''} · ${a2} heures de vie dépensées`
        : `${a0} fonctionnait déjà à pleine efficacité · ${a2} heures de vie dépensées pour rien`,
  },

  'chain-rule': {
    nothingToTake: (a0: string) =>
      `L’aura de ${a0} s’écoule dans la seringue, mais il n’y avait aucun pouvoir à y prendre`,
    drained: (a0: string, a1: string) =>
      `${a0} arraché à ${a1} · il est maintenu en Zetsu et ne le récupère pas avant que la chaîne le lui rende`,
  },

  'chain-bind': {
    vowViolated: (a0: string) =>
      `Vœu violé sur ${a0} · la chaîne-prison rejette une cible qui n’est pas une Araignée`,
    bound: (a0: string) => `${a0} entravé en Zetsu forcé · toutes ses actions sont scellées`,
  },

  dowsing: {
    probed: (a0: boolean, a1: string, a2: number) =>
      a0
        ? `${a1} · le pendule détecte une incertitude ou une tromperie (${a2} %)`
        : `${a1} localisé · signal stable (${a2} %)`,
  },

  enhance: {
    reinforced: (a0: boolean, a1: string, a2: number) =>
      a0
        ? `${a1} au Ren maximal · il contient plus d’aura qu’il ne peut en garder et le manteau déborde sur tout ce qui l’entoure`
        : `${a1} renforcé · puissance d’aura ${a2}/5`,
  },

  control: {
    guarded: (a0: string) => `${a0} est celui qu’on protège · chaque lien part d’ici et y revient`,
    answered: (a0: string, a1: number) =>
      `${a0} a été touché et les ${a1} ont répondu d’un seul coup · c’est tout le réseau`,
    network: (a0: string, a1: number) =>
      `${a1} garde${a1 > 1 ? 's' : ''} autour de ${a0} · ils mettent en commun le peu que chacun possède`,
  },

  growth: {
    grown: (a0: boolean, a1: string, a2: number) =>
      a0
        ? `Croissance du Nen de ${a1} ${a2}/10 · la progression est lente chez une personne non entraînée`
        : `${a1} a germé jusqu’au stade ${a2}/10`,
  },

  vehicle: {
    launched: (a0: number, a1: number) =>
      `Véhicule lancé · ${a0} passagers brûlent ${a1} % de leur propre aura pour mouvoir la coque`,
    boarding: (a0: number) => `${a0}/5 passagers à bord · cliquez un passager pour partir`,
    alreadyAboard: (a0: string) =>
      `${a0} est déjà à bord · le véhicule attend un deuxième passager avant de partir`,
    full: (a0: string) => `${a0} refusé · la coque transformée est pleine à 5 passagers`,
  },

  scout: {
    conjured: (a0: string) =>
      `${a0} est fait d’aura · Little Eye ne peut pas prendre possession d’une créature invoquée`,
    tooBig: (a0: number, a1: string) =>
      `${a1} est ${a0}× plus gros qu’un hamster · la boule n’a rien à quoi se tenir`,
    taken: (a0: number) =>
      `Un hôte de ${a0} px² est pris · ce qu’il voit et entend nous revient, et il continue de voir l’aura tant qu’il tient`,
  },

  tribunal: {
    blue: (a0: string) => `BLEU · ${a0} est admis et répond désormais à la cour`,
    yellow: (a0: string) =>
      `JAUNE · ${a0} est sous le contrôle de la cour et a fait ce qui lui était dit · retournez la carte s’il s’arrête`,
    yellowReversed: (a0: string) =>
      `JAUNE INVERSÉ · ${a0} est enfermé et peut encore parler · la boîte ne tient pas longtemps`,
    released: (a0: string) =>
      `${a0} est sorti de la boîte · la cour peut l’y remettre autant de fois qu’il le faut`,
    red: (a0: string) => `ROUGE · ${a0} est renvoyé et ne répond plus à cette cour`,
  },

  curse: {
    victim: (a0: string) =>
      `${a0} a été désigné victime · un sacrifié parmi les siens a été choisi au même instant et marqué là où rien ne se voit`,
    searched: (a0: boolean, a1: string) =>
      a0
        ? `Le Gyo a trouvé la tache de naissance quelque part dans ${a1} · touchez le sacrifié lui-même pour la dépenser`
        : `Le Gyo n’a rien trouvé sur ${a1} · celui qui a lancé ceci y a masqué sa propre aura`,
    spent: (a0: string) =>
      `Le sacrifié est mort · la malédiction a traversé toute la page et emporté ${a0}, et rien sur elle ne dit qui l’a lancée`,
  },

  blast: {
    fired: (a0: number, a1: string) =>
      a0
        ? `Le souffle de la paume a arraché ${a0} protection${a0 > 1 ? 's' : ''} à ${a1} d’un bout à l’autre de la page, sans le toucher`
        : `${a1} n’avait aucune protection · le souffle est passé au travers sans rien faire`,
  },

  surveillance: {
    recorded: (a0: boolean, a1: boolean, a2: string) =>
      a0
        ? `${a2} · la chouette a enregistré une mort imminente`
        : a1
          ? `${a2} · la chouette a enregistré un changement de position`
          : `${a2} · flux en direct stable, images antérieures conservées`,
  },

  future: {
    predicted: (a0: boolean, a1: string, a2: number) =>
      a0
        ? `${a1} ajouté à la prédiction immuable de dix secondes · choisissez une autre action réelle`
        : `Prédiction terminée · ${a2} actions subsistent en rémanences`,
  },

  resurrection: {
    killed: (a0: string) => `${a0} a tué Camilla · la contre-attaque post-mortem se matérialise`,
    absorbed: (a0: string) => `Force vitale de ${a0} absorbée · Camilla entièrement ressuscitée`,
  },

  poetry: {
    line: (a0: number) => `Vers ${a0}/3 écrit · ce sont les mots choisis qui décident de l’effet`,
    light: (a0: string, a1: string, a2: number, a3: boolean) =>
      `« ${a1} » · le mot de lumière a purifié ${a0} et lui a retiré ${a2} chose${a2 === 1 ? '' : 's'}${a3 ? ', et la saison a porté plus loin' : ''}`,
    fire: (a0: string, a1: string, a2: boolean) =>
      `« ${a0} » · tout ce que le poing frappe brûle, et c’est ${a1} qu’il a frappé${a2 ? ' · la saison l’a fait brûler de part en part' : ''}`,
    inert: (a0: string) =>
      `« ${a0} » · aucun mot d’invocation nulle part dedans · la bande reste une bande de papier`,
  },

  restoration: {
    restored: (a0: string) =>
      `${a0} restauré · filtres de chapitre, profondeur de carte et position d’événement ramenés à leur état reposé`,
  },

  transformation: {
    toggled: (a0: boolean, a1: number, a2: number, a3: string) =>
      a0
        ? `${a3} sous sa forme inoffensive · ${a1} de ses ${a2} commandes dépassent ce que ce corps sait faire`
        : `${a3} de retour dans sa vraie forme · tout est de nouveau à portée`,
  },

  rhythm: {
    armed: (a0: number, a1: string) =>
      `${a1} porte la tenue invoquée et tient la lance · sa portée couvre ${a0} voisin${a0 === 1 ? '' : 's'}, et la tenue le couvre`,
  },

  impact: {
    escaped: (a0: string) =>
      `${a0} est sorti de portée de la musique avant que la sphère se referme sur lui`,
    caught: (a0: string) => `Jupiter a rattrapé ${a0} et s’est refermée`,
    chasing: (a0: string, a1: number) => `Jupiter poursuit toujours ${a0} · passage ${a1}/4`,
    conjured: (a0: string) =>
      `Jupiter invoquée au-dessus de ${a0} · la danse est achevée, elle ne s’arrêtera plus`,
  },

  mimicry: {
    studied: (a0: number, a1: string) =>
      `${a0} secondes passées avec ${a1} · c’est exactement le temps que sa forme tiendra`,
    copied: (a0: string, a1: string, a2: number) =>
      `${a1} a pris la forme de ${a0} · ${a2} secondes de cette forme, quelle que soit la différence de taille`,
    expired: (a0: string, a1: string) =>
      `Le temps acheté avec ${a0} est écoulé et ${a1} est redevenu lui-même`,
  },

  theft: {
    needsControl: () => 'Skill Hunter exige un bouton ou un lien exposé',
    sealed: (a0: string) => `${a0} scellé dans Skill Hunter`,
  },

  bookmark: {
    alreadyHeld: (a0: string) => `${a0} est déjà la page tenue · l’autre main tient le livre`,
    twoOnly: (a0: string) =>
      `Deux pages ouvertes, c’est tout ce qu’il peut · ${a0} demanderait une troisième main`,
    pinned: (a0: boolean, a1: string, a2: string) =>
      a0
        ? `${a2} maintenu ouvert par le marque-page · le livre est libre de s’ouvrir ailleurs`
        : `Les deux pages sont ouvertes en même temps · ${a1} et ${a2} peuvent servir ensemble`,
  },

  devour: {
    notSealed: (a0: string) =>
      `${a0} n’est pas une pièce close · le poisson étouffe au milieu de toutes ces portes ouvertes`,
    eaten: (a0: string) =>
      `${a0} a été dévoré de l’intérieur · il tient toujours debout, répond toujours, et l’ignore toujours`,
    biting: (a0: string, a1: number) =>
      `${a0} en cours de dévoration · morsure ${a1}/4 · aucune douleur, aucun sang, aucune marque sur lui`,
  },

  pocket: {
    wrapped: (a0: boolean, a1: string) =>
      a0
        ? `${a1} enveloppé · il tient dans une paume à présent, et rien en lui n’est abîmé`
        : `${a1} ressorti du tissu à sa taille d’origine`,
  },

  teleport: {
    nowhere: (a0: string) =>
      `${a0} est resté où il était · il n’y a nulle part ailleurs sur cette page où le mettre`,
    moved: (a0: string, a1: string) =>
      `${a1} n’est plus là où il se tenait · il est à côté de ${a0}, et on ne lui a pas demandé son avis`,
  },

  polarity: {
    marked: (a0: boolean, a1: string) =>
      a0
        ? `Soleil et plus imprimés sur ${a1} · retouchez-le pour maintenir le contact, ou posez la Lune`
        : `Lune et moins imprimés sur ${a1} · la paire est posée mais rien ne s’est encore touché`,
    charging: (a0: number, a1: string) =>
      `Contact maintenu sur ${a1} pendant ${a0} seconde${a0 > 1 ? 's' : ''} · ${a0 >= 4 ? 'charge complète' : 'de trois à cinq pour la pleine puissance'}`,
    closing: (a0: number) =>
      `${a0} px entre les deux marques · elles ont été rapprochées et ne se sont toujours pas rencontrées`,
    detonated: (a0: boolean, a1: number, a2: number) =>
      a0
        ? `Marques à pleine charge réunies · ${a1} corps ont sauté, pas seulement les deux qui les portaient`
        : `Les marques se sont touchées à la charge ${a2} · seuls les deux porteurs ont sauté`,
  },

  command: {
    noHead: (a0: string) => `${a0} n’a pas de tête · il n’y a rien à tamponner dessus`,
    alive: (a0: string) =>
      `${a0} n’est pas un objet · le tampon le refuse, alors qu’une copie de Nen ferait l’affaire`,
    stamped: (a0: number, a1: number, a2: string) =>
      `人 sur la tête de ${a2} · ${a0} pantin${a1 ? 's' : ''} · retirez une tête et celui-là s’arrête`,
    order: (a0: string, a1: number) =>
      `« Va vers ${a0} » · assez simple pour que tous les ${a1} le suivent`,
  },

  'identity-swap': {
    leftHand: (a0: string) =>
      `Main gauche sur ${a0} · son apparence est prise, sa destination non · choisissez maintenant qui la portera`,
    ownFace: (a0: string) =>
      `${a0} ne peut pas porter son propre visage · touchez une seconde identité`,
    swapped: (a0: string, a1: string) =>
      `${a0} et ${a1} portent le visage de l’autre · tous deux mènent toujours exactement là où ils menaient`,
  },

  divination: {
    sameArea: () =>
      'Le cadran ne prendra pas un autre appel depuis cette zone · déplacez-vous d’abord',
    noCalls: () => 'Plus d’appels aujourd’hui · le combiné avait son quota et il est épuisé',
    guideTitle: (a0: number) => `Love Dial 6700 · appel ${a0}/6`,
    reading: (a0: string, a1: string, a2: number) =>
      `${a0} composé · le partenaire idéal est ${a1} (${a2} %) · c’est tout ce que le combiné dira`,
  },

  prophecy: {
    ownFuture: () => 'Lovely Ghostwriter ne peut pas écrire l’avenir de celui qui tient la plume',
    incomplete: (a0: string, a1: string) =>
      `${a0} n’a pas noté ${a1} · la plume ne bouge pas sur une fiche incomplète`,
    guideTitle: () => 'Lovely Ghostwriter · chemins annoncés',
    written: (a0: string, a1: number) =>
      `Quatre quatrains écrits pour ${a0} en transe · le premier est le passé, les ${a1} routes qui suivent ne le sont pas`,
  },

  clone: {
    copyOfCopy: () => 'Une copie n’a plus rien à copier · touchez un objet original',
    noBody: (a0: string) => `${a0} n’a aucun corps visible à copier`,
    copied: (a0: boolean, a1: string) =>
      a0
        ? `${a1} copié · ce qui est sorti de la main droite est un corps, et il ne fait rien de ce que fait l’original`
        : `${a1} copié · la réplique repose à côté de l’original sans aucune de ses fonctions`,
    expired: (a0: string) =>
      `La copie de ${a0} a atteint ses vingt-quatre heures et s’en est allée`,
  },

  puppet: {
    needsControl: () => 'Black Voice a besoin d’un bouton ou d’un lien pour son antenne',
    bothPlanted: () =>
      'Les deux antennes sont posées · l’une répond au téléphone et l’autre est là pour être regardée',
    planted: (a0: string) =>
      `${a0} a une antenne plantée dedans · posez la seconde avant de donner le moindre ordre`,
    ordered: (a0: string, a1: string | null) =>
      `L’ordre est parti dans ${a0}${a1 ? `, et pas dans ${a1}` : ''}`,
  },

  barrage: {
    fired: (a0: number, a1: string, a2: number) =>
      `${a0} balles sur ${a1} et sur ce qui se tenait à côté${a2 ? ` · ${a2} construction${a2 > 1 ? 's' : ''} de Nen transpercée${a2 > 1 ? 's' : ''} de part en part` : ''}`,
  },

  projection: {
    recalled: (a0: string) =>
      `${a0} a été touché · le double a disparu et il est de retour à l’intérieur`,
    passedThrough: (a0: string) =>
      `Le double a traversé ${a0} de part en part sans rien ouvrir au passage`,
    left: (a0: string) =>
      `Le double a laissé ${a0} derrière lui · le corps ne fait rien pendant son absence, et le toucher met fin à tout`,
  },

  animate: {
    noAura: (a0: string, a1: boolean) =>
      `${a0} refusé · il ne reste plus d’aura aujourd’hui pour ${a1 ? 'un troisième grand corps' : 'un onzième petit'}`,
    touched: (a0: string) => `${a0} touché · le changement met quelques secondes à venir`,
    alive: (a0: string, a1: boolean) =>
      `${a0} est vivant et fait toujours son travail · ${a1 ? 'un grand corps, donc' : 'petit, donc'} son aura ne tiendra pas longtemps`,
    spent: (a0: string) => `${a0} a épuisé son aura et redevient un objet`,
  },

  needle: {
    crippled: (a0: string) =>
      `${a0} a déjà survécu à un ordre · il est estropié et n’en prend plus`,
    inserted: (a0: string) =>
      `Une aiguille dans ${a0} et un ordre donné · il ne reste rien en lui qui puisse s’arrêter`,
    straining: (a0: string, a1: number) =>
      `${a0} exécute encore son ordre · ${a1}/3 avant que le corps cède`,
    burntOut: (a0: string) =>
      `${a0} a exécuté l’ordre et s’y est consumé · estropié à partir de maintenant`,
  },

  'paper-spy': {
    reported: (a0: string, a1: number) =>
      `${a0} · ${a1} changements rapportés par la poupée de papier`,
    deployed: (a0: string) => `Poupée de papier déployée à l’intérieur de ${a0}`,
  },

  shred: {
    stuck: (a0: string, a1: number, a2: number) =>
      `Un morceau s’est fiché dans ${a0} à ${a1} %, ${a2} % · toutes les salves d’ici le retrouvent`,
    tracking: (a0: string, a1: boolean, a2: number, a3: string) =>
      `La salve est revenue dans la même plaie de ${a0} · passage ${a2}${a1 ? '' : ` · vous visiez ${a3} et elle y est allée quand même`}`,
  },

  'remote-strike': {
    alone: (a0: string) => `${a0} est seul sur sa surface · l’aura n’a nulle part où courir dessus`,
    emerged: (a0: string, a1: string, a2: string, a3: number) =>
      `Frappé sur ${a2}, l’aura a couru le long de ${a0} et ressurgi sous ${a1} · ${a3} poing${a3 > 1 ? 's' : ''} sorti${a3 > 1 ? 's' : ''} de cette surface`,
  },

  spatial: {
    burnt: (a0: string) => `${a0} a été descellé une fois · le passage ne s’y ouvrira plus jamais`,
    tooManyDoors: (a0: string, a1: number) =>
      `${a0} a ${a1} sorties · ce n’est pas une pièce close, et la voici consumée`,
    carried: (a0: string) =>
      `${a0} emporté à travers la pièce close jusqu’à l’espace derrière elle · il ressort n’importe où, tant que cette pièce reste fermée`,
  },

  stitch: {
    threadOut: (a0: string) =>
      `Fil sorti de ${a0} · plus le second bord est proche, plus la couture est solide`,
    reattached: (a0: number, a1: string) =>
      a0
        ? `${a0} partie${a0 > 1 ? 's' : ''} sectionnée${a0 > 1 ? 's' : ''} recousue${a0 > 1 ? 's' : ''} sur ${a1}, et de nouveau mobile aussitôt`
        : `Rien n’a été arraché à ${a1} qui puisse être recousu`,
    strong: (a0: string, a1: number, a2: string) =>
      `${a1} px de fil · assez court pour tenir ${a0} et ${a2} ensemble comme un seul corps`,
    slack: (a0: number) =>
      `${a0} px de fil · à cette longueur c’est du coton, et la couture ne tient pas`,
  },

  melody: {
    playing: (a0: number) =>
      `Note ${a0} du morceau · pour l’instant il ne fait qu’apaiser ceux qui l’entendent`,
    landed: (a0: number, a1: string) =>
      `Le morceau a porté · ${a0} section${a0 === 1 ? '' : 's'} ne remarque${a0 === 1 ? '' : 'nt'} plus rien d’autre que ${a1} pendant trois minutes`,
    ended: () => 'Le morceau est fini · ils remarquent de nouveau la pièce',
  },

  infection: {
    holdingKnife: (a0: string, a1: string | number) =>
      `C’est ${a0} qui tient le couteau désormais · niveau ${a1}`,
    kissed: (a0: string) =>
      `${a0} embrassé et intégré au groupe · niveau 0, et il y reste jusqu’à ce qu’il tue`,
    killed: (a0: string, a1: string, a2: number, a3: number, a4: string) =>
      `${a0} a tué ${a1} pour ${a2} · niveau ${a3}${a4}`,
  },

  windup: {
    winding: (a0: number) =>
      `Rotation ${a0} · ×${a0} dans le poing · frappez autre chose pour le lâcher`,
    tooFew: (a0: number, a1: string) =>
      `×${a0} dans ${a1} et il tient toujours debout · pas assez de tours, et le bras est vide à présent`,
    landed: (a0: boolean, a1: number, a2: string, a3: number) =>
      a0
        ? `×${a1} dépassait de loin ce qu’il fallait pour ${a2} · ${a3} passant${a3 === 1 ? '' : 's'} y est passé avec lui`
        : `×${a1} · ${a2} détruit, et rien d’autre`,
  },

  predator: {
    nothingToRead: (a0: string) =>
      `${a0} n’a aucun pouvoir à décoder · Prédateur n’a rien contre quoi se développer`,
    tooMany: (a0: number, a1: string) =>
      `${a1} porte ${a0} pouvoirs · Prédateur y est désavantagé et ne se formera pas`,
    working: (a0: string, a1: number) =>
      `${a0} décodé seul · ${a1}/3 · s’entendre donner la réponse ne le rendrait que plus faible`,
    countered: (a0: string, a1: number) =>
      `Prédateur a avalé ${a0} partout où il était porté (${a1}) · et il n’y a plus le moindre Nen pendant quarante-huit heures`,
  },

  staff: {
    reached: (a0: number, a1: number, a2: string) =>
      `Le bâton est déployé jusqu’à ${a1} · depuis ${a2} il a atteint ${a0} corps de chaque côté`,
  },

  senses: {
    stage: (a0: number) =>
      [
        'Tous les sens rétablis',
        'Vue scellée',
        'Vue + ouïe scellées',
        'Vue + ouïe + parole scellées',
      ][a0],
  },

  vacuum: {
    alive: (a0: number, a1: string) =>
      a0
        ? `${a1} est vivant, il n’est donc pas avalé · ${a0} substance${a0 > 1 ? 's' : ''} étrangère${a0 > 1 ? 's' : ''} en a été extraite${a0 > 1 ? 's' : ''} à la place`
        : `${a1} refusé · Blinky considère la cible comme vivante`,
    nenTrap: (a0: string) =>
      `${a0} n’entrera pas · il est fait de Nen, et c’est ainsi qu’on sait que c’est un piège`,
    swallowed: (a0: string, a1: number) =>
      `« ${a0} » nommé à voix haute et avalé · ${a1} dans le réservoir, et seul le dernier en ressort jamais`,
  },

  snakes: {
    outOfRange: (a0: string) =>
      `${a0} est en dehors des dix · les serpents ne vont que vers quelqu’un déjà à portée`,
    building: (a0: number) =>
      `${a0}/10 à portée · l’utilisateur est l’un d’eux et ne peut pas être distingué`,
    alreadySuspect: (a0: string, a1: number) =>
      `${a0} fait déjà partie des suspects · le champ n’est qu’à ${a1}/10`,
    spent: () => 'L’un des dix a déjà été vidé · la marionnette ne désigne jamais qu’une fois',
    drained: (a0: string) =>
      `Quatre serpents sur ${a0} · onze secondes et il est vide · la malédiction est dépensée et n’a plus rien sur quoi se retourner`,
  },

  'training-shot': {
    sealed: () =>
      `Maintenez une concentration parfaite pendant 3 secondes · l’action de l’élève sur le site est scellée en Zetsu`,
    held: (a0: string) =>
      `${a0} a maintenu le Zetsu · le tir contrôlé est encaissé et son action est rétablie`,
  },

  serpent: {
    released: (a0: string) => `${a0} relâché · le bras se déroule d’un seul coup`,
    coiling: (a0: boolean, a1: boolean, a2: number, a3: string) =>
      a0
        ? `${a3} entièrement comprimé · plus rien ne passe entre les anneaux`
        : `Anneau ${a2}/3 autour de ${a3} · ${a1 ? 'ses commandes sont bloquées' : 'il peut encore bouger'}`,
  },

  flock: {
    dispatched: (a0: number, a1: string) => `Pigeon ${a0} envoyé avec ${a1}`,
  },

  relay: {
    staged: (a0: string, a1: boolean, a2: number) =>
      `Cargaison ${a0} · étape de relais ${a2}/3${a1 ? ' · livrée dans le stockage du relais, sans téléportation' : ''}`,
  },

  healing: {
    unhurt: (a0: string) =>
      `${a0} ne porte aucune blessure · la croix ne trouve rien à refermer dessus`,
    mending: (a0: boolean, a1: string) =>
      a0
        ? `La chaîne sacrée a refermé ${a1} · il répond de nouveau`
        : `Renforcement amené dans ${a1} · la plaie est à moitié close, un passage de plus l’achève`,
  },

  'heart-vow': {
    staked: (a0: string) =>
      `L’enjeu enserre le cœur de ${a0} · retouchez-le pour déclarer une règle, touchez autre chose et la règle est rompue`,
    twoRules: (a0: string) =>
      `${a0} porte déjà deux règles · un seul enjeu n’en tiendra pas une troisième`,
    declared: (a0: number, a1: string) =>
      `Règle ${a0}/2 déclarée sur ${a1} · il reste en vie aussi longtemps qu’il les respecte`,
    broken: (a0: string, a1: string) =>
      `C’est ${a1} qui a été touché · la règle est rompue et l’enjeu a traversé le cœur de ${a0}`,
  },

  'ability-loan': {
    empty: () =>
      'Le dauphin est vide · Steal Chain doit prendre quelque chose avant qu’il y ait quoi que ce soit à prêter',
    readOut: (a0: string, a1: string) => `${a0} exposé en entier : ${a1}`,
    spent: (a0: string, a1: string, a2: boolean) =>
      `${a0} utilisé une fois par ${a1}${a2 ? ', dont les nœuds d’aura ont été forcés en s’en servant' : ''} · il est déjà retourné à son propriétaire`,
  },

  contract: {
    signed: (a0: boolean, a1: string) =>
      a0
        ? `${a1} a lu les termes et signé · une signature volontaire de plus et l’accord tient`
        : `Les deux parties ont signé · touchez l’une d’elles pour l’honorer, touchez quelqu’un d’autre et c’est une rupture`,
    honoured: () =>
      `Termes honorés · les deux signataires ont touché la récompense convenue, et tout ce qu’ils s’étaient promis est ouvert`,
    breached: (a0: string, a1: string) =>
      `${a1} n’a jamais été partie à cet accord · ${a0} a rompu, et la sanction est une semaine de Zetsu`,
    served: (a0: string) => `${a0} a purgé sa semaine et sort du Zetsu`,
  },

  'truth-punch': {
    answered: (a0: boolean, a1: number, a2: string) =>
      a0
        ? `La propre voix de ${a2} a répondu, et elle a fait court · redemandez avec un autre coup`
        : `Coup ${a1} · même question, et ${a2} a développé ce qu’il avait déjà dit`,
  },

  'blood-search': {
    guideTitle: () => 'Bloody Mary · gouttes encore humides',
    released: (a0: string) =>
      `Une goutte lâchée dans ${a0} · elle cherche d’elle-même et rend compte au fil de ses trouvailles`,
    found: (a0: string, a1: number) => `La goutte ${a1} a trouvé ${a0}`,
    dried: (a0: number) =>
      `La goutte ${a0} a séché · son aura ne lui donnait qu’une quarantaine de minutes, et ce qu’elle avait trouvé est parti avec elle`,
  },

  'legal-defense': {
    declared: (a0: string) =>
      `${a0} déclaré comme planque · le LSDF ne répond nulle part ailleurs, et seulement tant que Morena est là`,
    outside: (a0: string) =>
      `${a0} est en dehors de la planque · Yokotani n’y a aucune compétence et rien ne se produit`,
    guarded: (a0: number, a1: string) =>
      `Un garde de niveau ${a0} se tient sur ${a1} · il ne peut rien faire, et rien ne peut l’atteindre non plus`,
  },

  'damage-transfer': {
    resting: (a0: string) =>
      `Main gauche posée sur ${a0} · tous les coups encaissés désormais arrivent ici à la place`,
    noSink: (a0: string) =>
      `La main gauche a été frappée sans personne à qui transmettre · ${a0} a tout encaissé lui-même`,
    transferred: (a0: string, a1: boolean, a2: string, a3: number) =>
      `${a2} a été frappé et ne l’a pas senti · le coup ${a3} a atterri sur ${a0}${a1 ? ', qui a pris tout ce qu’il pouvait prendre' : ''}`,
  },

  'door-network': {
    nenConstruct: (a0: string) =>
      `${a0} est une construction de Nen · il traverse le cadre de Voconte sans être déplacé du tout`,
    trapArmed: (a0: string) =>
      `${a0} armé comme cadre piégé · quiconque y entre ressort dans la planque`,
    returnArmed: (a0: string) =>
      `${a0} est le cadre de retour · la paire ne fonctionne que dans un sens par chacun d’eux`,
    notADoor: (a0: string) =>
      `${a0} n’est pas un cadre de porte · passer devant l’un d’eux ne fait absolument rien`,
    crossed: (a0: string, a1: string) => `On est entré dans ${a1} et ressorti à ${a0}`,
  },

  'weapon-body': {
    hammer: (a0: string) => `Marteau · ${a0} aplati sur place`,
    drill: (a0: unknown, a1: string) =>
      a0
        ? `Perceuse · ${a1} percé de part en part, et ce qu’il gardait fermé est ouvert`
        : `Perceuse · il n’y avait rien de fermé dans ${a1} à atteindre`,
    axe: (a0: boolean, a1: string, a2: string) =>
      a0 ? `Hache · ${a1} retiré de ${a2}` : `Hache · ${a2} n’a plus rien sur lui à trancher`,
  },

  'coercive-beast': {
    obeyed: (a0: string) => `${a0} l’a fait sans qu’on le lui demande`,
    taken: (a0: string) =>
      `${a0} l’a satisfaite trois fois et appartient entièrement à la bête · personne ne dira ce qu’il a satisfait`,
    probed: (a0: boolean, a1: string, a2: number) =>
      a0
        ? `${a1} satisfait la condition · ${a2}/3`
        : `${a1} ne satisfait pas la condition, et c’est tout ce qu’on vous en dira`,
  },

  'coin-growth': {
    awakened: (a0: string) =>
      `${a0} a gardé la même pièce assez longtemps pour en être éveillé · ce qui dormait en lui est ouvert`,
    kept: (a0: string, a1: number) =>
      `${a0} a gardé la pièce dix jours de plus · valeur ${a1}, et elle continue de grimper tant que personne ne la déplace`,
    transferred: (a0: unknown, a1: string, a2: string) =>
      a0
        ? `La pièce a été donnée à ${a2} · son revers a changé, sa valeur est retombée à 1, et ${a1} n’en a rien gardé`
        : `Une pièce frappée pour ${a2} à la valeur 1`,
  },

  'lie-marks': {
    truthful: (a0: string) => `${a0} a répondu droit · la bête a ramené son visage sans le marquer`,
    marked: (a0: number, a1: string) =>
      [
        `Une entaille s’est ouverte sur ${a1} pour le premier mensonge`,
        `L’entaille sur ${a1} s’est infectée au second · il a été prévenu à voix haute de ne pas en tenter un troisième`,
        `Troisième mensonge · personne ne sait ce qu’est ${a1} désormais, seulement que ce n’est plus ce qu’il était`,
      ][a0],
  },

  'drug-synthesis': {
    partner: (a0: string) =>
      `${a0} est entré dans le contrat · la bête n’apparaît pas du tout sans une seconde partie`,
    selfPartner: (a0: string) => `${a0} ne peut pas collaborer avec lui-même`,
    guideTitle: () => 'Synthèse Tubeppa · composé d’itinéraires',
    routes: (a0: string, a1: string) =>
      `Les deux partenaires ont apporté des itinéraires · ce qui est sorti de la bête est un raccourci entre ${a0} et ${a1}`,
    material: () =>
      `Les deux partenaires ont apporté de la matière · le composé a ouvert ce que chacun retenait`,
    inert: (a0: string, a1: string) =>
      `${a0} et ${a1} n’ont rien en commun sur quoi travailler · le lot est inerte`,
  },

  'aura-levy': {
    taboo: (a0: string) =>
      `${a0} est revenu se resservir · c’est le seul tabou de la doctrine, et la punition n’est pas douce`,
    guideTitle: () => 'Tyson · du bonheur en retour',
    read: (a0: string, a1: number, a2: number) =>
      `${a0} a lu ${a1} caractères du Livre · ${a2} % de bonheur en retour, et une commande prélevée au titre de la taxe`,
  },

  'desire-trap': {
    bait: (a0: string) =>
      `Le mille-pattes a lu ${a0} et a sorti ce qu’il désire en appât · c’est en prenant l’appât qu’on déclenche ceci`,
    sprung: (a0: string) =>
      `L’appât a été pris · la coercition n’a commencé qu’alors, et elle a porté le site jusqu’à ${a0}`,
  },

  'diffusive-smoke': {
    released: (a0: number) =>
      `Fumée lâchée · ${a0} personnes dans un rayon de sept mètres la respirent, et chacune en émettra à son tour d’ici deux`,
  },

  solicitation: {
    alreadyHeld: (a0: string) =>
      `${a0} est déjà occupé · un seul corps à la fois, c’est tout ce qu’elle peut porter`,
    asked: (a0: string) =>
      `« ${a0}, tu es libre ? » · retouchez-le pour dire oui, ou touchez autre chose pour refuser à sa place`,
    saidYes: (a0: number, a1: string) =>
      `${a1} a dit oui · l’araignée est dans son oreille et le corps ne lui appartient plus · ${a0} autres se font encore solliciter`,
    exhausted: (a0: string) =>
      `${a0} n’avait plus d’aura à lui donner · l’araignée est partie en vitesse et il se retrouve lui-même`,
  },

  'room-isolation': {
    realRoom: (a0: string) =>
      `${a0} est la vraie pièce · elle reste exactement telle quelle, et tous les autres sont envoyés ailleurs`,
    inside: (a0: string) =>
      `${a0} est à l’intérieur · la barrière ne regarde que vers l’extérieur, alors sortir ne coûte rien`,
    emptyCopy: (a0: string, a1: number) =>
      `${a0} a voulu rejoindre la pièce et est entré dans une copie vide · ${a1} choses qui devraient y être n’y sont pas`,
  },

  'postmortem-curse': {
    target: (a0: string) =>
      `${a0} est la cible · trouvez maintenant quelque chose à lui, à garder et à brûler`,
    notConnected: (a0: string, a1: string) =>
      `${a1} n’a rien à voir avec ${a0} · on ne suspend pas une malédiction aux affaires d’un inconnu`,
    relic: (a0: string) =>
      `${a0} conservé comme objet lié · pensez à la cible chaque jour, et restez près d’elle`,
    wrongObject: (a0: string) => `Le rite s’accomplit sur la relique, pas sur ${a0}`,
    rite: (a0: string, a1: number, a2: number) =>
      `Rite ${a1}/5 · ${a2} px entre les cendres et ${a0}, et cette distance fait l’essentiel de la malédiction`,
    completed: (a0: string, a1: number, a2: boolean) =>
      `Cendres bues et dague utilisée · à ${a1} px, il faudra ${a2 ? 'des heures' : 'des mois'} pour achever ${a0}`,
    noAura: (a0: string) =>
      `${a0} n’a plus d’aura · celui qui a fait cela était mort depuis le début`,
  },
}
