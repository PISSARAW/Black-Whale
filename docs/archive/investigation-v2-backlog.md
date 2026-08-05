# Backlog détaillé — Investigation V2 publiable

## Objectif

Publier un mode Investigation cohérent comprenant trois affaires complètes, une progression persistante, une gestion stricte des spoilers, une expérience FR/EN et un parcours utilisable en 2D comme en 3D.

### Priorités et estimations

- **P0** : indispensable à la publication.
- **P1** : important pour la qualité de la V2.
- **P2** : amélioration reportable.
- **S** : moins d’une journée.
- **M** : 1–2 jours.
- **L** : 3–5 jours.
- **XL** : plus d’une semaine, à découper.

---

## Epic 1 — Architecture générique des dossiers

### INV2-001 — Extraire le format générique d’une affaire

**Priorité :** P0  
**Estimation :** L  
**Dépendances :** aucune

Déplacer hors de la page tout ce qui reste spécifique à « Onze secondes » : métadonnées, scène, participants, interrogatoires, confrontations, géométrie, reconstitution, interactions Hatsu, hypothèses et rapport final.

**Critères d’acceptation :**

- la page ne référence plus directement `room1014Case` ;
- une affaire est chargée via son identifiant ;
- aucune branche du composant ne teste un identifiant de témoin particulier ;
- les tests de « Onze secondes » passent sans régression.

### INV2-002 — Définir le schéma versionné `InvestigationCase`

**Priorité :** P0  
**Estimation :** M  
**Dépendances :** INV2-001

Le schéma doit couvrir :

```ts
type InvestigationCase = {
  schemaVersion: number
  metadata: CaseMetadata
  scene: SceneDefinition
  subjects: InvestigationSubject[]
  evidence: Evidence[]
  objectives: Objective[]
  questions: InvestigationQuestion[]
  confrontations: ConfrontationRule[]
  hatsuRules: InvestigationHatsuRule[]
  replay: ReplayDefinition
  hypotheses: Hypothesis[]
  report: ReportDefinition
}
```

**Critères d’acceptation :**

- validation des identifiants uniques ;
- rejet des références vers une preuve ou une personne inconnue ;
- rejet d’une affaire sans conclusion canonique ;
- test d’intégrité automatisé pour chaque dossier.

### INV2-003 — Créer le registre des affaires

**Priorité :** P0  
**Estimation :** S  
**Dépendances :** INV2-002

**Critères d’acceptation :**

- `caseById(id)` retourne une affaire validée ;
- `listCases()` retourne les métadonnées sans charger la scène complète ;
- les identifiants inconnus produisent une page 404 propre ;
- l’ordre d’affichage est explicitement configuré.

### INV2-004 — Ajouter un validateur éditorial

**Priorité :** P0  
**Estimation :** M  
**Dépendances :** INV2-002

Le validateur doit détecter : preuves sans source, questions impossibles à débloquer, hypothèses impossibles à démontrer, objectifs irréalisables, confrontations circulaires, Hatsu donnant une preuve inexistante et rapports référençant une conclusion absente.

**Critères d’acceptation :**

- exécution dans les tests et la CI ;
- messages d’erreur nommant l’affaire et l’identifiant fautif ;
- zéro erreur sur les trois dossiers V2.

---

## Epic 2 — Accueil et navigation

### INV2-010 — Créer la salle des affaires

**Priorité :** P0  
**Estimation :** L  
**Dépendances :** INV2-003

Afficher pour chaque dossier : titre, accroche non-spoilante, enquêteur, chapitre requis, difficulté, durée estimée, progression et état verrouillé, disponible, en cours ou résolu.

**Critères d’acceptation :**

- responsive mobile/desktop ;
- navigation clavier complète ;
- aucune donnée spoilante sur une carte verrouillée ;
- reprise directe d’une affaire commencée.

### INV2-011 — Créer la route d’une affaire

**Priorité :** P0  
**Estimation :** M  
**Dépendances :** INV2-003, INV2-010

Route cible : `/investigation/[caseId]`.

**Critères d’acceptation :**

- chargement de l’affaire depuis le registre ;
- métadonnées SEO propres à l’affaire ;
- gestion du dossier inexistant ;
- retour clair vers la salle des affaires.

