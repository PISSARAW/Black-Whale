# Fighting Nen regression

Run `pnpm --filter @black-whale/web exec node scripts/check-fighting-nen.mjs`.
The fixture renders the production WebGL scene and resource controls, using the
actual deterministic engine and keyboard map. It checks held/released En, Shu,
In, Gyo, manual Ryu, P2 En, aura upkeep, pointer controls, Emperor Time and mobile
overflow. Screenshots and the JSON report go to `/tmp/black-whale-nen-ui`.
