# Infiltration V2 — backlog de publication

> **Objectif.** Transformer la tranche verticale `/infiltration` en un mode publiable composé de
> trois opérations courtes, rejouables et explicables. La V2 doit prouver que la géométrie du Black
> Whale, les couvertures sociales, la circulation de l'information et le Nen forment un même jeu.
>
> **État de départ.** Une mission jouable dans les huit pièces attestées de l'appartement de
> Tserriednich : rondes par les portes, collision, vision orientée, son spatial, trois Hatsu,
> témoins à croyances locales, traces, contrôles sociaux, rapports, télémétrie et débrief.
>
> **Définition de “publiable”.** Un nouveau joueur peut comprendre et terminer le tutoriel sans aide,
> les trois missions ont plusieurs solutions viables, une défaite est toujours explicable et la
> partie reste stable et accessible sur clavier comme sur écran tactile.

---

## 1. Invariants de conception

| ID | Invariant | Conséquence vérifiable |
| --- | --- | --- |
| I1 | Un PNJ ne reçoit jamais la position réelle du joueur sans percept. | Les couches de décision consomment des observations, jamais `player.position`. |
| I2 | Le navire est le terrain, pas un décor. | Navigation, vision et son sont dérivés des espaces, murs et ouvertures existants. |
| I3 | Être vu n'est pas perdre ; être identifié est une construction. | Chaque témoin conserve identité supposée, certitude, source et transmissions. |
| I4 | Une action utile laisse un coût ou un risque. | Aura, temps, trace, témoin ou contradiction accompagnent chaque raccourci. |
| I5 | Une information conserve sa provenance. | Le débrief distingue observation, conclusion, rapport et vérité. |
| I6 | Aucun Hatsu générique. | Chaque capacité applique ses conditions et ses limites canoniques déclarées. |
| I7 | Une même graine produit la même mission. | Rondes, variantes et objectifs sont reproductibles dans les tests et le débrief. |
| I8 | Les missions sont simulées, la géométrie est documentée. | L'interface sépare clairement canon, reconstruction et scénario non canonique. |
| I9 | La logique reste hors du rendu. | Réducteurs, perceptions, IA et verdicts sont purs et testés. |
| I10 | Une modalité sensorielle n'est jamais indispensable seule. | Son, couleur et animation possèdent toujours un équivalent visuel ou textuel. |

---

## 2. Périmètre de la V2

### Inclus

- Trois missions : rapport, filature et écoute.
- Trois Hatsu : Little Eye, Texture Surprise et Needle People.
- Trois configurations déterministes par mission.
- Couverture sociale, documents, contradictions et vérifications différées.
- États d'alerte produisant des changements concrets dans le monde.
- Débrief causal et sauvegarde locale d'une partie.
- Clavier AZERTY/QWERTY, tactile et exigences d'accessibilité de base.
- FR et EN à parité.

### Hors périmètre

- Combat ou élimination des gardes.
- Multijoueur.
- Planificateur LLM.
- Créateur libre de personnage ou de Hatsu.
- Génération procédurale complète.
- Extension aux cinq ponts.
- Progression persistante, monnaie ou arbre de compétences.
- Modification du catalogue canonique ou de `data/ship/blueprint.json`.

---

## 3. Structure cible

```text
apps/web/src/lib/infiltration/
├── missions/          # Définitions, objectifs, variantes et graines
├── actors/            # Perception, mémoire, décision et rapports
├── social/            # Couvertures, documents, déclarations et vérification
├── hatsu/             # Adaptateurs des modules Nen vers la mission
├── traces/            # Création, découverte, attribution et persistance
├── debrief/           # Reconstruction causale et vérité de référence
├── persistence/       # Sérialisation versionnée et reprise locale
├── accessibility/     # Mappage des commandes et retours équivalents
└── telemetry/         # Mesures locales d'équilibrage, sans données personnelles
```

La route Svelte orchestre ces modules et dessine leur projection. Elle ne décide ni de la
perception, ni de la validité d'une couverture, ni du résultat d'une mission.

---

## 4. Jalons

