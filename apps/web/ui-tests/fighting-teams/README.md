# Qualification des équipes et arènes

`pnpm --filter @black-whale/web test:teams-ui` monte la sélection et le combat de
production. L’horloge manuelle appelle le composant puis le vrai moteur : aucune
vie, destruction, élimination ou victoire n’est forcée.

Le contrôle réordonne et recharge une formation, vérifie les refus de relais,
marche réellement au bord au clavier, suit une intervention et son retour,
détruit un couvert avec des frappes ordinaires puis obtient un verdict réel.
Le terrain et les ressources sont vérifiés à l’entrée suivante. Les vues FR/EN
à 320, 390 et 1280 px sont contrôlées sans 3D ; cela ne qualifie ni GPU ni manette
Xbox physique. Le contrôle existant `check-fighting-phase9.mjs` conserve son essai
du relais animé et de la relecture.