### INV2-012 — Ajouter un briefing générique

**Priorité :** P0  
**Estimation :** M  
**Dépendances :** INV2-011

**Critères d’acceptation :**

- objectifs, enquêteur, lieu et contexte viennent du dossier ;
- choix entre exploration 3D et tableau 2D ;
- avertissement de spoilers avant l’entrée ;
- le briefing n’est plus affiché après reprise, sauf demande explicite.

### INV2-013 — Ajouter une navigation interne stable

**Priorité :** P1  
**Estimation :** S  
**Dépendances :** INV2-011

Actions requises : retour aux dossiers, revoir le briefing, ouvrir le carnet, ouvrir le rapport final et recommencer l’affaire.

---

## Epic 3 — Progression et sauvegardes

### INV2-020 — Séparer sauvegarde globale et sauvegarde par affaire

**Priorité :** P0  
**Estimation :** M  
**Dépendances :** INV2-003

La sauvegarde globale contient les dossiers commencés et résolus, la dernière activité et la préférence 2D/3D. La sauvegarde locale contient les preuves, questions, confrontations, Hatsu, hypothèses, journal et verdict.

### INV2-021 — Implémenter les migrations de sauvegarde

**Priorité :** P0  
**Estimation :** M  
**Dépendances :** INV2-020

**Critères d’acceptation :**

- les sauvegardes V1 actuelles sont migrées ;
- une version inconnue n’efface pas silencieusement les données ;
- une sauvegarde corrompue est isolée sans casser les autres dossiers ;
- chaque version possède un test de migration.

### INV2-022 — Ajouter la reprise exacte du contexte

**Priorité :** P0  
**Estimation :** M  
**Dépendances :** INV2-020

Restaurer l’onglet du carnet, la dernière personne interrogée, l’étape de reconstitution, l’hypothèse en cours et le rapport final déjà obtenu.

### INV2-023 — Ajouter export et import de progression

**Priorité :** P2  
**Estimation :** M  
**Dépendances :** INV2-020

Format JSON versionné, sans donnée personnelle.

---

## Epic 4 — Gestion des spoilers

### INV2-030 — Connecter Investigation à la limite globale de spoilers

**Priorité :** P0  
**Estimation :** M  
**Dépendances :** INV2-010

**Critères d’acceptation :**

- une affaire dépassant la limite est verrouillée ;
- titre, victime, image et résumé sont masqués ;
- aucune donnée du dossier verrouillé n’est incluse dans le HTML rendu ;
- le chapitre requis est indiqué sans révéler l’événement.

### INV2-031 — Filtrer les preuves et rapports par chapitre

**Priorité :** P0  
**Estimation :** L  
**Dépendances :** INV2-030

**Critères d’acceptation :**

- chaque preuve possède `knownAtChapter` et éventuellement `revealedAtChapter` ;
- la vérité lecteur postérieure reste masquée ;
- le verdict s’adapte aux informations autorisées ;
- les Hatsu respectent la même limite.

### INV2-032 — Créer le dialogue de relèvement de limite

**Priorité :** P0  
**Estimation :** S  
**Dépendances :** INV2-030

Le chapitre exact est annoncé, la confirmation est explicite et l’utilisateur peut annuler sans perdre sa progression.

### INV2-033 — Tester les fuites de spoilers

**Priorité :** P0  
**Estimation :** M  
**Dépendances :** INV2-031

Vérifier l’accueil, le HTML serveur, les textes accessibles, les attributs ARIA, les métadonnées SEO, les sauvegardes, le rapport final et les Hatsu.

---

## Epic 5 — Dossier 1 : Onze secondes

### INV2-040 — Migrer « Onze secondes » vers le moteur générique

**Priorité :** P0  
**Estimation :** M  
**Dépendances :** INV2-002

**Critères d’acceptation :**

- comportement identique à la version actuelle ;
- tests existants conservés ;
- aucune règle spécifique dans la page générique.

### INV2-041 — Finaliser la distribution visuelle

**Priorité :** P1  
**Estimation :** L  
**Dépendances :** INV2-040

