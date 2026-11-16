import { entry, type StyleMatchup } from './styleMatchupTypes'
import type { FighterId } from './types'
export const SECOND_STYLE_MATCHUPS: Partial<Record<FighterId, StyleMatchup>> = {
  rihan: entry(
    'preparation',
    [
      'Observer une manifestation puis construire une analyse personnelle.',
      'Observe a manifestation and build personal analysis.',
    ],
    [
      'Presser physiquement l’observateur ; aucune analyse automatique d’un pouvoir caché.',
      'Apply physical pressure; a hidden ability is not automatically understood.',
    ],
  ),
  zakuro: entry(
    'control',
    [
      'Gérer le sang disponible et les gouttes de surveillance.',
      'Manage available blood and surveillance droplets.',
    ],
    [
      'Punir les engagements et respecter la trajectoire du sang ; la réserve est finie.',
      'Punish commitments and respect blood trajectories; the reserve is finite.',
    ],
  ),
  melody: entry(
    'support',
    [
      'Obtenir une ouverture pour la flûte et conserver l’écoute.',
      'Find a flute opening and preserve hearing.',
    ],
    [
      'Sortir de portée ou couvrir les oreilles, au prix des deux mains.',
      'Leave range or cover the ears, at the cost of both hands.',
    ],
  ),
  basho: entry(
    'preparation',
    [
      'Écrire le poème avant de chercher le contact du poing.',
      'Write the poem before seeking fist contact.',
    ],
    [
      'Interrompre l’écriture et éviter le poing ; aucun feu gratuit à distance.',
      'Interrupt writing and evade the fist; there is no free ranged fire.',
    ],
  ),
  camilla: entry(
    'ranged',
    [
      'Utiliser le pistolet sans confondre Cat’s Name avec une attaque volontaire.',
      'Use the handgun; Cat’s Name is not a voluntary attack.',
    ],
    [
      'Un coup fatal n’annule pas le Nen post-mortem ; un vol exige ses vraies conditions.',
      'A fatal blow does not cancel post-mortem Nen; theft requires its real conditions.',
    ],
  ),
  halkenburg: entry(
    'preparation',
    [
      'Réunir les partisans consentants et préparer la flèche.',
      'Gather consenting supporters and prepare the arrow.',
    ],
    [
      'Interrompre le rassemblement ou éviter l’axe du tir ; les soutiens ne sont jamais copiés.',
      'Interrupt the gathering or evade the firing line; supporters are never copied.',
    ],
  ),
  gel: entry(
    'pressure',
    [
      'Gagner la distance où le bras-serpent peut toucher.',
      'Enter the range where the snake arm can connect.',
    ],
    [
      'Faire manquer l’allonge puis punir le retour du bras.',
      'Bait the extended arm and punish its recovery.',
    ],
  ),
  lynch: entry(
    'pressure',
    [
      'Poser une question audible puis toucher avec le poing.',
      'Ask an audible question, then connect with the fist.',
    ],
    [
      'Éviter le contact : une garde qui reçoit le poing peut encore fournir une réponse privée.',
      'Avoid contact: a guarded fist can still produce a private answer.',
    ],
  ),
  luini: entry(
    'preparation',
    [
      'Préparer une pièce fermée et un lieu personnellement visité.',
      'Prepare a sealed room and a personally visited destination.',
    ],
    [
      'Ouvrir la porte invalide cet ancrage pour la manche ; le passage ne donne pas d’invulnérabilité.',
      'Opening the door invalidates that anchor for the round; passage grants no invulnerability.',
    ],
  ),
  bill: entry(
    'support',
    [
      'Utiliser une graine réelle puis défendre sa préparation.',
      'Use a real seed and defend its preparation.',
    ],
    [
      'Presser avec les coups physiques ; Erigeron ne donne ni soin personnel ni bonus offensif.',
      'Pressure with physical strikes; Erigeron grants no self-heal or offensive bonus.',
    ],
  ),
  furykov: entry(
    'control',
    [
      'Lire les alertes de Combo Master sans abandonner la garde manuelle.',
      'Read Combo Master alerts while maintaining manual defense.',
    ],
    [
      'Varier les ouvertures ; une commande en attente n’est jamais une attaque prédite.',
      'Vary openings; a buffered command is never a predicted attack.',
    ],
  ),
  longhi: entry(
    'control',
    [
      'Proposer le pacte puis exploiter seulement une récompense réellement acquise.',
      'Offer the pact and use only an actually earned reward.',
    ],
    [
      'Refuser reste possible ; aucune signature forcée ni sanction avant contrat.',
      'Refusal remains possible; no forced signature or penalty before a contract.',
    ],
  ),
  musse: entry(
    'ranged',
    [
      'Poser Secret Window au contact puis exploiter son observation privée.',
      'Attach Secret Window at contact and use private observation.',
    ],
    [
      'Éviter la pose et punir le pistolet ; le hibou privé ne révèle pas de données au public.',
      'Evade attachment and punish the handgun; the private owl does not reveal public data.',
    ],
  ),
  padaille: entry(
    'pressure',
    [
      'Choisir marteau, foret ou hache en tenant compte de leur récupération.',
      'Choose hammer, drill, or axe with their recovery in mind.',
    ],
    [
      'Faire manquer l’outil puis punir ; changer de forme n’annule pas un engagement.',
      'Bait the tool and punish; changing form does not cancel commitment.',
    ],
  ),
  sayird: entry(
    'support',
    [
      'Contrôler un animal réel disponible, sans copie du matériel.',
      'Control an available real animal; copying supplies no equipment.',
    ],
    [
      'Presser le corps du manipulateur ; l’observation n’est pas une frappe ou une guérison.',
      'Pressure the controller’s body; observation is not a strike or heal.',
    ],
  ),
  terebellum: entry(
    'control',
    [
      'Aligner les contacts des mains pour absorber ou transférer une blessure.',
      'Align hand contact to absorb or transfer a wound.',
    ],
    [
      'Rompre la portée ou l’orientation des mains ; aucun renvoi automatique sans contact.',
      'Break hand range or facing; there is no automatic contact-free reflection.',
    ],
  ),
  voconte: entry(
    'control',
    [
      'Relier les huisseries puis provoquer un franchissement dans le bon sens.',
      'Link the frames, then cause a crossing in the correct direction.',
    ],
    [
      'Garder ses distances aux seuils ; les projectiles ne sont pas transportés.',
      'Keep clear of thresholds; projectiles are not transported.',
    ],
  ),
  yokotani: entry(
    'control',
    [
      'Réunir la juridiction et la présence de Morena avant LSDF.',
      'Establish jurisdiction and Morena’s presence before LSDF.',
    ],
    [
      'Les gardes sont invulnérables ; priver le porteur de son Hatsu exige les conditions habituelles.',
      'The guards are invulnerable; disabling the owner’s Hatsu requires the usual conditions.',
    ],
  ),
  cluck: entry(
    'support',
    [
      'Utiliser le pigeon réel pour sa livraison puis défendre le contact.',
      'Use the real pigeon for delivery, then defend close range.',
    ],
    [
      'Presser physiquement ; aucun essaim offensif ou bonus de combat inventé.',
      'Apply physical pressure; no invented offensive swarm or combat bonus.',
    ],
  ),
  beyond: entry(
    'pressure',
    [
      'Jouer ses capacités physiques ; les malédictions préparées restent hors du duel.',
      'Use physical abilities; prepared curses remain outside the duel.',
    ],
    [
      'Punir les engagements physiques ; aucun sacrifice ou transfert de malédiction automatique.',
      'Punish physical commitments; no automatic sacrifice or curse transfer.',
    ],
  ),
}
