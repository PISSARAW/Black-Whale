---
titre: Combats du Nen à vitesse normale
etage: 2
couvre: [apps/web/demos/fighting-nen-exchanges/**]
revu-le: 2026-11-18
---

# Combats du Nen à vitesse normale

Trois extraits continus de vingt secondes : Hisoka–Machi, Kurapika–Phinks,
Kalluto–Franklin. Un contrôleur réactif local utilise les commandes du joueur,
face à l’IA native. Ses décisions utilisent l’observation publique et les
capacités proposées par le moteur, sans modèle distant ni résultats scénarisés.

Les ressources et contacts ne sont jamais réécrits pendant les échanges. Chaque
extrait exporte son replay natif et vérifie tous les checkpoints en le resimulant.
Le rendu montre deux ticks à 60 Hz par image à 30 images/s : vitesse 1×, hitstop
natif compris. Le son est synthétisé par le directeur audio du jeu.

Depuis la racine : `node apps/web/scripts/render-nen-exchanges.mjs`.
`NEN_EXCHANGES_OUTPUT` choisit le dossier des vidéos, replays et rapports.
