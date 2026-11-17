# Étape 7 · parcours solo et défis

Le solo se joue sur `/fighting/profile/solo`, accessible depuis le profil et le
laboratoire. Il utilise les combattants, actions, coûts, collisions, perceptions
et verdicts existants. Aucun Hatsu ni pouvoir de Nen n’est ajouté. Les rencontres
sont des situations originales de Clash, annoncées comme telles.

## Trois parcours, neuf rencontres

| Parcours               | Rencontres                                                 | Décisions et conditions                                                                                                                                                                    |
| ---------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Lire une manifestation | Kurapika / Hisoka, Hisoka / Phinks, Lynch / Hisoka         | Percevoir un lien caché avec Gyo sans le supprimer ; interrompre une rotation réelle ; poser une question puis obtenir la réponse par un véritable coup de poing sur une cible consciente. |
| Protéger et tenir      | Kurapika / Franklin, Hanzo / Franklin, Kurapika / Franklin | Garder une caisse physique présente dix secondes ; revenir au corps réellement projeté puis garder une rafale basse ; survivre quinze secondes sous des tirs aux coûts ordinaires.         |
| Traverser les duels    | Personnage choisi / Franklin, Phinks, Chrollo              | Gagner trois manches contre l’IA ordinaire, avec un nouveau corps et les ressources de départ habituelles à chaque rencontre.                                                              |

Chaque briefing indique les participants, l’équipement, les alliés absents, la
connaissance initiale, le terrain et les ressources exactes. Les scénarios de
perception, préparation et projection reprennent les prémisses des défis déjà
jouables. Les ressources y restent finies : le mode entraînement est retiré et
ne peut rétablir ni PV ni aura pendant la rencontre. L’unique caisse à gauche est
un objet destructible ordinaire. Le chargement de Chrollo reste celui du duel.

Les objectifs se vérifient sur les frames du moteur. Ils peuvent terminer une
rencontre avant un K.-O. ; le contrôleur fige alors le solo sans fabriquer de
vainqueur ou de verdict de duel. La dernière rencontre est jouable et donne accès
à une fin originale et à un titre local : Éclaireur, Sentinelle ou Finaliste.
Les fins restent consultables dans la collection.

## Trois défis sur le même socle

- **Survie** : cinq adversaires successifs, PV et aura réellement restants
  conservés. Le passage utilise la frontière de manche existante pour remettre
  les actions et conditions ordinaires en état ; il conserve notamment les coûts
  physiques persistants du personnage. Il ne transfère pas les liens globaux avec
  l’adversaire précédent. Six combattants de référence sont proposés : Kurapika,
  Hisoka, Franklin, Phinks, Hanzo et Bill. Étendre ce choix exige de qualifier les
  ressources, contrats et corps propres aux autres personnages.
- **Contre-la-montre** : trois victoires, budget global de 10 800 frames, soit
  trois minutes simulées. Une défaite ou l’expiration du budget termine l’essai.
- **Score Attack** : trois adversaires et un budget maximal de trois minutes
  simulées. Le score compte les dégâts effectifs attribués à un impact réel de
  P1, avec les indicateurs du moteur de contre, punition et anti-air ; une garde,
  un coup évité, un impact répété et une perte de PV indépendante ne rapportent
  rien. Chaque victoire ajoute 1 000 points et deux par seconde entière restante
  dans la limite de sa rencontre. Les points n’accordent aucune statistique.

Les deux derniers défis et le parcours de duels proposent les quarante
personnages. Tous les défis utilisent des manches ordinaires de soixante secondes
au maximum ; le budget global continue entre les adversaires. Les pauses et les
briefings ne consomment pas de temps. Les prévisions détachées ne valident aucun
objectif ; les séquences post-mortem suivent leur résolution dans le moteur.

## Sauvegarde et séparation compétitive