- silhouettes différenciées ;
- labels lisibles ;
- Barrigen clairement identifiable ;
- états examiné/interrogé/confronté ;
- sélection tactile fiable.

### INV2-042 — Passe éditoriale canonique

**Priorité :** P0  
**Estimation :** M  
**Dépendances :** INV2-040

Relire l’identité des participants, la visibilité de la poupée et des créatures, la durée de l’attaque, le rôle des gardes et les limites des conclusions de Kurapika.

---

## Epic 6 — Dossier 2 : La chambre 1012

### INV2-050 — Écrire la bible du dossier Momoze

**Priorité :** P0  
**Estimation :** M  
**Dépendances :** INV2-002

Définir la question centrale, l’enquêteur, la fenêtre temporelle, les suspects, les alibis, les connaissances accessibles, la conclusion canonique et les révélations postérieures.

### INV2-051 — Construire la scène de la chambre 1012

**Priorité :** P0  
**Estimation :** L  
**Dépendances :** INV2-050

Éléments : lit, accès, postes de garde, positions de Tuffdy et des gardes, traces de strangulation et absence du Guardian Spirit Beast.

### INV2-052 — Écrire les interrogatoires des gardes

**Priorité :** P0  
**Estimation :** L  
**Dépendances :** INV2-050

Inclure les gardes de service et hors service, Biscuit, Hanzo, les contradictions horaires et les informations sur le double de Hanzo.

### INV2-053 — Ajouter les preuves et confrontations

**Priorité :** P0  
**Estimation :** L  
**Dépendances :** INV2-051, INV2-052

**Critères d’acceptation :**

- au moins huit preuves ;
- au moins deux confrontations productives ;
- une fausse piste crédible ;
- résolution possible sans Hatsu.

### INV2-054 — Créer la reconstitution du meurtre

**Priorité :** P0  
**Estimation :** M  
**Dépendances :** INV2-053

### INV2-055 — Créer hypothèses, verdicts et rapport final

**Priorité :** P0  
**Estimation :** M  
**Dépendances :** INV2-053

Distinguer ce que Hanzo peut déduire, ce que la confession établit et ce que le lecteur sait avant et après le chapitre 372.

### INV2-056 — Ajouter les interactions Hatsu

**Priorité :** P1  
**Estimation :** M  
**Dépendances :** INV2-053

Techniques candidates : Dowsing Chain, Little Eye, Hanzo Skill 4 et Emperor Time.

---

## Epic 7 — Dossier 3 : Le corps de Woody

### INV2-060 — Écrire la bible du dossier Woody

**Priorité :** P0  
**Estimation :** M  
**Dépendances :** INV2-002

Question centrale : que peut raisonnablement conclure Kurapika face au premier corps exsangue, avant de connaître Silent Majority ?

### INV2-061 — Construire la scène de la salle de bain 1014

**Priorité :** P0  
**Estimation :** L  
**Dépendances :** INV2-060

Éléments : corps de Woody, absence d’effraction, positions de Bill, Kurton et Sayird, chronologie après le départ et quatre autres morts découverts ultérieurement.

### INV2-062 — Modéliser les hypothèses évolutives

**Priorité :** P0  
**Estimation :** L  
**Dépendances :** INV2-060

Hypothèses : attaque physique, espion éliminé par une faction, Guardian Spirit Beast de Woble, capacité Nen parasitaire et lien ultérieur avec Silent Majority. Le verdict varie selon le chapitre autorisé.

### INV2-063 — Ajouter interrogatoires et informations politiques

**Priorité :** P0  
**Estimation :** L  
**Dépendances :** INV2-061

Inclure le statut d’espion des gardes, la hiérarchie des reines, les réactions d’Oito, les connaissances de Bill et la manipulation ultérieure de Sayird.

### INV2-064 — Ajouter les Hatsu pertinents

**Priorité :** P1  
**Estimation :** M  
**Dépendances :** INV2-063

Dowsing Chain, Steal Chain, Emperor Time et Little Eye.

### INV2-065 — Créer le rapport à conclusions variables

**Priorité :** P0  
**Estimation :** M  
**Dépendances :** INV2-062

Le rapport peut conclure : cause inconnue, Nen probable, parasitisme fortement impliqué ou hypothèse initiale réfutée par une révélation postérieure.

