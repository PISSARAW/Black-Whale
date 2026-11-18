# Revue des projections de Bonolenov

Lancer `node scripts/check-bonolenov-throws.mjs` depuis `apps/web`.
La scène monte le composant `FightStage` du jeu, avec des préparations et
projections produites par les commandes et ticks réels.

`window.throwFixture.reset({ side, armed, powered, miss, tech, ko, aura, zetsu })`
prépare une séquence ; `seek(progress)` choisit une phase entre 0 et 1,
`pause(true)` fige le rendu, `stable()` désactive la caméra cinématique.
`snapshot()` expose l'état du moteur et l'audit de la scène réellement dessinée.

Le catalogue et les règles sont décrits dans
[throws/README.md](../../src/lib/fighting/throws/README.md).
