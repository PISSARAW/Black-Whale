# Parcours solo

L’étape 7 réutilise les actions, collisions, perceptions et frontières de manche
du moteur. Les objectifs et leurs résultats sont des métadonnées locales ; ils
ne fabriquent aucun verdict de duel et ne participent pas à la carrière PvP.

`catalogue.ts` annonce rôles, équipement, alliés, connaissance et territoire.
`setup.ts` construit les prémisses ; `objectives.ts` observe les frames réelles.
Le contrôleur conserve la progression entre rencontres, les records et des récits
et titres cosmétiques. La route est `/fighting/profile/solo`.
