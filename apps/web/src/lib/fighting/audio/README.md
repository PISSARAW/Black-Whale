# Identité sonore de Clash

Le combat réutilise les recettes de `../../audio/hatsuSounds.ts`, le bruit partagé
de `../../audio/hatsu/synth.ts`, les profils `NEN_PRESENTATION` et la réponse
acoustique `impulseResponse` de la visite. Aucun sample tiers n'est chargé.

- `profiles.ts` écrit la matière, le poids, le souffle et le motif de chacun des
  quarante combattants ; `catalogueProfiles.ts` couvre les autres identités.
- `stages.ts` et `stageAdditions.ts` couvrent les 33 terrains, leurs sols,
  leur réverbération et leurs motifs ; les salons ont une acoustique plus courte.
  La pression suit le temps, le pourcentage de PV restant, les combos, les points
  et les knockdowns. Le calcul respecte les formats à plusieurs barres de vie.
- `events.ts` et `states.ts` comparent les états immuables du moteur. Un coup dans
  le vide souffle à sa frame active ; une blessure, une parade et une esquive ont
  des réponses distinctes. Les projectiles annoncent leurs tirs réels, sans rafale
  audio qui continue quand Franklin est interrompu.
- `hatsu.ts` et `techniques.ts` associent les recettes aux techniques. Les copies
  de Chrollo utilisent la source du Hatsu ; Black Voice et Sun and Moon ont des
  accents propres. Les pages, le Bungee Gum, la forme de Biscuit, la projection de
  Hanzo, Pain Packer, Rising Sun et les gardes LSDF suivent leurs états réels.
- `bonolenov.ts` synthétise l'air et les résonances des orifices découverts de
  Bonolenov pendant ses danses, ses déplacements et ses frappes. La phrase suit
  les compteurs de mouvement et s'éteint au repos, sur interruption et pendant
  le hitstop ; le directeur applique également pause, mute et fin de manche.
- `director.ts` tient les ambiances, l'aura et la pression. Ten, Ren, Ken, Gyo,
  Ryu, Ko, In, En, Shu, Zetsu et On utilisent le vocabulaire sonore partagé.
  Zetsu ferme l'aura ; On gronde et bat de façon instable. Emperor Time ajoute
  maillons, battement double, frottement harmonique et retrait de l'ambiance.
  Chaque seconde de vie dépensée, hitstop compris, déclenche un battement.
- Le mécanisme de montre est discret dès le début d'une manche chronométrée :
  toutes les deux secondes, puis chaque seconde sous 30 s, chaque demi-seconde
  sous 10 s et chaque quart de seconde sous 5 s. À 15 s, la montre est remontée ;
  à zéro, ses cloches sonnent. Aucun faux compte à rebours en entraînement.
- `mixer.ts` place les événements en stéréo, limite les queues à 32 voix et possède
  toutes ses sources. La sortie passe par les faders et le limiteur communs. Le
  graphe du combat ne modifie jamais l'oreille ou la salle de la visite. La pause,
  l'onglet masqué et le mute coupent la sortie ; les états observés pendant ce
  silence ne sont pas rejoués. Sortir ou changer de manche libère les sources et
  conserve l'AudioContext partagé.

Les réglages actions / ambiance / tension et le mute sont locaux au combat,
mémorisés dans `black-whale:fighting-audio`. Ils restent soumis aux faders généraux
du site. Les respirations sont des gestes synthétisés, sans doublage d'acteurs.

Vérification : `pnpm --filter @black-whale/web test src/lib/fighting/audio src/lib/audio`.