| Jalon | Résultat | Lots |
| --- | --- | --- |
| J0 — Fondation | Une mission est définie par des données et une graine. | A, B |
| J1 — Campagne | Les trois missions ont une boucle complète. | C, D, E |
| J2 — Profondeur | Social, Hatsu, alertes et traces communiquent. | F, G, H, I |
| J3 — Explication | Le débrief reconstruit toute la chaîne causale. | J |
| J4 — Publication | Sauvegarde, accessibilité, performance et intégration sont validées. | K, L, M, N |

Un jalon non validé bloque le suivant. Les critères demandant une partie humaine ne peuvent pas
être remplacés par un test unitaire.

---

## 5. Backlog détaillé

## Lot A — Modèle de mission et déterminisme

**But :** sortir les règles propres au rapport de la route et permettre plusieurs opérations.

| ID | Tâche | Sortie | Critère d'acceptation |
| --- | --- | --- | --- |
| A1 | Définir `MissionDefinition`, `ObjectiveDefinition`, `MissionVariant` et `MissionSeed`. | `missions/types.ts` | Aucun type ne dépend de Svelte ou du DOM. |
| A2 | Déplacer points de départ, témoins, objectif et extraction dans une définition. | `missions/report.ts` | La mission actuelle démarre sans constante de scénario dans la page. |
| A3 | Ajouter un générateur pseudo-aléatoire seedé partagé. | `missions/random.ts` | Deux initialisations de même graine sont profondément égales. |
| A4 | Produire trois variantes de rondes et de documents pour le rapport. | `missions/report.ts` | Les variantes restent connexes et accessibles. |
| A5 | Afficher mission, variante et graine dans le briefing et le débrief. | UI + i18n | Une partie peut être reproduite depuis son débrief. |
| A6 | Valider chaque définition au chargement. | `missions/validate.ts` | Objectif, extraction et routes invalides échouent en test. |

**Gate A :** recharger une graine restitue positions, rondes, documents et objectifs facultatifs.

## Lot B — Objectifs composables

| ID | Tâche | Sortie | Critère d'acceptation |
| --- | --- | --- | --- |
| B1 | Remplacer les booléens `documentCopied` et `authorConfirmed` par des objectifs typés. | `missions/objectives.ts` | Un verdict ne contient aucune condition codée par identifiant de mission. |
| B2 | Supporter objectifs requis, facultatifs, secrets et contradictoires. | Réducteur pur | Un objectif facultatif ne bloque jamais l'extraction. |
| B3 | Ajouter états `unknown`, `believed`, `confirmed`, `invalidated`. | Modèle d'information | Une information fausse peut être rapportée comme crue. |
| B4 | Séparer accomplissement matériel et validité de l'information. | Verdict | “Document copié” et “document authentique” sont deux axes. |
| B5 | Tester toutes les combinaisons de verdict. | Tests paramétrés | Chaque résultat public possède au moins un test. |

**Gate B :** le moteur peut conclure “objectif accompli, information fausse, couverture intacte”.

## Lot C — Mission 1 : Le rapport manquant

**Rôle :** tutoriel jouable en 10–15 minutes.

| ID | Tâche | Critère d'acceptation |
| --- | --- | --- |
| C1 | Écrire une séquence pédagogique progressive. | Aucun écran ne présente plus de deux nouveaux concepts simultanément. |
| C2 | Ajouter un ordre de maintenance authentique utilisable une fois. | Le premier contrôle social a une réponse démontrée, pas devinée. |
| C3 | Introduire vision, bruit puis Zetsu dans trois situations distinctes. | Chaque notion est utilisée avant l'introduction de la suivante. |
| C4 | Rendre la confirmation de l'auteur facultative. | Extraction possible sans confirmation, débrief différent. |
| C5 | Ajouter un leurre documentaire dans deux variantes sur trois. | Le leurre est détectable par au moins deux méthodes. |
| C6 | Ajouter aide contextuelle désactivable. | Un joueur expérimenté peut lancer sans tutoriel. |

**Gate C :** trois nouveaux joueurs sur quatre terminent sans explication extérieure.

## Lot D — Mission 2 : Le messager

**Rôle :** filature et information incertaine.

