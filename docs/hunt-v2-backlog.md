# Backlog détaillé — Hunt V2 publiable

## Objectif de publication

Publier une expérience solo complète et rejouable dans laquelle le joueur choisit un Hatsu,
comprend les principes du Nen, prépare un affrontement pendant la traque, puis peut expliquer dans
le débrief pourquoi il a gagné ou perdu.

La V2 est publiable quand la boucle `briefing → traque → contact → duel → débrief → rejouer` est
stable sur ordinateur et mobile, en français et en anglais, sans connaissance cachée utilisée par
le chasseur et sans modification de la reconstruction du navire.

### Légende

- **P0** : bloque la publication.
- **P1** : requis pour atteindre le niveau de qualité V2, mais ne bloque pas une release candidate.
- **P2** : amélioration reportable en V2.1.
- **S** : moins d’une journée ; **M** : 1–2 jours ; **L** : 3–5 jours.
- **Livré** : présent sur la branche V2 ; les critères restent couverts par les tests de régression.

## Invariants non négociables

1. Aucune statistique de dégâts : le duel porte sur les conditions, l’aura et l’exposition.
2. Une seule réserve d’aura finance information, préparation et survie.
3. Une victoire sans attaque doit rester possible par épuisement ou préparation.
4. Un chasseur intact domine le duel ; l’avantage se construit pendant la traque.
5. Le chasseur ne reçoit jamais la position réelle du joueur, uniquement ses perceptions.
6. Les terrains utilisent exclusivement la géométrie attestée de `blueprint.json`.
7. Hunt consomme les modules de `/tour` sans modifier leur comportement.

---

## Epic 1 — Boucle jouable et choix initiaux

### HUNT2-001 — Briefing et boucle complète

**État :** Livré  
**Priorité :** P0  
**Commit :** `ca44bbf`

**Critères d’acceptation :**

- la partie traverse sans rupture briefing, traque, duel et débrief ;
- recommencer réinitialise horloge, aura, croyances, Hatsu et tutoriel ;
- aucune action de jeu n’est possible sous le briefing ou le débrief.

### HUNT2-002 — Trois Hatsu aux usages distincts

**État :** Livré  
**Priorité :** P0  
**Commit :** `2a5b160`

Bungee Gum prépare le terrain, Parallel Future anticipe l’intention adverse et Dowsing Chain donne
une direction probable sans révéler une pièce exacte.

**Critères d’acceptation :**

- chaque Hatsu impose une condition Nen et un coût ou une limite d’usage ;
- aucun Hatsu ne court-circuite la perception du chasseur ;
- chaque effet est utile pendant la traque ou lors de la jonction avec le duel.

### HUNT2-003 — Sélection du loadout avant la chasse

**État :** Livré  
**Priorité :** P0  
**Commits :** `42ecc2e`, `d73ba62`

**Critères d’acceptation :**

- le Hatsu sélectionné est celui de l’état initial ;
- changer de Hatsu avant le départ réinitialise proprement la simulation ;
- les conditions d’utilisation sont visibles avant validation.

### HUNT2-004 — Profils de chasseurs sélectionnables

**État :** Livré  
**Priorité :** P1  
**Commit :** `e009d36`

**Critères d’acceptation :**

- méthodique, agressif et prudent ont des cadences et économies d’aura distinctes ;
- le profil choisi est injecté dans l’état initial, sans accès supplémentaire au joueur ;
- les différences sont expliquées dans le briefing.

### HUNT2-005 — Persistance des préférences de partie

**Priorité :** P1  
**Estimation :** S  
**Dépendances :** HUNT2-003, HUNT2-004

Conserver localement la langue, le Hatsu, le profil de chasseur, les réglages audio, le mouvement
réduit et le dernier terrain. Ne pas sauvegarder automatiquement une partie en cours dans la V2.

**Critères d’acceptation :**

- une préférence invalide ou obsolète retombe sur une valeur sûre ;
- aucun stockage n’est nécessaire pour commencer une partie ;
- une action permet de restaurer les réglages par défaut.

---

## Epic 2 — Apprentissage

### HUNT2-010 — Tutoriel Nen jouable

**État :** Livré  
**Priorité :** P0  
**Commit :** `a367dba`

Le tutoriel progresse à partir des actions réellement accomplies : marcher, passer en Zetsu,
balayer avec En, employer le Hatsu et atteindre le contact.

### HUNT2-011 — Entraînement sans pression

**Priorité :** P1  
**Estimation :** M  
**Dépendances :** HUNT2-010