`solo/storage.ts` conserve un seul parcours courant, les récits débloqués et les
meilleurs records dans `black-whale:clash:solo:1`. Les points de sauvegarde sont
l’entrée et l’issue de chaque rencontre. Une recharge en combat reprend cette
rencontre depuis son entrée ; elle ne prétend pas reprendre sa frame exacte.
Une rencontre scénarisée échouée peut être réessayée. Un défi échoué demande une
nouvelle partie. En Survie, l’instantané du dernier corps victorieux est borné et
validé avant de reconstruire l’entrée suivante.

Les sauvegardes illisibles ne sont pas écrasées avant une nouvelle partie. Un
stockage bloqué laisse jouer en mémoire. Les récits et meilleurs records écrits
par un autre onglet sont fusionnés à l’écriture. Un changement de règles conserve
les récits et titres, mais retire la session et les records devenus incompatibles.

Les records sont locaux, rejouables et non vérifiés : aucune publication dans un
classement. Le marqueur `soloSession` exclut ces rencontres du suivi de carrière.
Aucun résultat scénarisé n’est envoyé au PvP, aux saisons ou aux tournois. Les
titres et récits ne modifient ni aura, santé, équipement, corps, contrats ou Nen.

## Vérifications

`solo/solo.test.ts` joue les parcours et les transitions avec le moteur réel ;
aucun résultat, dégât ou K.-O. n’est forcé. Le contrôle navigateur
`pnpm --filter @black-whale/web test:solo-ui` monte les composants de production,
avec une horloge manuelle passant par le contrôleur réel. Il couvre une fin
complète, le rechargement, la pause, les sélecteurs et les vues FR/EN à
320, 390 et 1 280 pixels. Chromium utilise le rendu de secours sans 3D : ces
essais ne qualifient ni un GPU ni une manette Xbox physique.

## Résultats du 17 novembre 2026

Les 29 tests solo passent sur la copie isolée du lot après reprise du dernier
commit de combos. Ils jouent notamment les trois fins, les cinq manches de
Survie avec chacun des six personnages proposés, le coût de durée de vie de
Kurapika, les budgets simulés et les sauvegardes. Les régressions existantes du
laboratoire et de la carrière passent également : 111 tests ciblés au total lors
de cette qualification, puis une reprise des contrôles modifiés. Les dix vues
navigateur passent avec une fin réellement obtenue, pause et rechargement, sans
erreur JavaScript. Le cliquet et le contrôle documentaire passent : 23 tests.

Le dossier partagé évoluait pendant les contrôles globaux. `pnpm test` a terminé
avec 10 563 tests web réussis et 7 822 échecs dans vingt fichiers, principalement
`run is not a function` dans les hooks de Nen et les matrices de combos/réseau.
Un échantillon de 47 tests de Bonolenov et de la neuvième série de combos, échoué
dans cette exécution globale, passe sur la copie isolée du lot. Le typage global
a relevé une erreur dans `teamMatch.ts`, tandis que le typage de la copie du lot
passe avec les quatre avertissements antérieurs d’Infiltration. Le lint global
a relevé quatorze erreurs de console dans des scripts de cinématiques hors du lot
et trois avertissements de leur fixture ; le lint des fichiers du lot passe.
Ces exécutions globales ne sont pas présentées comme vertes.

Après le commit Nen `96c6142d2`, la reprise élargie donne **143 tests réussis et
19 échecs** : les 29 tests solo, le laboratoire, la carrière, Bonolenov et les
quatre tests de découpage passent. Les dix-neuf échecs restent tous dans
`duelComboNinth.test.ts`, avec la même erreur de hook. Une seconde copie de ce
HEAD, sans aucun changement de l’étape 7, reproduit les dix-neuf échecs : ils ne
sont pas corrigés en modifiant ici les facultés de Nen.

La compilation de production avec l’adaptateur Node passe. Les catalogues
existants de profils et d’exercices de combos disposent d’un bloc de chargement
séparé ; leurs données et réglages restent identiques après compilation. Le plus
gros bloc client mesure 419 786 octets, sous la limite inchangée de 500 000.