| ID | Tâche | Critère d'acceptation |
| --- | --- | --- |
| D1 | Définir le messager, deux faux destinataires et un destinataire réel. | Le destinataire dépend de la graine. |
| D2 | Ajouter mémoire d'exposition répétée. | Être vu trois fois par le messager augmente sa certitude même sous couverture. |
| D3 | Ajouter distance de filature lisible sans jauge omnisciente. | Retours “trop près/perdu de vue” dérivés de perceptions acquises. |
| D4 | Permettre une filature physique complète. | Mission gagnable sans Hatsu. |
| D5 | Permettre une filature par Little Eye. | L'éclaireur peut être remarqué, perdu ou détruit. |
| D6 | Produire une conclusion fausse plausible. | Un joueur peut extraire une identité erronée sans bug ni alerte spéciale. |
| D7 | Tester rupture et reprise de filature. | Perdre la cible ne révèle jamais sa position réelle. |

**Gate D :** les stratégies physique et Little Eye ont chacune un avantage et un risque mesurables.

## Lot E — Mission 3 : L'écoute

**Rôle :** préparation, persistance des traces et conséquences après extraction.

| ID | Tâche | Critère d'acceptation |
| --- | --- | --- |
| E1 | Ajouter un dispositif à poser dans une pièce choisie. | Position et heure de pose sont enregistrées. |
| E2 | Exiger une durée minimale de pose exposée. | L'action peut être interrompue par un contrôle ou une alerte. |
| E3 | Simuler la découverte après le départ. | Le monde continue jusqu'à une fenêtre de verdict bornée. |
| E4 | Distinguer réussite immédiate et réussite durable. | Un dispositif découvert après extraction dégrade le résultat sans l'annuler rétroactivement. |
| E5 | Ajouter deux emplacements, l'un sûr mais pauvre, l'autre risqué mais informatif. | Le choix modifie réellement les renseignements recueillis. |
| E6 | Ajouter une relève déterministe. | La relève est annoncée et reproductible par graine. |

**Gate E :** poser puis oublier le dispositif donne un résultat différent de poser et préparer sa survie.

## Lot F — Système social explicable

| ID | Tâche | Sortie | Critère d'acceptation |
| --- | --- | --- | --- |
| F1 | Définir couverture, droits, obligations et preuves détenues. | `social/cover.ts` | Chaque zone peut expliquer pourquoi une couverture est admise. |
| F2 | Remplacer “bonne réponse secrète” par des options évaluées. | `social/check.ts` | Le plan affiche les éléments connus qui soutiennent ou contredisent une réponse. |
| F3 | Ajouter présentation d'un document, citation d'un supérieur, maintien d'une déclaration, fuite et silence. | Actions typées | Chaque option a conséquence immédiate et différée. |
| F4 | Mémoriser toutes les déclarations par sujet. | `social/memory.ts` | Deux formulations compatibles ne sont pas marquées contradictoires. |
| F5 | Propager les contradictions lors d'un rapport. | Événement social | Un second témoin ne connaît la contradiction qu'après transmission. |
| F6 | Ajouter vérification auprès d'un supérieur. | Intention PNJ | Elle coûte du temps et peut échouer faute de liaison. |
| F7 | Exposer “pourquoi ce contrôle ?”. | UI accessible | Le joueur voit rôle, anomalie observée et autorité supposée. |

**Gate F :** après un échec, le joueur peut identifier la déclaration ou preuve qui l'a compromis.

## Lot G — Hatsu complets

### Little Eye

| ID | Tâche | Critère d'acceptation |
| --- | --- | --- |
| G1 | Matérialiser un éclaireur dans l'espace. | Sa position est rendue et testée contre les mêmes murs. |
| G2 | Ajouter pilotage pièce par pièce et champ de vision propre. | Il ne révèle rien hors de son cône ou derrière une cloison. |
| G3 | Immobiliser ou vulnérabiliser le joueur pendant le pilotage. | L'information distante possède un coût spatial immédiat. |
| G4 | Ajouter prédation, perte et rappel. | La disparition de l'hôte met fin au flux sans effacer les faits acquis. |

### Texture Surprise

| ID | Tâche | Critère d'acceptation |
| --- | --- | --- |
| G5 | Choisir la surface et l'apparence falsifiée. | La cible doit satisfaire les conditions du module. |
| G6 | Distinguer inspection visuelle, tactile et registre. | Gyo seul ne révèle pas une falsification sans aura détectable. |
| G7 | Permettre transmission d'un faux document. | Chaque lecteur obtient une croyance sourcée. |

### Needle People