Ajouter depuis le briefing un mode entraînement où le temps et le chasseur peuvent être mis en
pause. Les coûts, perceptions et règles restent identiques à une partie normale.

**Critères d’acceptation :**

- pause et reprise ne modifient pas le résultat déterministe ;
- chaque action Nen affiche condition, coût et conséquence ;
- le mode est clairement exclu des statistiques d’équilibrage.

### HUNT2-012 — Aide consultable et réinitialisable

**Priorité :** P1  
**Estimation :** S  
**Dépendances :** HUNT2-010

**Critères d’acceptation :**

- l’aide explique Ten, Zetsu, En, aura placée et principes du duel ;
- elle est accessible au clavier et au tactile pendant une partie ;
- le joueur peut relancer le tutoriel depuis les réglages.

---

## Epic 3 — Terrains et rejouabilité

### HUNT2-020 — Définir trois variantes de terrain attestées

**Priorité :** P0  
**Estimation :** L  
**Dépendances :** aucune

Créer trois configurations connectées : appartement, parcours resserré et parcours étendu. Chaque
configuration référence uniquement des espaces, murs et ouvertures déjà présents dans le plan.

**Critères d’acceptation :**

- chaque variante possède un identifiant stable et un libellé FR/EN ;
- un validateur garantit provenance, connexité et présence de deux points éloignés ;
- aucune variante ne modifie `data/ship/blueprint.json` ;
- le briefing expose taille, densité d’issues et durée estimée.

### HUNT2-021 — Sélection et initialisation du terrain

**Priorité :** P0  
**Estimation :** M  
**Dépendances :** HUNT2-020

**Critères d’acceptation :**

- changer de terrain reconstruit arène, graphe, départs et objectif ;
- joueur et chasseur commencent dans des espaces accessibles et distincts ;
- une même seed et un même loadout reproduisent la même ouverture.

### HUNT2-022 — Faire varier acoustique et lignes de vue

**Priorité :** P1  
**Estimation :** L  
**Dépendances :** HUNT2-020

Réutiliser les propriétés atmosphériques existantes pour que chaque terrain change la propagation
des pas, le masque sonore et la lisibilité des silhouettes, sans inventer de géométrie.

### HUNT2-023 — Objectifs secondaires par terrain

**Priorité :** P2  
**Estimation :** M  
**Dépendances :** HUNT2-021

Proposer des objectifs optionnels mesurables : terminer sans En, récupérer toute l’aura placée ou
faire enquêter le chasseur dans plusieurs mauvaises pièces.

---

## Epic 4 — Débrief explicable

### HUNT2-030 — Journaliser les déplacements significatifs

**Priorité :** P0  
**Estimation :** M

Enregistrer les changements de pièce du joueur et du chasseur avec horodatage, origine et cause
perçue, sans journaliser chaque frame.

**Critères d’acceptation :**

- le journal reste déterministe et borné ;
- la trajectoire du chasseur distingue patrouille, recherche et contact ;
- aucune information cachée n’est montrée avant la fin de partie.

### HUNT2-031 — Carte spatiale du débrief

**Priorité :** P0  
**Estimation :** L  
**Dépendances :** HUNT2-030

**Critères d’acceptation :**

- les trajectoires joueur/chasseur sont distinguables sans dépendre uniquement de la couleur ;
- En, Hatsu, pièges, inspections et contact sont placés sur la chronologie ;
- survol, focus clavier et sélection tactile donnent le même détail ;
- une alternative textuelle restitue toute l’information.

### HUNT2-032 — Expliquer la causalité de la victoire ou défaite

**Priorité :** P0  
**Estimation :** M  
**Dépendances :** HUNT2-030

Le résumé relie les décisions de traque à l’état d’entrée du duel : aura restante, aura immobilisée,
fausses pistes, Hatsu actif et fatigue du chasseur.

### HUNT2-033 — Comparer avec la partie précédente

**Priorité :** P2  
**Estimation :** M  
**Dépendances :** HUNT2-031

Comparaison locale uniquement, sur durée, dépense d’aura, exposition et résultat.

---

## Epic 5 — Instrumentation et équilibrage

### HUNT2-040 — Produire les métriques d’une partie

**Priorité :** P0  
**Estimation :** M  
**Dépendances :** HUNT2-030

Mesures minimales : durée, balayages En, temps en Zetsu, usages du Hatsu, aura dépensée et
récupérée, pièces visitées, fausses pistes, inspections, aura de départ du duel et issue.

### HUNT2-041 — Exporter un rapport d’équilibrage anonyme

