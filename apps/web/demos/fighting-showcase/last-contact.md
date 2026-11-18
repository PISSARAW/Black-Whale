---
titre: Hisoka × Chrollo — Le dernier contact
etage: 2
couvre:
  - apps/web/demos/fighting-showcase/LastContact.svelte
  - apps/web/demos/fighting-showcase/lastContact*.ts
  - apps/web/demos/fighting-showcase/last-contact.html
  - apps/web/scripts/render-last-contact.mjs
  - apps/web/scripts/compose-last-contact.mjs
  - apps/web/scripts/render-last-contact-audio.mjs
  - apps/web/demos/fighting-showcase/last-contact-audio.html
depend-de: [07-les-modes]
revu-le: 2026-11-17
---

# Le dernier contact

Démo continue de 179,12 secondes, Hisoka contre Chrollo à la Tour céleste.
Le moteur de production calcule 88 combos confirmés, 162 annulations légales
après confirmation et 270 contacts. Les vues de détail remplacent la caméra
principale ; aucun panneau simultané ni replay ne coupe la simulation.

```sh
node apps/web/scripts/render-last-contact.mjs --inspect
node apps/web/scripts/render-last-contact.mjs --faces-only
node apps/web/scripts/render-last-contact.mjs
node apps/web/scripts/render-last-contact-audio.mjs
node apps/web/scripts/compose-last-contact.mjs
```

Le rendu image et le rendu audio peuvent tourner séparément. Les segments audio
natifs disposent de deux secondes de prélecture et de 40 ms de recouvrement au
même instant absolu ; le mixage conserve le nombre exact d’échantillons du film.
Le rendu audio monolithique reste accessible avec `--audio-only`. La composition
produit `output/fighting-last-contact/Hisoka-vs-Chrollo-Le-Dernier-Contact.mp4`,
en H.264 1920 × 1080 à 60 images/s avec audio natif AAC stéréo. Le compositeur
vérifie chaque image par décodage intégral et contrôle l’absence de saturation.

## Conditions du duel

Une seule initialisation : 1 300 PV pour Hisoka, 1 800 pour Chrollo, 100 aura,
600 secondes disponibles et deux chambres closes déclarées dans la préparation.
Les ressources ne sont ensuite ni remises à zéro, ni soignées. Les déplacements
et contacts sont exécutés par les commandes du jeu. La téléportation historique
de Chrollo déplace explicitement Hisoka ; ce n’est pas une coupe de montage.

Le Soleil touche Hisoka à 1,25 s et reste jusqu’à la Lune finale. Hisoka utilise
ses vraies routes au sol, ses attaques aériennes, les cartes sous Shu, l’attache
dissimulée, le rappel et le rebond. Une copie Gallery Fake est créée à deux mains,
marquée pour persister et animée par Order Stamp. Des attaques physiques visant
la tête brisent réellement la tête puis la copie. Convert Hands ne change que
l’apparence.

Le livre fermé permet Fun Fun Cloth. Indoor Fish opère dans une pièce réellement
scellée : les blessures différées sont appliquées à la fermeture de la page.
L’interrogatoire et le contact volontaire paume/couverture volent Texture Surprise,
qui est rejouée par Chrollo ; Hisoka conserve Bungee Gum. Black Voice impose son
ordre pendant la durée native. Love Dial recherche Hisoka. Le projectile physique
attrapé puis renvoyé par la gomme reste le même objet, sans munitions inventées.
Les blessures ouvertes ne sont pas produites par ce duel : gum-seal est donc omis,
plutôt que d’en ajouter artificiellement pour rendre la commande disponible.

On est la variante du jeu issue de The Last Mission et porte cette mention dans
l’image. Ses contacts scellent les Hatsu ; les gardes en Ken consomment sa réserve,
puis Hisoka récupère naturellement en Zetsu. Ten, Ren, Gyo, In, En, Shu, Ryu et Ko
sont aussi observés dans les états. À la fin, Chrollo pare réellement l’exécution
élastique avant d’obtenir le K.-O. par la détonation Soleil/Lune.

## Jeu facial

`lastContactEmotions.ts` dérive les expressions des dégâts réellement reçus,
des confirmations de combos, de On, de l’épuisement et de la victoire. Les
transitions sont interpolées à 60 Hz ; les clignements restent brefs et sont
suspendus lors des confirmations et réactions aux coups.

`lastContactFaceRig.ts` anime les yeux et sourcils existants et pose une bouche
avec courbure, ouverture et dents variables sur le visage existant. Hisoka alterne
sourire en coin, plaisir du combat, douleur et rage ; Chrollo conserve un regard
plus fermé, avec surprises et satisfaction finale. Cheveux, proportions et tenues
restent ceux des modèles déclarés dans le projet. Les copies restent inexpressives.

Les réactions plein écran attendent la fin des frappes physiques de la route.
Les gros plans de vérification `emotion-*.jpg` peuvent forcer la caméra de portrait
sur un état natif ; cette commande de contrôle est réinitialisée à chaque seek et
n’est pas utilisée pendant l’encodage.

## Preuves

`combat-report.json` conserve les commandes acceptées, les confirmations,
l’arsenal, les dix techniques de Nen, l’âge du piège, les conditions des poissons,
le vol ciblé, le renvoi physique et la parade finale. `video-verification.json`
ajoute métadonnées, empreinte SHA-256, contrôle audio et décodage intégral.

Le vol ciblé a révélé une erreur d’observation : le témoin lisait l’attaque
précédente avant l’installation de la nouvelle. `nenWitness.ts` utilise désormais
le moveId effectivement engagé, transmis par `triggerHatsuAction`. Le test
`nenWitnessMove.test.ts` vérifie un vrai lancement de Texture Surprise suivi de
l’acquisition, ainsi que la conservation de Bungee Gum.