| ID | Tâche | Critère d'acceptation |
| --- | --- | --- |
| G8 | Choisir l'identité imitée au briefing. | Droits et obligations proviennent de l'identité choisie. |
| G9 | Ajouter témoins connaissant personnellement le modèle. | Ils détectent incohérences de comportement, pas le masque visuel par magie. |
| G10 | Appliquer expiration, retrait et lecture au Gyo. | Chaque fin possède un signal visuel et textuel. |

### Commun

| ID | Tâche | Critère d'acceptation |
| --- | --- | --- |
| G11 | Construire le plan depuis le module Nen existant. | Conditions, coût et projection affichés viennent de la même source que l'exécution. |
| G12 | Journaliser activation, cible, coût et effet. | Le débrief peut expliquer chaque changement produit par un Hatsu. |

**Gate G :** chaque Hatsu permet au moins une victoire et possède un mode d'échec exclusif.

## Lot H — États d'alerte concrets

| Niveau | Déclencheur indicatif | Effet monde |
| --- | --- | --- |
| Normal | Aucun rapport solide | Rondes ordinaires. |
| Doute | Observation ou trace faible | Contrôles plus probables, ordres vérifiés. |
| Recherche | Rapport local précis | PNJ enquêtent sur les dernières positions crues. |
| Confinement | Deux sources concordantes | Issues surveillées et itinéraires modifiés. |
| Identifié | Identité confirmée | Couverture perdue ; fuite encore possible. |

| ID | Tâche | Critère d'acceptation |
| --- | --- | --- |
| H1 | Remplacer les seuils UI par une machine d'état. | Chaque transition contient cause et source. |
| H2 | Produire des intentions de ronde selon l'état. | Le confinement change réellement la topologie praticable. |
| H3 | Garder la jauge comme résumé secondaire. | Aucun verdict ne dépend directement d'un pourcentage isolé. |
| H4 | Autoriser une extraction sous identité compromise. | “Identifié” n'est plus automatiquement un écran de défaite. |
| H5 | Ajouter retour sonore et textuel équivalent à chaque transition. | Jouable sans son et sans distinction de couleurs. |

**Gate H :** un joueur peut nommer l'état d'alerte en observant le comportement, sans lire la jauge.

## Lot I — Traces et enquête différée

| ID | Tâche | Critère d'acceptation |
| --- | --- | --- |
| I1 | Donner à chaque trace identifiant, position, auteur supposé et durée. | Deux traces de même type restent distinctes. |
| I2 | Ajouter exigences de découverte par type. | Aura : Nen/Gyo ; faux papier : toucher ou registre ; bruit : présence au moment. |
| I3 | Ajouter attribution et comparaison. | Découvrir une trace n'identifie pas automatiquement son auteur. |
| I4 | Simuler une fenêtre post-extraction bornée. | Même graine, mêmes découvertes différées. |
| I5 | Permettre reprise, nettoyage ou corruption de certaines traces. | Chaque nettoyage coûte temps ou produit une autre trace. |
| I6 | Tester traces concurrentes et faux positifs. | Une diversion peut raisonnablement incriminer une autre couverture. |

**Gate I :** une mission peut être propre à l'extraction puis compromise dans le rapport final.

## Lot J — Débrief causal

| ID | Tâche | Sortie | Critère d'acceptation |
| --- | --- | --- | --- |
| J1 | Normaliser un journal d'événements de mission. | `debrief/events.ts` | Toute modification de croyance référence un événement source. |
| J2 | Construire la chronologie joueur/témoins. | `debrief/timeline.ts` | Observations et rapports sont ordonnés sans omniscience rétroactive. |
| J3 | Construire la chaîne “perçu → cru → transmis → vérifié”. | `debrief/causality.ts` | Chaque identification possède un chemin causal. |
| J4 | Comparer information rapportée et vérité de scénario. | Verdict | Vrai, faux et incertain sont distincts. |
| J5 | Présenter quatre axes : objectif, vérité, couverture, conséquences. | UI | Aucun score agrégé ne masque un axe en échec. |
| J6 | Ajouter replay textuel filtrable par témoin. | UI | Le filtre ne révèle que ce que ce témoin savait à cet instant. |
| J7 | Exporter graine et résumé partageable sans données personnelles. | Bouton | Copier le résumé ne contient aucun stockage local sensible. |

**Gate J :** cinq défaites consécutives peuvent être expliquées sans consulter l'état interne.

