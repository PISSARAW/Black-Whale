# Hisoka contre Machi — vidéo de validation

Cette fixture rejoue quatre prises déterministes du vrai moteur : cartes et normaux,
Bungee Gum, Texture Surprise, puis Hisoka piloté par l'IA. La bande-son est rendue
par le directeur audio natif à partir des mêmes 1 440 états. Le script refuse le MP4
si ces états ne sont pas réellement observés pendant la simulation.

```sh
node apps/web/scripts/render-hisoka-machi-combat.mjs
```
