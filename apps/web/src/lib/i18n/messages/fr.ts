import type { Messages } from './types'

/**
 * The French catalogue. Typed against `en`, so the compiler catches a key that
 * drifted or a plural helper that lost its argument.
 *
 * Proper nouns from the manga stay as the French edition prints them: Nen,
 * Hatsu, Black Whale, Kakin, Brigade fantôme, Association des Hunters.
 */
export const fr: Messages = {
  common: {
    search: 'Rechercher',
    clearSearch: 'Effacer la recherche',
    resetFilters: 'Réinitialiser les filtres',
    resetSearch: 'Réinitialiser la recherche',
    all: 'Tous',
    unknown: 'Inconnu',
    home: 'Accueil',
    close: 'Fermer',
    open: 'Ouvrir',
    chapterShort: (number) => `Chap. ${number}`,
    events: (count) => (count === 1 ? 'événement' : 'événements'),
    records: (count) => (count === 1 ? 'fiche' : 'fiches'),
    results: (visible, total) => `${visible} résultat${visible === 1 ? '' : 's'} sur ${total}`,
    intlLocale: 'fr-FR',
  },

  error: {
    backHome: 'Retour aux archives',
    reference: (status) => `Référence ${status}`,
    notFound: {
      title: 'Cette page ne figure pas aux archives',
      body: 'L’adresse ne correspond à rien de catalogué. Elle a pu être renommée, ou n’avoir jamais existé.',
    },
    rateLimited: {
      title: 'Trop de requêtes',
      body: 'Les archives limitent les écritures pour qu’un seul visiteur ne dépense pas tout le navire. Patientez un instant puis réessayez.',
    },
    server: {
      title: 'Les archives n’ont pas pu répondre',
      body: 'La panne est de notre côté, pas du vôtre. La requête n’a pas été enregistrée : réessayer est sans risque.',
    },
    generic: {
      title: 'Une erreur est survenue',
      body: 'La requête n’a pas pu aboutir.',
    },
  },

  seo: {
    siteTitle: 'Black Whale — Archives de la succession',
    siteDescription:
      'Une archive interactive de la guerre de succession de Hunter × Hunter : chaque passager, chaque pont, chaque faction, chaque pouvoir de Nen et chaque point de vue à bord du Black Whale.',
  },

  nav: {
    explore: 'Explorer',
    timeline: 'Chronologie',
    characters: 'Personnages',
    knowledge: 'Savoirs',
    abilityArchive: 'Archive des pouvoirs',
    comparePerspectives: 'Comparer les points de vue',
    factionNetwork: 'Réseau des factions',
    simulations: 'Simulations',
    virtualTour: 'Visite virtuelle',
    tourModes: 'Modes de la visite',
    shipSources: 'Sources du vaisseau',
    arena: 'Arène du Black Whale',
    reconstruction: 'Reconstruction vivante',
  },

  reconstruction: {
    seoTitle: 'Reconstruction vivante — Suivre la chronologie du Black Whale',
    seoDescription:
      'Parcourez le Black Whale reconstruit tandis que les présences canoniques connues évoluent au fil de la chronologie du manga.',
    breadcrumb: 'Reconstruction vivante',
    title: 'Reconstruction vivante',
    eyebrow: 'Atlas spatio-temporel canonique',
    intro:
      'Choisissez un moment du voyage, lisez sa géographie d’un regard, puis entrez dans la scène reconstruite.',
    viewLabel: 'Vue de la reconstruction',
    overview: 'Vue du navire',
    scene: 'Entrer dans la scène',
    timeline: 'Chronologie du voyage',
    searchEvents: 'Trouver un événement',
    searchPlaceholder: 'Chapitre, événement ou conséquence…',
    currentState: 'État reconstruit du Black Whale',
    loadErrorEyebrow: 'Reconstruction indisponible',
    loadErrorTitle: 'Les données temporelles n’ont pas pu être chargées',
    loadErrorBody:
      'La chronologie reste masquée pour éviter de présenter un navire vide comme une information canonique.',
    retry: 'Réessayer',
    technicalDetails: 'Détails techniques',
    sources: 'Sources et méthode',
    evidenceLevels: {
      attested: 'Attesté',
      derived: 'Dérivé',
      inferred: 'Inféré',
    },
    perspective: 'Point de vue',
    canonicalPerspective: 'Canon objectif',
    loadingPerspective: 'Reconstruction du savoir du personnage…',
    perspectiveUnavailable: 'Ce point de vue ne peut pas être reconstruit pour cet événement.',
    perspectiveSummary: (visible, facts, beliefs) =>
      `${visible} corps visible${visible === 1 ? '' : 's'} · ${facts} fait${facts === 1 ? '' : 's'} connu${facts === 1 ? '' : 's'} · ${beliefs} croyance${beliefs === 1 ? '' : 's'}`,
    event: 'Événement sélectionné',
    shipState: 'État connu du navire',
    exact: 'Pièce exacte',
    approximate: 'Zone ou pont',
    unlocated: 'Non localisés',
    showUnlocated: (count) =>
      `Afficher ${count} présence${count === 1 ? '' : 's'} non localisée${count === 1 ? '' : 's'}`,
    methodNote:
      'La carte montre les connaissances attestées, pas une omniscience inventée. Une position absente signifie inconnue, pas hors du navire.',
    legendActive: 'Dans cet événement',
    legendKnown: 'Confirmé',
    legendProbable: 'Probable',
    legendLastKnown: 'Dernière position',
    filters: 'Filtres de la carte',
    allPresences: 'Toutes les présences',
    changesOnly: 'Changements seuls',
    certaintyFilter: 'Filtrer par certitude',
    allCertainties: 'Toutes les certitudes',
    arrived: 'Arrivée',
    departed: 'Départ',
    changes: 'Depuis l’événement précédent',
    noChanges: 'Aucun changement spatial consigné.',
    changeLabels: {
      arrived: 'Localisé ici pour la première fois',
      moved: 'Déplacé',
      departed: 'N’est plus localisé',
      unchanged: 'Inchangé',
    },
    followCharacter: (name) => `Suivre ${name} au fil du voyage`,
    following: 'Personnage suivi',
    followCount: (count) =>
      `${count} point${count === 1 ? '' : 's'} de bascule consigné${count === 1 ? '' : 's'}`,
    previousTrace: 'Trace précédente',
    nextTrace: 'Trace suivante',
    hatsuLens: 'Lentille de Nen',
    noHatsu: 'Aucune technique ne lit la reconstruction.',
    chooseHatsu: 'Choisir un Hatsu',
    hatsuReadings: {
      future: (count) =>
        `${count} changement${count === 1 ? '' : 's'} spatial${count === 1 ? '' : 'ux'} sépare${count === 1 ? '' : 'nt'} cet état du précédent.`,
      trace: (name, change) =>
        `${name} · ${change === 'unchanged' ? 'aucune rupture spatiale à cet événement' : change}`,
      chooseTarget: 'Choisissez un passager sur la coupe pour lire sa trace temporelle.',
      characterTarget: 'Cette technique exige un corps. Choisissez un passager sur la coupe.',
      sceneTarget:
        'Choisissez un passager ou un élément reconstruit pour appliquer la technique localement.',
    },
    previous: 'Événement précédent',
    next: 'Événement suivant',
    play: 'Lire la chronologie',
    pause: 'Mettre la chronologie en pause',
    chooseScene: 'Choisir une scène',
    sceneLabel: (chapter, title, index) => `${index}. Chap. ${chapter} — ${title}`,
    characters: 'Personnages',
    noCharacters: 'Aucun personnage nommé n’est consigné pour cette scène.',
    watchCharacter: (name) => `Regarder ${name}`,
    unknownPosition: 'La position exacte de ce personnage est inconnue dans cette scène.',
    roles: {
      ACTIVE: 'actif',
      PASSIVE: 'présent',
      OBSERVER: 'témoin',
      VICTIM: 'victime',
      UNKNOWN: 'présent',
    },
    visible: (count) =>
      `${count} présence${count === 1 ? '' : 's'} connue${count === 1 ? '' : 's'}`,
    empty: 'Aucun événement du voyage n’est disponible avec cette limite de spoilers.',
    v3: {
      actionTypes: {
        MOVE_ENTITY: 'Déplacer une entité',
        SHARE_KNOWLEDGE: 'Partager une information',
        ACTIVATE_HATSU: 'Activer un Hatsu',
      },
    },
  },

  tour: {
    seoTitle: 'Visite virtuelle — Parcourir le Black Whale',
    seoDescription:
      'Une visite à la première personne du Black Whale reconstruit : cinq ponts, toutes les salles que les plans et le manga documentent, et tous les couloirs que la reconstruction a dû inventer, signalés comme tels.',
    title: 'Parcourir le Black Whale',
    modes: {
      seoTitle: 'Modes de la visite — Choisir son expérience du Black Whale',
      seoDescription:
        'Choisissez entre la visite libre, la table de Morena, la reconstruction vivante, l’infiltration, la traque, l’arène, l’investigation et la stratégie à bord du Black Whale.',
      eyebrow: 'Expériences du Black Whale',
      title: 'Choisissez votre mode',
      intro:
        'Toutes les expériences construites autour de la visite sont réunies ici. Explorez librement, suivez le canon dans le temps ou entrez dans un scénario jouable.',
      open: 'Entrer dans le mode',
      free: {
        title: 'Visite libre',
        tag: 'Exploration',
        description:
          'Parcourez le vaisseau reconstruit à votre rythme, de salle en salle et de pont en pont.',
      },
      morena: {
        title: 'Morena',
        tag: 'Jeu social',
        description:
          'Asseyez-vous à la table de Morena Prudo et jouez la partie qui décide qui peut rejoindre Heil-Ly.',
      },
      reconstruction: {
        title: 'Reconstruction vivante',
        tag: 'Canon',
        description:
          'Choisissez un moment du voyage et observez les présences connues se déplacer dans le vaisseau reconstruit.',
      },
      infiltration: {
        title: 'Infiltration',
        tag: 'Discrétion',
        description:
          'Traversez un territoire hostile, maîtrisez votre détection et atteignez l’objectif sans vous faire prendre.',
      },
      hunt: {
        title: 'Traque',
        tag: 'Poursuite',
        description:
          'Pistez une cible dans le vaisseau, gérez votre aura et survivez à la confrontation.',
      },
      arena: {
        title: 'Arène',
        tag: 'Combat',
        description: 'Disputez un duel de Nen déterministe dans une salle attestée du Black Whale.',
      },
      investigation: {
        title: 'Investigation',
        tag: 'Déduction',
        description:
          'Inspectez une scène de crime, confrontez les preuves et rendez un verdict argumenté.',
      },
      strategy: {
        title: 'Strategy',
        tag: 'Tactique',
        description:
          'Commandez une faction de la guerre de succession à travers huit tours de renseignement, de diplomatie et de conflits.',
      },
    },
    intro:
      "Le vaisseau comme architecture, pas comme décor : ni passagers, ni chapitre, ni chronologie. Chaque surface dit d'où elle vient — une planche, le plan des ponts, ou la reconstruction elle-même.",
    enter: 'Cliquez pour marcher',
    // Tab d'abord : c'est celle qui marche en plein écran, là où Échap libère le
    // pointeur et quitte le plein écran d'une seule touche.
    engaged: 'Tab pour libérer le pointeur — Échap le libère et quitte le plein écran',
    loading: 'Construction du pont…',
    unsupported:
      'Cette visite exige WebGL, que ce navigateur ne propose pas. Les plans des ponts restent accessibles sur la carte du vaisseau.',
    deck: 'Pont',
    decks: 'Ponts',
    rooms: 'Salles',
    currentRoom: 'Vous êtes dans',
    outside: 'Entre deux ponts',
    source: 'Source',
    noSource: 'Aucune source consignée',
    scale: (metres) =>
      `${metres.toLocaleString('fr-FR')} m de coque reconstruite, de la proue à la poupe`,
    counts: (spaces, decks, interiors) =>
      `${spaces} espaces reconstruits sur ${decks} ponts, dont ${interiors} intérieurs de pièces à leur propre échelle`,
    minimap: (deckName) => `Plan du ${deckName}`,
    jumpTo: 'Rejoindre un espace',
    takeLink: (destination) => `Appuyez sur E pour rejoindre ${destination} par l'escalier`,
    takeBulkhead: (destination) => `Appuyez sur E pour franchir la cloison vers ${destination}`,
    enterInterior: (destination) => `Appuyez sur E pour entrer dans ${destination}`,
    leaveInterior: (destination) => `Appuyez sur E pour ressortir vers ${destination}`,
    insideOf: (room) => `Intérieur de ${room}`,
    atFullSize: 'Dessiné à sa propre échelle',
    controls: {
      title: 'Commandes',
      move: 'Se déplacer',
      moveKeys: 'Z Q S D ou les flèches',
      look: 'Regarder',
      lookKeys: 'Bougez la souris, ou faites glisser sur écran tactile',
      sprint: 'Courir',
      sprintKeys: 'Maj',
      use: 'Changer de pont, entrer dans une pièce',
      useKeys: 'E, sur une cage d’escalier ou n’importe où dans un intérieur',
      plan: 'Plan plein écran',
      planKeys: 'M',
      find: 'Chercher une pièce',
      findKeys: '⌘K, ou Ctrl K',
      reveal: 'Montrer les preuves',
      revealKeys: 'G',
      fullscreen: 'Plein écran, panneau compris',
      fullscreenKeys: 'V',
      release: 'Rendre le pointeur à la page',
      releaseKeys: 'Tab — le plein écran est conservé, ce qu’Échap ne fait pas',
      nen: 'Lancer le Hatsu actif',
      nenKeys: 'F, ou un clic, sur la pièce ou le volume que vous regardez',
      nenSelf: 'Retourner le Hatsu actif sur soi',
      nenSelfKeys: 'R, où que porte le regard',
      nenSecond: 'Lancer la seconde page',
      nenSecondKeys: (name) => `R lance ${name}, celle que tient le marque-page`,
      nenMoon: 'Poser la lune plutôt que le soleil',
      nenMoonKeys: 'R marque de la lune, F du soleil',
      touch: 'Sur écran tactile',
      touchKeys:
        'Le manche en bas à gauche fait marcher, poussé à fond il fait courir ; glissez sur la vue pour regarder ; les boutons franchissent une porte et lancent',
    },
    /**
     * Le bouton qui fait taire la visite. La visite a sa propre voix — les pas, et
     * la salle qui leur répond — et l'intitulé dit ce que le bouton va faire,
     * non l'état dans lequel il se trouve.
     */
    sound: {
      silence: 'Couper le son de la visite',
      restore: 'Écouter la visite : les pas, et la salle qui leur répond',
    },
    touch: {
      hint: 'Glissez pour regarder · manche pour marcher',
      move: 'Manche de marche',
      cast: 'Lancer',
      takeLink: (destination) => `Rejoindre ${destination} par l'escalier`,
      takeBulkhead: (destination) => `Franchir la cloison vers ${destination}`,
      enterInterior: (destination) => `Entrer dans ${destination}`,
      leaveInterior: (destination) => `Ressortir vers ${destination}`,
    },
    provenance: {
      title: 'Ce qui est canon ici',
      panel: 'Montré sur une planche',
      plan: 'Sur le plan des ponts',
      map: 'Sur le plan /ship',
      inferred: 'Reconstruit',
      panelHelp: 'Un chapitre montre cette salle ; sa forme est relevée sur cette planche.',
      planHelp: "Elle figure sur la coupe du vaisseau, qui n'en donne pas l'intérieur.",
      mapHelp:
        "Aucune page du manga ne le montre. Le plan de salle de /ship le dessine, et la visite est ce plan à hauteur d'homme.",
      inferredHelp:
        'Rien ne la montre. Elle existe pour que le pont tienne debout, et sa lumière est froide pour que ça se voie.',
      scaleHelp:
        "Les plans des ponts sont schématiques. La reconstruction les met à l'échelle pour que les pièces fassent la taille que les planches impliquent — ce n'est pas une mesure du vaisseau.",
    },
    reveal: {
      toggle: 'Preuves',
      help: 'Peindre le pont selon ce que chaque surface vaut comme preuve, et montrer les cloisons et les portes que la reconstruction a déclarées.',
      blind: 'Cloison aveugle',
      blindHelp:
        'Deux pièces partagent ce mur et rien n’y passe. Le plan doit le dire, et dire pourquoi.',
      declared: 'Porte placée à la main',
      declaredHelp:
        'Toute autre ouverture du vaisseau découle de deux empreintes qui se touchent. Pas celles-ci.',
      none: 'Aucune à ce niveau.',
    },

    sourcesLink: "D'où vient chaque pièce",

    plan: {
      open: 'Plan plein écran',
      close: 'Fermer',
      crossingUp: (destination) => `Monter vers ${destination}`,
      crossingDown: (destination) => `Descendre vers ${destination}`,
      crossingAcross: (destination) => `Passer vers ${destination}`,
      legend: 'Sur le plan',
      doorway: 'Ouverture',
      up: 'Escalier montant',
      down: 'Escalier descendant',
      across: 'Porte de plain-pied',
    },

    find: {
      open: 'Chercher une pièce',
      title: 'Chercher une pièce ou un niveau',
      placeholder: 'Salle du banquet, 1004, cuisine, cellule…',
      showing: (shown, total) => `${shown} affichés sur ${total}`,
      noMatch: 'Rien de ce nom dans le vaisseau',
      level: 'Niveau',
      close: 'Échap',
      hint: '↑ ↓ pour choisir · Entrée pour y aller · Échap pour fermer',
    },

    goTo: (room) => `Rejoindre ${room}`,
    aimAt: (room) => `Viser ${room}`,

    viewpoint: {
      copy: 'Copier ce point de vue',
      copied: 'Lien copié',
      failed: "Impossible d'accéder au presse-papiers",
    },

    fullscreen: {
      enter: 'Plein écran',
      exit: 'Quitter le plein écran',
      hidePanel: 'Replier le panneau',
      showPanel: 'Rouvrir le panneau',
    },

    comfort: {
      title: 'Confort',
      fov: 'Champ de vision',
      sensitivity: 'Vitesse du regard',
      snapTurn: 'Tourner par crans',
      snapAngle: 'Cran',
      jumpOnly: 'Ne pas marcher — sauter de pièce en pièce',
      nightLight: 'Lumière que vous portez',
      nightLightOff: 'Éteinte — le vaisseau tel qu’il est éclairé',
      reset: 'Revenir aux réglages du système',
      calm: 'Votre système demande moins de mouvement : tout démarre en douceur.',
      degrees: (angle) => `${angle}°`,
      metres: (distance) => `${distance} m`,
      times: (factor) => `×${factor.toFixed(2)}`,
    },

    room: {
      size: (long, wide, ceiling) => `${long} × ${wide} m sous ${ceiling} m`,
      exits: (count) => `${count} ${count === 1 ? 'sortie' : 'sorties'}`,
      bare: 'rien de dessiné dedans',
      solids: {
        spring: (count) => `${count} ${count === 1 ? 'ressort' : 'ressorts'}`,
        casket: (count) => `${count} ${count === 1 ? 'cercueil' : 'cercueils'}`,
        platform: (count) => `${count} ${count === 1 ? 'estrade' : 'estrades'}`,
        counter: (count) => `${count} ${count === 1 ? 'comptoir' : 'comptoirs'}`,
        table: (count) => `${count} ${count === 1 ? 'table' : 'tables'}`,
        bed: (count) => `${count} ${count === 1 ? 'lit' : 'lits'}`,
        seat: (count) => `${count} ${count === 1 ? 'siège' : 'sièges'}`,
        cabinet: (count) => `${count} ${count === 1 ? 'meuble' : 'meubles'}`,
        basin: (count) => `${count} ${count === 1 ? 'vasque' : 'vasques'}`,
        painting: (count) => `${count} ${count === 1 ? 'toile' : 'toiles'}`,
        window: (count) => `${count} ${count === 1 ? 'baie' : 'baies'}`,
        lifeboat: (count) => `${count} ${count === 1 ? 'canot' : 'canots'}`,
        pillar: (count) => `${count} ${count === 1 ? 'pilier' : 'piliers'}`,
        bars: (count) => `${count} ${count === 1 ? 'grille' : 'grilles'}`,
        manacle: (count) => `${count} ${count === 1 ? 'entrave' : 'entraves'}`,
        camera: (count) => `${count} ${count === 1 ? 'caméra' : 'caméras'}`,
        telephone: (count) => `${count} ${count === 1 ? 'téléphone' : 'téléphones'}`,
        duct: (count) => `${count} ${count === 1 ? 'gaine' : 'gaines'}`,
        vent: (count) => `${count} ${count === 1 ? "bouche d'aération" : "bouches d'aération"}`,
      },
    },

    hatsu: {
      title: 'Le Nen dans la visite',
      reach: "N'importe quelle pièce du vaisseau, depuis n'importe où dans le vaisseau",
      aiming: (room) => `Face à ${room}`,
      aimingNothing: "Face à rien que l'aura puisse saisir",
      castHint: 'Ou choisissez ci-dessous une pièce du vaisseau',
      keys: {
        title: 'Commandes',
        click: 'clic',
        touch: 'Les boutons dans le coin de la visite',
        actions: {
          cast: 'Lancer sur la pièce que vous visez',
          castSolid: 'Lancer sur le volume que vous visez',
          castSelf: 'Lancer sur vous, où que vous visiez',
          castOnSelfInstead: 'Lancer sur vous plutôt que sur ce qui est devant vous',
          sun: 'Poser le soleil ☀',
          moon: 'Poser la lune ☾',
          alternate: 'Alterner le soleil ☀ et la lune ☾',
          openPage: 'Lancer la page ouverte',
          markedPage: 'Lancer la page que tient le marque-page',
          airDance: 'Jouer l’air vif',
          airBloom: 'Jouer l’air doux',
          airScatter: 'Jouer l’air aigu',
          doubleWatch: 'Changer la garde du double',
          owlFlight: 'Changer le hibou envoyé',
          insectOrders: 'Changer les ordres de l’insecte',
        },
      },
      inert: (name, carried) =>
        `${name} agit sur ce qu'une page dit, et la visite n'a que des pièces : il ne fait rien ici. ${carried} techniques répondent au vaisseau — Emperor Time, Blinky, les Portes de la planque et les autres.`,
      inertShort: 'Sans prise dans la visite',
      targets: 'Lancer sur une pièce',
      allDecks: 'Tout le vaisseau',
      holding: "Ce que l'aura retient",
      release: 'Rendre le vaisseau',
      nothingHeld: 'Rien pour l’instant',
      copy: 'Copie vide',
      copySource: "Un double vide de la pièce. Rien de ce qu'il contient n'est le vaisseau.",
      double: {
        watch: 'La garde du double',
        follow: 'À votre épaule',
        wander: 'Libre dans la pièce',
        scout: 'En éclaireur',
      },
      owl: {
        watch: 'Le vol du hibou',
        wander: 'Il parcourt le vaisseau',
        shoulder: 'Sur votre épaule',
        random: 'Lâché sans visée',
        left: (seconds) => `${seconds} s restantes`,
      },
      insect: {
        orders: 'L’insecte est',
        pilot: 'Piloté à la main',
        scout: 'En reconnaissance',
        film: 'En train de filmer',
      },
      tunes: {
        title: 'La flûte joue',
        hint: 'F, R et C · chaque air n’est entendu que par la pièce où vous êtes',
        dance: 'L’air vif',
        bloom: 'L’air doux',
        scatter: 'L’air aigu',
      },
      reports: {
        noTarget: 'Rien à portée sur quoi lancer',
        teleported: (room) => `Envoyé dans ${room} — vous n'avez pas choisi où vous tombiez`,
        doorArmed: (room) =>
          `Premier cadre installé dans ${room} · armez-en un second pour les relier`,
        doorsPaired: (a, b) =>
          `${a} et ${b} ne font plus qu'un seuil · entrez par l'un, ressortez par l'autre`,
        doorsRearmed: (room) => `L'ancienne paire est tombée · premier cadre installé dans ${room}`,
        phasingOn: 'Les murs ont cessé d’être des murs · traversez le vaisseau',
        phasingOff: 'De retour dans la géométrie · les murs tiennent à nouveau',
        eyeSent: (room) =>
          `La sphère est posée sur un hôte dans ${room} · son flux est dans le coin`,
        eyeRecalled: (rooms) =>
          `L'insecte est revenu près de vous · ${rooms} pièce${rooms === 1 ? '' : 's'} filmée${rooms === 1 ? '' : 's'}`,
        eyeModeChanged: (order) => `L'insecte a de nouveaux ordres · ${order}`,
        eyePiloted: (room) => `Piloté jusqu'à ${room} · le flux le suit`,
        eyeFlown: (room) => `L'insecte a pris une porte · il est dans ${room} maintenant`,
        eyeFilmed: (room, seen) =>
          `${room} enregistrée · ${seen} chose${seen === 1 ? '' : 's'} s'y tient${seen === 1 ? '' : 'nent'}`,
        sealedSight: 'Vue scellée · les ponts sont toujours là et vous ne les voyez plus',
        sealedHearing: "Ouïe scellée à son tour · le vaisseau s'est tu",
        sealedSpeech: 'Parole scellée aussi · la visite ne dira plus dans quelle pièce vous êtes',
        sealedReleased: 'Les trois libérés · la vue, l’ouïe et la parole reviennent',
        dowsed: (room, metres, decks) =>
          decks
            ? `${room} · à ${metres} m, ${decks} niveau${decks > 1 ? 'x' : ''} d'écart`
            : `${room} · à ${metres} m, sur ce niveau`,
        watching: (room) => `Une poupée de papier est dans ${room} et compte chaque arrivée`,
        isolatedInside: (room) =>
          `${room} est isolée autour de vous · vous pouvez sortir, et vous ne pourrez plus rentrer`,
        isolatedOutside: (room) => `${room} est isolée · d'ici vous n'atteindrez qu'une copie vide`,
        stripped: (room, count) =>
          count
            ? `${count} emprise${count > 1 ? 's' : ''} soufflée${count > 1 ? 's' : ''} sur ${room} · rien n'a été déplacé`
            : `Rien ne retenait ${room}`,
        laidOpen: (spaces, decks) =>
          `Toutes les catégories à 100 % · ${spaces} pièces sur ${decks} niveaux ouvertes d'un coup`,
        emptied: (room, structures) =>
          structures
            ? `${structures} volume${structures > 1 ? 's' : ''} aspiré${structures > 1 ? 's' : ''} hors de ${room}`
            : `${room} était déjà nue`,
        swallowed: (solid, held) =>
          `${solid} passe dans le sac · ${held} gardé${held === 1 ? '' : 's'}`,
        coughedUp: (solid, room, held) =>
          `${solid} ressort dans ${room} · ${held} restant${held === 1 ? '' : 's'} dans le sac`,
        bagEmpty: 'Le sac est vide · visez quelque chose pour l’aspirer',
        refused: (room) =>
          `Blinky refuse ${room} · du Nen la retient, et c'est ainsi que le piège se voit`,
        dispatched: (room) => `Un oiseau revient de ${room} avec ce sur quoi la pièce repose`,

        nothingToSteal: (room) => `Rien ne retient ${room} : il n'y a rien à y prendre`,
        takenIntoTheBook: (room, technique) =>
          `${technique} est dans le livre · ${room} est lâchée, car son propriétaire ne peut s'en servir tant qu'elle est tenue`,
        needsTwoPages: "Une page ne fait pas deux · prenez-en une seconde avant d'en marquer une",
        bookmarked: (technique) => `${technique} maintenue vive à côté de la page ouverte`,
        acquisitionFailed: (room) =>
          `${room} est passée sous la flèche · on n'y acquiert plus rien`,
        carded: (room, technique) =>
          `${technique} acquise en carte · ${room} la garde aussi, et la carte se dépense en la jouant`,
        notEligible: (room) =>
          `${room} n'est pas morte · seul ce qui a été tué transmet quelque chose`,
        inherited: (room, technique) =>
          `${room} a été tuée par ${technique}, et c'est cela qu'elle transmet`,
        drained: (room, technique) =>
          `${technique} arrachée à ${room} · plus rien n'atteint cette pièce tant que le livre ne la rend pas`,
        needsEmperorTime: "Le dauphin n'existe que pendant Emperor Time",
        nothingToLend: 'Le livre est vide · rien à expliquer, rien à prêter',
        lent: (technique) =>
          `${technique} expliquée et ouverte · le prochain lancer consomme le prêt`,
        pageSpent: (technique) => `${technique} est dépensée`,
        inZetsu: (room) => `${room} n'a plus d'aura à offrir · la chaîne l'a drainée`,
        owlAttached: (rooms) =>
          `Le hibou vous suit · ${rooms} pièce${rooms === 1 ? '' : 's'} déjà sur le fil, et il les garde`,
        owlRecalled: (rooms) =>
          `Le hibou est rappelé · ${rooms} gardées quand même, comme toujours`,
        foreseen: (room) => `Dix secondes plus tard : ${room} · la vision ne se corrige pas`,
        diverged: (room, went) =>
          `La prédiction dit toujours ${room} ; vous êtes allé dans ${went}`,
        written: (room) => `La plume a écrit ${room}`,
        lineTaken: (room, lines) => `${room} retenue · vers ${lines} sur 3`,
        poemRead: (strength) =>
          strength
            ? `Les trois se lisent comme une route · ${strength} d'entre elles se touchent vraiment, et ça porte`
            : `Trois vers qui ne se rejoignent pas · ça vous portera, et mal`,
        dialSet: (room) => `Le cadran est réglé sur ${room}`,
        dialRead: (room, reading) => `${room} · relevé ${reading}`,
        dropletSent: (room, metres) =>
          `Une goutte a trouvé ${room}, à ${metres} m — là où la visite n'est jamais allée`,
        dropletsDry: 'Chaque pièce a été foulée · il ne reste rien à chercher',
        dropletExpired: (room) => `La goutte sur ${room} s'est asséchée`,
        nameTaken: (room) => `${room} porte le nom du chat · tuez-la et elle répond`,
        counterattack: (room, released) =>
          `${room} a été tuée, et a répondu · ${released} emprise${released === 1 ? '' : 's'} arrachée${released === 1 ? '' : 's'} à qui l'a fait`,
        markedVictim: (room) =>
          `${room} est marquée · le sacrifice a été choisi parmi les siens et vous est caché`,
        sacrificeFound: (room) => `Le sacrifice est dans ${room}`,
        curseFell: (victim, sacrifice) =>
          `Le sacrifice a été consommé dans ${sacrifice} · ${victim} s'en va avec lui`,
        soulsSwapped: (a, b) =>
          `${a} et ${b} se sont réveillées l'une dans l'autre · les deux murs sont restés`,
        arrowDrawn: (room) => `L'arc est bandé sur ${room} · frappez-en une seconde`,
        reinforced: (committed) =>
          `Aura engagée · ${committed} sur 6 · vous allez plus loin et plus vite`,
        boarded: 'Embarqué · chargez-en cinq, et ce sont eux le carburant',
        alighted: (room, passengers) =>
          passengers ? `Posé dans ${room} · ${passengers} déposés avec vous` : `Posé dans ${room}`,
        loaded: (solid, passengers) => `${solid} à bord · ${passengers} sur 5`,
        holdFull: 'La soute en prend cinq, et elle en a cinq',
        projected: (room) => `Le corps reste dans ${room} · le double continue sans lui`,
        returned: (room) => `De retour dans le corps, dans ${room}`,
        bodyDisturbed: (room) =>
          `Quelque chose a atteint le corps dans ${room} · vous y êtes rappelé`,
        reshaped: (metres) => `Yeux à ${metres.toFixed(2)} m · la forme a changé, et rien dessous`,
        rested: (hours) => `${hours} heures de repos en un soin court · la fatigue est tombée`,
        mended: (room, solids) =>
          solids
            ? `${solids} réparé${solids > 1 ? 's' : ''}${room ? ` dans ${room}` : ' dans tout le vaisseau'}`
            : `Rien n'était abîmé ici`,
        dancePlayed: (bars) => `Le prologue, mesure ${bars} · la musique porte tout le reste`,
        danceNeeded: 'Pas encore de musique · jouez d’abord le prologue',
        mimicked: (solid) => `Vous êtes ${solid}, pour l'œil`,
        unmimicked: 'Votre propre forme à nouveau',
        soothed: (opened) =>
          opened ? 'Les trois se rouvrent, et la musique les tient ouverts' : 'La musique continue',
        tunePlayed: (air, room, on, solids) => {
          if (!on) return `${air} s'achève · ${room} redevient ce qu'elle était`
          return solids
            ? `${air} dans ${room} · ${solids} chose${solids === 1 ? '' : 's'} l'ont prise et se sont mises à danser`
            : `${air} dans ${room} · la pièce l'a entendu et l'a gardé`
        },
        // Les bêtes de Nen gardiennes. Chacune dit ce que son animal a fait,
        // jamais qu'un animal est apparu : le visiteur l'a sous les yeux.
        beastRaised: (room, solids) =>
          solids
            ? `La bête est suspendue au-dessus de ${room} · ${solids} chose${solids === 1 ? '' : 's'} décollée${solids === 1 ? '' : 's'} du pont et qui tourne${solids === 1 ? '' : 'nt'}`
            : `La bête est suspendue au-dessus de ${room} · rien à soulever`,
        beastDismissed: (room, solids) =>
          solids
            ? `La bête lâche ${room} · ${solids} chose${solids === 1 ? '' : 's'} de retour au sol`
            : `La bête lâche ${room}`,
        wheelRaised: (room, coin) =>
          `La roue tourne au-dessus de ${room} · une pièce de ${coin} à sa bouche, et qui ne vaut rien tant que personne ne la prend`,
        wheelDismissed: (room) => `La roue quitte ${room}, la pièce avec`,
        coinTaken: (value, gilded) =>
          `Prise : ${value} · vous en portez ${gilded} désormais, et la suivante vaudra dix fois celle-ci`,
        liePushed: (solid, metres) =>
          metres
            ? `Premier contact · ${solid} est poussé, et marqué pour un deuxième`
            : `Premier contact · ${solid} n'avait nulle part où être poussé, et est marqué quand même`,
        lieGreened: (solid) => `Deuxième contact · le vert est dans ${solid} et y reste`,
        lieTransformed: (solid) =>
          `Troisième contact · quoi que ce soit qui se tienne là, ce n'est plus ${solid}`,
        gasLoosed: (room, solids) =>
          solids
            ? `La bête est accroupie dans ${room} · ${solids} chose${solids === 1 ? '' : 's'} dans le gaz avec elle`
            : `La bête est accroupie dans ${room} · rien à y prendre`,
        gasLifted: (room) => `La bête quitte ${room} · ce qu'elle avait déjà pris, elle le garde`,
        melted: (room, melting, gone) =>
          gone
            ? `${gone} disparu${gone === 1 ? '' : 's'} dans ${room}, ${melting} encore en train de fondre`
            : `${melting} en train de fondre dans ${room}`,
        roomBrightened: (room, levied) =>
          levied
            ? `${levied} prélevés sur vous, et ${room} en est éclairée`
            : `${room} est éclairée · vous n'aviez rien engagé, et cela vous est rendu quand même`,
        haloRaised: (levied, halo) =>
          `La pièce est déjà claire, alors cela va sur vous : ${levied} prélevés, ${halo} portés`,
        reeled: (pulled, eaten) =>
          eaten
            ? `${eaten} vous ${eaten === 1 ? 'a atteint et a' : 'ont atteint et ont'} été avalé${eaten === 1 ? '' : 's'}${pulled ? ` · ${pulled} encore en chemin` : ''}`
            : `${pulled} chose${pulled === 1 ? '' : 's'} traînée${pulled === 1 ? '' : 's'} vers vous`,
        smokeLoosed: (room) =>
          `Toutes ses bouches s'ouvrent · ${room} commence à se remplir, une couleur à la fois`,
        smokeLifted: (room, filled) => `La bête quitte ${room} · elle en était à ${filled} parts`,
        smokeSpread: (room, filled, full) =>
          full
            ? `${room} est pleine · les bouches se ferment`
            : `${room} prend une part de plus · ${filled} dedans à présent`,
        flockLoosed: (rooms, beasts) =>
          `${beasts} d'entre elles, sur ${rooms} pièces · elles ne restent pas dans les pièces`,
        flockCalledIn: (rooms) => `Rappelées de ${rooms} pièces · le vaisseau se tait`,
        isolationLifted: (room) => `La bête s'écarte de la porte · ${room} vous laisse sortir`,
        crushedOne: (solid, left) =>
          left
            ? `${solid} passe sous ses pattes · ${left} restant${left === 1 ? '' : 's'} dans la pièce`
            : `${solid} passe sous ses pattes · plus rien debout`,

        deduced: (what, strength) =>
          `Condition lue — ${what} · ${strength} nommées, et plus fort à chacune`,
        nothingToDeduce: 'Plus rien à lire : chaque emprise a été nommée',
        armourWorn:
          "L'emballage est en place · ce que le vaisseau vous fera désormais y sera gardé, pas annulé",
        armourHolding: (packed) =>
          packed
            ? `L'emballage garde ${packed} coup${packed === 1 ? '' : 's'} · rien ne revient avant que le soleil ne se lève dessus`
            : "L'emballage ne garde encore rien · allez au-devant de ce que l'aura a dressé contre vous",
        packedAway: (room, packed) =>
          `${room} ne vous a rien fait : c'est parti dans l'emballage · ${packed} coup${packed === 1 ? '' : 's'} gardé${packed === 1 ? '' : 's'}`,
        sunRisen: (metres, solids) =>
          `Le soleil s'est levé là où vous êtes · ${metres} m de rayon, et ${solids} élément${solids === 1 ? '' : 's'} carbonisé${solids === 1 ? '' : 's'} sans égard pour à qui ils étaient`,
        jailed: (room, doors) => `${room} est enchaînée · ${doors} accès, et aucun qui s'ouvre`,
        jailRefused: (room) =>
          `Rien ne retient ${room} · la chaîne est pour ce que le Nen habite déjà`,
        fishLoosed: (room) =>
          `Les poissons sont dans ${room} · rien ne se verra tant que vous y êtes`,
        fishFed: (room, solid) =>
          `${solid} n'était plus là quand vous avez regardé ${room} en repartant`,
        guardsPosted: (room) => `Gardes sur ${room} · un intrus est mis dehors, pas blessé`,
        expelled: (room, back) => `Mis dehors de ${room}, renvoyé dans ${back}`,
        cardBlue: (room) => `Bleu : ${room} est admise, et avertie`,
        cardYellow: (room) => `Jaune : ${room} vous retient où vous êtes`,
        cardRed: (room) => `Rouge : ${room} est congédiée et close derrière vous`,
        vowDeclared: (room) => `La règle est posée : vous n'entrerez pas dans ${room}`,
        vowBroken: (room) =>
          `Vous êtes entré dans ${room} en le sachant · la chaîne prend l'aura pour cela`,
        pactTaken: (room) => `Les termes sont pris : atteindre ${room}`,
        pactMet: (room, released) =>
          released
            ? `${room} atteinte · le contrat se referme et lâche ${released} emprise${released === 1 ? '' : 's'}`
            : `${room} atteinte · le contrat se referme sans rien devoir`,
        baitSet: (room) => `Ce que vous vouliez se dresse dans ${room}`,
        trapped: (room) => `Vous l'avez pris · ${room} ne vous laisse plus ressortir`,
        heldFast: (room) => `${room} ne vous laisse pas partir`,
        snakesLoosed: (rooms) =>
          `Quatre serpents, ${rooms} pièces à portée · il faut entrer dans l'une d'elles`,
        snakesFed: (room) => `La malédiction a trouvé sa victime dans ${room}`,
        snakesRebound: "Congédiée sans victime · la malédiction revient sur qui l'a posée",
        puppeted: (solid) => `L'antenne est plantée · ${solid} est maintenant sous contrôle`,
        puppetReleased: (solid) => `L'antenne est retirée · ${solid} n'est plus contrôlé`,
        autopilotStarted:
          'Pilote automatique activé · le corps avance seul pour accomplir la tâche',
        wormSet: (room) => `Une extrémité du tunnel dans ${room} · désignez l'autre`,
        wormOpen: (a, b) =>
          `${a} et ${b} font une route d'une nuit, et elle est faite pour être prise une fois`,
        wormCrossed: (room, crossings) =>
          `Ressorti dans ${room} · passage ${crossings} sur 3, et le ver s'épuise`,
        wormSpent: "Le tunnel s'effondre · il n'était pas fait pour être demandé trois fois",
        doublePosted: (room) => `Le double se tient dans ${room}, auprès de qui reste`,
        doubleSpent: (room) => `Le double a pris le coup à votre place, et a quitté ${room}`,
        doubleModeChanged: (watch) => `Le double change de garde · ${watch}`,
        owlModeChanged: (flight) => `Le hibou est lâché autrement · ${flight}`,
        owlFlown: (room) => `Le hibou a pris une porte · il est dans ${room} désormais`,
        owlExpired: (rooms) =>
          `Le hibou s'est dématérialisé · ses dix dernières secondes, sur ${rooms} pièce${rooms === 1 ? '' : 's'}, passent dans le coin`,
        noSolid: 'Rien de solide dans le réticule',
        boundFast: (solid) => `${solid} est tenu ferme · seule la couture le rend`,
        gumSet: (solid) => `Gomme sur ${solid} · saisissez un second volume pour les rapprocher`,
        gumPulled: (solid, other) => `${solid} a claqué jusqu'à ${other}`,
        gumTrapSet: (room) =>
          `Gomme tendue en travers de ${room} · rien ne la montre hors du Gyo, et elle y reste`,
        gumRebound: (room) =>
          `${room} vous a renvoyé d'où vous veniez · la gomme a cédé, puis elle a repris`,
        gumPropulsion: 'La gomme vous tire · vous parcourez le vaisseau plus vite que vos jambes',
        gumHealed: (healed) =>
          `La gomme referme ce qui était ouvert · ${healed} coup${healed === 1 ? '' : 's'} sorti${healed === 1 ? '' : 's'} de l'armure`,
        forged: (solid) =>
          `${solid} porte une autre surface · ce qu'il est, et ce qu'il arrête, n'ont pas changé`,
        wrapped: (solid) => `${solid} emballé, réduit · rien n'y est abîmé`,
        unwrapped: (solid) => `${solid} ressort du tissu, à sa taille`,
        pushed: (solid, metres) =>
          metres
            ? `${solid} poussé de ${metres} m · c'est une chose, elle se déplace comme telle`
            : `${solid} bute contre le mur de sa pièce et n'ira pas plus loin`,
        stamped: (solid, puppets) =>
          `人 sur ${solid} · ${puppets}/20 pantins · reclique dessus pour le verrouiller`,
        stampLocked: (solid, locked, locks) =>
          locked
            ? `${solid} verrouillé · ${locks} pantin${locks === 1 ? '' : 's'} entendra le prochain ordre`
            : `${solid} déverrouillé · il n'entend plus rien jusqu'à ce qu'on le reverrouille`,
        ordered: (room, puppets) =>
          `« Allez en ${room} » · assez simple pour que les ${puppets} pantin${puppets === 1 ? '' : 's'} verrouillé${puppets === 1 ? '' : 's'} le suive${puppets === 1 ? '' : 'nt'}`,
        noLock: (stamped) =>
          stamped
            ? `Aucun des ${stamped} pantins n'est verrouillé · l'ordre n'est adressé à personne`
            : `Rien n'est marqué · l'ordre n'est adressé à personne`,
        copied: (solid) =>
          `Une copie de ${solid} se dresse à côté · elle est froide, car aucune planche ne la soutient`,
        crushed: (solid) => `${solid} est aplati sous la masse`,
        volley: (solid, hits) => `${solid} repoussé · rafale ${hits} sur 3`,
        shattered: (solid) => `${solid} ne tient plus debout`,
        woundUp: (turns) =>
          `${turns} rotation${turns > 1 ? 's' : ''} enroulée${turns > 1 ? 's' : ''} dans le prochain coup`,
        launched: (solid, metres) =>
          metres ? `${solid} projeté à ${metres} m` : `${solid} n'avait nulle part où aller`,
        struck: (solid) => `Le bâton s'abat sur ${solid} et le fait pivoter`,
        lashed: (solid, hits) =>
          hits > 1
            ? `La chaîne claque sur ${solid} · ${hits} fois maintenant`
            : `La chaîne claque sur ${solid} et revient`,
        bound: (solid) => `Le serpent tient ${solid} · plus rien d'autre ne le bouge`,
        released: (solid) => `${solid} est relâché`,
        armsFull: (solids) =>
          `Les deux serpents sont sortis · ils tiennent ${solids}, et vous n'avez que deux bras`,
        cameUpUnder: (solid, other) =>
          `L'aura a couru depuis ${solid} le long du sol et a resurgi sous ${other}`,
        cameUpEmpty: (room) => `L'aura a couru le long du sol et a jailli du pont dans ${room}`,
        stitched: (solid) => `${solid} est revenu tel que le plan le donne`,
        nothingToStitch: (solid) => `Rien n'avait été fait à ${solid}`,
        animated: (solid) => `${solid} s'est éveillé, et n'en est pas moins solide`,
        shredStuck: (solid) =>
          `Le confetti se fiche dans ${solid} · toutes les volées y convergeront`,
        shredCut: (solid, left) => `${solid} est taillé à ${left} % de lui-même`,
        hammered: (solid) => `Le bras était un marteau · ${solid} est enfoncé dans le pont`,
        bored: (solid) =>
          `Le bras était une perceuse · un trou traverse ${solid}, et il se franchit`,
        halved: (solid, apart) =>
          apart
            ? `Le bras était une hache · ${solid} est en deux morceaux, côte à côte`
            : `Le bras était une hache · ${solid} est en deux morceaux, sans place où poser le second`,
        grown: (solid) => `${solid} a grossi hors de toute proportion`,
        growthRefused: (solid) => `${solid} bouge à peine · du Nen l'habite déjà`,
        marked: (solid, sun) => `${sun ? '☀' : '☾'} sur ${solid}`,
        detonated: (solid, other) =>
          `${solid} et ${other} se sont rejoints, il ne reste ni l'un ni l'autre`,
        swapped: (solid, other) =>
          `${solid} et ${other} ont échangé leur apparence, et rien d'autre`,
        cargoTaken: (solid) => `${solid} est chargé · désignez le relais de sortie`,
        cargoLanded: (solid, room) => `${solid} se dresse dans ${room}`,
      },
      body: {
        reach: 'Elle agit sur vous, où que vous soyez dans le vaisseau',
        castHint: 'La cible, c’est vous : il n’y a rien à choisir dans le vaisseau.',
        noTarget: 'Rien à viser : la cible, c’est vous',
      },
      solids: {
        reach: "N'importe quel volume du vaisseau, depuis n'importe où dans le vaisseau",
        castHint: 'Ou choisissez ci-dessous un volume du vaisseau',
        aiming: (solid) => `Face à ${solid}`,
        aimingNothing: 'Rien de solide devant vous',
        targets: 'Lancer sur un volume',
        relayTargets: 'Désignez le relais de sortie',
        pairing: (solid) => `Tient ${solid}`,
        of: (solid, room) => `${solid} — ${room}`,
        copy: 'copie',
      },
      verse: {
        provenance: [
          'Une planche la soutient, et la planche ne cille pas.',
          "La coupe en atteste, et n'en montre pas l'intérieur.",
          'Seule la main de cette archive la dessine.',
          'Rien ne la dessine. Elle tient pour que le pont tienne.',
        ],
        ways: [
          "Aucun chemin n'y mène. Elle attend qu'on l'atteigne.",
          'Un seuil, et tout passe par lui.',
          'Peu de portes, et chacune choisie.',
          "Beaucoup d'accès, et aucun qui soit calme.",
        ],
        standing: [
          "Rien ne s'y dresse. C'est cela, l'affirmation.",
          "Peu s'y dresse, et c'est ce que la pièce est.",
          "Ce qui s'y dresse la remplit avant vous.",
          'Vous contournerez plus que vous ne traverserez.',
        ],
        level: [
          "Au-dessus, quelqu'un dort encore.",
          'En dessous, les ressorts portent la masse.',
          "La coque est plus proche qu'il n'y paraît.",
          "Ce n'est pas le pont qui décide de celle-ci.",
        ],
      },
      book: {
        title: 'Le livre',
        cast: 'Lancer cette page',
        hint: 'Une page se lance là où vous visez, comme le reste',
        card: 'carte',
        loan: 'prêt',
        bothLive: 'Le livre est ouvert sur deux',
        bothHint: 'F lance la page ouverte · R celle que tient le marque-page',
        turn: 'Déplacer le marque-page',
      },
      holds: {
        book: 'Dans le livre',
        openPage: 'Ouvert sur',
        bookmark: 'Tenue à côté',
        hand: 'Cartes en main',
        zetsu: 'Drainée',
        loan: 'Prêtée',
        trail: 'Le fil',
        owl: 'Le hibou garde',
        film: 'Le film rapporté',
        foreseen: 'Dix secondes plus tard',
        verses: 'Écrites',
        poem: 'Le poème',
        dial: 'Le cadran lit',
        droplets: 'Gouttes en chasse',
        ninelives: 'Le nom du chat sur',
        curse: 'Marquée',
        souls: 'Réveillée en',
        enhance: 'Aura engagée',
        riding: 'À bord',
        eyes: 'Yeux à',
        projected: 'Le corps est dans',
        dance: 'Le prologue',
        mimic: 'Sous la forme de',
        soothed: 'La musique tient',
        playing: 'La flûte joue',
        flowered: 'En fleurs',
        scattered: 'Notes en suspens dans',
        dancing: 'Dansent',
        medusa: 'La bête tient',
        chimera: 'La bête est près de',
        toad: 'Le gaz est dans',
        centipede: 'La sécrétion est dans',
        cat: 'Le chat est dans',
        dragon: 'La porte de',
        wheel: 'La roue tourne au-dessus de',
        smoke: 'Se remplit',
        menagerie: 'Pièces où elles courent',
        lit: 'Éclairée',
        gilded: 'Pièces gardées',
        halo: 'La bulle',
        deduced: 'Conditions lues',
        packed: "L'emballage garde",
        packedHits: (packed) => `${packed} coup${packed === 1 ? '' : 's'}`,
        shut: 'Enchaînée',
        guarded: 'Gardée',
        pinned: 'Retenu dans',
        vow: 'La règle',
        pact: 'Les termes',
        devouring: 'Les poissons sont dans',
        cards: 'Cartes posées',
        double: 'Le double',
        worm: 'Le tunnel',
        snakes: 'Serpents lâchés dans',
        trap: "L'appât est dans",
        gumTrap: 'Gomme tendue en travers de',
        crossings: (n) => `${n} passages sur 3`,
        solid: 'Volumes retenus',
        wound: 'Le confetti est dans',
        windup: (turns) =>
          `${turns} rotation${turns === 1 ? '' : 's'} enroulée${turns === 1 ? '' : 's'}`,
        laidOpen: 'Tout le vaisseau, ouvert',
        isolated: 'Pièce isolée',
        doors: 'Portes de la planque',
        eye: 'Œil déporté',
        eyeFilm: "Ce que l'insecte a filmé",
        watched: 'Poupées de papier',
        emptied: 'Aspiré',
        dowsing: 'Le pendule désigne',
        phasing: 'Traversée des murs',
        sealed: 'Sens scellés',
        dispatches: 'Dépêches',
        visits: (count) => `${count} arrivée${count === 1 ? '' : 's'}`,
        armed: 'armé',
      },
    },
    morena: {
      seoTitle: 'Le jeu de Morena — La table de négociation à bord du Black Whale',
      seoDescription:
        'Asseyez-vous en face de Morena Prudo dans la planque des Heil-Ly et jouez la partie de négociation à douze cartes qu’elle impose à Borksen aux chap. 407-410 : sept questions contre cinq réponses, dont une marquée.',
      breadcrumb: 'Le jeu de Morena',
      title: 'Le jeu de Morena',
      intro:
        'Les chap. 407-410 assoient Borksen dans le bureau du chef de la planque Heil-Ly et étalent douze cartes entre elles. Sept sont des questions, et elles sont à Morena. Cinq sont des réponses, et elles sont à vous. Vous dépensez une question par tour pour savoir à quoi vous consentez ; elle retire une réponse par tour, au hasard. Ce qui reste quand les questions s’épuisent est la réponse que vous avez donnée.',
      source:
        'Chap. 407-410 — la partie de négociation, ses douze cartes, le baiser échangé contre une carte du cimetière, et la carte que Morena a marquée avant de distribuer.',
      seat: 'La pièce est la planque que dessinent les plans de pont. La table, et la chaise de chaque côté, sont ce que les chapitres y mettent.',
      loading: 'Mise en place de la table…',
      unsupported:
        'Cette table demande WebGL, que ce navigateur ne propose pas. Les règles ci-dessous sont tout le jeu et se lisent sans lui.',

      menu: {
        play: 'S’asseoir',
        rules: 'Lire les règles',
        back: 'Revenir à la table',
        leave: 'Quitter la table',
        deck: 'La donne',
        marked: 'Telle qu’elle distribue — une carte marquée',
        markedNote:
          'Morena triche. Une de vos cinq réponses est marquée avant de vous parvenir, et y porter la main à la fin est ce qui laisse entrer la composante manipulatrice de Contagion.',
        clean: 'Une donne propre — rien de marqué',
        cleanNote:
          'Les mêmes douze cartes sans le marquage : le jeu tel qu’il serait si la restriction était tenue. Une main qu’elle n’a jamais jouée.',
        walk: 'Visiter la planque plutôt',
      },

      table: {
        fan: 'Ses questions',
        asked: 'Posées',
        hand: 'Vos réponses',
        graveyard: 'Cimetière',
        empty: 'Rien pour l’instant',
        markedCard: 'Marquée',
      },

      round: (spent, left) =>
        `Tour ${spent + 1} — ${left} réponse${left === 1 ? '' : 's'} encore en main`,
      askTitle: 'Dépenser une question',
      askHint: 'Elle y répond, puis elle prend une de vos cartes. Vous ne choisissez pas laquelle.',
      askedLabel: 'Vous demandez',
      answerLabel: 'Elle répond',

      // La table jouée à la main : ce que ferait la carte visée si on la
      // prenait. Chacun de ces gestes est un coup que le panneau propose aussi —
      // la salle est une seconde paire de mains sur la même partie.
      scarlet: {
        watching: 'Elle vous regarde la dépenser',
      },

      reach: {
        hint: 'Visez une carte et cliquez.',
        cast: (effect: string) => `F — ${effect}`,
        castSecond: (effect: string) => `R — ${effect}`,
        ask: (question: string) => `Demander — ${question}`,
        kiss: (card: string) => `L’embrasser, et reprendre le ${card}`,
        decline: 'Refuser le baiser, et jouer la main que vous avez',
        point: (card: string) => `Pointer le Joker sur ${card}`,
        reachFor: (card: string) => `Aller chercher le ${card} dans la défausse`,
        play: (card: string) => `Poser le ${card}`,
      },

      questions: {
        goal: {
          title: 'Qu’est-ce que vous voulez, au fond ?',
          short: 'But',
          morena:
            'Un monde où personne n’est le sujet de personne. Je suis née d’une maîtresse du roi et je n’ai été rien de toute ma vie. Je compte démonter le trône et distribuer ce qu’il y a dedans.',
        },
        power: {
          title: 'Qu’est-ce que vous mettriez en moi ?',
          short: 'Pouvoir',
          morena:
            'Contagion. Vingt-deux d’entre vous au maximum, et je sais où est chacun, comment il va et ce qu’il vaut. Vous montez d’un niveau par vie prise. Dix pour un utilisateur de Nen. Cinquante pour un prince.',
        },
        'if-yes': {
          title: 'Qu’est-ce qui se passe si je dis oui ?',
          short: 'Si oui',
          morena:
            'Je vous embrasse, puis vous me regardez tuer quelqu’un. Tant que ces deux choses ne sont pas faites vous êtes niveau zéro et vous n’êtes rien. Après elles vous êtes à moi, et au niveau vingt vous recevez un pouvoir que personne d’autre au monde n’a.',
        },
        'if-no': {
          title: 'Qu’est-ce qui se passe si je dis non ?',
          short: 'Si non',
          morena:
            'Vous sortez. Le jeu est ma restriction et je perdrais le pouvoir en la brisant : un non me coûte et ne vous coûte rien. C’est la moitié honnête de tout ceci, et c’est la seule.',
        },
        contract: {
          title: 'Qu’est-ce qui vous engage, vous ?',
          short: 'Contrat',
          morena:
            'Le jeu lui-même. Il finit quand l’une de nous meurt ou quand la dernière carte tombe, et d’ici là je ne peux pas vous toucher. C’est tout le contrat. Vous l’avez en main.',
        },
        origin: {
          title: 'D’où venez-vous ?',
          short: 'Origine',
          morena:
            'D’un lit illégitime, dans une famille qui avait un usage pour moi et pas de nom à me donner. Membre Zéro est un titre que j’ai inventé, parce que personne ne m’en avait donné non plus.',
        },
        price: {
          title: 'Qu’est-ce que je vaux pour vous ?',
          short: 'Prix',
          morena:
            'Vous êtes soldate, Hunter, et Spécialiste sans le savoir encore. Vous valez plus que les quatre dernières personnes assises là réunies — c’est pour ça que vous obtenez des réponses et qu’elles n’ont eu qu’un baiser.',
        },
      },

      cards: {
        yes: {
          name: 'Oui',
          rule: 'Le contrat. Contagion, et niveau zéro tant que vous n’avez pas tué.',
        },
        no: {
          name: 'Non',
          rule: 'Le refus. Elle l’honore : le jeu est sa propre restriction.',
        },
        back: {
          name: 'Retour',
          rule: 'Pas une réponse. Va chercher une carte dans le cimetière et la ressort.',
        },
        joker: {
          name: 'Joker',
          rule: 'Devient Oui ou Non, décidé à l’instant où on le pose.',
        },
        x: { name: 'X', rule: 'Annule la négociation. Aucune des deux n’obtient rien.' },
      },

      deal: {
        title: 'Elle se penche par-dessus la table',
        body: 'Un baiser, et vous reprenez la carte de votre choix dans le cimetière. Elle ne précise pas que le baiser est à lui seul l’une des trois conditions de Contagion. Il l’est.',
        take: 'Accepter le marché',
        refuse: 'Refuser',
        pick: 'Et reprendre',
      },

      settle: {
        title: 'Une carte restante',
        play: 'La jouer',
        joker: 'Orienter le Joker',
        jokerHint: 'Il est celui des deux que vous dites qu’il est.',
        back: 'Aller dans le cimetière',
        backHint: 'Ce que vous en sortez est la réponse que vous avez donnée.',
        backEmpty: 'Il n’y a rien à reprendre dans le cimetière.',
      },

      verdicts: {
        infected: {
          title: 'Oui',
          body: 'Vous l’avez dit, et vous l’avez dit en sachant ce que c’était. Contagion, niveau zéro — une sur vingt-deux, et elle vous sent où que vous soyez sur le vaisseau.',
        },
        refused: {
          title: 'Non',
          body: 'Elle se rassoit et vous laisse vous lever. Le jeu était sa restriction et elle la tient : la briser lui coûterait le pouvoir, et le pouvoir est tout ce qu’elle a.',
        },
        cancelled: {
          title: 'X',
          body: 'La négociation est annulée. Pas de contrat, pas d’infection, et pas de réponse — le seul résultat que la table ne peut pas lui donner.',
        },
        forced: {
          title: 'Oui — et vous ne l’avez pas dit',
          body: 'Vous avez porté la main sur la carte qu’elle avait marquée avant de distribuer. Le marquage est la triche, et la triche est ce qui laisse entrer la composante manipulatrice de Contagion : la réponse est réduite à Oui ou Non, et c’est elle qui choisit.',
        },
      },

      hatsu: {
        title: 'L’aura que vous avez en main',
        none: 'Rien en main. Prenez une technique dans le dock Nen et rasseyez-vous — certaines ont beaucoup à dire à douze cartes.',
        useless: (name) =>
          `${name} n’a rien à faire à une table de cartes. Le dock vous donnera autre chose.`,
        sealed:
          'Une main est en cours à la table de Morena Prudo. Ici, on ne prend en main que ce qui a quelque chose à dire à douze cartes.',
        play: 'La jouer',
        spent: (used, of) => `${used} sur ${of} utilisée${used === 1 ? '' : 's'}`,
        exhausted: 'Épuisée',
        legal: 'Légal',
        fraud: 'Fraude',
        exposure: (percent) =>
          percent === 0
            ? 'La pièce ne peut pas le voir'
            : `Environ ${percent} % de chances que la pièce le voie`,
        watching: 'LSDF se tient dans cette pièce. Ce qu’elle voit, Morena l’apprend.',
        unwatched: 'Plus rien ici ne regarde.',
        buys: 'Achète',
        unbidden: 'Personne ne la joue. Elle écrit quand Morena plonge la main dans votre jeu.',
        costs: 'Coûte',
        seen: 'Elle a vu.',
        unseen: 'Personne n’a rien vu.',

        read: 'Son éventail est retourné. Vous voyez ce qu’il lui reste à demander.',
        foreseen: (card) => `Elle va prendre le ${card} au prochain tour.`,
        forged: (card) =>
          `Le ${card} dans votre main n’est pas à vous. Rien à cette table ne peut le dire — mais le baiser est un contact.`,
        shielded:
          'Le serment est prononcé. Plus rien ne peut réduire votre réponse, et donner le Oui malgré tout vous tuerait.',
        proxied: 'Ce n’est pas vous qui êtes sur cette chaise.',

        book: {
          title: 'Le livre, ouvert à deux pages',
          body: 'Double Face n’est pas un coup. Il tient vivantes deux des techniques volées par Chrollo — ces deux-là, tirées au moment de la donne — et chacune se joue sur sa propre touche et se dépense sur son propre compte.',
        },

        rewound: {
          title: 'Il y a dix secondes',
          body: (cards: number) =>
            `Vous êtes déjà passé par là, et vous êtes le seul à le savoir. Morena dépense ces secondes exactement comme elle les a dépensées la première fois — ${cards === 1 ? 'une carte' : `${cards} cartes`} qu’elle n’a pas le choix de prendre — et votre main, elle, est libre. La pièce reste bleue tant qu’elle n’a pas rattrapé.`,
        },

        ghost: {
          title: 'Le quatrain que la bête a écrit',
          body: 'Elle écrivait pendant que Morena plongeait la main dans votre jeu. Personne ne le lui a demandé, et elle n’écrira pas une seconde fois — une prophétie qui se corrige ne vaut rien. Ce qu’elle dit porte sur la branche perdante.',
          verse: {
            yes: [
              'Le petit mot rouge ne coûte rien à dire',
              'et ne se reprend pas.',
              'La main qui finit sur lui finit',
              'sur une bouche qui a déjà consenti.',
            ],
            no: [
              'Le bleu est honoré : elle l’a dit,',
              'et elle est faite des promesses qu’elle tient.',
              'Regardez alors la carte qu’elle ne prend jamais :',
              'une porte laissée ouverte l’a été exprès.',
            ],
            back: [
              'Une carte va rechercher les autres,',
              'et celle-ci était ouverte avant d’être donnée.',
              'Le vert n’est pas la sortie de la main.',
              'C’est la main, qui attend votre bras.',
            ],
            joker: [
              'Le jaune porte les deux visages',
              'et l’on ne lui dit lequel qu’au dernier instant.',
              'Demandez quelle bouche le lui dira',
              'quand tout le reste aura quitté la table.',
            ],
            x: [
              'Le violet annule la négociation',
              'et ne laisse rien de signé de part ni d’autre.',
              'C’est la branche qu’elle ne peut pas dépenser —',
              'donc c’est la branche qu’elle a préparée.',
            ],
          },
        },

        owl: {
          title: 'Ce que le hibou avait déjà filmé',
          body: 'Il était sur la cloison avant que vous vous asseyiez. Voici son éventail à l’instant où vous avez pensé à revoir la bande — grisées, les cartes qu’elle a dépensées depuis.',
        },

        leave: 'Se lever',
        leaveWarning:
          'Le canon met l’abandon sous la même sanction que la triche : la réponse est réduite à Oui ou Non. Il n’y a pas de porte de sortie qui ne passe pas par là.',

        narrowed: {
          title: 'La Manipulation',
          cheating:
            'Elle a vu. La composante manipulatrice de Contagion se referme sur votre main et lui retire les mots larges : Retour, Joker et X quittent la table. Il vous reste Oui et Non, c’est-à-dire ce qu’elle attendait depuis le début.',
          leaving:
            'Vous vous êtes levé, et se lever c’est tricher. Retour, Joker et X quittent la table. Vous êtes toujours assis là, et la réponse est désormais Oui ou Non.',
        },

        effects: {
          read: 'Lire sa main',
          foresee: 'Voir la carte qu’elle prendra',
          pass: 'Suspendre l’échange',
          recover: 'Reprendre une carte',
          forge: 'Glisser une carte',
          shield: 'Prononcer le serment',
          hide: 'Crever les yeux de la pièce',
          proxy: 'Asseoir quelqu’un d’autre',
          evict: 'Vider sa chaise',
          blind: 'Lui ôter les sens',
          rider: 'Poser la clause',
          rewind: 'Reprendre les dix secondes',
        },

        techniques: {
          dowsing: {
            buys: 'Une question par oui ou par non, pointée sur la carte qu’elle s’apprête à prendre. Chaque refus que vous donnez ensuite est un refus que vous pouvez adosser.',
            costs:
              'La chaîne est une chaîne : elle pend à votre main et ne passe pas en Zetsu. Bonne pour un tour, ruineuse sur cinq.',
          },
          future: {
            buys: 'Le dernier échange, repris. La question retourne dans son éventail et la carte qu’elle a prise revient dans votre main — et elle devra dépenser ces secondes exactement comme elle les a dépensées, quoi que vous fassiez des vôtres.',
            costs:
              'Tout le monde dans la pièce sauf vous continue de vivre la prédiction : rien de ce que vous faites pendant ces secondes n’est une chose à laquelle qui que ce soit puisse réagir. Un échange, une fois, et la pièce n’est visiblement plus elle-même tant qu’elle n’a pas rattrapé.',
          },
          divination: {
            buys: 'Un numéro composé sous la table, et une réponse qui est vraie.',
            costs:
              'C’est un appel téléphonique, et un appel est une chose sur laquelle on entre sans frapper.',
          },
          prophecy: {
            buys: 'Un quatrain tiré avant de s’asseoir, qui nomme la branche perdante.',
            costs:
              'Elle ne lit pas l’avenir de son porteur : quelqu’un d’autre doit tirer pour vous, ce qui met un tiers dans votre partie.',
          },
          surveillance: {
            buys: 'Des chouettes contre la cloison. Vous connaissez les questions avant qu’elles soient posées.',
            costs:
              'Rien à la table — tout se joue avant. Les faire entrer ici est une effraction, et LSDF gradue ses gardes sur la gravité du délit.',
          },
          scout: {
            buys: 'Un hamster sur la table. Presque pas d’aura, il survit à votre inconscience, et il ne ressemble pas à du Nen.',
            costs: 'Cela reste une bête que personne n’a invitée, dans une pièce qui a des yeux.',
          },
          'paper-spy': {
            buys: 'Une poupée collée là où elle voit sa main, et qui rapporte tout.',
            costs: 'Du papier sur un mur, dans une pièce faite pour être fouillée.',
          },
          'truth-punch': {
            buys: 'Un coup, une question, une réponse sortie du corps lui-même — même quand la bouche ment.',
            costs:
              'Frapper à la table, c’est quitter la table. Gardez-le pour le dernier échange, quand la Manipulation n’a plus rien à réduire.',
          },
          disguise: {
            buys: 'Une carte qui n’est pas à vous : la bonne texture, le bon poids, aucune aura à trouver.',
            costs:
              'Le canon la défait par le toucher, et cette partie finit par un baiser. Vous gagnez une main que vous ne pouvez pas conclure.',
          },
          melody: {
            buys: 'Un tour qui ne vous coûte aucune réponse. Trois minutes d’attention tenue, et personne n’a quitté la pièce.',
            costs:
              'Rien du tout. C’est la seule pause légale du jeu — et c’est exactement pour cela qu’elle est la seule.',
          },
          senses: {
            buys: 'Sa vue, son ouïe et sa voix. Elle ne peut plus poser la dernière question, donc aucun Oui ne peut vous être arraché.',
            costs:
              'Une partie qu’elle ne peut plus jouer est une partie abandonnée, et l’abandon est puni des deux côtés. Vous achetez une partie nulle au prix fort.',
          },
          'coin-growth': {
            buys: 'Une carte reprise au cimetière, payée d’une pièce et non d’un baiser.',
            costs:
              'Une pièce vaut ce qu’on l’a gardée : en dépenser une d’un an, c’est dépenser l’année. Rien n’est caché — c’est de l’argent honnête.',
          },
          clone: {
            buys: 'Une copie de l’enjeu, assez fidèle pour que rien à cette table ne puisse le dire.',
            costs:
              'La copie est inerte et disparaît en un jour. Elle n’est payée en fumée que demain — la partie sera close, et vous ne serez plus dans la pièce.',
          },
          growth: {
            buys: 'Quelque chose poussé sur place et posé comme enjeu.',
            costs: 'Ça pousse devant elle.',
          },
          'drug-synthesis': {
            buys: 'Un composé qui vaut une carte, synthétisé et posé sur la table.',
            costs:
              'On ne le fabrique pas seul. L’enjeu exige un allié : la table devient deux têtes contre une, et elle les voit toutes les deux.',
          },
          contract: {
            buys: 'Des termes, une durée, des pénalités, et une Manipulation pour les exécuter. La réponse cesse d’être un mot.',
            costs:
              'Rien, et cela vous lie exactement aussi fort que cela la lie. C’est ce qui le rend légal.',
          },
          'heart-vow': {
            buys: '« Je ne répondrai pas Oui. » La seule immunité véritable à la Manipulation.',
            costs:
              'Vous mourez si vous le donnez quand même. Elle a besoin du Oui et n’a que faire du cadavre : c’est donc elle qui doit céder.',
          },
          polarity: {
            buys: 'La lune, posée sur elle par contact — et le contact, c’est le baiser qu’elle va vous demander.',
            costs:
              'La marquer, ce sont des mains qui bougent au-dessus d’une table qu’elle regarde. Et cela ne rapporte rien tant qu’elle n’a pas pris sa deuxième condition.',
          },
          curse: {
            buys: 'Votre mort rendue chère : la marque emporte quelqu’un des siens avec elle.',
            costs:
              'Cela répond à une clause qu’elle n’allait jamais utiliser. Elle ne tue pas ses candidats, elle les recrute.',
          },
          scarlet: {
            buys: 'Son éventail face visible et chaque carte de la pièce comptée. Rien n’échappe à ces yeux, et rien en eux n’est une fraude.',
            costs:
              'Une heure de vie par seconde, et une négociation n’est pas courte. Elle regarde se consumer la recrue qu’elle achète, et se lève bien avant la fin de l’année.',
          },
          resurrection: {
            buys: 'Un chat dans le coin qui ne fait rien du tout — jusqu’à ce que vous mouriez, et alors il tue celle qui l’a fait.',
            costs:
              'Il ne répond qu’à un tueur direct, et elle ne tue pas ses candidats. Le lui dire est la seule part que vous pouvez jouer.',
          },
          solicitation: {
            buys: 'La bête à votre épaule demande, redemande, et un oui lui donne les commandes. Toute cette partie, la négociation en moins.',
            costs:
              'Ce qu’elle récolte n’est pas le Oui de cette table. C’est une manifestation dans une petite pièce, et elle la voit demander.',
          },
          'desire-trap': {
            buys: 'Son ouverture à elle, rejouée contre elle : ce qu’elle veut, nommé à voix haute et posé comme appât.',
            costs:
              'C’est une bête, dans une petite pièce, chez elle. Une fois sur deux elle la regarde monter.',
          },
          'lie-marks': {
            buys: 'Le bluff taxé, aux deux bouts de la table. Le seul dispositif ici sous lequel jouer honnêtement est strictement meilleur.',
            costs:
              'Cela coupe des deux côtés — et elle a répondu sans mentir depuis le début, parce que le jeu est sa restriction.',
          },
          theft: {
            buys: 'Contagion elle-même. Le pouvoir vu en action, sa propriétaire interrogée et répondant, l’empreinte touchée — en moins d’une heure, et cette partie est les trois à la fois.',
            costs:
              'Il faut mener la main jusqu’au bout et accepter le baiser pour obtenir le contact. C’est très exactement ainsi que Morena le perd.',
          },
          puppet: {
            buys: 'Quelqu’un d’autre sur la chaise, qui dit la réponse de quelqu’un d’autre.',
            costs:
              'Un pantin n’a pas de désir qu’elle puisse nommer ni rien à lui à mettre en jeu. Il ne peut pas vous faire perdre la partie et il ne peut pas la gagner : la fraude la mieux cachée est celle qui plafonne au match nul.',
          },
          command: {
            buys: 'Une tête estampillée sur la chaise, qui fait ce qu’on lui a dit de faire.',
            costs:
              'Un pantin n’a pas de désir qu’elle puisse nommer ni rien à lui à mettre en jeu. Il ne peut pas vous faire perdre la partie et il ne peut pas la gagner : la fraude la mieux cachée est celle qui plafonne au match nul.',
          },
          needle: {
            buys: 'Une tête aiguillée sur la chaise, qui joue le rôle à la lettre.',
            costs:
              'Un pantin n’a pas de désir qu’elle puisse nommer ni rien à lui à mettre en jeu. Il ne peut pas vous faire perdre la partie et il ne peut pas la gagner : la fraude la mieux cachée est celle qui plafonne au match nul.',
          },
          'identity-swap': {
            buys: 'Les mains de quelqu’un d’autre sur vos cartes, et les vôtres sur les siennes.',
            costs:
              'Un échange est un échange : ce que la partie fait, elle le fait à un corps qui n’est pas le vôtre — et la réponse appartient à qui le porte.',
          },
          guardian: {
            buys: 'Une bête sans forme propre, portant l’identité d’une morte, sa mémoire et ses manières. Elle peut s’asseoir, jouer, et dire Oui.',
            costs:
              'Celle au nom de qui elle le dit n’existe plus : l’infection n’a personne sur qui tomber. Mais si on la démasque, ce qui est sur la chaise, c’est vous.',
          },
          mimicry: {
            buys: 'Un visage et une voix empruntés à quelqu’un à qui vous avez parlé.',
            costs:
              'Cela tient aussi longtemps que le temps passé avec cette personne, pas une minute de plus — et sept questions dans une pièce close, c’est exactement ce budget qui se dépense. Chaque tour rend la chute plus probable.',
          },
          projection: {
            buys: 'Un corps sur la chaise qui n’est pas celui où vous êtes. Le baiser n’atteint rien du tout.',
            costs:
              'Le vôtre dort ailleurs dans ce vaisseau, et un mot prononcé à son oreille met fin à tout. C’est une planque pleine de gens qui pourraient aller le dire.',
          },
          teleport: {
            buys: 'Sa chaise, vidée. Elle ne s’en va pas : on la sort — et une négociation qu’elle n’a pas finie est une négociation à laquelle personne n’a à répondre.',
            costs:
              'La seule sortie de ce jeu qui ne passe pas par la Manipulation, et c’est un vol commis dans sa propre planque. Vu en train de le faire, c’est vous le tricheur, et la partie continue sans le tour de passe-passe.',
          },
          tribunal: {
            buys: 'Le carton rouge. Il expulse, il est légal, et il vient après un avertissement qu’elle ne peut pas nier avoir reçu.',
            costs:
              'Un carton rouge se mérite. Il faut deux questions posées avant d’avoir de quoi l’expulser — et l’expulser met fin à la négociation sans réponse : c’est une partie nulle, pas une victoire.',
          },
          'room-isolation': {
            buys: 'La pièce retirée du vaisseau. Quoi que vous fassiez ensuite, il ne reste rien qui puisse le rapporter.',
            costs: 'Être enfermé avec elle, c’est être enfermé avec elle.',
          },
          'door-network': {
            buys: 'Les portes décident de ce que « sortir » veut dire, et la pièce cesse d’être un endroit avec des témoins.',
            costs:
              'Ce sont ses portes. Elles ont été posées pour cette pièce, par ses gens, avant que vous n’arriviez.',
          },
        },

        aftermath: {
          title: 'Ce que ça valait',
          bound:
            'Moonlight Act tient la réponse. C’est un contrat maintenant, avec des termes et une pénalité, et il lie celle des deux qui essaiera de s’en aller.',
          moon: 'Elle a pris le baiser, et la lune est partie avec. Elle ne pourra plus toucher un porteur du soleil sans que les deux sautent.',
          stolen:
            'Vu en action, interrogée et répondant, touchée — les trois, en moins d’une heure. Contagion est dans le livre. C’est ainsi que Morena le perd.',
          'sworn-struck':
            'Vous avez donné le Oui avec la chaîne dans le cœur. Le serment ne négocie pas : il n’a jamais été une menace pour elle, c’était un prix sur vous.',
          smoke:
            'Demain la copie n’existe plus et elle aura été payée en rien. La partie sera close, et close est close.',
          taxed:
            'Chaque mensonge dit à cette table a été marqué au moment où il était dit. L’honnêteté était le meilleur coup, et elle l’était pour vous deux.',
          trapped:
            'On l’a forcée à répondre à sa propre ouverture. Personne ne lui avait encore fait ça.',
          deterred:
            'Vous tuer lui coûte quelqu’un des siens. Elle n’allait pas le faire, mais maintenant elle ne peut plus se permettre d’y avoir pensé.',
          unaffordable:
            'Elle s’est levée. Une recrue qui vaut vingt-deux niveaux ne vaut plus rien s’il ne lui reste pas de vie à dépenser, et elle a regardé le compteur tourner tout du long. Personne n’a dit Oui, et personne n’a eu à le faire.',
          'burnt-out':
            'L’année s’est épuisée alors que les cartes étaient encore sur la table. Les yeux sont restés ouverts toute la manche, et ils allaient toujours être payés.',
          'stood-in':
            'Quelqu’un était déjà assis là. La double de Kacho prend la chaise à l’instant où l’invité y meurt — indiscernable, et dévouée à une personne qui n’est plus à la table. L’infection n’a plus personne sur qui porter.',
          solicited:
            'La bête a eu son oui. Personne n’en a été infecté, personne n’a été embrassé, personne n’a eu à regarder un meurtre — ce qui est exactement ce qu’il vaut, et exactement pourquoi elle exige les trois.',
          avenged:
            'Vous êtes mort à cette table, et le chat a traversé la pièce. Le Nom du chat n’a besoin ni d’être annoncé, ni d’être cru, ni d’être lancé : il avait besoin que vous soyez mort, et c’est elle qui s’en est chargée.',
          evicted:
            'Elle a été sortie de sa propre chaise avant que la dernière carte ne tombe. Personne n’a dit Oui, donc personne n’a été recruté — et une négociation qu’elle n’a pas finie est la seule chose à laquelle le canon n’a pas de réponse.',
          proxied:
            'Ce n’était pas vous sur cette chaise. Rien de ce qui s’est passé ici ne vous est arrivé — et rien de ce qui s’est passé ici ne pouvait être une victoire.',
        },
      },

      dashboard: {
        title: 'Heil-Ly — recrutement',
        unrevealed:
          'Procédure de recrutement inconnue. Personne hors de la planque n’a vu comment un candidat est retourné, et l’archive ne devine pas devant un lecteur qui n’y est pas encore.',
        network: 'Le réseau',
        empty: 'Place libre',
        noMembers: 'Personne d’infecté pour l’instant. Vingt-deux est le plafond, et il est dur.',
        level: (level) => `Niveau ${level}`,
        game: 'La négociation',
        noGame: 'Aucune partie en cours.',
        round: 'Tour',
        questions: 'Ses questions',
        answers: 'Vos réponses',
        watch: 'Surveillance',
        verdict: 'Réponse',
        narrowed: 'Retour, Joker et X ont quitté la table.',
        frieze: 'La frise des fraudes',
        noFrauds: 'Rien d’autre que des cartes n’a été joué à cette table.',
        caught: 'Vue',
        unseen: 'Ratée',
        at: (round) => `T${round}`,
        steps: {
          'game-won-yes': 'Un oui, gagné à la table',
          kiss: 'Le baiser',
          'witnessed-murder': 'Un meurtre, vu de ses yeux',
        },
      },

      conditions: {
        title: 'Les trois conditions de Contagion',
        said: 'Un oui, gagné à la table',
        kissed: 'Le baiser',
        witnessed: 'Un meurtre, vu de ses yeux',
        met: 'remplie',
        unmet: 'non remplie',
        level: (level) => `Niveau ${level}`,
        none: 'Non infectée',
        kissedAnyway:
          'Vous avez pris le baiser et vous êtes tout de même sortie. Une des trois conditions est remplie et les deux autres ne le seront jamais — c’est exactement ce que le marché vous a coûté.',
      },

      log: {
        title: 'Ce qui s’est passé',
        marked: (card) => `Morena marque le ${card} avant de distribuer.`,
        asked: (round, question) => `Tour ${round} — vous demandez : ${question}`,
        taken: (round, card) => `Tour ${round} — elle prend le ${card}.`,
        offered: 'Elle propose le baiser.',
        kissed: (card) => `Vous acceptez le marché, et le ${card} avec.`,
        declined: 'Vous refusez le marché.',
        recovered: (card) => `Le ${card} ressort du cimetière.`,
        settled: (card) => `La dernière carte est le ${card}.`,
        played: (round, technique, seen) =>
          `Tour ${round} — ${technique}. ${seen ? 'Elle a vu.' : 'Personne n’a rien vu.'}`,
        narrowed: (because) =>
          because === 'cheating'
            ? 'Prise sur le fait. Retour, Joker et X quittent la table.'
            : 'Vous vous êtes levé, ce qui est tricher. Retour, Joker et X quittent la table.',
        exposed: (card) => `Le baiser trouve le faux ${card}.`,
        rewound: (cards: number) =>
          `La pièce recule de dix secondes. Il lui reste ${cards === 1 ? 'une carte' : `${cards} cartes`} à reprendre, et pas le choix de laquelle.`,
      },

      again: 'Redistribuer',

      rules: {
        title: 'Les douze cartes',
        lines: [
          'Douze cartes, réparties entre vous deux. Morena tient sept questions ; vous tenez cinq réponses — Oui, Non, Retour, Joker et X.',
          'À chaque tour vous dépensez une question. Elle y répond sans mentir, parce que le jeu est une restriction sur son propre pouvoir et qu’un mensonge lui coûterait Contagion.',
          'Puis elle prend une carte au hasard dans votre main. Elle part au cimetière, et vous n’avez pas votre mot à dire sur laquelle.',
          'Cela fait quatre tours. Quatre questions posées, quatre réponses perdues, et une carte restante. Cette carte est votre réponse.',
          'Retour n’est pas une réponse : il ressort une carte du cimetière, et ce qui en sort est ce que vous avez dit. Joker est celui de Oui et Non que vous désignez. X met fin à la négociation, un point c’est tout.',
          'Vers le troisième tour, elle propose un baiser contre une carte du cimetière. Le baiser est à lui seul l’une des trois conditions de Contagion : la carte n’est donc pas gratuite, et elle n’en dit pas le prix.',
          'Et elle triche. Une de vos cinq réponses était marquée avant de vous parvenir. Y porter la main à la fin lui donne la composante manipulatrice de Contagion, et la réponse cesse d’être la vôtre.',
        ],
      },
    },
  },

  infiltration: {
    seoTitle: 'Infiltration — Une mission à bord du Black Whale',
    seoDescription:
      'Infiltrez un appartement du pont 1 sous couverture, copiez un rapport et ressortez avant que les témoins ne relient les indices.',
    title: 'Infiltration',
    briefing: 'Ordre de mission · Pont 1',
    chooseMission: 'Choisir une mission',
    missions: {
      'missing-report': {
        name: 'Le rapport disparu',
        goal: 'Copiez le rapport, confirmez son auteur et rejoignez la sortie.',
      },
      courier: {
        name: 'Le courrier sous surveillance',
        goal: 'Identifiez puis suivez le bon courrier sans perdre votre couverture.',
      },
      'listening-device': {
        name: "Le dispositif d'écoute",
        goal: 'Posez le dispositif au bon endroit et quittez les lieux.',
      },
      'compromised-shift': {
        name: 'La relève compromise',
        goal: 'Tenez votre rôle, accomplissez la tâche attendue et remplacez le registre.',
      },
      'impossible-witness': {
        name: 'Le témoin impossible',
        goal: 'Gagnez sa confiance, extrayez-le et installez une autre explication.',
      },
      'three-princes': {
        name: 'La réunion des trois princes',
        goal: 'Placez plusieurs sources et distinguez le vrai du renseignement préparé.',
      },
    },
    objectiveLabels: {
      copy: 'Copier la cible sans déplacer l’original.',
      identify: 'Confirmer l’identité de la cible.',
      follow: 'Suivre la cible jusqu’au point de transmission.',
      plant: "Poser le dispositif d'écoute dans la zone cible.",
      extract: 'Rejoindre le point d’extraction.',
    },
    v3: {
      campaign: 'Campagne',
      operations: 'opérations',
      knownAreas: 'zones connues',
      documentChecks: 'Contrôle des documents actif',
      objectiveAxis: 'Objectif',
      informationAxis: 'Information',
      coverAxis: 'Couverture',
    },
    hatsuInteractive: {
      recall: "Rappeler l'éclaireur",
      surfaces: {
        'work-order': 'Ordre de travail',
        'door-sign': 'Plaque de porte',
        'register-copy': 'Copie du registre',
      },
      identities: {
        maintenance: 'Maintenance',
        security: 'Sécurité',
        service: 'Service',
        messenger: 'Messager',
      },
    },
    intro:
      'Vous entrez comme aide de maintenance. Copiez le rapport placé au fond de l’appartement, confirmez si possible son véritable auteur, puis revenez au point d’entrée. Être vu n’est pas perdre : être compris l’est.',
    cover: 'Couverture · Maintenance',
    integrity: 'Intégrité',
    alert: 'Alerte partagée',
    objective: 'Objectif',
    copied: 'Rapport copié',
    copy: 'Copier le rapport',
    verify: 'Vérifier l’auteur',
    extract: 'S’exfiltrer',
    divert: 'Diversion',
    challenge: 'Contrôle de couverture',
    challengePrompt:
      'Votre présence ne correspond pas à la ronde annoncée. Quelle justification donnez-vous ?',
    workOrder: 'Présenter l’ordre de maintenance',
    bluff: 'Invoquer une instruction orale urgente',
    taskCopy: 'Copier le rapport sans le déplacer.',
    taskVerify: 'Identifier son auteur réel (facultatif).',
    taskLeave: 'Revenir au point d’entrée avec une histoire cohérente.',
    begin: 'Commencer la mission',
    debrief: 'Reconstitution après votre départ',
    score: 'Discrétion',
    traces: 'Traces laissées',
    reports: 'Rapports transmis',
    discoveredTraces: 'Traces découvertes',
    runStyle: 'Profil de mission',
    styles: { ghost: 'Fantôme', operator: 'Opérateur', exposed: 'Exposé' },
    chooseHatsu: 'Capacité emportée',
    castHatsu: 'Utiliser le Hatsu',
    uses: 'usage(s)',
    hatsuRoles: {
      scout: 'Reconnaissance à distance',
      forge: 'Falsification de l’ordre de mission',
      disguise: 'Déguisement social temporaire',
      surveillance: 'Surveillance attachée',
      tracker: 'Pistage d’une cible',
      interrogate: 'Interrogation forcée',
      analyse: 'Analyse de l’information',
      cleanup: 'Nettoyage des traces',
      mobility: 'Mobilité et pièges',
      theft: 'Capacité empruntée',
    },
    hatsuConditions: {
      ten: 'Ten doit être actif',
      conscious: 'Vous devez être en état d’agir',
      aura: 'Aura insuffisante',
      uses: 'Aucun usage restant',
      uninterrupted: 'Impossible pendant un contrôle',
      target: 'Choisissez une cible présente dans la pièce',
    },
    truth: 'Information rapportée',
    confirmed: 'Auteur confirmé',
    uncertain: 'Auteur encore incertain',
    again: 'Recommencer',
    reported: 'Observation transmise',
    unreported: 'Observation restée locale',
    witnesses: { steward: 'L’intendant', guard: 'Le garde', nenGuard: 'La garde au Nen' },
    beliefs: {
      maintenance: 'A vu un agent de maintenance',
      intruder: 'Soupçonne une intrusion',
      unknown: 'N’a rien établi',
    },
    outcomes: {
      playing: 'Mission en cours',
      escaped: 'Exfiltration réussie',
      identified: 'Couverture compromise',
      timeUp: 'Relève arrivée',
    },
  },

  hunt: {
    seoTitle: 'Le jeu de traque — Une partie dans l’appartement de Tserriednich',
    seoDescription:
      'Un prototype joué à l’intérieur de la reconstruction : huit pièces attestées du pont 1, un chasseur, un seul réservoir d’aura à répartir entre savoir, préparer et survivre, et un duel qui se décide sur quelle zone plutôt que sur combien.',
    breadcrumb: 'Le jeu de traque',
    title: 'Le jeu de traque',
    intro:
      'Huit pièces, dix minutes, et cent points d’aura qui doivent couvrir savoir où il est, préparer le terrain, et tenir debout quand il vous trouve. Contre un chasseur intact, vous perdez. Le jeu, c’est ce que vous faites avant.',
    enter: 'Cliquez pour marcher',
    engaged: 'Tab libère le pointeur',
    briefing: {
      eyebrow: 'PROTOTYPE DE TRAQUE',
      title: 'Le chasseur est déjà là.',
      premise:
        'Traversez l’appartement et rejoignez la pièce indiquée. Écoutez-le, trompez-le et choisissez où aura lieu le contact.',
      rule: 'Votre aura sert à savoir, à préparer et à survivre. Contre un chasseur intact, vous perdez.',
      objective: 'Atteignez la pièce cible — ou préparez une rencontre qu’il ne pourra pas gagner.',
      hatsu: 'Hatsu emporté',
      chooseHatsu: 'Choisissez votre Hatsu',
      role: {
        prepare: 'Préparer le terrain',
        foresee: 'Voir l’intention future',
        locate: 'Localiser probablement',
      },
      hatsuRule:
        'Pose sur une surface un lien élastique dissimulé avec In. Il retient sans infliger de dégâts.',
      begin: 'Entrer dans l’appartement',
    },
    actions: {
      hint: 'Actions de traque',
      sweep: 'Sentir',
      zetsu: 'Se taire',
      ten: 'Reprendre Ten',
      lay: 'Piège Bungee Gum',
      take: 'Récupérer',
      hatsu: {
        'bungee-gum': 'Piège Bungee Gum',
        'parallel-future': 'Ouvrir le futur',
        'dowsing-chain': 'Sonder',
      },
    },
    hatsu: {
      future: (room, seconds) => `intention : ${room || 'ailleurs'} · ${seconds} s`,
      probable: 'direction probable, pas une position confirmée',
    },
    controls: {
      walk: 'ZQSD — marcher',
      look: 'Souris — regarder',
      sweep: 'F — balayer au En (15)',
      zetsu: 'X — Zetsu : invisible, et sans avertissement',
      lay: 'V — poser une entrave (25)',
      take: 'R — en reprendre une',
    },
    hud: {
      room: 'Vous êtes dans',
      nowhere: 'Entre deux pièces',
      target: 'Rejoindre',
      aura: 'Aura',
      available: 'En main',
      committed: 'Posée',
      ten: 'Ten',
      zetsu: 'Zetsu',
      entraves: 'Entraves posées',
      elapsed: 'Écoulé',
    },
    feel: {
      swept: 'Quelque chose vous a balayé.',
      footsteps: 'Des pas.',
      muffled: 'Des pas, à travers une cloison.',
      sprung: 'Quelque chose à vous vient de partir.',
      found: 'Une des vôtres a été trouvée.',
    },
    outcome: {
      title: 'La partie est finie',
      reached: 'Vous avez atteint la pièce. Il ne vous a jamais eu.',
      timeUp: 'Dix minutes. Il ne vous a pas trouvé, et vous n’êtes pas arrivé.',
      eliminated:
        'Il n’avait plus de quoi tenir son Ten, et il a marché dans ce que vous lui aviez laissé.',
      caught: 'Il lui en restait assez pour vous répondre.',
    },
    duel: {
      title: 'Contact',
      you: 'Vous',
      hunter: 'Le chasseur',
      zone: { head: 'Tête', torso: 'Torse', arms: 'Bras', legs: 'Jambes' },
      verb: {
        ryu: 'Ryu',
        gyo: 'Gyo',
        in: 'In',
        ko: 'Ko',
        ken: 'Ken',
        zetsu: 'Zetsu',
      },
      controls: {
        zone: '1–4 — où se tient l’aura',
        forward: '− = — en avant, ou en retrait',
        gyo: 'G — Gyo : lire où est la sienne',
        in: 'I — In : devenir illisible',
        ken: 'K — Ken : couvert partout, sans avancer',
        ko: 'Espace — rassembler et frapper',
        zetsu: 'X — tout lâcher et rompre',
        take: 'R — reprendre ce que vous avez posé ici',
      },
      action: {
        guard: 'Zone protégée',
        reserve: 'Réserve',
        press: 'Pression',
        observe: 'Observer',
        conceal: 'Dissimuler',
        endure: 'Tenir',
        strike: 'Engager Ko',
        breakAway: 'Rompre le duel',
        recover: 'Reprendre l’entrave',
      },
      state: {
        held: 'Retenu',
        broken: 'Son Ten ne tient plus',
        breaking: 'Rupture en cours…',
        hidden: 'Illisible',
        covered: 'Couvert',
        forward: 'En avant',
        back: 'En retrait',
      },
    },
    debrief: {
      title: 'Ce que chacun a cru',
      hunt: 'La traque',
      duel: 'Le contact',
      duration: 'Durée',
      seconds: 'secondes',
      laid: 'Entraves posées',
      sprung: 'Déclenchées',
      recovered: 'Reprises',
      spent: 'Aura dépensée',
      remaining: 'Aura restante',
      condition: 'Le chasseur, à la fin',
      intact: 'Intact',
      journal: 'Le relevé',
      nothing: 'Rien n’a été consigné.',
      again: 'Recommencer',
      actor: { player: 'Vous', hunter: 'Le chasseur' },
      kind: {
        sweptEn: 'a balayé au En',
        feltEn: 'a senti un balayage passer',
        wentZetsu: 'est passé en Zetsu',
        wentTen: 'a repris son aura',
        laidEntrave: 'a posé une entrave',
        tookEntraveBack: 'a repris une entrave',
        sprungEntrave: 'a marché dans une entrave',
        spottedEntrave: 'a repéré une entrave',
        inspected: 'a fouillé le sol',
        believed: 'vous a cru ici',
        lostTheTrail: 'a perdu la trace',
        duelOpened: 'est arrivé à portée de bras',
        duelClosed: 'a rompu',
      },
    },
  },

  arena: {
    seoTitle: 'Arène du Black Whale — Combat Nen dans la salle de banquet',
    seoDescription:
      'Un mode de combat déterministe fondé sur les principes du Nen, disputé dans une pièce attestée du Black Whale plutôt que sur un terrain inventé.',
    breadcrumb: 'Arène du Black Whale',
    eyebrow: 'Salle de banquet · Match d’exhibition',
    title: 'Arène du Black Whale',
    intro:
      'La salle, ses tables, sa scène et ses cloisons viennent directement de la reconstruction du navire. Contrôlez le flux d’aura, utilisez le décor et ne vous engagez que lorsque l’ouverture est réelle.',
    firstTo: 'Premier à 10',
    you: 'Vous',
    opponent: 'Combattant d’étage',
    aura: 'Aura',
    score: 'Score',
    distance: 'Distance',
    source: 'Pièce attestée',
    enter: 'Cliquez dans la scène pour prendre le contrôle',
    zone: { head: 'Tête', torso: 'Torse', arms: 'Bras', legs: 'Jambes' },
    mode: { ten: 'Ten', ren: 'Ren', zetsu: 'Zetsu' },
    condition: { ready: 'Prêt', staggered: 'Ébranlé', down: 'Au sol', ko: 'KO' },
    impact: {
      miss: 'Hors de portée',
      blocked: 'Bloqué',
      clean: 'Touche nette · 1 point',
      critical: 'Touche critique · 2 points',
      knockdown: 'Mise au sol · 3 points',
      ko: 'K.-O.',
    },
    controls: {
      move: 'ZQSD / flèches — se déplacer dans la pièce',
      modes: 'T / R / X — Ten, Ren, Zetsu',
      zone: '1–4 — déplacer le Ryu sur une zone',
      flow: '− / = — retenir ou pousser l’aura',
      perception: 'G / I — Gyo et In',
      defence: 'K — Ken',
      strike: 'Espace — frapper',
      ko: 'C — rassembler Ko',
    },
    keys: {
      label: 'Commandes de combat',
      strike: 'Clic · F · Espace',
      ko: 'C',
      ryu: '1–4',
      modes: 'T · R · X',
    },
    action: {
      strike: 'Frapper',
      ko: 'Rassembler Ko',
      guard: 'Garde active',
      feint: 'Feinte',
      restart: 'Recombattre',
    },
    training: 'Initiation Nen',
    auraDistribution: 'Distribution du Ryu',
    lesson: [
      {
        title: 'Déplacez votre Ryu',
        body: 'Choisissez une zone avec 1–4. Le transfert prend un instant.',
      },
      {
        title: 'Fermez la garde',
        body: 'Maintenez votre lecture puis pressez Maj au moment de l’attaque.',
      },
      {
        title: 'Provoquez une réaction',
        body: 'Pressez V pour feinter sur la zone actuellement visée.',
      },
      { title: 'Punissez l’ouverture', body: 'Frappez pendant que l’adversaire récupère.' },
    ],
    state: { gyo: 'Gyo', in: 'In', ken: 'Ken', ko: 'Ko en charge', concealed: 'Aura dissimulée' },
    outcome: { won: 'Match gagné', lost: 'Match perdu' },
    roadmap:
      'La salle de banquet est le premier terrain tiré du Black Whale. Le même moteur peut maintenant accueillir d’autres pièces du plan sans réinventer leur géométrie.',
  },

  tourSources: {
    seoTitle: 'Sources — D’où vient chaque pièce du Black Whale',
    seoDescription:
      'Les preuves derrière le Black Whale reconstruit, pièce par pièce : le chapitre ou le plan sur lequel repose chacun des 314 espaces, les couloirs que la reconstruction a inventés, et les cloisons murées à dessein.',
    breadcrumb: 'Sources',
    title: 'D’où vient chaque pièce',
    intro:
      'La reconstruction affirme quelque chose du vaisseau à chaque surface qu’elle dessine : elle publie donc la preuve de chacune. Rien ici n’est un résumé — c’est tout ce sur quoi la visite est bâtie, pièce par pièce, et chaque espace que le manga ne montre pas est déclaré comme inventé.',
    counts: (spaces, sources) => `${spaces} espaces, appuyés sur ${sources} sources distinctes`,
    tally: (label, count) => `${count} ${label.toLowerCase()}`,

    nothingInvented: (solids, invented) =>
      invented === 0
        ? `Aucun des ${solids} solides que la visite dresse dans le vaisseau n’est inventé. Chaque lit, cercueil, ressort et grille est dessiné sur un plan ou montré sur une planche, et porte sa source. Ce que la reconstruction invente, c’est la circulation — les couloirs qui rendent un pont continu — et elle le dit sur le mur.`
        : `${invented} des ${solids} solides que la visite dresse dans le vaisseau ne reposent sur aucun dessin, et sont signalés comme tels.`,
    onThisPage: 'Sur cette page',
    sections: {
      chapters: 'Chapitres',
      method: 'Méthode',
      departures: 'Écarts',
      rooms: 'Pièces',
      levels: 'Niveaux',
      solids: 'Solides',
      unfurnished: 'Laissé nu',
      joins: 'Liaisons',
      walls: 'Cloisons',
    },

    chapters: {
      title: 'Les chapitres d’où le vaisseau est lu',
      help: (count) =>
        `${count} chapitres portent toute la reconstruction. Le nombre est celui des affirmations — une pièce, un niveau, un solide, un escalier — qui citent ce chapitre comme source. Choisissez-en un pour voir ce qui repose dessus.`,
      chapter: (chapter) => `Chap. ${chapter}`,
      filter: (chapter) => `Montrer ce qui repose sur le chap. ${chapter}`,
    },

    levels: {
      title: 'Les niveaux sur lesquels les pièces se dressent',
      help: (decks, interiors) =>
        `${decks} ponts et ${interiors} intérieurs dessinés à leur propre échelle. Ce sont les affirmations sur lesquelles tout le reste repose : une pièce est sur un pont parce qu’une coupe l’y met, et un intérieur est le dedans d’une pièce parce qu’un plan ou une planche le dessine.`,
    },

    unfurnished: {
      title: 'Ce que la reconstruction ne meuble pas',
      help: (count) =>
        `${count} pièces dont les murs sont attestés et le contenu non sont laissées vides. C’est la même règle que le reste de cette page, prise dans l’autre sens : les huit suites VVIP, le sol nu de la 37564, les salles que le plan du cinéplexe nomme sans dessiner un fauteuil. Un siège inventé pour les remplir affirmerait quelque chose de l’histoire, non du vaisseau.`,
      bare: (count) => `${count} ${count === 1 ? 'pièce laissée nue' : 'pièces laissées nues'}`,
    },

    method: {
      title: 'Ce que les dessins donnent vraiment',
      crossSection:
        'La coupe du ch. 349 est l’ossature. Elle empile les cinq ponts et nomme ce qui se trouve sur chacun — l’essentiel du vaisseau en dépend. Mais c’est un diagramme de voisinage, pas un relevé : elle dit ce qui jouxte quoi, jamais les dimensions, jamais l’intérieur d’une pièce.',
      apartmentPlan:
        'Le plan d’appartement princier donne les sept pièces derrière une seule porte, et le ch. 362 et les suivants montrent ces pièces meublées chez Benjamin, Tserriednich et Luzurus. Le plan des ponts dessine le même appartement comme une petite boîte : les deux dessins ne sont pas à la même échelle, et ils ne l’ont jamais été. La visite garde les deux plutôt que d’en déformer un — le pont conserve l’empreinte que le plan dessine, et l’intérieur est un niveau à part, à sa taille réelle.',
      scale:
        'Une unité des plans de ponts vaut 0,35 m, un facteur fixé par la taille des pièces et non par la coque. Lus au pied de la lettre, les plans donnent une salle de banquet de 450 m que personne ne pourrait traverser. Les 175 m auxquels la reconstruction aboutit sont une propriété de la reconstruction, pas une mesure du Black Whale.',
      doorways:
        'Les portes ne sont pas écrites. Deux espaces qui partagent une portion de mur communiquent, dérivé de la seule géométrie : une cloison déplacée de deux mètres ne peut donc pas laisser une porte en suspens — c’est une salle devenue inaccessible qui fait échouer les tests.',
    },

    departures: {
      title: 'Ce que la coupe dit et que la visite ne prend pas',
      help: 'L’ordre d’autorité met le manga au-dessus de tout, cette page comprise : là où un dessin et la reconstruction divergent, le dessin l’emporte et c’est la reconstruction qu’il faut refaire. Quatre endroits s’écartent malgré tout de la coupe du chap. 349, parce qu’un vaisseau qu’on parcourt ne peut pas tenir tout ce que ce dessin tient. C’est le seul motif recevable pour s’en écarter, et chacun est déclaré ici plutôt que laissé à découvrir.',
      drawn: 'La coupe dessine',
      kept: 'La visite tient',
      items: [
        {
          drawn:
            'Chacun des cinq ponts comme un empilement de niveaux intermédiaires. Un pont y est une tranche de coque, pas un étage.',
          kept: 'Un seul niveau parcouru par pont. Un pont a 4,5 à 6 m sous plafond et les tiers sont espacés de 27 m de navire : six ponts séparent donc un plafond du plancher au-dessus, et c’est là que sont ces niveaux intermédiaires. La visite ne les parcourt pas et ne les nie pas. Un plan par pont est ce qui fait de /ship et de la visite le même vaisseau, et cette correspondance est toute la raison d’être de la reconstruction. L’écart, lui, se compte au lieu de se choisir : le vaisseau a 41 ponts, la reconstruction en tient sept et le paquebot en porte dix au-dessus, ce qui en laisse six par bande à 4,5 m pièce. La coupe donne l’ordre de l’empilement, jamais la distance.',
        },
        {
          drawn:
            'Une superstructure au-dessus du pont 1 — la passerelle et sa cheminée, dégagées de la coque.',
          kept: 'Rien. Aucun dessin n’en donne l’intérieur, et une coque vide où l’on n’entre pas serait du décor. Le vaisseau que la visite tient s’arrête au pont des appartements.',
        },
        {
          drawn:
            'La coque en élévation : le profil de l’étrave et de la poupe, et le bulbe dans lequel le pont 5 se loge.',
          kept: 'Un contour fermé par pont, échantillonné sur les courbes des plans de ponts de /ship, qui sont dessinés vus de dessus. Le vaisseau reconstruit se resserre donc de pont en pont, mais le mur de chaque pont monte à la verticale. Une coque incurvée à travers le plancher déplacerait un mur de plusieurs mètres au seul endroit où les plans de ponts ne disent rien.',
        },
        {
          drawn: 'Une ligne de flottaison, les ponts 4 et 5 en dessous.',
          kept: 'Aucun champ : rien de la marche n’en dépend. Elle est consignée ici parce qu’elle touche à l’affirmation la plus forte du plan — sur 314 espaces, exactement deux voient dehors. Deux ponts sous l’eau, c’est la raison pour laquelle les 312 autres sont éclairés par ce que quelqu’un a allumé.',
        },
      ],
    },

    controls: {
      search: 'Chercher une pièce ou une source',
      searchPlaceholder: 'Chambre funéraire, ch. 358, couloir…',
      evidence: 'Preuve',
      groupBy: 'Regrouper par',
      bySource: 'Source',
      byDeck: 'Pont',
    },

    spaces: (count) => `${count} espace${count === 1 ? '' : 's'}`,
    walkThere: (name) => `Marcher jusqu’à ${name}`,
    insideOf: (room) => `intérieur de ${room}`,
    noMatch: 'Aucun espace ne correspond.',

    links: {
      title: 'Comment les ponts sont reliés',
      help: 'Escaliers, ascenseurs et cloisons sont les seules liaisons que le plan consigne à la main, parce que les deux espaces qu’ils relient ne partagent aucun mur d’où déduire une ouverture.',
      stair: 'Escalier',
      lift: 'Ascenseur',
      bulkhead: 'Cloison',
      door: 'Porte',
    },

    structures: {
      title: 'Ce qui se dresse dans les pièces',
      help: 'La visite ne décore pas : elle n’invente jamais la place d’une chaise. Elle ne dessine un volume que dans deux cas. Quand un plan l’y met — le plan d’appartement princier dessine les lits, les canapés, la table à manger et la cuisine, ce qui est un relevé et non de l’ameublement. Et quand ce qu’une planche montre est ce que la pièce est : la couronne de cercueils est la chambre funéraire, les ressorts sont ce sur quoi la coque porte le vaisseau, et la grille de sa façade est la cellule. Chacun est plein, et chacun porte sa propre source — qui n’est pas toujours celle de la pièce autour de lui.',
      standingIn: (room) => `dans ${room}`,
      count: (count) => `${count} volume${count === 1 ? '' : 's'}`,
    },

    seals: {
      title: 'Murs laissés aveugles à dessein',
      help: 'Puisqu’une porte découle d’un mur partagé, un mur censé rester plein doit être déclaré — et une déclaration est une affirmation sur le vaisseau : elle porte donc sa raison.',
    },

    doors: {
      title: 'Portes placées à la main',
      help: 'Une porte est placée à la main quand le plan de la pièce la dessine ailleurs qu’au milieu du mur partagé, et quand elle est l’unique entrée d’un appartement — que rien d’autre ne pourrait ouvrir. C’est aussi ainsi qu’un mur est ouvert sur toute sa longueur, pour les façades que les plans dessinent en barreaux et non en mur : une cellule est fermée par la grille qui se dresse dans l’ouverture, pas par le mur que la visite y aurait bâti.',
      walls: (count) => `${count} mur${count === 1 ? '' : 's'}`,
    },

    data: {
      title: 'Vérifiez vous-même',
      help: 'Chaque ligne de cette page est un champ du plan que la visite charge. C’est un unique fichier édité à la main, et la suite de tests échoue si un espace n’a pas de source, si un espace déduit revendique un chapitre, ou si une salle du vaisseau devient inaccessible.',
      file: 'data/ship/blueprint.json',
      walkIt: 'Parcourir le vaisseau',
    },
  },

  layout: {
    skipToContent: 'Aller au contenu principal',
    brandHome: 'Black Whale — Accueil',
    brandTagline: 'Archives de la succession',
    primaryNavigation: 'Navigation principale',
    quickFind: 'Recherche rapide',
    openQuickNavigation: 'Ouvrir la navigation rapide',
    openMenu: 'Ouvrir le menu de navigation',
    closeMenu: 'Fermer le menu de navigation',
    siteNavigation: 'Navigation du site',
    menuDossier: 'Dossier de navigation',
    menuClassified: 'CONFIDENTIEL / 05 SECTIONS',
    mainSections: 'Sections principales',
    archiveSections: 'Sections des archives',
    menuFooterExpedition: 'Expédition du Continent Noir',
    menuFooterStatus: 'État des archives : actives',
    footerTagline: 'Archives de la succession · Expédition royale de Kakin',
    footerSections: 'Sections',
    copyright: (year) => `© ${year} Archives du Black Whale`,
    disclaimer: 'Projet de fans non officiel · Hunter × Hunter est © Yoshihiro Togashi / Shueisha',
    dataCreditPrefix: 'Catalogue et cartes du navire par Ginks —',
    dataCreditRepository: 'dépôt source',
    dataCreditLicensedUnder: '— sous licence',
    chooseLanguage: 'Choisir une langue',
    spoiler: {
      label: 'Filtre à spoilers',
      summaryFull: 'Spoilers · canon complet',
      summaryLimited: (chapter) => `Spoilers · jusqu'au ch. ${chapter}`,
      intro: "Indiquez le dernier chapitre lu : l'archive masque tout ce qui vient après.",
      chapterField: 'Dernier chapitre lu',
      rangeHint: (first, last) => `Chapitres indexés ${first}–${last}`,
      apply: 'Appliquer',
      clear: 'Afficher tout le canon',
    },
  },

  home: {
    seoDescription:
      'Parcourez les passagers, les ponts, les savoirs et les systèmes de Nen de la guerre de succession du Black Whale — une archive interactive de Hunter × Hunter.',
    eyebrow: 'Expédition royale de Kakin · Voyage 001',
    titleLead: 'Montez à bord du',
    titleBrand: 'Black Whale',
    lede: "Une archive de l'arc de la guerre de succession. Elle consigne où se trouve chaque passager, quel corps abrite quelle conscience, quels Nen sont en jeu et ce que chaque personnage croit à cet instant du voyage.",
    exploreShip: 'Explorer le navire',
    walkTheShip: 'Faire la visite virtuelle',
    openRegistry: 'Ouvrir le registre des passagers',
    latestChapter: 'Dernier chapitre indexé',
    published: (date) => `Publié le ${date}`,
    metricsLabel: 'Chiffres des archives',
    metrics: {
      tiers: 'Ponts du navire',
      passengers: 'Passagers répertoriés',
      rooms: 'Salles cartographiées',
      abilities: 'Pouvoirs de Nen',
    },
    manifestEyebrow: 'Architecture du renseignement',
    manifestTitleLine1: 'Un seul voyage.',
    manifestTitleLine2: 'Mille réalités.',
    manifestCopy:
      "L'archive ne tient jamais une information pour absolue. Chaque fiche appartient à un moment, à une source et à un point de vue.",
    dossierExplore: 'Explorer ↗',
    dossiers: {
      ship: {
        title: 'Le navire, pont par pont',
        copy: "Parcourez les cinq ponts et voyez qui se trouve où, à n'importe quel moment du voyage.",
        tag: 'CARTE VIVANTE',
      },
      timeline: {
        title: 'Chaque événement, dans l’ordre',
        copy: 'Suivez chaque affrontement, chaque alliance et chaque transfert dans l’ordre du récit.',
        tag: 'JOURNAL DES ÉVÉNEMENTS',
      },
      perspectives: {
        title: 'Ce que sait chaque personnage',
        copy: 'Observez le même monde à travers d’autres esprits, d’autres souvenirs et d’autres suppositions.',
        tag: 'SAVOIRS',
      },
    },
    closingEyebrow: 'Par où commencer',
    closingTitleLine1: 'Commencez au premier',
    closingTitleLine2: 'événement consigné.',
    openTimeline: 'Ouvrir la chronologie',
  },

  registry: {
    seoTitle: 'Registre des passagers',
    seoDescription: (count) =>
      `Parcourez les ${count} passagers du Black Whale : princes, gardes, mafieux, Hunters et membres de la Brigade fantôme, avec leur faction, leur pont et leur première apparition.`,
    collectionName: 'Registre des passagers du Black Whale',
    collectionDescription:
      'Tous les passagers répertoriés à bord du Black Whale, avec leur faction et leurs fiches d’identité.',
    eyebrow: 'Manifeste 02 · Fiches d’identité',
    titleLine1: 'Registre des',
    titleLine2: 'passagers',
    note: 'Toute identité est une cible mouvante. Parcourez les passagers confirmés, leurs alias, leurs affiliations et leurs premières apparitions consignées.',
    totalRecords: 'Fiches au total',
    visible: 'Affichées',
    filtersLabel: 'Filtres du registre',
    searchPassengers: 'Rechercher un passager',
    searchPlaceholder: 'Rechercher par nom, alias ou mot-clé…',
    filterByAffiliation: 'Filtrer par affiliation',
    independent: 'Indépendant',
    factionPrefix: 'Faction ',
    canonical: 'Canonique',
    secondary: 'Secondaire',
    aka: 'ALIAS',
    noIntelligence: 'Aucun renseignement public n’est disponible pour le moment.',
    appearanceUnknown: 'Première apparition inconnue',
    emptyTag: 'AUCUN RÉSULTAT',
    emptyTitle: 'Le registre n’a renvoyé aucune identité.',
    emptyCopy: 'Changez d’affiliation ou élargissez votre recherche.',
    beyondLineage: {
      filterLabel: 'Filtrer par filiation avec Beyond',
      all: 'Tout le monde',
      any: 'Enfants de Beyond',
      confirmed: 'Marqués',
      suspected: 'Suspectés',
      badgeConfirmed: 'Enfant de Beyond · marqué',
      badgeSuspected: 'Enfant de Beyond · suspecté',
      emptyCopy: 'Aucune fiche ne correspond à la filiation de Beyond à votre limite de lecture.',
    },
    categories: {
      intruderCell: 'Cellule d’intrus',
      mafiaFamily: 'Famille mafieuse',
      hunterAssociation: 'Association des Hunters',
      stateAuthority: 'Autorité de l’État',
      royalHousehold: 'Maison royale',
      unaligned: 'Fiche sans affiliation',
    },
  },

  timeline: {
    seoTitle: 'Chronologie de la guerre de succession',
    seoDescription:
      'Une chronologie interactive, chapitre par chapitre, de l’arc de la guerre de succession : chaque affrontement, chaque alliance et chaque transfert de Nen dans l’ordre canonique.',
    breadcrumb: 'Chronologie',
    eyebrow: 'Dossier narratif · Guerre de succession',
    title: 'Chronologie',
    intro:
      'Suivez les événements du Black Whale chapitre par chapitre, rejouez-les dans l’ordre où ils ont réellement eu lieu et ouvrez la carte à n’importe quel moment du récit.',
    summaryLabel: 'Résumé de la chronologie',
    chapters: 'Chapitres',
    events: 'Événements',
    latestRecord: 'Dernier relevé',
    searchLabel: 'Rechercher dans la chronologie',
    searchPlaceholder: 'Rechercher par événement, chapitre ou mot-clé…',
    orderLabel: 'Ordre de la chronologie',
    storyOrder: 'Ordre du récit',
    storyOrderHint: 'Événements regroupés par chapitre, dans l’ordre de lecture',
    chronological: 'Ordre chronologique',
    chronologicalHint: 'Événements dans l’ordre où ils se sont produits à bord',
    spoilerHint: 'Les événements ultérieurs sont masqués',
    spoilerLimited: (chapter) => `Spoilers limités au chapitre ${chapter}`,
    fullCanon: 'Canon intégral',
    quickChapterAccess: 'Accès rapide aux chapitres',
    index: 'Index',
    chapterAbbrev: 'CH.',
    chronologyEyebrow: 'Chronologie du voyage',
    chronologyTitle: 'Dans l’ordre où cela s’est produit',
    chapterLabel: (number) => `Chapitre ${number}`,
    untitled: 'Sans titre',
    openOnMap: (title) => `${title} — ouvrir sur la carte`,
    revealedIn: (chapter) => `↶ Révélé au chapitre ${chapter}`,
    flashbackOccurrence: (ordinal) => `↶ Flash-back · occurrence n° ${ordinal}`,
    sequenceShort: (sequence) => `Séq. ${sequence}`,
    timeOnEvent: 'Heure consignée sur l’événement lui-même',
    undated: 'Non daté',
    undatedHint: 'Se passe hors du voyage : l’horloge du navire n’en dit rien',
    communitySourced: 'Daté par Hunterpedia',
    precision: {
      stated: 'Heure indiquée par le manga',
      derived: 'Heure déduite d’une heure indiquée',
      bracketed: 'Non daté : l’intervalle entre les deux ancres qui l’encadrent',
    },
    emptyTitle: 'Aucun événement trouvé',
    emptyCopy: 'Essayez un autre titre, un autre numéro de chapitre ou un autre mot-clé.',
  },

  compare: {
    seoTitle: 'Comparaison des points de vue',
    seoDescription:
      'Placez deux personnages côte à côte et voyez précisément où leurs connaissances du Black Whale divergent — qui est mal informé, et depuis quel chapitre.',
    breadcrumb: 'Comparer les points de vue',
    eyebrow: 'Salle d’enquête · Renseignements synchronisés',
    titleLine1: 'La vérité est',
    titleLine2: 'relative.',
    intro:
      'Comparez ce que croient deux observateurs au même événement, au même endroit et à la même échelle, puis révélez le relevé canonique si l’habilitation le permet.',
    activeEvent: 'Événement actif',
    detectedGaps: 'Écarts détectés',
    subjectsInView: 'Sujets à l’écran',
    hideCanonical: 'Masquer la colonne Vérité du lecteur',
    showCanonical: 'Comparer à la réalité canonique',
    canonicalWarning:
      'Attention : cette comparaison révèle les erreurs et les illusions du point de vue sélectionné.',
    canonicalBlocked: 'Vue canonique indisponible au-delà de la limite de spoilers autorisée.',
    relatedViews: 'Vues de renseignement associées',
    perspectiveSetup: 'Configuration des points de vue',
    returnToMap: 'Retour à la carte du navire',
    event: 'Événement',
    eventOption: (chapter, title) => `Chap.${chapter} - ${title}`,
    perspectiveA: 'Point de vue A',
    perspectiveB: 'Point de vue B',
    viewSynchronized: 'Voir les cartes synchronisées',
    differencesOnly: 'Écarts uniquement',
    synchronizedZoom: 'Zoom synchronisé',
    synchronizedTier: 'Pont synchronisé',
    synchronizedZone: 'Zone synchronisée',
    allZonesInTier: 'Toutes les zones de ce pont',
    eventReadout: (chapter, title) => `Chap.${chapter} / ${title}`,
    noEventSelected: 'Aucun événement sélectionné',
    activeComparison: 'Comparaison en cours',
    versus: 'CONTRE',
    columnA: (name) => `Point de vue A - ${name}`,
    columnB: (name) => `Point de vue B - ${name}`,
    scopeReadout: (zoom, tier, zone) => `Zoom ${zoom} · ${tier} · ${zone}`,
    allZones: 'toutes les zones',
    syncedWithA: 'Synchronisé avec A (pont / zoom / zone / sujet)',
    mapTitleA: (tier) => `Point de vue A · ${tier}`,
    mapTitleB: (tier) => `Point de vue B · ${tier}`,
    mapTitleReader: (tier) => `Vérité du lecteur · ${tier}`,
    readerTruthTitle: 'Vérité du lecteur — réalité canonique',
    spoilerLimit: (chapter) => `Limite de spoilers : chapitre ${chapter}`,
    unlimited: 'illimitée',
    noCanonicalInfo: 'Aucune information canonique propre à ce sujet pour le moment.',
    differencesMobile: 'Écarts uniquement (mobile)',
    noDifferencesForFilter: 'Aucun écart pour ce filtre.',
    assumedIdentity: 'Identité supposée',
    unknownIndividual: 'Individu inconnu',
    unknownLocation: 'Lieu inconnu',
    unknownValue: 'inconnue',
    rowTypes: {
      canonicalFact: 'fait canonique',
      actualPosition: 'position réelle',
      contestedBelief: 'croyance contestée',
      fact: 'fait',
      belief: 'croyance',
    },
    filters: {
      all: 'Tous',
      identities: 'Identités',
      positions: 'Positions',
      statuses: 'Statuts',
      abilities: 'Pouvoirs',
      affiliations: 'Affiliations',
      events: 'Événements',
    },
  },

  factions: {
    seoTitle: 'Renseignements sur les factions',
    seoDescription:
      'Examinez les alliances, les conflits et les membres connus qui façonnent la guerre de succession du Black Whale — factions princières, familles mafieuses, Hunters et Brigade fantôme.',
    breadcrumb: 'Factions',
    eyebrow: 'Renseignement stratégique · Black Whale',
    title: 'Réseau des factions',
    intro:
      'Repérez qui coopère, qui se fait manipuler et où le conflit a éclaté. Chaque lien renvoie au chapitre qui l’établit.',
    factions: 'Factions',
    knownTies: 'Liens connus',
    affiliatedPeople: 'Personnes affiliées',
    spoilerNotice: (chapter) =>
      `Renseignements limités au chapitre ${chapter}. Les liens ultérieurs restent masqués.`,
    indexLabel: 'Index des factions',
    chooseFaction: 'Choisir une faction',
    searchFactions: 'Rechercher une faction',
    searchPlaceholder: 'Rechercher dans le réseau…',
    factionSummary: (members, ties) =>
      `${members} membre${members === 1 ? '' : 's'} · ${ties} lien${ties === 1 ? '' : 's'}`,
    emptyIndex: 'Aucune faction ne correspond à cette recherche.',
    selectedDossier: (index) => `Dossier sélectionné · ${index}`,
    knownConnections: 'Liens connus',
    filterConnections: 'Filtrer les liens',
    relationTypes: {
      all: 'tous',
      alliance: 'alliance',
      cooperation: 'coopération',
      conflict: 'conflit',
      control: 'contrôle',
      patronage: 'protection',
    },
    establishedIn: (chapter) => `Établi au chap. ${chapter}`,
    signalAbsent: 'Signal absent',
    noConnection: 'Aucun lien documenté',
    noConnectionCopy:
      'Cela ne veut pas dire que la faction est neutre — seulement que le dossier actuel ne contient aucun lien appuyé par un chapitre correspondant à ce filtre.',
    knownPersonnel: 'Personnel connu',
    recordCount: (count) => `${count} fiche${count === 1 ? '' : 's'}`,
    affiliationConfirmed: 'Affiliation confirmée',
    noPersonnel: 'Aucun membre nommé n’est confirmé dans le catalogue actuel.',
  },

  palette: {
    dialogLabel: 'Navigation rapide',
    searchLabel: 'Rechercher une destination du site',
    placeholder: 'Où voulez-vous aller ?',
    empty: (query) => `Aucune destination ne correspond à « ${query} ».`,
    enterHint: 'Entrée pour ouvrir le premier résultat',
    shortcutHint: '⌘K partout',
    groups: {
      primary: 'Principal',
      dossier: 'Dossier',
    },
    destinations: {
      ship: 'Explorer le Black Whale',
      timeline: 'Ouvrir la chronologie',
      characters: 'Chercher dans le registre des passagers',
      perspectives: 'Examiner les savoirs des personnages',
      abilities: 'Parcourir l’archive des pouvoirs',
      compare: 'Comparer les points de vue',
      relationships: 'Voir le réseau des factions',
      simulations: 'Lancer des simulations',
    },
  },

  voyage: {
    label: 'Avancement du voyage du Black Whale',
    shipTime: 'Temps du navire · Dernier relevé canonique',
    day: (day) => `Jour ${day}`,
    daysRemaining: 'jours restants',
    progressLabel: 'Avancement du voyage',
    valueText: (day, total) => `Jour ${day} sur ${total}`,
    departure: 'Départ',
    finalCheck: 'Dernier contrôle',
    newContinent: 'Nouveau Continent',
    territorialWaters: 'Eaux territoriales',
    waterSplit: '3 semaines en eaux connues · 5 semaines en eaux inconnues',
  },

  prophecy: {
    sheetCode: 'LOVELY GHOSTWRITER · FICHE APOCRYPHE',
    covers: 'Couvre',
    foretells: 'Prédit',
    desireLabel: 'Ce que veut le sujet',
    unwritten:
      'La page de ce sujet n’a jamais été écrite — le pouvoir ne peut pas prédire l’avenir de celui qui le détient.',
    glossSummary: 'Lire la glose — elle nomme les événements que le poème ne fait qu’effleurer',
    footer:
      'Écrite dans le style des poèmes de Neon Nostrade. Lovely Ghostwriter avait déjà disparu de Skill Hunter au départ du Black Whale : cette fiche est une reconstruction, pas un document.',
  },

  audio: {
    sealedOff: 'Thème du voyage scellé par Three Monkeys — désactiver',
    turnOff: 'Désactiver le thème du voyage',
    turnOn: 'Écouter le thème du voyage',
    sealed: 'Scellé',
    theme: 'Thème',
  },

  voyageArt: {
    vessel: 'Black Whale 1',
    route: 'Kakin → Nouveau Continent',
    title: 'Le Black Whale 1 en mer',
    description:
      'Le colossal navire d’expédition en forme de baleine porte le pont royal 1 au-dessus de ses cinq ponts, fendant les houles d’un océan sombre.',
    specsHull: 'Semi-submersible · 41 ponts',
    specsPassengers: '200 000 passagers',
  },

  nen: {
    forcedZetsu: 'ZETSU FORCÉ',
    nenSealed: (remaining) => `Nen scellé · ${remaining}`,
    zetsuCost: 'Emperor Time a consumé une année de vie.',
    changeHatsu: 'Changer de Hatsu',
    activeHatsu: (owner) => `HATSU ACTIF · ${owner}`,
    release: 'Zetsu · relâcher',
    activateAHatsu: 'Activer un Hatsu',
    pickerLabel: 'Choix du Hatsu',
    globalAura: 'SYSTÈME D’AURA GLOBAL',
    activateTechnique: 'Activer une technique',
    searchHatsu: 'Rechercher un Hatsu',
    searchPlaceholder: 'Technique ou utilisateur…',
    pickerFooter: (count) =>
      `${count} techniques connues · l’activation persiste pendant la navigation`,
    gateBadge: 'Rien à y faire',
    gateFooter: (usable, reason) => `${usable} utilisables ici · ${reason}`,
    why: 'POURQUOI ?',
    projectedEffects: 'EFFETS PROJETÉS',
    noProjectedEffects: 'Aucun effet projetable dans cet état.',
    noTarget: 'aucune cible',
    masked: 'masqué',
    maskedTitle: 'In : réel mais invisible hors Gyo',
    postMortem: 'post-mortem',
    postMortemTitle: 'Survit à la mort de l’utilisateur',
    cost: (label) => `Coût : ${label}`,
    planStatus: {
      AVAILABLE: 'Action disponible',
      LOCKED: 'Action verrouillée',
      UNKNOWN: 'Conditions non révélées par le canon',
      FORBIDDEN: 'Action refusée par le moteur',
    },
    parallelFuture: 'FUTUR PARALLÈLE',
    ended: 'TERMINÉ',
    replayLastEvents: 'Rejouer les cinq derniers événements',
    guardianLabel: 'KACHO · NEN POST-MORTEM',
    portalStart: 'DÉPART',
    portalReturn: 'RETOUR',
    enterTunnel: 'Entrer dans le tunnel',
    crossBack: 'Revenir',
    culdceptAcquiring: 'CULDCEPT · ACQUISITION',
    skillHunter: 'SKILL HUNTER',
    useStolenControl: 'Utiliser le contrôle volé',
    astralDouble: 'DOUBLE ASTRAL',
    bodyRemains: 'Le corps reste sur place',
    followAsDouble: 'Suivre la route en tant que double →',
    activateCaptured: 'Activer le Hatsu capturé',
    noKnownHatsu: 'Aucun Hatsu connu',
    lifeConsumed: (hours) => `VIE CONSUMÉE · ${hours} / 8 760 H`,
    trays: {
      pocket: 'FUN FUN CLOTH',
      vacuum: 'BLINKY STORAGE',
      relay: 'RELAIS DE TRANSPORT',
      hidden: 'ESPACE CACHÉ',
    },
    captured: {
      inherit: 'BENJAMIN BATON',
      capture: 'CARTE CULDCEPT',
      abilityLoan: 'STEALTH DOLPHIN · PRÊT À USAGE UNIQUE',
      steal: 'STEAL CHAIN · INDEX DOLPHIN',
    },
  },

  mapUi: {
    regionLabel: 'Carte interactive des ponts',
    unmappedArea: 'Zone non cartographiée',
    gapEyebrow: 'Lacune cartographique · scan local indisponible',
    gapCopy:
      'Cette zone est indexée dans les archives, mais aucun plan local vérifié n’a été retrouvé.',
    returnToTierMap: 'Revenir à la carte du pont',
    mapNotFound: (tier) => `Carte de ${tier} introuvable`,
    backToTier: '← Retour au pont',
    canonNote: 'Zones canoniques · géométrie schématique',
    canonNoteTitle:
      'Les zones et le mobilier nommés suivent les planches publiées du manga ; les distances et la géométrie non montrée sont schématiques.',
    zoomControls: 'Commandes de zoom de la carte',
    zoomIn: 'Zoomer',
    zoomOut: 'Dézoomer',
    resetView: 'Réinitialiser la vue',
    keyboardZoom: 'zoom',
    keyboardReset: 'réinitialiser',
    locationDetails: 'Détails du lieu',
    closeLocationDetails: 'Fermer les détails du lieu',
    charactersHere: 'Personnages présents à cet endroit',
    noCharacterHere: 'Aucun personnage suivi n’est présent à l’événement sélectionné.',
    walkThere: 'Y aller à pied',
    derivedFrom: 'Établi à partir des relevés de présence de l’événement sélectionné.',
    unknownLocationTitle: 'Position inconnue',
    closeUnknownPositions: 'Fermer les positions inconnues',
    bodiesWithoutLocation: (count) => `${count} corps sans position cartographiée`,
    identifiedSplit: (identified, unknown) => `${identified} identifiés · ${unknown} inconnus`,
    everyBodyMapped: 'Chaque corps suivi a une position cartographiée à cet événement.',
    directObservation: 'Observation directe',
  },

  perspectiveUi: {
    selectorLabel: 'Sélecteur de point de vue',
    perspective: 'Point de vue',
    tracking: 'Suivi',
    chooseTrackingMode: 'Choisir le mode de suivi',
    followOptions: {
      consciousness: 'Suivre la conscience',
      body: 'Suivre le corps',
      appearance: 'Suivre l’apparence publique',
    },
    whyLabel: 'Pourquoi cette information',
    whyTitle: 'Pourquoi vois-je ceci ?',
    character: 'Personnage',
    displayedValue: 'Valeur affichée',
    source: 'Source',
    observation: 'Observation',
    freshness: 'Fraîcheur',
    knowledgeStatus: 'État du savoir',
    knowledgeSource: 'Source du savoir',
    canonicalReality: 'Réalité canonique',
    statusAria: (label, state) => `${label} : ${state}`,
    differenceType: 'Type d’écart',
    staleAria: (lastConfirmed) => `Information périmée depuis ${lastConfirmed}`,
    staleLabel: (lastConfirmed) => `Dernière information : ${lastConfirmed}`,
    streamsLabel: 'Chronologie à plusieurs flux',
    streams: {
      reality: 'Réalité',
      body: 'Corps',
      consciousness: 'Conscience',
      knowledge: 'Savoirs',
    },
    transferLabel: 'Transition de transfert de conscience',
    originBody: 'Corps d’origine',
    destinationBody: 'Corps de destination',
    contextLabel: 'Contexte du point de vue',
    spoilersUpTo: (limit) => `Spoilers <= ${limit}`,
    allChapters: 'tous',
    apparentIdentity: 'Apparence',
    mode: 'Mode :',
    comparisonLabel: 'Comparaison des points de vue',
    legendLabel: 'Légende de la comparaison',
    codes: 'Codes',
    codeLegend: {
      same: 'cohérent entre A et B',
      leftOnly: 'information seulement chez A',
      rightOnly: 'information seulement chez B',
      contradiction: 'contradiction explicite',
      confidenceGap: 'écart de certitude',
      temporal: 'divergence temporelle',
    },
    markerAria: (label, certainty) => `${label} (${certainty})`,
    markerPosition: (identity, location, status) => `${identity}, ${location}, ${status}`,
    unknownPosition: 'position inconnue',
    unknownStatusLower: 'statut inconnu',
    unknownStatus: 'Statut inconnu',
    unspecifiedLocation: 'Lieu non précisé',
    outsideTier: 'Hors des ponts',
    transferredConsciousness: 'Conscience transférée',
    assumedIdentity: 'Identité supposée',
  },

  map: {
    unknownBody: 'Corps inconnu',
    outsideTier: 'Hors des ponts',
    unknownPosition: 'Position inconnue',
    unknownFuturePosition: 'Position future inconnue',
    parallelFuture: 'Futur parallèle',
    positionInChapter: (chapter) => `Position au chapitre ${chapter}`,
    futureIdentity: (name, chapter) => `${name} · Chap. ${chapter}`,
    assumedIdentity: 'Identité supposée',
    unknownIndividual: 'Individu inconnu',
    activeSuspicion: 'Soupçon actif',
    structuralPresence: 'Présence structurelle',
    factSource: (predicate) => `Fait : ${predicate}`,
    beliefSource: (predicate) => `Croyance : ${predicate}`,
    roomConfirmed: 'Salle confirmée · position dans la salle non représentée',
    spotInferred: 'Position dans la salle déduite de la scène, non représentée',
    sinceEvent: (eventId) => `depuis ${eventId}`,
    unknownEvent: 'événement inconnu',
    unidentifiedIndividual: 'Individu non identifié',
    knownIdentity: 'identité connue',
    unknownIdentity: 'identité inconnue',
    temporal: {
      assumedPosition: 'Position supposée',
      assumedDetail: 'Présence probable, non confirmée',
      lastKnown: 'Dernière position connue',
      lastKnownDetail: 'Information peut-être périmée',
      unknownStatus: 'Statut inconnu',
      unknownDetail: 'Niveau de certitude non fourni',
      confirmedPeriod: 'Confirmée sur une période',
      periodDetail: (from, until) => `Événements ${from} à ${until}`,
      confirmedAtEvent: 'Confirmée à cet événement',
      eventDetail: (sequence) => `Événement ${sequence}`,
      confirmedInChapter: 'Confirmée durant ce chapitre',
      confirmedPresence: 'Présence confirmée',
      sinceDetail: (sequence) => `Depuis l’événement ${sequence}`,
    },
  },

  ship: {
    seoTitle: 'Carte du Black Whale — Hunter × Hunter',
    seoDescription:
      'Explorez les cinq ponts du Black Whale pont par pont : les salles, les positions connues des personnages et le point de vue de n’importe quel passager, chapitre par chapitre.',
    breadcrumb: 'Carte du navire',
    eyebrow: 'Expédition du Continent Noir',
    intro: 'Cartographie tactique des ponts, des présences et des zones d’influence.',
    statusLabel: 'État de la carte',
    event: 'Événement',
    eventValue: (chapter, sequence) => `Chap. ${chapter} · Év. ${sequence}`,
    activeZone: 'Zone active',
    perspective: 'Point de vue',
    canonVisible: 'Canon visible',
    compareWithCanon: 'Comparer au canon',
    comparePerspectives: 'Comparer les points de vue',
    navigation: 'Navigation',
    shipDecks: 'Ponts du navire',
    decksNavLabel: 'Ponts du Black Whale',
    overview: 'Vue d’ensemble',
    shipStructure: 'Coupe longitudinale',
    tierLabel: (tier) => `Pont ${tier}`,
    unmodelledDecks: (metres) => `${metres} m de ponts non reconstruits`,
    superstructure: (decks: number) =>
      `Superstructure du paquebot — ${decks} ponts non reconstruits`,
    tierSummaries: [
      'Famille royale et VVIP',
      'VIP et services',
      'Public et médical',
      'Équipage et fret',
      'Machines et stockage',
    ],
    factionsLabel: 'Factions',
    factionsActive: (count) => `${count} active${count === 1 ? '' : 's'}`,
    clearFactionFilters: 'Effacer les filtres de faction',
    beyondLineage: {
      label: 'Lignée de Beyond',
      filterLabel: 'Filtrer la carte par la lignée de Beyond',
      aboard: (count) => `${count} à bord`,
      all: 'Tout le monde',
      any: 'Ses enfants',
      confirmed: 'Marqués',
      suspected: 'Soupçonnés',
      note: 'Se croise avec les filtres de faction : les marqués portent la tache de naissance, les soupçonnés n’en ont que la rumeur.',
    },
    factions: {
      princes: 'Maisons royales',
      guards: 'Garde royale',
      hunters: 'Hunters',
      spider: 'Brigade fantôme',
      mafia: 'Familles mafieuses',
    },
    intelligenceLabel: 'Renseignements actuels de la carte',
    currentSignal: 'Signal actuel',
    tracked: 'Suivis',
    zones: 'Zones',
    clearanceLabel: 'Habilitation des archives',
    accessLevel: 'Niveau d’accès',
    withheld: 'Certaines parties sont retenues par ordre de la Couronne de Kakin',
    track: 'Suivre',
    trackAria: 'Suivre rapidement un point de vue',
    liveData: 'Données synchronisées en direct',
    mapHint: 'Glissez pour naviguer · Molette pour zoomer',
    mapRegion: 'Carte interactive du Black Whale',
    unresolved: 'NON RÉSOLU',
    structuralLevel: 'NIVEAU STRUCTUREL',
    activeScan: 'SCAN ACTIF',
    scanReadout: (zones, presences) =>
      `${zones} zones cartographiées · ${presences} présences suivies`,
    assessmentLabel: 'Évaluation des renseignements en cours',
    activeEnvironment: 'Environnement actif',
    humanDensity: 'Densité humaine',
    threatAssessment: 'Évaluation de la menace',
    incidentMarker: 'Marqueur d’incident',
    surveillance: 'Surveillance',
    nenPhenomenon: 'Phénomène de Nen',
    unverified: 'NON VÉRIFIÉ',
    anomalyCaveat: 'N’attribuez aucune intention · contamination de l’observateur possible',
    interceptedReport: 'Rapport intercepté',
    interceptCopy: {
      lead: 'La source',
      mid: 'signale que',
      tail: 'a franchi la limite sécurisée sans relevé de corps correspondant.',
    },
    chainOfCustody: 'CHAÎNE DE CUSTODIE CONTESTÉE',
    level: (level) => `NIVEAU ${level}`,
    pointOfView: 'Point de vue',
    observationFilter: 'Filtre d’observation',
    mapLegend: 'Légende de la carte',
    temporalCertainty: 'Certitude temporelle',
    legendLabel: 'Couleurs par certitude temporelle',
    legend: {
      currentEvent: 'Événement courant',
      confirmedPeriod: 'Période confirmée',
      currentChapter: 'Chapitre courant',
      confirmed: 'Confirmée',
      assumed: 'Supposée',
      lastKnown: 'Dernière position connue',
      unknown: 'Inconnue',
    },
    unknownPositions: (count) => `Positions inconnues (${count})`,
    timeline: 'Chronologie',
    currentState: 'État actuel',
    flashbackBadge: '↶ FLASH-BACK ·',
    chapterBadge: 'CHAP',
    eventBadge: 'ÉV',
    timelineEvent: 'Événement de la chronologie',
    noEvents: 'Aucun événement disponible.',
    readerView: 'Vue du lecteur',
    localArea: 'Zone locale',
    followLabels: {
      consciousness: 'suivre la conscience',
      body: 'suivre le corps',
      appearance: 'suivre l’apparence publique',
    },
    timelinePoints: {
      canonicalEvent: 'Événement canonique',
      bodyMovement: 'Déplacement du corps',
      biologicalState: 'État biologique',
      mentalAnchor: 'Ancrage mental',
      transfer: 'Transfert',
      informationReceived: 'Information reçue',
      perspectiveUpdate: 'Mise à jour du point de vue',
      spoilerFiltered: 'Canon filtré des spoilers',
      subjectiveView: 'Point de vue subjectif',
    },
    deckClearance: {
      overview: 'Scan global',
      'tier-1': 'Habilitation royale',
      'tier-1-b': 'Habilitation royale',
      'tier-1-c': 'Habilitation royale',
      'tier-2': 'Habilitation VIP',
      'tier-3': 'Accès public',
      'tier-3-b': 'Accès public',
      'tier-3-c': 'Accès public',
      'tier-4': 'Habilitation équipage',
      'tier-4-b': 'Habilitation équipage',
      'tier-5': 'Systèmes réservés',
      'tier-5-b': 'Systèmes réservés',
    },
    tiers: {
      overview: {
        title: 'Vue d’ensemble du navire',
        subtitle: 'Cinq sociétés sous une seule coque',
        clearance: 'ARCHIVES / GLOBAL',
        pressure: 'Contrôle en couches',
        danger: 'ÉLEVÉ',
        signal: 'Surveillance inter-ponts active',
        anomaly: 'Les signatures d’aura parasite restent inexpliquées',
        report:
          'Les manifestes de passagers contredisent les comptages de sécurité sur les ponts inférieurs.',
      },
      'tier-1': {
        title: 'Enceinte royale',
        subtitle: 'Calme cérémoniel · guerre de succession dissimulée',
        clearance: 'KAKIN / ROYAL',
        pressure: 'Hostilité silencieuse',
        danger: 'GRAVE',
        signal: 'Armées privées surveillant tous les couloirs',
        anomaly: 'Plusieurs entités gardiennes déduites · observation directe impossible',
        report: 'Quatre morts dans la salle 1014. Cause censurée par l’autorité royale.',
      },
      'tier-1-b': {
        title: 'Pont de la garnison',
        subtitle: 'Chambrées, geôles et tribunal · un pont au-dessus du pont royal',
        clearance: 'KAKIN / ROYAL',
        pressure: 'Force armée résidente',
        danger: 'GRAVE',
        signal: 'Relève de garde entre les geôles et les chambrées',
        anomaly: 'L’étage de ces blocs est celui de la reconstruction, aucune page ne le donne',
        report: 'Le prisonnier de haute sécurité reste sous garde permanente des Zodiaques.',
      },
      'tier-1-c': {
        title: 'Pont des hôtes',
        subtitle: 'Casino et bloc des reines · deux ponts au-dessus du pont royal',
        clearance: 'KAKIN / ROYAL',
        pressure: 'Loisir surveillé',
        danger: 'ÉLEVÉ',
        signal: 'Écoutes signalées autour des tables de jeu',
        anomaly: 'L’étage de ces blocs est celui de la reconstruction, aucune page ne le donne',
        report: 'Les huit chambres du bloc des reines ne sont attribuées par aucun plan.',
      },
      'tier-2': {
        title: 'Quartier VVIP',
        subtitle: 'Privilèges derrière un accès contrôlé',
        clearance: 'VVIP / BLEU',
        pressure: 'Accès contrôlé',
        danger: 'SOUS GARDE',
        signal: 'Voies de détention et de transit surveillées',
        anomaly: 'Aura résiduelle détectée près des suites réservées',
        report: 'Un ordre d’acheminement intercepté mentionne une zone de rétention non déclarée.',
      },
      'tier-3': {
        title: 'Pont civique',
        subtitle: 'Hôpitaux, tribunaux et circulation publique',
        clearance: 'CIVIL / AMBRE',
        pressure: 'Surcharge d’informations',
        danger: 'INSTABLE',
        signal: 'Flux du Bureau de la Justice partiellement synchronisés',
        anomaly: 'Activité de Nen non attribuée signalée par des canaux civils',
        report: 'Les témoignages se contredisent après une disparition près du quartier médical.',
      },
      'tier-3-b': {
        title: 'Pont de première classe',
        subtitle: 'Cabines et une chambre-piège · un étage au-dessus du pont civique',
        clearance: 'CIVIL / AMBRE',
        pressure: 'Calme payant',
        danger: 'SOUS GARDE',
        signal: 'Ronde de coursive plus rare que le manifeste ne l’exige',
        anomaly: 'L’étage de ces cabines se lit sur la coupe, aucune page ne le dessine',
        report: 'La chambre 3101 répond à une réservation qu’aucune ligne du registre ne porte.',
      },
      'tier-3-c': {
        title: 'Pont des cabines ordinaires',
        subtitle: 'Les cabines de niveau 3 · l’étage le plus haut du pont',
        clearance: 'CIVIL / AMBRE',
        pressure: 'Promiscuité',
        danger: 'INSTABLE',
        signal: 'Couloir de rassemblement annoncé deux fois par jour',
        anomaly: 'L’étage de ces cabines se lit sur la coupe, aucune page ne le dessine',
        report: 'Les comptages de cabines dépassent les couchettes que le bloc dessine.',
      },
      'tier-4': {
        title: 'Passage industriel',
        subtitle: 'Routes de fret disputées par trois familles',
        clearance: 'ÉQUIPAGE / ROUGE',
        pressure: 'Frictions entre factions',
        danger: 'CRITIQUE',
        signal: 'Couloirs aveugles et relais mafieux détectés',
        anomaly: 'Discontinuités spatiales signalées par plusieurs équipes',
        report:
          'Trois transmissions interceptées utilisent des codes de position mutuellement exclusifs.',
      },
      'tier-4-b': {
        title: 'Étage Ei-I',
        subtitle: 'Un bureau de famille, et un pont qui ne porte rien d’autre',
        clearance: 'ÉQUIPAGE / ROUGE',
        pressure: 'Frictions entre clans',
        danger: 'CRITIQUE',
        signal: 'Trafic de relais sans terminal déclaré',
        anomaly: 'La hauteur de ce bureau se lit sur la coupe, aucune page ne la dessine',
        report: 'Le bureau est déclaré à une adresse que le plan du pont ne recense pas.',
      },
      'tier-5': {
        title: 'Machinerie inférieure',
        subtitle: 'Surpopulation, pénurie et contrôle défaillant',
        clearance: 'RÉSERVÉ / NOIR',
        pressure: 'Effondrement systémique',
        danger: 'EXTRÊME',
        signal: 'Couverture de surveillance officielle sous le seuil',
        anomaly: 'Éclosion d’aura hostile · classification indisponible',
        report:
          'Registre des victimes scellé. Dix-sept identifiants de passagers ne résolvent plus.',
      },
      'tier-5-b': {
        title: 'Pont des cabines de 5e classe',
        subtitle: 'Les cabines ordinaires et la baie 37564 · un étage au-dessus du hangar',
        clearance: 'RÉSERVÉ / NOIR',
        pressure: 'Promiscuité sans contrôle',
        danger: 'EXTRÊME',
        signal: 'Aucune patrouille consignée à cet étage depuis l’appareillage',
        anomaly: 'L’étage de ces cabines se lit sur la coupe, aucune page ne le dessine',
        report: 'Une baie du couloir des cabines est numérotée et ne figure sur aucune liste.',
      },
    },
  },

  characterDetail: {
    seoTitle: (name) => `${name} · Rôle et déplacements`,
    fallbackDescription: (name) =>
      `Rôle à bord, faction et relevé des déplacements chapitre par chapitre de ${name} sur le Black Whale.`,
    breadcrumbLabel: 'Fil d’Ariane',
    registryLink: 'Registre des passagers',
    subjectPrefix: 'SUJET',
    eyebrow: 'Rôle à bord · Relevé des déplacements',
    alsoKnownAs: 'Aussi appelé',
    roleAboard: 'Rôle à bord',
    noConfirmedRole: 'Aucun rôle confirmé',
    locateOnShip: 'Localiser sur le navire',
    firstRecord: 'Première mention',
    chapterUpper: (chapter) => `CHAP. ${chapter}`,
    latestPosition: 'Dernière position',
    reportedStatus: 'Statut signalé',
    unconfirmed: 'Non confirmé',
    latestTransition: 'Dernière transition',
    noneRecorded: 'Aucune consignée',
    unknownLocation: 'Inconnue / peut-être hors du navire',
    fileIndex: 'Sommaire du dossier',
    dossierSections: 'Sections du dossier',
    scope: 'Périmètre',
    scopeNote:
      'Seuls le rôle opérationnel, la position du corps, la position de la conscience et les états de continuité sont retenus.',
    sections: {
      role: 'Rôle à bord',
      identity: 'Continuité d’identité',
      biography: 'Biographie',
      nen: 'Nen et pouvoirs',
      prophecy: 'Fiche du ghostwriter',
      appearances: 'Apparitions dans le manga',
      trajectory: 'Trajectoire par chapitre',
    },
    codes: {
      operationalPosition: 'POSITION OPÉRATIONNELLE',
      identityContinuity: 'IDENTITÉ / CONTINUITÉ',
      characterRecord: 'FICHE DE PERSONNAGE',
      auraProfile: 'PROFIL D’AURA',
      apocryphal: 'APOCRYPHE · LOVELY GHOSTWRITER',
      sourceIndex: 'INDEX DES SOURCES',
      trajectory: 'CORPS · CONSCIENCE · ESPACE SPÉCIAL',
    },
    currentFunction: 'Fonction actuelle',
    currentArea: 'Zone actuelle / dernière connue',
    statusUnconfirmed: 'Statut non confirmé',
    catalogueAffiliation: 'Affiliation au catalogue',
    identityTitle: 'Le corps et l’identité diffèrent',
    relatedRecord: 'Fiche liée',
    abilitiesAndPowers: 'CAPACITÉS ET POUVOIRS',
    primaryType: 'CATÉGORIE PRINCIPALE',
    activateAbility: (name, description) => `Activer ${name} : ${description}`,
    hatsuActive: 'HATSU ACTIF',
    clickToActivate: 'CLIQUEZ SUR LA DESCRIPTION POUR ACTIVER',
    noAppearanceRecord: 'Aucun relevé d’apparition individuel documenté.',
    noAppearanceCopy:
      'Hunterpedia ne fournit pas de tableau d’apparitions dédié à l’arc de la succession pour ce personnage.',
    battles: 'COMBATS',
    competitions: 'COMPÉTITIONS',
    trajectoryIntro:
      'Le corps et la conscience sont suivis séparément. « Inconnue » reste une position à part entière ; les transferts, les morts, les copies, les passages dimensionnels et les sorties possibles du navire restent explicites.',
    positionsCount: (count) => (count > 1 ? `${count} POSITIONS` : '1 POSITION'),
    routeWithinChapter: 'TRAJET DANS LE CHAPITRE',
    bodyConsciousnessPositions: 'POSITIONS CORPS / CONSCIENCE',
    positionInChapter: 'POSITION DANS LE CHAPITRE',
    noTransition: 'Aucune transition de chapitre consignée.',
    lastKnownPosition: (location) => `Position actuelle ou dernière connue : ${location}.`,
    states: {
      ALIVE: 'En vie',
      INJURED: 'Blessé',
      UNCONSCIOUS: 'Inconscient',
      DEAD: 'Mort',
      DESTROYED: 'Détruit',
      PRESERVED: 'Corps conservé',
      UNKNOWN: 'Inconnu',
      ACTIVE: 'Conscience active',
      TRANSFERRED: 'Conscience transférée',
      SUPPRESSED: 'Conscience réprimée',
      DORMANT: 'Conscience dormante',
      DISCONNECTED: 'Conscience déconnectée',
      death: 'Mort',
      corpse: 'Corps localisé',
      soul: 'Âme / conscience',
      clone: 'Clone ou copie de Nen',
      impersonated: 'Identité usurpée',
      disguised: 'Présence déguisée',
      absent: 'Position inconnue',
      debut: 'Première localisation',
      appears: 'Localisé dans le chapitre',
      pictured: 'Position représentée',
    },
    kinds: {
      'body-location': 'Déplacement du corps',
      'body-state': 'État du corps',
      'consciousness-state': 'État de la conscience',
      'consciousness-location': 'Position de la conscience',
      appearance: 'Présence signalée',
    },
  },

  abilities: {
    seoTitle: 'Archive des pouvoirs de Nen',
    seoDescription:
      'Tous les pouvoirs de Nen documentés à bord du Black Whale — conditions, limitations et propriétaires, du Bungee Gum aux bêtes gardiennes des princes.',
    breadcrumb: 'Pouvoirs',
    title: 'Archive des pouvoirs de Nen',
    subtitle: 'Pouvoirs enregistrés dans le moteur narratif.',
    unknownCategory: 'Inconnue',
    noDescription: 'Aucune description disponible.',
    activate: 'Activer sur tout le site',
    activateAria: (name) => `Activer ${name} sur tout le site`,
    cost: (cost) => `Coût : ${cost}`,
    empty: 'Aucun pouvoir trouvé.',
  },

  simulations: {
    seoTitle: 'Laboratoire de simulation',
    seoDescription:
      'Dupliquez la chronologie canonique du Black Whale, appliquez les règles du Nen à une branche et observez le monde projeté sans toucher au canon.',
    breadcrumb: 'Simulations',
    eyebrow: 'NOYAU DU MONDE / LABORATOIRE DE BRANCHES',
    title: 'Laboratoire de simulation',
    intro:
      'Dupliquez le canon, appliquez les règles du Nen et observez le monde projeté sans modifier la chronologie canonique.',
    branchUnavailable: 'Branche indisponible',
    forkTitle: 'Dupliquer l’état canonique',
    canonicalEvent: 'Événement canonique',
    eventOption: (chapter, sequence, title) => `Chap. ${chapter} · ${sequence} — ${title}`,
    rulePolicy: 'Politique de règles',
    policies: {
      ruleCompatible: 'Compatible avec les règles',
      strictCanon: 'Canon strict',
      sandbox: 'Bac à sable',
    },
    createBranch: 'Créer la branche',
    branchStateTitle: 'État de la branche',
    id: 'ID',
    policy: 'Politique',
    fork: 'Duplication',
    forkValue: (chapter, ordinal) => `Chap. ${chapter} / ordinal ${ordinal}`,
    currentCursor: 'Curseur actuel',
    entities: 'Entités',
    activeEffects: 'Effets actifs',
    executeTitle: 'Exécuter une capacité',
    executeCopy:
      'Choisir une capacité, une de ses actions et une cible planifie l’action sur cette branche. Les conditions et les effets ci-dessous sont ceux du module — exactement ceux que le serveur applique à l’activation.',
    ability: 'Capacité',
    action: 'Action',
    noActions: 'Aucune action disponible',
    actorReference: 'Référence de l’acteur',
    targetEntity: 'Entité cible',
    selectTarget: 'Aucune cible',
    planAction: 'Planifier l’action',
    runAction: (label) => `Exécuter : ${label}`,
    moveTitle: 'Déplacer une entité',
    moveCopy:
      'L’autre action de branche du noyau : mettre quelqu’un là où le canon ne le met pas. Le déplacement ne vaut que pour cette branche.',
    moveEntity: 'Entité',
    moveDestination: 'Destination',
    moveSubmit: 'Déplacer dans cette branche',
    noMarkers: 'Cette branche ne place aucune entité sur les plans de pont.',
    markersElsewhere: (count) =>
      count === 1
        ? '1 entité se tient sur un autre pont.'
        : `${count} entités se tiennent sur d’autres ponts.`,
    sceneTitle: 'MapScene projetée',
    markers: 'marqueurs',
    effectLinks: 'liens d’effet',
    auraLayers: 'couches d’aura',
    noEffects: 'Aucun effet propre à cette branche n’a encore été émis.',
  },

  perspectives: {
    seoTitle: 'Points de vue et comparaison',
    seoDescription:
      'Vivez la guerre de succession par les yeux de chaque personnage : ce qu’il sait, ce qu’il ne fait que croire et là où ses informations sont périmées.',
    breadcrumb: 'Points de vue',
    title: 'Points de vue et comparaison',
    intro:
      'Explorez le monde subjectif d’un personnage à un instant précis, ou comparez les croyances de deux protagonistes.',
    openSubjectiveMap: 'Ouvrir la carte subjective',
    openKnowledgeMap: 'Ouvrir la carte des savoirs',
    openComparison: 'Comparaison des points de vue',
    pointInTime: 'Instant du récit (événement)',
    searchEventPlaceholder: 'Rechercher par titre ou chapitre...',
    eventOption: (chapter, title) => `Chap. ${chapter} — ${title}`,
    noEvents: 'Aucun événement trouvé.',
    observerA: 'Observateur A (obligatoire)',
    observerB: 'Observateur B (comparaison)',
    chooseCharacter: 'Choisir un personnage',
    noneSingleView: '(Aucun — vue simple)',
    selectPrompt: 'Choisissez un événement et au moins un observateur pour afficher les données.',
    identityState: 'État d’identité (V2)',
    occupiedBody: 'Corps occupé',
    activeConsciousness: 'Conscience active',
    subjectiveFacts: 'Faits et croyances subjectifs',
    factSubject: (predicate, subject) => `${predicate} (sujet : ${subject})`,
    noKnownFacts: 'Aucun fait connu récupéré.',
    differencesTitle: 'Contradictions et écarts de point de vue',
    knowsButNot: (knower, other) => `${knower} le sait, mais pas ${other}.`,
    contradiction: 'Contradiction',
    versus: 'CONTRE',
    value: (value) => `Valeur : ${value}`,
    noDifferences: 'Aucun écart trouvé dans les informations connues des deux personnages.',
    perspectiveOf: (name) => `Point de vue de ${name}`,
    apparentIdentity: 'Identité apparente et état physique (moteur V2)',
    notFound: 'Introuvable',
    consciousness: 'Conscience',
    knowledgeBase: 'Base de savoirs et de croyances',
    contestedBelief: 'Croyance contestée',
    verifiedFact: 'Fait vérifié',
    subjectPrefix: 'Sujet :',
    noVerifiedKnowledge: 'Ce personnage n’a aucun savoir vérifié à cet instant du récit.',
    retrieving: 'Récupération des données de point de vue depuis le moteur...',
  },

  perspectiveDetail: {
    seoTitle: (character) => `Point de vue — ${character}`,
    seoDescription: (character) =>
      `Le Black Whale tel que ${character} le comprend : sa chronologie, ses sources et les informations qui ne sont plus à jour.`,
    title: (character) => `Point de vue de ${character}`,
    intro:
      'Carte et chronologie subjectives : ce que ce personnage sait, croit, soupçonne ou ignore.',
    subjectiveMap: 'Carte subjective',
    confirmedPosition: 'Position confirmée',
    likelyPosition: 'Position probable',
    lastKnownPosition: 'Dernière position connue',
    activeKnowledge: 'Savoirs actifs',
    apparentIdentity: 'Identité apparente',
    dissonant: 'dissonance d’identité',
    cursor: 'Instant',
    apply: 'Appliquer',
    noEvents: 'Aucun événement canonique n’est disponible à votre limite de spoiler.',
    noKnowledge: 'L’archive ne consigne aucun savoir pour ce personnage à cet instant.',
    noPositions: 'L’archive ne place aucun corps visible par ce personnage à cet instant.',
    markersElsewhere: (count) =>
      count === 1
        ? '1 corps observé sur un autre pont.'
        : `${count} corps observés sur d’autres ponts.`,
  },

  knowledgeDetail: {
    seoTitle: (character) => `Savoirs — ${character}`,
    seoDescription: (character) =>
      `Ce que ${character} sait, croit et n’a pas encore appris des événements à bord du Black Whale.`,
    title: (character) => `Carte des savoirs : ${character}`,
    intro: 'Une archive des savoirs, des soupçons, des rumeurs et des informations périmées.',
    informationState: 'État de l’information',
    graphTitle: 'Graphe des savoirs',
    since: (chapter) => `depuis le ch. ${chapter}`,
    between: (from, until) => `ch. ${from} → ch. ${until}`,
    toldBy: (source) => `rapporté par ${source}`,
    confidence: (percent) => `${percent} % de confiance`,
    noKnowledge: (character) =>
      `L’archive ne consigne aucun fait ni croyance de ${character} dans votre limite de spoiler.`,
    openPerspective: 'Ouvrir le point de vue',
    openProfile: 'Ouvrir la fiche',
  },

  bodyDetail: {
    seoTitle: (label) => `Corps — ${label}`,
    seoDescription: (label) =>
      `Relevé de continuité de ${label} : positions observées, états signalés et occupation par une conscience à bord du Black Whale.`,
    title: (label) => `Historique du corps : ${label}`,
    intro: 'Chronologie biologique, occupation par une conscience et apparence publique.',
    bodyType: 'Type de corps',
    owner: 'Propriétaire d’origine',
    occupants: 'Consciences consignées à l’intérieur',
  },

  consciousnessDetail: {
    seoTitle: (label) => `Conscience — ${label}`,
    seoDescription: (label) =>
      `Relevé des transferts de ${label} : le corps qu’elle occupe, le moment de chaque déplacement et le degré de certitude de chaque observation.`,
    title: (label) => `Historique de la conscience : ${label}`,
    intro: 'Suivi des transferts, des suppressions et des ancrages mentaux.',
    consciousnessType: 'Type de conscience',
    origin: 'Personnage d’origine',
    bodiesOccupied: 'Corps occupés',
  },

  identity: {
    continuityTitle: 'Relevé de continuité',
    noEntries: 'L’archive ne consigne rien pour cette entité dans votre limite de spoiler.',
    firstVisible: 'Première apparition',
    interval: (fromChapter, fromSequence, untilChapter, untilSequence) =>
      `ch. ${fromChapter}·${fromSequence} → ch. ${untilChapter}·${untilSequence}`,
    intervalOpen: (chapter, sequence) => `depuis le ch. ${chapter}·${sequence}`,
    fromEvent: (title) => `Événement : ${title}`,
    certaintyLabel: (certainty) => `Certitude : ${certainty}`,
    entryKind: {
      OCCUPANCY: 'Occupation',
      BODY_STATE: 'État du corps',
      PRESENCE: 'Position',
      APPEARANCE: 'Apparence',
      CONSCIOUSNESS_STATE: 'État de la conscience',
    },
    enums: {
      bodyType: {
        ORIGINAL: 'Corps d’origine',
        CLONE: 'Clone',
        COPY: 'Copie',
        CONSTRUCT: 'Construction de Nen',
        UNKNOWN: 'Inconnu',
      },
      consciousnessType: {
        ORIGINAL: 'Conscience d’origine',
        COPIED: 'Conscience copiée',
        ARTIFICIAL: 'Conscience artificielle',
        NEN_ENTITY: 'Entité de Nen',
        UNKNOWN: 'Inconnu',
      },
      occupancyType: {
        ORIGINAL: 'Occupe son propre corps',
        TRANSFERRED: 'Transférée dans ce corps',
        POSSESSED: 'Possède ce corps',
        CONTROLLED: 'Contrôle ce corps',
        EMPTY: 'Corps laissé vide',
        UNKNOWN: 'Occupation inconnue',
      },
      certainty: {
        CONFIRMED: 'confirmée',
        PROBABLE: 'probable',
        UNKNOWN: 'inconnue',
      },
      bodyState: {
        ALIVE: 'Vivant',
        INJURED: 'Blessé',
        UNCONSCIOUS: 'Inconscient',
        DEAD: 'Mort',
        DESTROYED: 'Détruit',
        PRESERVED: 'Conservé',
        UNKNOWN: 'État inconnu',
      },
      consciousnessState: {
        ACTIVE: 'Active',
        UNCONSCIOUS: 'Inconsciente',
        TRANSFERRED: 'Transférée',
        SUPPRESSED: 'Supprimée',
        DORMANT: 'En sommeil',
        DISCONNECTED: 'Déconnectée',
        DESTROYED: 'Détruite',
        UNKNOWN: 'État inconnu',
      },
      presencePrecision: {
        EXACT_ROOM: 'Située dans une salle',
        ZONE: 'Située dans une zone',
        TIER: 'Située sur un pont',
        UNKNOWN: 'Position inconnue',
      },
      presenceCertainty: {
        CONFIRMED: 'confirmée',
        PROBABLE: 'probable',
        LAST_KNOWN: 'dernière connue',
      },
      appearanceCause: {
        NATURAL: 'Apparence naturelle',
        TRANSFORMATION: 'Apparence transformée',
        DISGUISE: 'Déguisement',
        NEN_ABILITY: 'Apparence modifiée par le Nen',
        UNKNOWN: 'Cause inconnue',
      },
      acquisitionMethod: {
        DIRECT_OBSERVATION: 'vu de ses yeux',
        TOLD_BY_OTHER: 'rapporté par quelqu’un',
        DEDUCTION: 'déduit',
        NEN_ABILITY: 'appris par le Nen',
        DOCUMENT: 'lu dans un document',
        RUMOR: 'entendu comme rumeur',
        UNKNOWN: 'source inconnue',
      },
      epistemicRelation: {
        known: 'sait',
        confirmed: 'confirme',
        reported: 's’est fait dire',
        believed: 'croit',
        suspected: 'soupçonne',
        rumor: 'a entendu',
        rejected: 'rejette',
        outdated: 'savait',
        contradicted: 'doute de',
        unknown: 'ignore',
      },
    },
  },

  strategy: {
    hatsu: {
      canOnlyActivateInOwnZone: (name: string) =>
        `${name} ne peut être activé que dans la zone occupée par son utilisateur.`,
      requiresConfirmedHostile: (name: string) =>
        `${name} exige une présence hostile confirmée dans la zone ciblée.`,
      catsNamePassive:
        'Cat’s Name est un contre post-mortem passif et ne peut pas recevoir d’ordre d’activation.',
      chainJailRequiresSpider:
        'Chain Jail est interdit : aucune Araignée confirmée ne se trouve dans cette zone.',
      benjaminBatonRequiresDeath:
        'Benjamin Baton exige la mort préalable d’un soldat loyal éligible.',
    },
    errors: {
      oneOrderPerTurn: 'Une unité ne peut recevoir qu’un ordre par tour.',
      eliminatedUnitCannotReceiveOrders: 'Une unité éliminée ne peut plus recevoir d’ordre.',
      hatsuCannotBeActivated: 'Ce Hatsu ne peut pas être activé.',
      unknownAction: 'Un ordre utilise une action inconnue.',
      orderTargetsNonOwnedUnit: 'Un ordre vise une unité qui ne vous appartient pas.',
      unknownDestination: 'Destination inconnue dans cet état du monde.',
      unitDoesNotExist: 'Cette unité n’existe pas dans cet état du monde.',
    },
  },

  investigation: {
    replay: {
      dollAppears: {
        title: 'La poupée apparaît',
        description: 'Loberry seule voit la figure masquée derrière Furykov.',
      },
      allEyesDiverge: {
        title: 'Tous les regards dévient',
        description: 'Loberry crie et désigne une présence que personne d’autre ne peut trouver.',
      },
      fourCreaturesStrike: {
        title: 'Quatre créatures frappent',
        description: 'Les tsuchibokko matérialisés se fixent au cou de Barrigen.',
      },
      simultaneousDrain: {
        title: 'Drainage simultané',
        description: 'Les gardes voient les créatures et tentent de les arracher; le temps manque.',
      },
      barrigenIsDead: {
        title: 'Barrigen est mort',
        description: 'Les quatre créatures ont réduit quarante-quatre secondes à environ onze.',
      },
    },
    hatsu: {
      noGrip: 'Aucune prise',
      cannotEstablishInfo: (name: string) =>
        `${name} ne peut établir aucune information sur cette cible.`,
      usageDenied: 'Usage refusé',
      impossibleCost: 'Coût impossible',
      corroboratedSignal: 'Signal corroboré',
      conclusiveAnalysis: 'Analyse concluante',
      limitedResult: 'Résultat limité',
      requiresLifeHours: (hours: number) =>
        `Cette analyse exige ${hours} heures de vie disponibles.`,
      ethicalOrProceduralConditions:
        'Les conditions éthiques ou procédurales interdisent cet usage.',
      confirmsLimits: 'La capacité confirme ses propres limites sans produire de nouvelle preuve.',
      reinforcesInfo:
        'La capacité renforce une information existante sans la transformer en vérité absolue.',
      revealsCompatibleElements:
        'La capacité révèle les éléments compatibles avec ses conditions et son coût.',
      cannotEstablishNewInfo: (name: string) =>
        `${name} ne peut rien établir de nouveau sur cette cible dans les conditions présentes.`,
    },
  },
}
