# Kurapika chain visual fixture

This fixture mounts the production FightScene, with actual engine snapshots for
all five chains, mirrored P1/P2 poses, playback, and post-contact Judgment Chain.
It does not change the duel rules or expose fixture controls in the game.

Serve it with Vite and the Svelte plugin without SvelteKit's page routing or the
site text preprocessor (the same setup as `scripts/check-fighting-hud.mjs`).
Use `$lib` as an alias for `src/lib` and `static` as the public directory.
Open `/ui-tests/kurapika-chains/` and verify all five tips, both sides, deployment,
retraction, the persistent Chain Jail and the implanted Judgment blade.