---

## Epic 8 — Mode 2D complet

### INV2-070 — Créer le tableau de scène 2D

**Priorité :** P0  
**Estimation :** L  
**Dépendances :** INV2-001

Permettre de sélectionner une personne, examiner un objet, consulter les positions, visualiser les lignes de vue et accéder à tous les indices disponibles en 3D.

### INV2-071 — Synchroniser progression 2D et 3D

**Priorité :** P0  
**Estimation :** M  
**Dépendances :** INV2-070

**Critères d’acceptation :**

- aucune preuve dupliquée ;
- passage libre d’un mode à l’autre ;
- reprise dans le dernier mode choisi ;
- verdict identique.

### INV2-072 — Détecter WebGL indisponible

**Priorité :** P0  
**Estimation :** S  
**Dépendances :** INV2-070

Basculer automatiquement vers la 2D avec une explication concise.

### INV2-073 — Ajouter le mode mouvement réduit

**Priorité :** P1  
**Estimation :** M  
**Dépendances :** INV2-070

Désactiver mouvements automatiques, effets de caméra, clignotements et lecture animée obligatoire.

---

## Epic 9 — Hatsu

### INV2-080 — Généraliser les règles Hatsu par dossier

**Priorité :** P0  
**Estimation :** L  
**Dépendances :** INV2-002

**Critères d’acceptation :**

- aucune branche par nom de témoin dans le moteur ;
- résultat défini par règle de dossier ;
- coûts globaux respectés ;
- chaque usage produit une justification.

### INV2-081 — Classer les résultats Hatsu

**Priorité :** P0  
**Estimation :** M  
**Dépendances :** INV2-080

Catégories : nouvelle preuve, corroboration, information limitée, usage interdit, vérité lecteur non exploitable et coût sans résultat.

### INV2-082 — Empêcher les victoires automatiques

**Priorité :** P0  
**Estimation :** M  
**Dépendances :** INV2-080

**Critères d’acceptation :**

- aucun Hatsu ne résout seul un dossier ;
- une preuve obtenue par Nen doit encore être interprétée ;
- Dowsing Chain n’identifie jamais automatiquement le coupable ;
- la surveillance ne reconstruit pas le passé.

### INV2-083 — Tester les coûts persistants

**Priorité :** P0  
**Estimation :** S  
**Dépendances :** INV2-080

Couvrir Emperor Time, Zetsu forcé, changement d’affaire, rafraîchissement et changement d’onglet.

---

## Epic 10 — Localisation

### INV2-090 — Extraire tous les textes de l’interface

**Priorité :** P0  
**Estimation :** L  
**Dépendances :** INV2-001

Aucune chaîne visible ne doit rester dans les composants.

### INV2-091 — Définir le format de contenu localisé des dossiers

**Priorité :** P0  
**Estimation :** M  
**Dépendances :** INV2-002

Séparer règles et identifiants, textes FR et textes EN.

### INV2-092 — Traduire les trois affaires

**Priorité :** P0  
**Estimation :** XL  
**Dépendances :** INV2-091 et dossiers terminés

À découper en une tâche par dossier.

### INV2-093 — Ajouter les tests de complétude linguistique

**Priorité :** P0  
**Estimation :** M  
**Dépendances :** INV2-091

Détecter clés absentes, textes vides, chaînes françaises dans la version anglaise, identifiants traduits et caractères d’encodage corrompus.

---

## Epic 11 — Accessibilité et responsive

### INV2-100 — Parcours intégral au clavier

**Priorité :** P0  
**Estimation :** L

**Critères d’acceptation :** focus visible, ordre logique, fermeture par Échap, focus capturé dans les dialogues, retour au déclencheur et aucun piège clavier dans la 3D.

### INV2-101 — Compatibilité lecteur d’écran

**Priorité :** P0  
**Estimation :** L

Couvrir preuves, objectifs, confrontations, chronologie, reconstitution, verdict et rapport final.

### INV2-102 — QA mobile

**Priorité :** P0  
**Estimation :** L

Largeurs cibles : 320 px, 375 px, 768 px et orientation paysage.

### INV2-103 — Préférences de mouvement et contraste