## Lot K — Sauvegarde et reprise

| ID | Tâche | Critère d'acceptation |
| --- | --- | --- |
| K1 | Définir un format versionné et validé. | Une sauvegarde inconnue est refusée proprement. |
| K2 | Sauvegarder mission, graine, état et journal localement. | Rechargement restitue exactement la partie. |
| K3 | Exclure handles DOM, cartes et objets non sérialisables. | Aller-retour JSON profondément égal sur l'état persistant. |
| K4 | Ajouter reprendre, recommencer et supprimer. | Aucun écrasement silencieux. |
| K5 | Geler l'horloge en pause ou onglet masqué. | Aucun PNJ ne se téléporte après retour. |
| K6 | Tester migration d'une version précédente. | Fixture de sauvegarde conservée dans les tests. |

## Lot L — Accessibilité et commandes

| ID | Tâche | Critère d'acceptation |
| --- | --- | --- |
| L1 | Centraliser les commandes dans un mapping configurable. | AZERTY et QWERTY sans branche dans la logique de mission. |
| L2 | Ajouter navigation clavier complète des dialogues. | Aucun contrôle n'exige la souris. |
| L3 | Finaliser commandes tactiles et zones sûres. | Test manuel sur 360 × 800 sans chevauchement bloquant. |
| L4 | Ajouter libellés, focus piégé et restitution du focus aux modales. | Audit axe sans erreur critique. |
| L5 | Doubler son/couleur/animation par texte ou forme. | Partie terminable en sourdine et en monochrome. |
| L6 | Respecter réduction de mouvement. | Aucun effet essentiel ne disparaît avec l'animation. |
| L7 | Ajouter pause et aide des commandes. | Accessible pendant toute phase non cinématique. |

## Lot M — Performance et robustesse

| ID | Tâche | Critère d'acceptation |
| --- | --- | --- |
| M1 | Profiler une partie de vingt minutes. | Pas de croissance continue des listeners, apparitions ou buffers. |
| M2 | Borner le rattrapage de boucle après suspension. | Maximum 250 ms simulées au retour. |
| M3 | Tester 30/60/120 Hz. | Même graine et mêmes actions donnent le même verdict. |
| M4 | Tester perte/reprise du pointer lock. | Aucun déplacement ou clic fantôme. |
| M5 | Tester WebGL indisponible. | Message accessible et retour au site, sans écran noir. |
| M6 | Ajouter budget de performance. | 60 fps cible bureau, 30 fps plancher mobile compatible. |
| M7 | Vérifier nettoyage complet à la sortie. | Audio, RAF et événements sont arrêtés au démontage. |

## Lot N — Publication et intégration

| ID | Tâche | Critère d'acceptation |
| --- | --- | --- |
| N1 | Créer une page d'introduction hors plein écran. | Promesse, durée, commandes et statut du scénario visibles avant lancement. |
| N2 | Ajouter l'entrée à la navigation et au sitemap. | Accessible en FR/EN sans URL directe. |
| N3 | Ajouter SEO, Open Graph et capture dédiée. | Aperçu correct sur les validateurs usuels. |
| N4 | Afficher crédits et statut canonique. | Géométrie documentée et scénario non canonique clairement séparés. |
| N5 | Corriger tout texte mal encodé. | Recherche automatisée des séquences mojibake connue vide. |
| N6 | Ajouter page de confidentialité de la télémétrie locale. | Aucun envoi réseau sans consentement explicite. |
| N7 | Ajouter feature flag et procédure de rollback. | Désactivation sans redéploiement de données. |
| N8 | Écrire notes de version et guide de feedback. | Version, limites et canal de retour visibles. |

---

## 6. Plan de tests

### Tests unitaires obligatoires

- Déterminisme des trois missions et de chaque variante.
- Navigation exclusivement par ouverture.
- Vision : angle, distance, mur, porte, lumière.
- Son : allure, distance, portes, bruit ambiant, Zetsu sans silence artificiel.
- Croyances : acquisition, vieillissement, contradiction, transmission et vérification.
- Conditions, coûts et projections de chaque Hatsu.
- Découverte et attribution de chaque type de trace.
- Tous les verdicts et axes du débrief.
- Sérialisation, migration et reprise.

### Tests d'intégration