**Priorité :** P1  
**Estimation :** M  
**Dépendances :** HUNT2-040

**Critères d’acceptation :**

- export JSON versionné, sans identifiant personnel ni texte libre ;
- consentement explicite avant tout envoi réseau ;
- téléchargement local disponible sans consentement analytique.

### HUNT2-042 — Simuler la matrice de configurations

**Priorité :** P0  
**Estimation :** L  
**Dépendances :** HUNT2-020, HUNT2-040

Exécuter plusieurs seeds pour chaque combinaison Hatsu × chasseur × terrain et produire durée,
taux de contact, aura au duel et taux de victoire.

### HUNT2-043 — Première passe d’équilibrage

**Priorité :** P0  
**Estimation :** M  
**Dépendances :** HUNT2-042

**Critères d’acceptation :**

- aucun Hatsu ou profil ne constitue un choix dominant sur tous les terrains ;
- une partie standard dure entre 4 et 10 minutes ;
- la préparation modifie matériellement l’issue du duel ;
- chaque ajustement de constante possède une mesure avant/après.

---

## Epic 6 — Contrôles, accessibilité et responsive

### HUNT2-050 — Parité clavier, souris et tactile

**Priorité :** P0  
**Estimation :** L

**Critères d’acceptation :**

- toutes les actions de traque et de duel sont disponibles sur les trois modes d’entrée ;
- aucun geste tactile ne dépend du survol ;
- les raccourcis sont affichés et remappables au minimum entre AZERTY et QWERTY ;
- aucun focus n’est perdu lors du passage briefing/jeu/duel/débrief.

### HUNT2-051 — Lecteur d’écran et annonces de jeu

**Priorité :** P0  
**Estimation :** M

Annoncer sobrement changement de Nen, coût d’aura, balayage reçu, Hatsu prêt, entrée en duel et
résultat. Les pas continus et animations ne doivent pas saturer la région live.

### HUNT2-052 — Mouvement réduit, contraste et signaux redondants

**Priorité :** P0  
**Estimation :** M

**Critères d’acceptation :**

- `prefers-reduced-motion` supprime secousses, pulsations et transitions non indispensables ;
- états Nen, danger et trajectoires utilisent forme ou texte en plus de la couleur ;
- textes et contrôles atteignent WCAG AA.

### HUNT2-053 — QA responsive

**Priorité :** P0  
**Estimation :** M  
**Dépendances :** HUNT2-050

Viewports cibles : 320×568, 375×667, 768×1024, 1366×768 et paysage mobile. Le HUD ne doit jamais
masquer simultanément la scène, les actions et l’objectif.

---

## Epic 7 — Audio et finition sensorielle

### HUNT2-060 — Signatures audio de la traque

**Priorité :** P1  
**Estimation :** M

Ajouter des signatures distinctes pour pas du chasseur, En reçu, changement de Nen, Hatsu, piège
déclenché et contact. Réutiliser le système audio existant et libérer tous les nœuds à la sortie.

### HUNT2-061 — Réglages audio

**Priorité :** P0  
**Estimation :** S  
**Dépendances :** HUNT2-060

**Critères d’acceptation :**

- volume principal et mode muet accessibles avant le lancement ;
- aucune lecture ne démarre avant une interaction utilisateur ;
- couper l’audio ne retire aucune information indispensable.

### HUNT2-062 — Passe visuelle finale

**Priorité :** P1  
**Estimation :** M

Harmoniser briefing, HUD, duel, tutoriel et débrief ; garantir la lisibilité sur scènes claires et
sombres ; supprimer textes tronqués, chevauchements et changements de mise en page brusques.

---

## Epic 8 — Localisation, résilience et performance

### HUNT2-070 — Parité éditoriale FR/EN

**Priorité :** P0  
**Estimation :** M

**Critères d’acceptation :**

- aucune chaîne visible en dur dans les composants ;
- test de complétude des clés et paramètres de fonctions de traduction ;
- aucun caractère d’encodage corrompu ;
- terminologie Nen cohérente dans briefing, tutoriel, HUD et débrief.

### HUNT2-071 — Gestion des erreurs et des états incomplets

**Priorité :** P0  
**Estimation :** M

Couvrir WebGL indisponible, terrain invalide, stockage inaccessible, perte de focus, onglet suspendu
et reprise après une erreur de rendu. Une erreur de présentation ne doit pas corrompre la partie.

### HUNT2-072 — Budget performance

**Priorité :** P0  
**Estimation :** M

**Seuils :**

