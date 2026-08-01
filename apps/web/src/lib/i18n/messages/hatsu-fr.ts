import type { HatsuInteractionKind } from '$lib/nen/hatsuRegistry'

/**
 * The French rendering of the Hatsu registry.
 *
 * `hatsuRegistry.ts` stays the English source of truth — the audit tests count
 * and measure its entries — and this file overlays the French text on top of it,
 * keyed by the same ids.
 *
 * Naming follows what the French edition actually does with these techniques:
 *
 *  - A name the original writes in Latin script or as a katakana loanword is
 *    left alone (Bungee Gum, Emperor Time, Skill Hunter, Silent Majority…).
 *    The French edition prints those untranslated; `Lovely Ghostwriter` keeps
 *    its name and only carries a French gloss, and `Emperor Time` is quoted in
 *    English by French sources.
 *  - A name that is an English *translation* of a Japanese descriptive title
 *    gets its French equivalent. Kurapika's chains follow the renderings French
 *    sources use: chaîne du jugement, chaîne sacrée, chaîne-prison, chaîne de
 *    divination.
 *  - A name this archive coined as a description of an unnamed ability — the
 *    guardian beasts, `Aura Manipulation`, `Vehicle Transformation` — is
 *    translated as the description it is.
 *
 * Owner fields carry proper nouns and stay as they are, except the ones that are
 * descriptions rather than names (`Unknown Assassin`, `… Guardian Beast`).
 */
export interface HatsuTextOverride {
  name: string
  owner: string
  action: string
  instruction: string
  rule: string
  cost: string
}

