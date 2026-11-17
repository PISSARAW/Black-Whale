# Référence du combat de Clash

Le [contrat et le protocole des sept situations](../../src/lib/fighting/BASELINE.md)
décrivent les prémisses et les limites des mesures.

`reference/baseline.json` conserve les résultats attendus et les définitions des
48 routes des six personnages. `reference/sources.json` identifie le contenu exact
du code, indépendamment du commit ; `reference/sources.tar.gz` en conserve le
contenu. `reference/replays.tar.gz` conserve les replays
importables ; les fichiers sont compressés pour ne pas multiplier les fixtures JSON.

Depuis la racine, `pnpm test:combat-reference` régénère les 768 cas de route et les
84 situations dans `output/clash-combat-reference/`, puis les compare à la
référence. Une divergence rend la commande non réussie. Une référence nouvelle
doit conserver les anciennes mesures et expliquer les différences avant de
remplacer celle-ci dans une modification distincte.

`pnpm test:combat-reference --frozen` utilise les sources archivées pour vérifier
la référence indépendamment des évolutions du checkout. La commande ordinaire
compare au contraire le code courant à ces résultats conservés.

```sh
mkdir -p output/clash-reference-frozen
tar -xzf apps/web/ui-tests/fighting-reference/reference/replays.tar.gz -C output/clash-reference-frozen
```

Les fichiers extraits se trouvent dans `output/clash-reference-frozen/replays/`.
Ils s’importent individuellement depuis Replays. Le nom indique route ou
situation, personnage, terrain et, pour les routes, orientation, centre/coin et
distance. Le paquet 0 conserve le snapshot de départ.

`Fixture.svelte` monte le sélecteur de production. Le contrôle
`node apps/web/scripts/check-combat-reference.mjs` vérifie les 84 relancements,
les deux langues et les trois largeurs d’écran. Ses captures et son rapport
restent dans `output/clash-reference-ui/`.

## Référence initiale du 17 novembre 2026

La version mesurée est `clash-combat-9`, avec le protocole
`clash-pvp-5:clash-combat-9`. Les **768 conversions sont complètes** ; les
**84 situations** ont également été enregistrées et resimulées. Une seconde
génération depuis les sources archivées donne **zéro différence sur les 852 cas**.
Le résultat de cette reconstruction est conservé dans `reference/verification.json`.
La comparaison finale avec le checkout courant retrouve également les 852 mêmes
résultats ; ses changements de sources sont signalés séparément.

Les [mesures représentatives des 48 routes](reference/routes.md) exposent les
dégâts, débits d’aura, durées, mises au sol et distances finales. Le manifeste
identifie 2 847 fichiers de source et de runtime local. `reference/SHA256SUMS`
permet de contrôler les deux archives ; les métadonnées AppleDouble en ont été
retirées sans modifier le contenu des sources ou des replays.

Ces résultats valident la référence automatisée. Ils ne constituent ni des
observations de joueurs, ni une qualification matérielle ou une preuve
d’équilibrage compétitif.