- 60 FPS médian sur la machine de référence et 30 FPS sur mobile cible ;
- aucune croissance mémoire après dix parties successives ;
- aucun rattrapage massif de ticks après retour d’un onglet en arrière-plan ;
- chargement initial de Hunt mesuré et documenté dans la release candidate.

### HUNT2-073 — Nettoyage du cycle de vie

**Priorité :** P0  
**Estimation :** S

À la sortie ou au redémarrage : arrêter boucle, audio et listeners ; libérer la scène ; fermer les
interfaces Hatsu ; empêcher une ancienne partie d’émettre des événements.

---

## Epic 9 — Tests et publication

### HUNT2-080 — Tests unitaires et invariants

**Priorité :** P0  
**Estimation :** M

Conserver tous les tests Hunt existants et ajouter, pour chaque mécanique, un cas nominal, un cas
de refus et le ou les invariants concernés.

### HUNT2-081 — Parcours navigateur critiques

**Priorité :** P0  
**Estimation :** L

Automatiser au minimum : première partie tutorielle, chaque Hatsu, chaque profil de chasseur, chaque
terrain, victoire préparée, défaite sans préparation, redémarrage et débrief accessible.

### HUNT2-082 — Matrice de compatibilité

**Priorité :** P0  
**Estimation :** M  
**Dépendances :** HUNT2-081

Chromium, Firefox et WebKit, desktop et mobile ; clavier AZERTY/QWERTY ; mouvement normal/réduit ;
audio actif/muet ; français/anglais.

### HUNT2-083 — Revue éditoriale et spoilers

**Priorité :** P0  
**Estimation :** S

Vérifier noms, descriptions de Hatsu, certitude des informations, limite de spoilers, provenance des
lieux et absence de capacité inventée.

### HUNT2-084 — Release candidate V2

**Priorité :** P0  
**Estimation :** M  
**Dépendances :** tous les tickets P0

**Critères d’acceptation :**

- tests unitaires, contrôles de types, lint et parcours navigateur verts ;
- zéro bug bloquant ou majeur ouvert ;
- rapport d’équilibrage joint à la release ;
- checklist accessibilité et responsive signée ;
- métadonnées SEO et aperçu social validés ;
- version, changelog et procédure de retour arrière documentés.

---

## Ordre de livraison recommandé

| Lot | Tickets | Résultat démontrable |
| --- | --- | --- |
| V2.1 — Variété | HUNT2-020, 021, 022 | Trois terrains changent réellement la traque. |
| V2.2 — Explication | HUNT2-030, 031, 032 | Chaque issue est lisible dans l’espace et le temps. |
| V2.3 — Mesure | HUNT2-040, 042, 043 | La matrice est mesurée puis équilibrée. |
| V2.4 — Finition | HUNT2-050–053, 060–062, 070–073 | La boucle est accessible et robuste. |
| V2.5 — Publication | HUNT2-080–084 | Une release candidate passe toutes les gates. |

Les tickets P2 ne bloquent pas la V2. HUNT2-011, HUNT2-012, HUNT2-022 et les tickets P1 de finition
peuvent être reportés uniquement si leur absence ne compromet aucun critère P0 mesuré.

## Définition de terminé par fonctionnalité

Un ticket est fermé dans un commit dédié quand :

- [ ] les critères d’acceptation sont démontrés ;
- [ ] la logique pure possède ses tests nominaux et de refus ;
- [ ] les invariants concernés sont préservés ;
- [ ] les textes visibles sont disponibles en français et en anglais ;
- [ ] clavier et tactile sont couverts pour toute nouvelle action ;
- [ ] mouvement réduit et alternative non sonore sont vérifiés si nécessaire ;
- [ ] aucun fichier `/tour` ni `blueprint.json` n’est modifié sans décision explicite ;
- [ ] les tests Hunt, le typecheck ciblé et `git diff --check` sont verts ;
- [ ] le commit ne contient qu’une fonctionnalité cohérente.

Convention recommandée :

```text
feat(hunt-terrain): add attested arena variants
feat(hunt-debrief): render spatial pursuit timeline
feat(hunt-balance): export anonymous run metrics
fix(hunt-a11y): preserve focus through duel transition
```

## Hors périmètre V2

Comptes joueurs, classement global, multijoueur, défis quotidiens en ligne, génération procédurale,
planificateur LLM, nouveaux Hatsu au-delà des trois loadouts et progression compétitive persistante.
Ces sujets relèvent d’une V2.1 ou V3 et ne doivent pas retarder la publication.
