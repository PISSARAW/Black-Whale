# Mesures

Deux outils, à lancer à la main. Ils existent parce que « lecture rapide » a
besoin d'un nombre : sans mesure, une optimisation est une intuition, et
l'ADR-001 en portait une qui ne survit pas au chiffre — le blueprint « de 1,1 Mo »
pèse 73 ko sur le fil et se parse en 2 ms.

## `timeline.ts` — le moteur, contre une vraie base

```
DATABASE_URL=postgresql://…/blackwhale npx tsx bench/timeline.ts
```

Chronomètre `getWorldState`, `getKernelState` et `getEventsBefore` à un point
tôt et à un point tard du voyage. Le point tard est le pire cas : tout le monde
est monté à bord, personne n'est encore redescendu.

## `pages.ts` — les pages, contre le serveur construit

```
pnpm --filter @black-whale/web build
DATABASE_URL=… ORIGIN=http://localhost:4180 PORT=4180 node build/index.js &
npx tsx bench/pages.ts
```

Chronomètre le rendu serveur et pèse le HTML de chaque page. Les deux chiffres
comptent séparément : une page peut être rapide à produire et lourde à recevoir,
et c'est le cas de `/ship`.

Passer `--data` pour détailler la charge utile d'une page : ce que le loader
sérialise, champ par champ, une fois la déduplication de SvelteKit défaite.
C'est ainsi qu'on voit que `worldState` fait 313 ko dont la carte ne lit qu'une
partie.
