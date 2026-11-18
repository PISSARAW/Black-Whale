# Projections cinématiques de Bonolenov

Cette intégration reprend la paire de chorégraphies de la branche de travail
(`e466a60dc`) et le correctif de lance de `dce65d8e2`. Le catalogue de `main`
n'active que Bonolenov. Les noms et les projections sont des adaptations arcade
propres à Clash ; la vidéo de référence du combat ne présente pas ces prises.

| Commande                     | Chorégraphie               | Conditions                                                                  |
| ---------------------------- | -------------------------- | --------------------------------------------------------------------------- |
| Projection                   | La valse du guerrier       | Prise physique confirmée, avec trois appuis dansés.                         |
| Aura + Projection            | Prologue : le renversement | 25 Nen, engagé au départ réel. Emprunte uniquement une lance déjà préparée. |
| Aura + Projection sans lance | Le dernier accord          | Même renversement physique renforcé, sans arme ni tenue créées par le film. |

La super conserve les réglages de la branche source : dégâts de base ×1,5,
hitstop +3, hitstun +6 et poussée ×1,15. La récupération est d'au moins 54 frames
pour la normale, 84 pour la super ; la mise au sol couvre cette durée avec
8 frames supplémentaires. Ces réglages ne s'appliquent qu'à Bonolenov.
Le buffer réserve la variante ; le coût n'est prélevé qu'au départ. Un raté ou
une déprojection ne rembourse pas ce coût. Le Nen indisponible ou une réserve
insuffisante refuse la super ; la commande ordinaire reste physique.

Le film exige un véritable impact de projection, confirmé par le moteur. Raté,
déprojection, projectile, garde et autre cause de contact ne le déclenchent pas.
Le rendu ne modifie ni dégâts, ni ressources, ni positions de simulation.
Il n'invoque aucun Prologue, Jupiter, projectile ou accessoire supplémentaire.

Les deux corps sont animés après la préparation réelle de la lance. Le lanceur
pivote autour du bassin avec un appui libre ; la cible suit une trajectoire
continue jusqu'au sol. Les solveurs de membres conservent les longueurs d'os et
les contraintes articulaires. La prise et la lance sont alignées après l'animation
des deux acteurs. `prologue.ts` rétablit explicitement l'axe local de la hampe
avant d'orienter le poignet droit : la pose d'estoc ordinaire n'en détourne plus
la pointe. Ce contrôle couvre les deux orientations.

La caméra alterne détail, renversement, impact et retour au combat. Les plans
d'action tiennent compte de toute la lance, y compris en portrait. Pause,
hitstop et états répétés figent la chorégraphie. Un K.-O. reste acquis ; seule la
présentation de victoire attend la fin de la projection. Les mouvements réduits
et la caméra stable conservent la présentation ordinaire. Les effets de rythme
respectent le réglage des flashes. Les ressources de scène sont libérées au démontage.

## Vérification

Depuis `apps/web` :

```sh
pnpm exec vitest run src/lib/fighting/throws/bonolenov.test.ts
node scripts/check-bonolenov-throws.mjs
```

Les tests utilisent des commandes et ticks réels pour la préparation, le contact,
les ratés, les déprojections et le K.-O. Ils couvrent les deux sièges, les variantes,
le coût unique, le buffer, les chemins entraînement/PvP/replay, l'axe de la lance,
les contraintes des jambes, le contact au sol et l'absence de mutation au rendu.

La page `ui-tests/bonolenov-throws` monte le véritable `FightStage`. Le script
capture les quatre plans des huit combinaisons siège/Aura/Prologue et les vues
390/320 px, puis contrôle pause, refus, K.-O. et caméra stable. Il écrit ses
captures et `report.json` dans `/tmp/black-whale-bonolenov-throws` ;
`BONOLENOV_THROW_OUTPUT` permet de changer ce dossier.
