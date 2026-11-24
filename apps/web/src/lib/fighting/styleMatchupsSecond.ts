import { entry, type StyleMatchup } from './styleMatchupTypes'
import type { FighterId } from './types'
export const SECOND_STYLE_MATCHUPS: Partial<Record<FighterId, StyleMatchup>> = {
  rihan: entry(
    'preparation',
    [
      'Céder du terrain pour observer et punir une ouverture réelle. Predator s’étudie sur une manifestation visible.',
      'Give ground to observe and punish a real opening. Predator studies a visible manifestation.',
    ],
    [
      'Presser physiquement l’observateur ; aucune analyse automatique d’un pouvoir caché.',
      'Apply physical pressure; a hidden ability is not automatically understood.',
    ],
  ),
  zakuro: entry(
    'control',
    [
      'Accrocher de la main et ramener du coude. Gérer la réserve de sang et les gouttes de surveillance.',
      'Hook with the hand and pull back with the elbow. Manage blood reserves and surveillance droplets.',
    ],
    [
      'Punir les engagements et respecter la trajectoire du sang ; la réserve est finie.',
      'Punish commitments and respect blood trajectories; the reserve is finite.',
    ],
  ),
  melody: entry(
    'support',
    [
      'Faire manquer par un retrait souple et reprendre de la paume. Obtenir une ouverture pour la flûte et conserver l’écoute.',
      'Draw a miss with a flowing retreat and return with the palm. Find a flute opening and preserve hearing.',
    ],
    [
      'Sortir de portée ou couvrir les oreilles, au prix des deux mains.',
      'Leave range or cover the ears, at the cost of both hands.',
    ],
  ),
  basho: entry(
    'preparation',
    [
      'Poser les appuis et alterner la main libre avec des frappes de poing. Le poème doit être écrit avant que le poing puisse en déclencher l’effet.',
      'Plant the feet and alternate the free hand with fist strikes. Write the poem before a fist can trigger its effect.',
    ],
    [
      'Interrompre l’écriture et éviter le poing ; aucun feu gratuit à distance.',
      'Interrupt writing and evade the fist; there is no free ranged fire.',
    ],
  ),
  camilla: entry(
    'ranged',
    [
      'Provoquer une avance avec le pistolet ou une garde ouverte, puis utiliser le retrait et le revers arrière. Cat’s Name répond à une mort attribuée.',
      'Draw an approach with the pistol or open guard, then retreat and riposte. Cat’s Name responds to an attributed death.',
    ],
    [
      'Un coup fatal n’annule pas le Nen post-mortem ; un vol exige ses vraies conditions.',
      'A fatal blow does not cancel post-mortem Nen; theft requires its real conditions.',
    ],
  ),
  halkenburg: entry(
    'preparation',
    [
      'Mesurer dans l’axe de la main avant, reculer droit et riposter du poing arrière. Réunir les partisans consentants pour préparer la flèche.',
      'Measure with the lead hand, retreat in line and answer with the rear fist. Gather consenting supporters to prepare the arrow.',
    ],
    [
      'Interrompre le rassemblement ou éviter l’axe du tir ; les soutiens ne sont jamais copiés.',
      'Interrupt the gathering or evade the firing line; supporters are never copied.',
    ],
  ),
  gel: entry(
    'pressure',
    [
      'Mesurer de la main, enrouler l’épaule et détendre le bras droit après un écart.',
      'Measure with the hand, coil the shoulder, then snap the right arm out after slipping away.',
    ],
    [
      'Faire manquer l’allonge puis punir le retour du bras.',
      'Bait the extended arm and punish its recovery.',
    ],
  ),
  lynch: entry(
    'pressure',
    [
      'Entrer vite et alterner les poings dans l’axe. Pour obtenir une réponse, poser une question audible avant la frappe.',
      'Close fast and alternate straight punches. Ask an audible question before the hit to get an answer.',
    ],
    [
      'Éviter le contact : une garde qui reçoit le poing peut encore fournir une réponse privée.',
      'Avoid contact: a guarded fist can still produce a private answer.',
    ],
  ),
  luini: entry(
    'preparation',
    [
      'Piquer au couteau puis ressortir sur le revers. Préparer une pièce fermée et un lieu personnellement visité.',
      'Stab with the knife and exit with a reverse slash. Prepare a sealed room and a personally visited destination.',
    ],
    [
      'Ouvrir la porte invalide cet ancrage pour la manche ; le passage ne donne pas d’invulnérabilité.',
      'Opening the door invalidates that anchor for the round; passage grants no invulnerability.',
    ],
  ),
  bill: entry(
    'support',
    [
      'Avancer en couvrant de la paume, puis pousser des deux mains. Utiliser une graine réelle et défendre sa préparation.',
      'Advance behind an open palm, then drive with both hands. Use a real seed and defend its preparation.',
    ],
    [
      'Presser avec les coups physiques ; Erigeron ne donne ni soin personnel ni bonus offensif.',
      'Pressure with physical strikes; Erigeron grants no self-heal or offensive bonus.',
    ],
  ),
  furykov: entry(
    'control',
    [
      'Sonder du poing et du pied avant, puis frapper dès qu’une ouverture se montre. Combo Master laisse la garde manuelle.',
      'Probe with the lead hand and foot, then strike once an opening shows. Combo Master leaves defense manual.',
    ],
    [
      'Varier les ouvertures ; une commande en attente n’est jamais une attaque prédite.',
      'Vary openings; a buffered command is never a predicted attack.',
    ],
  ),
  longhi: entry(
    'control',
    [
      'Tendre la paume pour fixer la distance, puis se retirer ou intercepter du talon. Moonlight Act passe par une offre volontaire.',
      'Offer the palm to set the distance, then step away or intercept with the heel. Moonlight Act begins with a voluntary offer.',
    ],
    [
      'Refuser reste possible ; aucune signature forcée ni sanction avant contrat.',
      'Refusal remains possible; no forced signature or penalty before a contract.',
    ],
  ),
  musse: entry(
    'ranged',
    [
      'Fermer la ligne avec la main avant, couvrir au coude et reculer vite. Poser Secret Window au contact pour observer.',
      'Check the line with the lead hand, cover with the elbow and retreat quickly. Attach Secret Window at contact to observe.',
    ],
    [
      'Éviter la pose et punir le pistolet ; le hibou privé ne révèle pas de données au public.',
      'Evade attachment and punish the handgun; the private owl does not reveal public data.',
    ],
  ),
  padaille: entry(
    'pressure',
    [
      'Jauger de la main libre, puis frapper du bras droit. Choisir marteau, foret ou hache selon leur temps de récupération.',
      'Gauge with the free hand, then strike with the right arm. Choose hammer, drill or axe by their recovery.',
    ],
    [
      'Faire manquer l’outil puis punir ; changer de forme n’annule pas un engagement.',
      'Bait the tool and punish; changing form does not cancel commitment.',
    ],
  ),
  sayird: entry(
    'support',
    [
      'Observer sous couverture, puis entrer d’un pas court et direct. Little Eye passe par un petit animal réel disponible.',
      'Observe from cover, then enter with a short direct step. Little Eye uses an available real small animal.',
    ],
    [
      'Presser le corps du manipulateur ; l’observation n’est pas une frappe ou une guérison.',
      'Pressure the controller’s body; observation is not a strike or heal.',
    ],
  ),
  terebellum: entry(
    'control',
    [
      'Avancer avec des appuis lourds et des frappes à portée de main. Sweet Home exige d’aligner les contacts pour absorber ou transférer une blessure.',
      'Advance with heavy footing and strikes at hand range. Sweet Home requires hand contact to absorb or transfer a wound.',
    ],
    [
      'Rompre la portée ou l’orientation des mains ; aucun renvoi automatique sans contact.',
      'Break hand range or facing; there is no automatic contact-free reflection.',
    ],
  ),
  voconte: entry(
    'control',
    [
      'Marquer un seuil avec l’avant-bras, accélérer puis s’arrêter net. Door demande deux huisseries et le bon sens de passage.',
      'Check the threshold with the forearm, burst in and stop sharply. Door requires two linked frames and the correct crossing direction.',
    ],
    [
      'Garder ses distances aux seuils ; les projectiles ne sont pas transportés.',
      'Keep clear of thresholds; projectiles are not transported.',
    ],
  ),
  yokotani: entry(
    'control',
    [
      'Barrer le passage de l’avant-bras et reconduire de la paume. Réunir la juridiction et la présence de Morena avant LSDF.',
      'Bar the passage with the forearm and guide the opponent away with the palm. Establish jurisdiction and Morena’s presence before LSDF.',
    ],
    [
      'Les gardes sont invulnérables ; priver le porteur de son Hatsu exige les conditions habituelles.',
      'The guards are invulnerable; disabling the owner’s Hatsu requires the usual conditions.',
    ],
  ),
  cluck: entry(
    'support',
    [
      'Traverser la distance d’une ruée ou d’un saut, frapper en passage puis se replier. Le pigeon réel sert à la livraison.',
      'Cross the distance with a dash or jump, strike in passing and disengage. The real pigeon delivers the dispatch.',
    ],
    [
      'Presser physiquement ; aucun essaim offensif ou bonus de combat inventé.',
      'Apply physical pressure; no invented offensive swarm or combat bonus.',
    ],
  ),
  beyond: entry(
    'pressure',
    [
      'Avancer sous une garde lourde, engager l’épaule et garder l’adversaire à portée. La malédiction de Beyond exige sa préparation.',
      'Advance behind a heavy guard, commit the shoulder and keep the opponent in range. Beyond’s curse requires its preparation.',
    ],
    [
      'Punir les engagements physiques ; aucun sacrifice ou transfert de malédiction automatique.',
      'Punish physical commitments; no automatic sacrifice or curse transfer.',
    ],
  ),
}