| Scénario | Attendu |
| --- | --- |
| Rapport sans Hatsu | Gagnable par observation et ordre authentique. |
| Rapport avec faux document | Réussite initiale, risque différé au registre. |
| Filature physique | Aucune position donnée sans vue ou son. |
| Filature Little Eye | Faits sourcés par l'éclaireur, perte possible. |
| Écoute emplacement sûr | Moins d'information, moins de découvertes. |
| Écoute emplacement risqué | Plus d'information, enquête post-extraction probable. |
| Contradiction transmise | Seuls les destinataires du rapport en bénéficient. |
| Extraction identifiée | Fin jouable et verdict distinct d'une capture. |

### Tests humains

- 4 sessions de découverte sans accompagnement.
- 5 parties consécutives par mission avec changement de stratégie.
- 1 session clavier AZERTY, 1 QWERTY et 2 tactiles.
- 1 session sans son, 1 en réduction de mouvement, 1 avec navigation clavier seule.
- Questionnaire après chaque défaite : “Comment avez-vous été identifié ?”.

---

## 7. Télémétrie d'équilibrage locale

Mesures autorisées, conservées localement sauf consentement explicite :

- durée par phase ;
- distance parcourue ;
- nombre de contrôles et réponses ;
- activations, coûts et échecs de Hatsu ;
- alertes par source ;
- traces créées, découvertes et attribuées ;
- objectifs vrais, crus et rapportés ;
- état d'alerte maximal ;
- résultat sur les quatre axes.

Signaux à surveiller :

| Signal | Interprétation | Action |
| --- | --- | --- |
| Un Hatsu choisi dans > 60 % des parties | Choix dominant ou mission biaisée. | Corriger opportunités/risques, pas seulement le coût. |
| Une réponse sociale réussit > 85 % | Contrôle décoratif. | Renforcer besoin de renseignement ou vérification. |
| Une mission échoue avant 3 minutes > 25 % | Introduction illisible. | Revoir enseignement et signaux préalables. |
| Objectif atteint sans alerte > 50 % | Route trop sûre. | Modifier rondes et goulots. |
| Joueur incapable d'expliquer une défaite > 20 % | Débrief ou causalité insuffisant. | Corriger explication avant difficulté. |

---

## 8. Ordre recommandé

1. A — modèle et graine.
2. B — objectifs composables.
3. C — solidifier le tutoriel.
4. F — rendre le social explicable.
5. H — matérialiser les alertes.
6. I — compléter les traces.
7. G — terminer les trois Hatsu.
8. D puis E — ajouter les deux missions.
9. J — construire le débrief sur les événements stabilisés.
10. K, L et M en parallèle logique, sans modifier les règles.
11. N — publication après validation des gates.

Ne pas commencer D et E avant que A/B soient stables : copier la mission actuelle deux fois avant
d'avoir un modèle de mission produirait trois routes différentes à maintenir.

---

## 9. Définition de fini de la V2

La V2 est publiable lorsque toutes les affirmations suivantes sont vraies :

- [ ] Les trois missions sont terminables sans Hatsu.
- [ ] Chaque Hatsu permet une victoire particulière et possède un échec particulier.
- [ ] Chaque mission dispose de trois variantes seedées et reproductibles.
- [ ] Aucun PNJ ne reçoit une vérité qu'il n'a pas perçue ou reçue.
- [ ] Aucun déplacement, regard ou son ne traverse la géométrie sans règle explicite.
- [ ] Les états d'alerte changent le comportement et non seulement l'interface.
- [ ] Le débrief explique chaque identification par une chaîne causale.
- [ ] Vérité, objectif, couverture et conséquences sont quatre verdicts distincts.
- [ ] Une partie peut être sauvegardée, rechargée, mise en pause et supprimée.
- [ ] FR et EN sont complètes et correctement encodées.
- [ ] Clavier, tactile, sourdine et réduction de mouvement ont été testés humainement.
- [ ] Une partie de vingt minutes respecte les budgets mémoire et framerate.
- [ ] Trois nouveaux joueurs sur quatre terminent le tutoriel sans aide.
- [ ] Après cinq parties, au moins deux stratégies restent viables par mission.
- [ ] Statut simulé, sources de la reconstruction et crédits sont visibles.

Si une de ces cases manque, la V2 peut être déployée sous feature flag pour test, mais elle ne doit
pas être présentée comme publiée.
