# Musse, Sayird, Furykov et Lynch : information obtenue, type 1

Des accents silencieux de 18 images de simulation (0,3 seconde) accompagnent
les informations réellement acquises dans la vue de combat.

- Musse : placement effectif de Secret Window, changement d’observation corporelle
  et réception d’une parole relayée si le moteur fournit ce fait acquis. L’écoute
  seule reste une observation audio. La démonstration utilise les observations
  corporelles de la surveillance de contact.
- Sayird : prise de contrôle confirmée d’un petit animal réel fourni par le
  scénario. Le marqueur souligne ce relais ; il ne fabrique aucun animal,
  observation, champ de vision ou connaissance supplémentaire.
- Furykov : ouverture de la console, alerte réellement détectée, destinataire
  confirmé et signature devenue lisible. Une signature inconnue garde son état
  inconnu dans la console. La lecture par Gyo reste en type 1 pendant son usage.
- Lynch : signal discret après l’enregistrement d’une réponse au vrai contact
  du poing. Le marqueur est accessible aux deux participants autorisés à entendre
  la réponse ; son texte reste dans le panneau privé existant.

`perceptionPresentation.ts` lit seulement les faits acquis par le participant dont
le point de vue est actif. Ses événements ne contiennent ni paroles, ni réponses,
ni identités ou signatures. Un changement de spectateur, une reconstruction ou
un retour en arrière ne rejoue pas l’historique privé. Les marqueurs de Musse,
Sayird et Furykov disparaissent du point de vue adverse.

`perceptionCamera.ts` retire les vues secondaires de ces événements après le
filtrage des informations privées. Les gestes martiaux et l’arme physique de
Musse conservent leur présentation. Les coûts, dégâts, cibles, états de Nen et
conditions d’obtention restent ceux du moteur.

Les marqueurs suivent le hibou, l’animal, la console ou le participant qui reçoit
la réponse. Leurs ancrages sont stables pendant une pause et renouvelés lors
d’une reconstruction du personnage. Le hibou utilise le temps de simulation.
Le mouvement réduit et le réglage sans éclats masquent les ornements, en
conservant les supports utiles au joueur autorisé.

Vérifications : `perceptionPresentation.test.ts`, les tests métier des quatre
personnages, `preparation.test.ts`, `remainingVisitHatsu.test.ts` et les tests de
caméra. `node apps/web/scripts/check-fighting-perception.mjs` filme neuf scénarios,
puis vérifie P2, le changement de spectateur, la pause, le mouvement réduit et
les largeurs 390/320 px. Vidéo et rapport : `output/clash-perception/`.
`PERCEPTION_CAPTURE_MODES=read,reply` reprend ces séquences ; une valeur vide
relance les contrôles complémentaires.