export const hatsuFr: Record<string, HatsuTextOverride> = {
  'bungee-gum': {
    name: 'Bungee Gum',
    owner: 'Hisoka',
    action: 'Attacher le premier filament',
    instruction:
      'Reliez les personnages de la carte à portée d’émission ; recliquez une cible reliée pour rétracter tous les filaments vers le premier point d’ancrage.',
    rule: 'La force élastique croît avec la tension, les fils émis rompent au-delà de dix mètres et cinq secondes d’immobilité isolent les cibles reliées.',
    cost: 'Aura continue · portée et tension croissante',
  },
  'texture-surprise': {
    name: 'Texture Surprise',
    owner: 'Hisoka',
    action: 'Choisir une surface à falsifier',
    instruction:
      'Cliquez plusieurs fois sur une surface plane de la page pour faire défiler des textures truquées de papier, de métal, de peau et de camouflage, sans changer sa fonction.',
    rule: 'La couche d’aura ne change que l’apparence ; la surface d’origine et son comportement restent détectables au toucher.',
    cost: 'Peu d’aura · surface plane et limitée',
  },
  'emperor-time': {
    name: 'Emperor Time',
    owner: 'Kurapika',
    action: 'Agir à pleine efficacité',
    instruction:
      'Balayez une section entière à 100 % d’efficacité dans toutes les catégories à la fois ; chaque activation coûte trois heures de vie de plus sur la session.',
    rule: 'Les yeux écarlates donnent 100 % d’efficacité dans chaque catégorie de Nen, mais une année consumée impose cinq minutes de Zetsu.',
    cost: '1 seconde = 1 heure de vie',
  },
  'steal-chain': {
    name: 'Steal Chain',
    owner: 'Kurapika',
    action: 'Drainer le Hatsu d’une cible',
    instruction:
      'Enfoncez la seringue dans un personnage de la carte pour drainer son aura, le maintenir en Zetsu et conserver l’un de ses Hatsu répertoriés.',
    rule: 'La cible est forcée dans un état d’aura épuisée, tandis que le pouvoir volé devient disponible pour Kurapika.',
    cost: 'Contact, drainage maintenu et un pouvoir capturé',
  },
  'chain-jail': {
    name: 'Chaîne-prison',
    owner: 'Kurapika',
    action: 'Choisir une Araignée',
    instruction:
      'Entravez un membre de la Brigade fantôme en Zetsu forcé ; sélectionner quelqu’un d’autre viole le vœu fatal et met immédiatement fin au Hatsu.',
    rule: 'L’entrave absolue n’est utilisable que contre les Araignées et supprime totalement leur aura et leurs mouvements.',
    cost: 'La vie de Kurapika si elle sert contre une non-Araignée',
  },
  'dowsing-chain': {
    name: 'Chaîne de divination',
    owner: 'Kurapika',
    action: 'Sonder une cible',
    instruction:
      'Déplacez le pendule pour repérer les commandes proches, puis cliquez un texte ou une section pour tester son signal, entre incertitude et tromperie.',
    rule: 'La chaîne combine les indices disponibles, l’intuition et la concentration ; elle n’accorde aucune omniscience infaillible.',
    cost: 'Concentration soutenue et informations de contexte',
  },
  'benjamin-aura': {
    name: 'Manipulation d’aura',
    owner: 'Benjamin',
    action: 'Renforcer par le Ren',
    instruction:
      'Cliquez plusieurs fois une cible pour empiler jusqu’à cinq couches de Ren ; la cinquième déborde le manteau d’aura sur tout ce qui l’entoure.',
    rule: 'L’aura immense de Benjamin renforce la puissance physique et la défense proportionnellement à l’aura engagée.',
    cost: 'Aura croissante à chaque couche de renfort',
  },
  erigeron: {
    name: 'Erigeron',
    owner: 'Bill',
    action: 'Accélérer la croissance',
    instruction:
      'Cliquez des cibles pour accélérer leur croissance ; la vie ordinaire de la page germe vite, tandis que le Nen des personnages ne progresse que par petits paliers.',
    rule: 'La croissance est spectaculaire sur les plantes mais volontairement faible sur les utilisateurs de Nen inexpérimentés.',
    cost: 'Paumes près de la cible vivante · traitement répété',
  },
  'kurton-vehicle-transformation': {
    name: 'Transformation en véhicule',
    owner: 'Kurton',
    action: 'Embarquer un passager',
    instruction:
      'Embarquez jusqu’à cinq passagers de la page, puis recliquez l’un d’eux pour lancer tout le convoi sur leur aura commune.',
    rule: 'Kurton devient un véhicule dont la capacité est de cinq places et dont le carburant est fourni en symbiose par ses passagers.',
    cost: 'Aura partagée des passagers · limite de cinq places',
  },
  'little-eye': {
    name: 'Little Eye',
    owner: 'Sayird',
    action: 'Piloter l’insecte',
    instruction:
      'Posez la sphère sur un hôte, puis pilotez l’insecte de pièce en pièce ; visez la pièce où il est pour le rappeler. R change ses ordres (Piloté, Reconnaissance, Filmer) : en reconnaissance il prend une porte tout seul, et en mode Filmer viser sa pièce l’enregistre au lieu de le rappeler.',
    rule: 'L’objet possédé est un insecte volant enveloppé d’une aura bleue de Nen qui peut être contrôlé à distance pour filmer.',
    cost: 'Très peu d’aura · hôte insecte volant',
  },
  'cross-game': {
    name: 'Cross Game',
    owner: 'Mizaistom',
    action: 'Présenter la carte bleue',
    instruction:
      'Cliquez une cible via l’admission bleue, le contrôle jaune, l’entrave jaune inversée — qui se dissipe — puis le renvoi rouge.',
    rule: 'L’entrave ne s’active qu’après un avertissement ignoré, empêche le mouvement mais pas la parole, et peut être réappliquée.',
    cost: 'Effets de cartes brefs et réutilisables',
  },
  'beyond-sacrificial-curse': {
    name: 'Malédiction sacrificielle',
    owner: 'Beyond',
    action: 'Marquer la victime visée',
    instruction:
      'Choisissez la victime lointaine ; le sacrifié est choisi avec elle parmi les siens, puis dissimulé — utilisez le Gyo pour trouver la marque avant de la dépenser.',
    rule: 'La marque dormante s’éveille chez son porteur dès la naissance et ne tue la cible présélectionnée qu’à la mort de ce sacrifié.',
    cost: 'Enfant sacrifié préparé · mort · Nen post-mortem',
  },
  'benjamin-baton': {
    name: 'Benjamin Baton',
    owner: 'Benjamin',
    action: 'Identifier un soldat éligible',
    instruction:
      'Sélectionnez sur la carte des soldats loyaux décédés pour éveiller les étoiles de la paume et activer leurs Hatsu répertoriés depuis le panneau d’héritage.',
    rule: 'Seuls les diplômés loyaux et décédés de l’académie militaire transmettent leurs pouvoirs ; les pouvoirs actifs restent la propriété de Benjamin.',
    cost: 'La mort et une loyauté militaire jurée',
  },
  'air-blow': {
    name: 'Air Blow',
    owner: 'Benjamin / Vincent',
    action: 'Tirer le souffle de la paume',
    instruction:
      'Cliquez un élément à n’importe quelle distance pour lui retirer les protections qu’une autre technique y a posées ; rien n’est déplacé, rien n’est touché.',
    rule: 'L’attaque d’émission héritée frappe sans contact direct ; ses conditions complètes restent inconnues.',
    cost: 'Aura émise inconnue',
  },
  'secret-window': {
    name: 'Secret Window',
    owner: 'Benjamin / Musse',
    action: 'Attacher la chouette',
    instruction:
      'Attachez une chouette à un personnage de la carte pour garder un flux en direct et révéler les déplacements ou la mort consignés au chapitre suivant. Appuyez sur R pour choisir le hibou envoyé : libre dans le vaisseau, sur votre épaule, ou lâché sans visée.',
    rule: 'La chouette écoute à travers les cloisons, suit sa cible au toucher et conserve les images antérieures pour un examen ultérieur.',
    cost: 'Une chouette de surveillance attachée',
  },
  culdcept: {
    name: 'Culdcept',
    owner: 'Benjamin / Shikaku',
    action: 'Acquérir un pouvoir de Nen',
    instruction:
      'Cliquez un utilisateur de Nen, maintenez le rectangle d’aura pendant sa charge, puis activez le pouvoir acquis depuis sa carte Culdcept.',
    rule: 'Culdcept acquiert le Hatsu d’un autre utilisateur sous forme de carte ; la flèche invincible de Halkenburg le transperce et fait échouer l’acquisition.',
    cost: 'Mains jointes · rectangle d’aura chargé',
  },
  'parallel-future': {
    name: 'Parallel Future',
    owner: 'Tserriednich',
    action: 'Entrer dans le futur à dix secondes',
    instruction:
      'Observez pendant dix secondes les corps du chapitre suivant et cliquez les actions possibles pour laisser des rémanences prédites tout en choisissant une réalité divergente.',
    rule: 'Tout le monde sauf Tserriednich continue de percevoir la prédiction immuable, même quand ses actes réels changent.',
    cost: 'Zetsu complet · vision de dix secondes',
  },
  'grimmel-the-dissonance': {
    name: 'Grimmel the Dissonance',
    owner: 'Halkenburg',
    action: 'Rassembler la volonté collective',
    instruction:
      'Matérialisez l’arc, puis frappez un personnage ; un porteur marqué est désigné et les deux corps visibles échangent leur position et leur point de vue.',
    rule: 'L’aura collective forme une armure invincible et une flèche qui perce toutes les défenses avant d’échanger deux âmes.',
    cost: 'Partisans unis · un porteur risque son âme',
  },
  'without-you': {
    name: 'Without You',
    owner: 'Kacho',
    action: 'Commander la jumelle',
    instruction:
      'La gardienne mémorise cinq interactions, intercepte un événement mortel détecté et peut rejouer la trace mémorisée qu’elle protège. Appuyez sur R pour changer de mode (Suivre, Balade, Éclaireur).',
    rule: 'Le double post-mortem de Kacho reste auprès de sa jumelle survivante, indiscernable d’elle et tout entier dévoué à sa protection.',
    cost: 'La mort d’une jumelle · persistance post-mortem',
  },
  'magical-worm': {
    name: 'Magical Worm',
    owner: 'Fugetsu',
    action: 'Poser la porte de départ',
    instruction:
      'Faites un clic droit sur deux états de la carte pour poser la porte de départ et la porte de retour ; chaque traversée restaure l’URL, le pont et le zoom, mais l’usage répété épuise le site.',
    rule: 'Le tunnel dimensionnel apparié ne fonctionne normalement qu’une fois par nuit ; les voyages répétés anormaux épuisent dangereusement Fugetsu.',
    cost: 'Un trajet sûr par nuit · épuisement croissant',
  },
  'cats-name': {
    name: 'Le nom du chat',
    owner: 'Camilla',
    action: 'Désigner le tueur direct',
    instruction:
      'Cliquez le tueur direct pour simuler la mort de Camilla ; le chat post-mortem écrase ce coupable, absorbe sa vie et restaure la page.',
    rule: 'Seule une mort directe déclenche la contre-attaque ; une atteinte non mortelle ou le refus de tuer contourne le pouvoir.',
    cost: 'La mort de Camilla · un tueur direct identifiable',
  },
  'great-haiku': {
    name: 'Great Hiker',
    owner: 'Basho',
    action: 'Choisir le premier vers',
    instruction:
      'Sélectionnez trois fragments de texte de la page : un mot de lumière purifie ce qu’il nomme, un mot de feu le brûle, et un poème sans ni l’un ni l’autre ne fait rien.',
    rule: 'Le résultat est d’autant plus puissant que les trois vers choisis forment un poème convaincant.',
    cost: 'Trois vers · la qualité détermine la puissance',
  },
  'magical-esthetician-cookie': {
    name: 'Magical Esthetician Cookie',
    owner: 'Biscuit',
    action: 'Choisir une section à restaurer',
    instruction:
      'Cliquez une section fatiguée pour la restaurer, tandis que Cookie ramène les filtres de chapitre, la profondeur de carte et l’avancement des événements à un état reposé.',
    rule: 'Cookie soulage l’épuisement et comprime des heures de repos en un court soin.',
    cost: 'Un seul soin à la fois',
  },
  'biscuit-body-transformation': {
    name: 'Transformation corporelle',
    owner: 'Biscuit',
    action: 'Transformer un corps de la page',
    instruction:
      'Cliquez n’importe quelle carte pour alterner entre une forme compacte, incapable d’exposer les commandes imbriquées, et une forme complète qui les rétablit.',
    rule: 'Le corps visible change radicalement alors que l’identité qu’il abrite reste la même.',
    cost: 'Transformation maintenue',
  },
  'battle-cantabile-prologue': {
    name: 'Battle Cantabile : Prologue',
    owner: 'Bonolenov',
    action: 'Lancer le rythme',
    instruction:
      'Jouez le morceau au-dessus d’un élément pour invoquer sa tenue de guerrier et sa lance : il gagne en portée sur ses voisins et se couvre contre tout le reste.',
    rule: 'L’air qui traverse les orifices du corps devient une musique de combat dont le rythme porte la technique.',
    cost: 'Mouvement et rythme continus',
  },
  'battle-cantabile-jupiter': {
    name: 'Battle Cantabile : Jupiter',
    owner: 'Bonolenov',
    action: 'Choisir le point d’impact',
    instruction:
      'Invoquez Jupiter au-dessus d’une cible ; une fois la danse achevée, la planète la poursuit, et seule la sortie de portée de la musique permet d’y échapper.',
    rule: 'La planète invoquée écrase la cible désignée sous une masse écrasante.',
    cost: 'Un seul impact massif',
  },
  'battle-cantabile-metamorphosen': {
    name: 'Battle Cantabile : Metamorphosen',
    owner: 'Bonolenov',
    action: 'Choisir une forme à copier',
    instruction:
      'Passez du temps sur un modèle pour acheter du temps sous sa forme, puis transformez un autre élément ; la forme retombe d’elle-même à la fin de ce temps.',
    rule: 'La musique de combat change l’apparence de Bonolenov en une identité ou un objet choisis.',
    cost: 'Un modèle plus une cible',
  },
  'skill-hunter': {
    name: 'Skill Hunter',
    owner: 'Chrollo',
    action: 'Ouvrir le livre et voler une commande',
    instruction:
      'Cliquez un bouton ou un lien pour le voler dans le livre flottant ; la commande d’origine est scellée tandis que sa copie reste utilisable.',
    rule: 'Un pouvoir volé est rangé dans le livre et ne peut plus servir à son propriétaire tant qu’il y est conservé.',
    cost: 'La commande visée doit être exposée',
  },
  'double-face': {
    name: 'Double Face',
    owner: 'Chrollo',
    action: 'Marquer la première section',
    instruction:
      'Marquez jusqu’à deux sections ; toutes deux restent épinglées et visibles pendant que vous parcourez le reste de la page.',
    rule: 'Le marque-page garde un pouvoir volé actif pendant que Skill Hunter s’ouvre sur une autre page.',
    cost: 'Deux pages simultanées au maximum',
  },
  'indoor-fish': {
    name: 'Indoor Fish',
    owner: 'Chrollo',
    action: 'Lâcher les poissons en intérieur',
    instruction:
      'Cliquez le texte de la page pour laisser les poissons dévorer ses mots, tandis que la mise en page reste étrangement intacte jusqu’au Zetsu.',
    rule: 'Les Indoor Fish ne mangent la chair qu’à l’intérieur d’une pièce close ; les victimes ne sentent rien et restent en vie jusqu’à la fin du pouvoir.',
    cost: 'Page close et active',
  },
  'fun-fun-cloth': {
    name: 'Fun Fun Cloth',
    owner: 'Chrollo',
    action: 'Envelopper et réduire une section',
    instruction:
      'Cliquez n’importe quelle section pour la replier en un ballot tenant dans la paume ; recliquez le ballot pour la laisser ressortir en taille réelle, intacte.',
    rule: 'Tout ce que le tissu enveloppe est réduit et rangé sans dommage.',
    cost: 'Les cibles rangées restent prisonnières',
  },
  'chrollo-teleportation': {
    name: 'Téléportation',
    owner: 'Chrollo',
    action: 'Choisir la première cible',
    instruction:
      'Cliquez un élément pour le déplacer ailleurs sur la page ; vous ne choisissez pas où il atterrit et son avis n’est pas demandé.',
    rule: 'La technique volée déplace de force ses cibles sans exiger de trajet visible.',
    cost: 'Deux destinations valides',
  },
  'sun-and-moon': {
    name: 'Le Soleil et la Lune',
    owner: 'Chrollo',
    action: 'Poser la marque du Soleil',
    instruction:
      'Marquez le Soleil, maintenez le contact pour le charger, puis marquez la Lune ; la paire n’explose qu’au contact des deux marques, et une charge complète emporte les voisins.',
    rule: 'Les marques opposées explosent au contact et persistent par le Nen post-mortem.',
    cost: 'Une marque de Soleil et une marque de Lune',
  },
  'order-stamp': {
    name: 'Order Stamp',
    owner: 'Chrollo',
    action: 'Tamponner les pantins de la page',
    instruction:
      'Tamponnez jusqu’à 20 blocs inertes pourvus d’une tête ; recliquez sur un bloc marqué pour le verrouiller en rouge, et dès qu’un pantin est verrouillé le clic suivant ailleurs devient l’ordre que les verrouillés exécutent.',
    rule: 'Le tampon contrôle des pantins en tant qu’objets, jamais des êtres que son utilisateur considère vivants.',
    cost: 'Uniquement des corps inanimés de la page',
  },
  'convert-hands': {
    name: 'Convert Hands',
    owner: 'Chrollo',
    action: 'Marquer la première identité',
    instruction:
      'Sélectionnez deux éléments pour échanger leur identité visible tout en conservant leurs destinations et leur comportement d’origine.',
    rule: 'Les marques de la main gauche et de la main droite échangent les apparences sans échanger la personne qui se trouve dessous.',
    cost: 'Deux identités marquées',
  },
  'love-dial-6700': {
    name: 'Love Dial 6700',
    owner: 'Chrollo',
    action: 'Prendre un relevé d’affinité',
    instruction:
      'Composez depuis une zone pour savoir seulement si le partenaire idéal est à portée ; le combiné refuse ensuite jusqu’à ce que vous bougiez, et il n’a que six appels par jour.',
    rule: 'L’outil de divination en forme de téléphone guide son utilisateur vers la personne désirée à travers des relevés de compatibilité changeants.',
    cost: 'Les relevés répétés affinent la direction',
  },
  'lovely-ghostwriter': {
    name: 'Lovely Ghostwriter',
    owner: 'Chrollo',
    action: 'Choisir un sujet de prophétie',
    instruction:
      'Sélectionnez un sujet porteur d’un nom, d’une date et d’un type ; le premier quatrain est toujours son passé, et les liens annoncés deviennent des routes.',
    rule: 'L’écriture automatique angélique prédit l’avenir immédiat de la cible en vers énigmatiques, tout en lui cachant sa propre prophétie.',
    cost: 'Informations sur la cible et support écrit',
  },
  'gallery-fake': {
    name: 'Gallery Fake',
    owner: 'Chrollo',
    action: 'Copier un objet visible',
    instruction:
      'Cliquez un élément de la page pour poser à côté un double inerte d’apparence parfaite : la copie ne répond à rien de ce que fait l’original.',
    rule: 'Gallery Fake crée des copies exactes, privées des qualités vivantes et des pouvoirs de l’original.',
    cost: 'Les copies disparaissent au bout de vingt-quatre heures',
  },
  'black-voice': {
    name: 'Black Voice',
    owner: 'Chrollo',
    action: 'Planter une antenne',
    instruction:
      'Plantez les deux antennes dans des boutons ou des liens, puis cliquez n’importe où ; l’ordre part dans l’une des deux et ne dit jamais laquelle.',
    rule: 'L’antenne accorde un contrôle total à distance jusqu’à son retrait ou la destruction de la cible.',
    cost: 'Une antenne et un contrôleur',
  },
  'double-machine-gun': {
    name: 'Double Machine Gun',
    owner: 'Franklin',
    action: 'Ouvrir le feu',
    instruction:
      'Chaque clic arrose la cible et tout ce qui se tient à côté d’elle ; les constructions de Nen n’arrêtent pas les balles.',
    rule: 'Les bouts de doigts sectionnés émettent une salve puissante et soutenue dont la force récompense l’engagement.',
    cost: 'Aura émise en continu',
  },
  'hanzo-skill-4': {
    name: 'Technique n° 4 de Hanzo',
    owner: 'Hanzo',
    action: 'Projeter le double',
    instruction:
      'Envoyez le double hors d’une section et il traverse tout ; toucher le corps endormi qu’il a laissé derrière lui le ramène aussitôt.',
    rule: 'La conscience de Hanzo quitte son corps endormi sous forme de double invisible, mais doit revenir si l’on dérange ce corps.',
    cost: 'Un corps inconscient et immobile',
  },
  'biohazard-hinrigh': {
    name: 'Biohazard',
    owner: 'Hinrigh',
    action: 'Animer un objet',
    instruction:
      'Cliquez un objet non vivant pour l’animer quelques secondes plus tard en lui gardant sa fonction ; dix petits corps par jour, deux grands, et l’aura est épuisée.',
    rule: 'Les machines et les objets touchés deviennent des animaux vivants sans perdre leurs propriétés pratiques.',
    cost: 'Contact direct avec un objet',
  },
  'illumi-needle-people': {
    name: 'Hommes-aiguilles',
    owner: 'Illumi',
    action: 'Enfoncer une aiguille de contrôle',
    instruction:
      'Percez un élément avec une aiguille et un ordre ; il exécute cet ordre jusqu’à s’y consumer, et survit estropié.',
    rule: 'Les aiguilles écrasent l’autonomie et font des gens des pantins jetables, jusqu’à l’épuisement ou la mort.',
    cost: 'Une aiguille par pantin',
  },
  'surveillance-paper-dolls': {
    name: 'Poupées de papier espionnes',
    owner: 'Kalluto',
    action: 'Déployer un observateur de papier',
    instruction:
      'Attachez des poupées de papier à des sections ; elles comptent et rapportent chaque changement du DOM survenant à l’intérieur de leur cible.',
    rule: 'De minuscules figurines de papier écoutent à distance et relaient l’activité à leur utilisateur.',
    cost: 'Un observateur de papier par zone',
  },
  'dance-of-the-serpents-bite': {
    name: 'Danse de la morsure du serpent',
    owner: 'Kalluto',
    action: 'Commencer la danse de papier',
    instruction:
      'Le premier confetti se fiche exactement à l’endroit cliqué ; toutes les salves suivantes convergent vers cette même plaie, où que vous visiez.',
    rule: 'Un éventail dirige des confettis de papier tranchants, capables de suivre et d’entailler une cible choisie.',
    cost: 'Essaim de papier maintenu',
  },
  'leorio-remote-punch': {
    name: 'Coup de poing à distance',
    owner: 'Leorio',
    action: 'Choisir un impact à distance',
    instruction:
      'Frappez un élément et l’aura court le long de sa surface pour ressortir sous un autre élément de cette même surface ; frappez encore pour un autre poing.',
    rule: 'L’aura voyage à travers une surface et reproduit le coup de poing en un point distant.',
    cost: 'Une surface continue et de l’aura émise',
  },
  'luini-spatial-teleportation': {
    name: 'Téléportation spatiale',
    owner: 'Luini',
    action: 'Ouvrir la pièce cachée',
    instruction:
      'Envoyez des sections dans la pièce cachée, qui ne s’ouvre que depuis une section n’ayant qu’une seule sortie ; desceller cette section la consume définitivement.',
    rule: 'Luini traverse les murs vers un espace privé relié, mais doit respecter les points d’entrée qu’il a marqués.',
    cost: 'Frontière préparée et itinéraire de retour',
  },
  'nen-stitches': {
    name: 'Suture au fil de Nen',
    owner: 'Machi',
    action: 'Choisir le premier bord déchiré',
    instruction:
      'Cousez deux sections ensemble — plus le fil est court, plus la couture est solide — ou cousez une section à elle-même pour lui remettre ce qui lui a été retiré.',
    rule: 'Des fils d’aura rattachent les chairs sectionnées avec une vitesse et une précision exceptionnelles.',
    cost: 'Longueur du fil et précision',
  },
  'melody-enchanting-music': {
    name: 'Musique envoûtante',
    owner: 'Melody',
    action: 'Jouer la première note',
    instruction:
      'Jouez trois notes et toutes les autres sections cessent de remarquer quoi que ce soit pendant trois minutes, quel que soit leur nombre à l’écoute.',
    rule: 'La musique porte l’aura directement jusqu’aux auditeurs, les apaise et façonne leur état émotionnel.',
    cost: 'Interprétation continue et audition',
  },
  contagion: {
    name: 'Contagion',
    owner: 'Morena',
    action: 'Créer un membre de niveau un',
    instruction:
      'Infectez un membre au niveau 0, puis dirigez-le sur des cibles : une cible ordinaire vaut 1, un personnage 10, un titre 50, un pouvoir en coûte 20 et le Membre Zéro en vaut 100.',
    rule: 'Les membres gagnent des niveaux par le meurtre et débloquent des pouvoirs à certains seuils, tandis que l’infection ne se transmet que par le baiser de Morena.',
    cost: 'Appartenance, cibles et niveaux croissants',
  },
  'ripper-cyclotron': {
    name: 'Ripper Cyclotron',
    owner: 'Phinks',
    action: 'Choisir une cible et armer le bras',
    instruction:
      'Enroulez le bras sur une cible, puis frappez-en une autre ; en dessous de quatre tours il ne se passe rien, au-delà de sept les passants sont emportés aussi.',
    rule: 'Chaque tour complet du bras augmente l’aura concentrée dans le coup suivant.',
    cost: 'Temps d’armement visible',
  },
  'pain-packer': {
    name: 'Pain Packer',
    owner: 'Feitan',
    action: 'Empaqueter un coup',
    instruction:
      'Cliquez sur ce qui fonctionne encore pour encaisser le coup : l’emballage scelle ses commandes et les garde, et rien ne revient avant que Rising Sun ne l’ouvre.',
    rule: 'L’armure empaquette les dégâts que Feitan a déjà subis au lieu de les soigner ; plus elle en garde, plus la forme libérée a à dépenser.',
    cost: 'Les dégâts déjà subis · rien n’est rendu avant l’ouverture',
  },
  'rising-sun': {
    name: 'Rising Sun',
    owner: 'Feitan',
    action: 'Libérer la chaleur gardée',
    instruction:
      'Cliquez là où le soleil doit se lever : son rayon vaut ce que Pain Packer avait empaqueté, et tout ce qu’il attrape est rouvert.',
    rule: 'La chaleur est proportionnelle aux dégâts gardés et ne distingue personne : ce qui se tient près de la cible brûle avec elle.',
    cost: 'Tous les coups empaquetés, dépensés d’un coup',
  },
  'rihan-predator': {
    name: 'Prédateur',
    owner: 'Rihan',
    action: 'Commencer l’analyse d’une cible',
    instruction:
      'Consultez trois fois un même Hatsu répertorié par vous-même ; Prédateur le contre ensuite partout où il est porté, au prix de tout votre Nen pendant quarante-huit heures.',
    rule: 'Prédateur devient plus fort et plus spécialisé à mesure que Rihan déduit correctement les conditions d’un pouvoir ennemi.',
    cost: 'Analyse juste · faible face à l’inconnu',
  },
  'saiyu-priest-staff': {
    name: 'Bâton du moine',
    owner: 'Saiyu',
    action: 'Planter le bâton',
    instruction:
      'Plantez le bâton et allongez-le : chaque poussée atteint un corps de plus le long de la rangée.',
    rule: 'Le bâton invoqué s’allonge et frappe avec force à courte et moyenne portée.',
    cost: 'Un seul bâton contrôlé',
  },
  'saiyu-three-monkeys': {
    name: 'Les Trois Singes',
    owner: 'Saiyu',
    action: 'Sceller la vue',
    instruction:
      'Chaque clic scelle la vue, puis l’ouïe, puis la parole sur tout le site ; le quatrième libère les trois sens.',
    rule: 'Trois singes de Nen privent la cible de la vue, de l’ouïe et de la parole lorsque leurs attaques portent.',
    cost: 'Trois frappes sensorielles réussies',
  },
  blinky: {
    name: 'Blinky',
    owner: 'Shizuku',
    action: 'Nommer quelque chose à aspirer',
    instruction:
      'Nommez et aspirez du contenu non vivant ; le Nen refuse d’entrer, ce qui révèle les pièges, et une cible vivante se voit plutôt extraire les effets étrangers qu’elle porte.',
    rule: 'Blinky aspire toute matière non vivante que Shizuku nomme, sauf les constructions de Nen et ce qu’elle considère vivant.',
    cost: 'Cible déclarée non vivante',
  },
  'silent-majority': {
    name: 'Silent Majority',
    owner: 'Assassin inconnu',
    action: 'Constituer le champ de dix cibles',
    instruction:
      'Marquez dix cibles de la page pour y dissimuler l’utilisateur ; quatre serpents drainent ensuite la victime suivante, les autres restant suspects.',
    rule: 'La malédiction exige une portée de dix personnes, tue par quatre serpents et se retourne contre son porteur si elle est levée sans victime.',
    cost: 'Dix cibles proches · une victime obligatoire',
  },
  'theta-aura-projectile': {
    name: 'Projectile d’aura',
    owner: 'Theta',
    action: 'Choisir un élève en Zetsu',
    instruction:
      'Sélectionnez une cible pour sceller son action en Zetsu ; rester parfaitement immobile trois secondes la rétablit après le tir contrôlé.',
    rule: 'Theta tire un projectile d’aura contrôlé pour vérifier si un élève parvient à maintenir un Zetsu complet sous pression.',
    cost: 'Trois secondes de concentration sans faille',
  },
  'snake-arm': {
    name: 'Bras-serpent',
    owner: 'Gel',
    action: 'Choisir quelque chose à immobiliser',
    instruction:
      'Enroulez le bras trois fois pour le serrer — la cible est bloquée dès le deuxième tour — et un quatrième contact relâche tout d’un coup.',
    rule: 'Gel transforme partiellement son bras en serpent, capable d’immobiliser instantanément une cible du niveau des Zodiaques.',
    cost: 'Transformation partielle maintenue',
  },
  'bird-manipulation': {
    name: 'Manipulation des oiseaux',
    owner: 'Cluck',
    action: 'Confier un message à la volée',
    instruction:
      'Affectez des oiseaux à des éléments de la page ; chaque pigeon rapporte un message lisible dans le panneau de livraison de la volée.',
    rule: 'Des centaines d’oiseaux contrôlés peuvent livrer des documents avec précision sur une vaste zone.',
    cost: 'Un oiseau contrôlé par message',
  },
  'transport-portals': {
    name: 'Portails de transport',
    owner: 'Tokarine',
    action: 'Charger la cargaison au relais un',
    instruction:
      'Chargez des sections et faites-les avancer par trois étapes de relais visibles jusqu’à un stockage de transport récupérable, sans téléportation.',
    rule: 'Le pouvoir transporte une cargaison limitée entre les relais de l’expédition, mais ne peut explicitement pas la téléporter.',
    cost: 'Faible capacité · transport par étapes',
  },
  'yomotsu-hegui': {
    name: 'Yomotsu Hegui',
    owner: 'Les démunis de Camilla',
    action: 'Choisir la cible de toute une vie',
    instruction:
      'Nommez la cible, conservez un objet qui lui est lié, puis accomplissez cinq rites sur cet objet ; la distance décide du délai et le cinquième achève l’utilisateur.',
    rule: 'Des années de fixation, un objet lié, des cendres, la proximité et le suicide donnent leur force à une malédiction post-mortem visant une seule cible.',
    cost: 'Longue préparation · objet lié · la vie de l’utilisateur',
  },
  'holy-chain': {
    name: 'Chaîne sacrée',
    owner: 'Kurapika',
    action: 'Choisir quelque chose de blessé',
    instruction:
      'Refermez une plaie en deux passages ; un contenu intact ne donne rien sur quoi la croix puisse travailler.',
    rule: 'La chaîne du pouce, terminée par une croix, accélère la guérison naturelle et atteint sa pleine efficacité pendant Emperor Time.',
    cost: 'Aura de renforcement · plus forte sous Emperor Time',
  },
  'judgment-chain': {
    name: 'Chaîne du jugement',
    owner: 'Kurapika',
    action: 'Choisir le sujet du contrat',
    instruction:
      'Plantez l’enjeu dans un sujet et déclarez-lui jusqu’à deux règles ; toucher autre chose constitue la violation.',
    rule: 'La chaîne implantée ne perce le cœur que lorsque la règle déclarée est violée en connaissance de cause.',
    cost: 'Emperor Time · règle explicite · sanction mortelle',
  },
  'stealth-dolphin': {
    name: 'Stealth Dolphin',
    owner: 'Kurapika',
    action: 'Analyser un pouvoir volé',
    instruction:
      'Faites exposer ce que Steal Chain a déjà pris, puis prêtez-le à un destinataire ; le prêt est consommé en un seul usage et éveille l’aura d’un non-utilisateur.',
    rule: 'Le dauphin n’existe que pendant Emperor Time, explique le pouvoir capturé et ouvre les nœuds d’aura d’un non-utilisateur quand le prêt est consommé.',
    cost: 'Emperor Time reste actif jusqu’à l’usage du pouvoir chargé',
  },
  'moonlight-act': {
    name: 'Moonlight Act',
    owner: 'Longhi',
    action: 'Choisir le premier signataire',
    instruction:
      'Deux parties signent volontairement ; toucher l’une d’elles honore les termes et les récompense toutes deux, toucher quelqu’un d’autre est une rupture qui coûte une semaine de Zetsu.',
    rule: 'Seul un accord volontaire aux termes explicites peut être récompensé ou puni par le contrat de manipulation.',
    cost: 'Consentement mutuel · durée et sanction déclarées',
  },
  'body-and-soul': {
    name: 'Body and Soul',
    owner: 'Lynch',
    action: 'Interroger et frapper une cible',
    instruction:
      'Posez la question une fois et frappez ; continuez de frapper la même cible et sa propre voix développe la réponse qu’elle a déjà donnée.',
    rule: 'La voix émise par le corps répond sincèrement à la question, même quand la cible consciente ment ou se tait.',
    cost: 'Un coup direct après une question claire',
  },
  'bloody-mary': {
    name: 'Bloody Mary',
    owner: 'Zakuro',
    action: 'Libérer la première goutte de sang',
    instruction:
      'Libérez une goutte et laissez-la faire : elle rapporte ses trouvailles d’elle-même au fil des minutes suivantes, puis sèche en les emportant avec elle.',
    rule: 'Seul le sang de Zakuro peut être manipulé ; les gouttelettes autonomes pourvues d’un œil expirent au bout de trente à quarante minutes environ.',
    cost: 'Plaie ouverte · réserve de sang emportée · temps de recherche limité',
  },
  lsdf: {
    name: 'Bataille d’esprits : LSDF',
    owner: 'Yokotani',
    action: 'Établir la juridiction de la planque',
    instruction:
      'Désignez la planque, puis postez un garde numéroté sur tout intrus qui s’y trouve : il ne peut rien faire, et rien ne peut lui être fait.',
    rule: 'Les gardes invincibles n’agissent que dans la planque de Morena, après que Yokotani a identifié les intrus illégitimes ; ils expulsent mais ne blessent pas.',
    cost: 'Morena présente · planque uniquement · infraction déclarée',
  },
  'damage-sweet-home': {
    name: 'Damage : Sweet Home',
    owner: 'Terebellum',
    action: 'Toucher la cible protégée',
    instruction:
      'Posez d’abord la main gauche sur un destinataire ; tous les coups suivants atterrissent chez lui, et frapper le destinataire lui-même lui fait encaisser les dégâts.',
    rule: 'Les dégâts sont redirigés entre cibles touchées plutôt qu’effacés, avec des limites plus strictes dès que des corps vivants sont en jeu.',
    cost: 'Contact préalable avec la source et le destinataire',
  },
  'voconte-hideout-doors': {
    name: 'Portes de la planque',
    owner: 'Voconte',
    action: 'Installer la première porte',
    instruction:
      'Armez un cadre et un cadre de retour ; entrer dans l’un fait ressortir par l’autre, passer devant ne fait rien, et les constructions de Nen ne sont pas déplacées.',
    rule: 'Les portes relient des pièces préparées dans toute la base des Heil-Ly, au lieu d’ouvrir des portails n’importe où.',
    cost: 'Murs de planque préparés et pièces reliées',
  },
  'padaille-weapon-transformation': {
    name: 'Je viens te chercher',
    owner: 'Padaille',
    action: 'Choisir une fonction d’arme',
    instruction:
      'Faites défiler la main entre marteau, perceuse et hache : l’un aplatit la cible, l’autre perce ce qu’elle gardait fermé, le dernier lui retire une partie.',
    rule: 'Padaille change son propre corps en armes et en outils familiers, plutôt que d’invoquer un équipement indépendant.',
    cost: 'Forme d’arme connue · partie du corps transformée',
  },
  'camilla-guardian-coercion': {
    name: 'Coercition de la bête gardienne de Camilla',
    owner: 'Bête gardienne de Camilla',
    action: 'Sonder la première condition inconnue',
    instruction:
      'Réalisez trois contacts à condition inconnue sur une même cible ; le troisième contact capture son contrôle et permet de la commander à distance.',
    rule: 'La manipulation totale de la bête est confirmée, mais ses conditions réelles d’activation restent volontairement inconnues.',
    cost: 'Conditions inconnues · représentées par trois contacts non résolus',
  },
  'zhanglei-guardian-coins': {
    name: 'Pièces de la bête gardienne',
    owner: 'Bête gardienne de Zhang Lei',
    action: 'Frapper une pièce de valeur un',
    instruction:
      'Revenez sur le même détenteur pour multiplier la pièce par dix et finir par l’éveiller ; donner la pièce à quelqu’un d’autre la remet à 1 et efface ce qui était accumulé.',
    rule: 'Une pièce est produite chaque jour, accumule du Nen au fil du temps et retombe à la valeur un dès que son propriétaire change.',
    cost: 'Longue accumulation · le transfert remet la valeur à zéro',
  },
  'tserriednich-guardian-lie-marks': {
    name: 'Transformation aux trois mensonges',
    owner: 'Bête gardienne de Tserriednich',
    action: 'Détecter le premier mensonge',
    instruction:
      'La bête juge chaque réponse et ne marque que celles qu’elle lit comme des mensonges : une entaille, puis un avertissement infecté, puis quelque chose qui n’est plus soi.',
    rule: 'Chaque mensonge aggrave la malédiction, et le troisième transforme le menteur en quelque chose qui n’est plus humain.',
    cost: 'Trois mensonges dits en présence de Tserriednich',
  },
  'tubeppa-guardian-synthesis': {
    name: 'Synthèse pharmaceutique collaborative',
    owner: 'Bête gardienne de Tubeppa',
    action: 'Choisir le partenaire de recherche',
    instruction:
      'Choisissez deux composants qui collaborent : deux porteurs d’itinéraires donnent un raccourci, deux porteurs de matière donnent une révélation, et une paire mal assortie donne un lot inerte.',
    rule: 'La bête productrice de substances exige un partenaire coopérant et peut créer de nombreux effets dont les limites restent inconnues.',
    cost: 'Alliance active · deux composants coopérants',
  },
  'tyson-guardian-eye-wogs': {
    name: 'Têtards-yeux',
    owner: 'Bête gardienne de Tyson',
    action: 'Attacher un têtard-œil à un lecteur',
    instruction:
      'Attachez un têtard-œil à un lecteur : il prélève une commande et rend du bonheur en proportion de ce qui a été lu ; demander deux fois brise le seul tabou.',
    rule: 'La profondeur de l’engagement dans le Livre de Tyson détermine le bonheur rendu, tandis que violer son unique tabou attire la punition.',
    cost: 'Exposition au Livre · prélèvement d’aura continu',
  },
  'luzurus-guardian-desire-trap': {
    name: 'Piège à désir',
    owner: 'Bête gardienne de Luzurus',
    action: 'Lire le désir de la cible',
    instruction:
      'Lisez une cible et la bête matérialise son désir en appât ; la coercition ne commence qu’une fois l’appât accepté.',
    rule: 'La bête matérialise ce que sa victime désire et n’applique sa manipulation pseudo-coercitive qu’après acceptation de l’appât.',
    cost: 'Désir connu · appât satisfait volontairement',
  },
  'salesale-guardian-smoke': {
    name: 'Fumée d’aura diffuse',
    owner: 'Bête gardienne de Salé-salé',
    action: 'Libérer le premier nuage de fumée',
    instruction:
      'Exposez les sections voisines de façon répétée ; les commandes converties rejoignent un panneau qui s’étend et oriente les visiteurs vers Salé-salé.',
    rule: 'Une fumée coercitive de faible intensité gagne des sympathies au fil des heures, crée des émetteurs secondaires et échoue contre qui retient son souffle.',
    cost: 'Exposition prolongée · fumée d’aura respirable',
  },
  'momoze-guardian-solicitation': {
    name: '« Tu es libre ? »',
    owner: 'Bête gardienne de Momoze',
    action: 'Demander « Tu es libre ? »',
    instruction:
      'Interrogez une cible et retouchez-la pour répondre oui ; toute cible restée sans réponse continue d’être harcelée, et un seul corps peut être occupé à la fois.',
    rule: 'Seule une réponse affirmative laisse l’araignée entrer dans l’oreille et manipuler la victime avec sa propre aura.',
    cost: 'Sollicitation répétée · oui explicite · lourde fatigue de l’hôte',
  },
  'marayam-guardian-isolation': {
    name: 'Isolement de la salle 1013',
    owner: 'Bête gardienne de Marayam',
    action: 'Isoler la pièce protégée',
    instruction:
      'Isolez la pièce réelle, puis regardez quiconque, à l’extérieur, tente de l’atteindre et arrive dans une copie vide à la place.',
    rule: 'Les occupants peuvent quitter la pièce réelle, mais les personnes extérieures et les anciens occupants n’atteignent qu’un double spatial vide.',
    cost: 'Pièce protégée · frontière perceptive à sens unique',
  },
}