**Priorité :** P1  
**Estimation :** M

Respecter `prefers-reduced-motion`, les contrastes WCAG AA et ne jamais dépendre uniquement de la couleur.

---

## Epic 12 — Performance et résilience

### INV2-110 — Charger la 3D à la demande

**Priorité :** P0  
**Estimation :** M

La salle des affaires et le mode 2D ne chargent pas Three.js.

### INV2-111 — Mesurer les performances

**Priorité :** P1  
**Estimation :** M

Mesurer poids initial, temps avant interaction, chargement de scène, mémoire après changement d’affaire et timers abandonnés.

### INV2-112 — Ajouter les états d’erreur

**Priorité :** P0  
**Estimation :** M

Couvrir WebGL, chargement de données, sauvegarde corrompue, dossier invalide, source canonique absente et erreur de reconstitution.

### INV2-113 — Vérifier les nettoyages

**Priorité :** P0  
**Estimation :** S

À la fermeture : arrêter les timers et l’audio, fermer le Hatsu gate, libérer Three.js et retirer les listeners globaux.

---

## Epic 13 — Tests et publication

### INV2-120 — Tests unitaires du moteur

**Priorité :** P0  
**Estimation :** L

Couvrir déblocage des questions, confrontation, verdict, Hatsu, spoilers, migrations et rapports.

### INV2-121 — Tests de parcours par dossier

**Priorité :** P0  
**Estimation :** L

Pour chaque dossier : chemin canonique sans Hatsu, chemin alternatif avec Hatsu, conclusion erronée, dossier incomplet et reprise après rafraîchissement.

### INV2-122 — Tests navigateur desktop et mobile

**Priorité :** P0  
**Estimation :** L

Navigateurs minimaux : Chromium, Firefox, WebKit et viewport mobile.

### INV2-123 — Vérification éditoriale finale

**Priorité :** P0  
**Estimation :** L

Checklist par preuve : source, chapitre, formulation, certitude, connaissance de l’enquêteur, limite de spoilers et traduction.

### INV2-124 — Observabilité sans données personnelles

**Priorité :** P1  
**Estimation :** M

Événements possibles : affaire commencée, reprise, mode 2D/3D, verdict soumis et erreur de chargement. Ne pas enregistrer le texte libre ni le contenu de la sauvegarde.

### INV2-125 — Release candidate

**Priorité :** P0  
**Estimation :** M  
**Dépendances :** tous les P0

**Critères de sortie :**

- trois dossiers résolubles ;
- zéro fuite de spoilers connue ;
- FR/EN complets ;
- 2D et 3D fonctionnelles ;
- migrations validées ;
- tests unitaires et navigateur verts ;
- aucune erreur console bloquante ;
- QA éditoriale signée.

---

## Ordre de réalisation recommandé

### Milestone A — Fondation

- INV2-001 à INV2-004
- INV2-010 à INV2-012
- INV2-020 à INV2-022

**Résultat :** moteur multi-affaires et sauvegarde stable.

### Milestone B — Sécurité éditoriale

- INV2-030 à INV2-033
- INV2-080 à INV2-083
- INV2-090 et INV2-091

**Résultat :** spoilers, Hatsu et localisation correctement architecturés.

### Milestone C — Contenu

- INV2-040 à INV2-042
- INV2-050 à INV2-056
- INV2-060 à INV2-065

**Résultat :** trois dossiers jouables.

### Milestone D — Expérience publiable

- INV2-070 à INV2-073
- INV2-092 à INV2-093
- INV2-100 à INV2-103
- INV2-110 à INV2-113

**Résultat :** expérience 2D/3D, FR/EN, accessible et robuste.

### Milestone E — Release candidate

- INV2-120 à INV2-125

**Résultat :** V2 vérifiée et publiable.

---

## Définition globale de « Done »

Une tâche n’est terminée que si :

- le code est générique lorsque nécessaire ;
- les tests associés passent ;
- FR et EN sont présents ;
- les spoilers sont respectés ;
- clavier et mobile sont vérifiés ;
- les données canoniques sont sourcées ;
- la sauvegarde reste compatible ;
- aucune régression n’est introduite dans « Onze secondes ».
