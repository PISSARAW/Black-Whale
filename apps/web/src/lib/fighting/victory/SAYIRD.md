# Sayird — Ton angle mort

Little Eye capture un **vrai petit animal**, présent dès le premier plan :
un cafard de quelques centimètres. La sphère d’aura part de la paume et le
rejoint à l’image 66. L’insecte contourne les appuis adverses ; les images
138–185 montrent sa vue réelle au ras du sol. Sayird exploite cette information
pour lire le départ du coup et esquiver physiquement, sans esquive automatique.

Cette scène reprend les limites décrites aux chapitres 361 et 367 : contrôle
d’un animal réel, au plus de la taille d’un hamster, et réception de sa vue
et de son ouïe. Aucun insecte n’est conjuré, aucun humain n’est manipulé,
aucun poison ou essaim offensif n’est ajouté. Le cafard reste vivant.
[Référence récapitulative](https://hunterxhunter.fandom.com/wiki/Sayird).

Le petit animal fourni et sa capture sont des prémisses de **cinématique**.
Le moteur actuel ne possède pas de commande Little Eye utilisable pendant
le duel ; le rapport indique donc explicitement `nativeActivation: false`.
La séquence n’ajoute pas d’activation fictive au moteur.

## Action et chute

Deux enchaînements physiques natifs occupent les images 228–414 :

- direct, direct en avançant, crochet ;
- coup bas, direct en avançant, crochet.

Ces transitions sont autorisées dans `duelComboEighthProfiles.ts`. Les poses,
récupérations, hitstops et réactions proviennent d’une simulation indépendante
avec les vrais movesets. Les six contacts sont synchronisés aux images
252, 280, 310, 348, 380 et 414, sans étirer les articulations.

À partir de 415, le vaincu suit `nativeVictoryFall` : gravité et réception
du combat, corps intact maintenu au sol. Portrait de Sayird à 510. La caméra
réduite garde un plan large fixe, sans point de vue embarqué. Toutes les poses,
les matériaux, les accessoires et la caméra sont restaurés après rendu.
Le verdict, les PV, l’aura et le résultat réseau restent inchangés.

## Export et vérification

`sayirdFilm.ts` obtient d’abord un vrai K.-O. physique dans une simulation
continue, sans soin ni remise à zéro. Le son comporte déplacements de l’insecte,
capture, esquive, six contacts, réception et annonce « Fatality » en anglais.
Aucune voix française. Le même fichier audio est chargé par le jeu.

```sh
node apps/web/scripts/render-sayird-fatality.mjs --inspect
node apps/web/scripts/render-sayird-fatality.mjs
node apps/web/scripts/compose-sayird-fatality.mjs
node apps/web/scripts/check-sayird-victory.mjs
pnpm --dir apps/web exec vitest run src/lib/fighting/victory/sayird.test.ts
```

Le MP4 final est `output/fighting-sayird/Sayird-Ton-Angle-Mort-10s.mp4`.
Les tests couvrent P1/P2, miroir, gabarits extrêmes, restauration de scène,
chute native, caméra réduite et continuité du K.-O. Le contrôle navigateur
vérifie IA/local, rematch, chargement du son et passage aux résultats.