/** The one-line signature the effect layer prints under the active technique. */
export const hatsuManifestationFr: Record<HatsuInteractionKind, string> = {
  elastic: 'Filament de gomme élastique',
  disguise: 'Feuille de texture truquée',
  scarlet: 'Yeux écarlates',
  'chain-rule': 'Chaîne-seringue de l’index',
  'chain-bind': 'Chaîne d’entrave du majeur',
  dowsing: 'Pendule de divination',
  enhance: 'Manteau de Ren royal',
  growth: 'Pousse d’erigeron',
  vehicle: 'Coque transformée à cinq places',
  scout: 'Insecte volant (Aura bleue)',
  tribunal: 'Carton de pénalité Cross Game',
  curse: 'Tache de naissance sacrificielle',
  inherit: 'Paume à quatre étoiles',
  blast: 'Choc de paume comprimé',
  surveillance: 'Chouette Secret Window',
  capture: 'Carte d’acquisition Culdcept',
  future: 'Cadre du futur parallèle',
  arrow: 'Flèche d’âme de Grimmel',
  guardian: 'Double post-mortem de Kacho',
  portal: 'Porte Magical Worm',
  resurrection: 'Bête de représailles féline',
  poetry: 'Vers de haïku matérialisé',
  restoration: 'Aura de massage de Cookie',
  transformation: 'Sceau du vrai corps de Biscuit',
  rhythm: 'Rythme de combat du Prologue',
  impact: 'Sphère écrasante de Jupiter',
  mimicry: 'Masque de guerre Metamorphosen',
  theft: 'Livre du secret du bandit',
  bookmark: 'Marque-page Double Face',
  devour: 'Morsure d’Indoor Fish',
  pocket: 'Ballot de Fun Fun Cloth',
  teleport: 'Croix de déplacement de Chrollo',
  polarity: 'Marques du Soleil et de la Lune',
  command: 'Sceau à pantins Order Stamp',
  'identity-swap': 'Paumes de Convert Hands',
  divination: 'Combiné Love Dial',
  prophecy: 'Plume du ghostwriter',
  clone: 'Double Gallery Fake',
  puppet: 'Antenne Black Voice',
  barrage: 'Salve d’aura des doigts sectionnés',
  projection: 'Double astral de Hanzo',
  animate: 'Animal-machine Biohazard',
  needle: 'Épingle d’homme-aiguille',
  'paper-spy': 'Poupée de papier espionne',
  shred: 'Confettis de papier du serpent',
  'remote-strike': 'Poing surgissant de la surface',
  spatial: 'Trappe de la pièce cachée de Luini',
  stitch: 'Sutures d’aura de Machi',
  melody: 'Partition d’aura de Melody',
  infection: 'Marque de niveau de Contagion',
  windup: 'Rotation du bras du Cyclotron',
  predator: 'Bête de contre-attaque Prédateur',
  staff: 'Bâton de moine extensible',
  senses: 'Trois singes des sens',
  vacuum: 'Bouche aspirante de Blinky',
  snakes: 'Serpents de Silent Majority',
  'training-shot': 'Tir d’aura faible de Theta',
  serpent: 'Bras-serpent transformé de Gel',
  flock: 'Volée de livraison de Cluck',
  relay: 'Relais de transport de Tokarine',
  'postmortem-curse': 'Malédiction de cendres Yomotsu Hegui',
  healing: 'Croix de la chaîne sacrée',
  'heart-vow': 'Lame du jugement au cœur',
  'ability-loan': 'Stealth Dolphin',
  contract: 'Sceau du contrat Moonlight',
  'truth-punch': 'Voix sincère du corps',
  'blood-search': 'Gouttelettes de sang à œil',
  'legal-defense': 'Gardes numérotés du LSDF',
  'damage-transfer': 'Ligne de transfert Sweet Home',
  'door-network': 'Porte de planque de Voconte',
  'weapon-body': 'Corps-arme de Padaille',
  'coercive-beast': 'Méduse coercitive de Camilla',
  'coin-growth': 'Pièce de Nen de Zhang Lei',
  'lie-marks': 'Plaie faciale des trois mensonges',
  'drug-synthesis': 'Fiole de synthèse de Tubeppa',
  'aura-levy': 'Têtard-œil de Tyson',
  'desire-trap': 'Appât à désir de Luzurus',
  'diffusive-smoke': 'Fumée d’aura de Salé-salé',
  solicitation: 'Souris solliciteuse de Momoze',
  'room-isolation': 'Pièce dupliquée de Marayam',
  'pain-armour': 'Emballage de Pain Packer',
  'sun-flare': 'Sphère de Rising Sun',
}
