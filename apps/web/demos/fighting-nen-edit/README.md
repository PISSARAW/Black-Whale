# Six types of Nen — vertical edit (36.4 s)

No ranking: every fighter gets two beats and lands their real signature finisher on the
second, grouped by Nen category in hexagon order — Enhancement, Transmutation,
Conjuration, Specialization, Manipulation, Emission — then the unknowns.

**The pivot.** Conjuration ends on Kurapika. His shot freezes on the exact simulation frame
Emperor Time turns on (scarlet vignette, "Emperor Time"), the title swings to
Specialization and the hexagon moves with it, then Judgment Chain lands and Specialization
continues with Chrollo, Tserriednich and Furykov.

**Canon.** Sections are titled by the technique type, not "enhancers" etc. A fighter's
category is its known affinity (`nenCatalogue.gen.ts`); for an unknown affinity, the
category of its abilities only if they all agree. Six fighters have none or several
(Mizaistom, Basho, Halkenburg, Gel, Beyond, Musse): they close the film as "???", in grey
until their finisher. Colours are the game's aura colours.

Hook: four finishers from four categories in one bar. End: "Who's your main?".
Music: `scripts/nen-edit-music.py` (fill into each category, silence and a ring on Emperor
Time, double time after it, muffled for the unknowns).

```sh
node apps/web/scripts/render-signature-flow.mjs --demo=nen-edit --stills=432,438
node apps/web/scripts/render-signature-flow.mjs --demo=nen-edit
TSX_TSCONFIG_PATH=apps/web/tsconfig.json node --import tsx --test apps/web/demos/fighting-nen-edit/film.test.ts
```

Output: `output/fighting-nen-edit/Black-Whale-Clash-Six-Types-Of-Nen.mp4`.
