import js from '@eslint/js'
import globals from 'globals'
import svelte from 'eslint-plugin-svelte'
import svelteParser from 'svelte-eslint-parser'
import tseslint from 'typescript-eslint'

/**
 * One flat config for the whole monorepo, run from the root with `pnpm lint`.
 *
 * Type-aware rules are off *by default* and on where they earn their keep: the
 * package sources and the two servers, which is what ADR-001 §2.4 asks for.
 * They cost a project service — the reason they were off everywhere — so the
 * `lint` script runs `svelte-kit sync` first, the same way `typecheck` does,
 * and the scope below is deliberately narrow: the `.svelte` files and the
 * route modules stay on the syntactic pass, where they are fast.
 *
 * Everywhere else `pnpm typecheck` covers what types can prove and this catches
 * what they cannot.
 */
export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.svelte-kit/**',
      '**/.turbo/**',
      '**/*.tsbuildinfo',
      'apps/*/vite.config.ts.timestamp-*.mjs',
      'packages/database/prisma/migrations/**',
      // Scratch checkouts and a holding pen for deletions: copies of the tree,
      // not the tree. Linting them reports every finding twice and holds the
      // whole repo red on code nobody is editing.
      '.claude/**',
      '_to_delete/**',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
    },
    rules: {
      // The view layer still leans on `any` where load functions hand untyped
      // rows to components. It stays a warning there — see the packages
      // override below, where it is an error and the count is zero.
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' },
      ],
      // Logging on a public page is a defect, not a style preference. warn and
      // error stay allowed: they go to an operator, not to a visitor.
      'no-console': ['error', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-var': 'error',
      'prefer-const': 'error',

      // A file past five hundred lines is holding more than one subject; the
      // second one is always easier to find from its own file than from a
      // heading two thousand lines down. ADR-002 counts *raw* lines, blanks and
      // comments included: what makes a file unopenable is its length on
      // screen, not the share of it the parser calls code, and a bound that
      // discounts prose is a bound that can be paid off in comments.
      'max-lines': ['error', { max: 500, skipBlankLines: false, skipComments: false }],

      // No emoji in the interface. They render differently on every platform,
      // read as a different register from the rest of the copy, and are not
      // translatable — a pictograph says whatever the reader's font decides.
      // The typographic marks the design already uses (✓ ◉ ◐ ★ ♩) are not
      // affected: this bans the colour pictograph blocks only.
      'no-misleading-character-class': 'error',
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=/[\\u{1F000}-\\u{1FAFF}\\u{FE0F}\\u{1F1E6}-\\u{1F1FF}]/u]',
          message: 'No emoji in the interface — say it in words, or use a typographic mark.',
        },
        {
          selector:
            'TemplateElement[value.raw=/[\\u{1F000}-\\u{1FAFF}\\u{FE0F}\\u{1F1E6}-\\u{1F1FF}]/u]',
          message: 'No emoji in the interface — say it in words, or use a typographic mark.',
        },
      ],

      // Past three parameters a call site stops being readable at the call
      // site: `f(a, b, true, null, 3)` says nothing about what those are, and
      // adding an argument silently changes the meaning of every existing
      // call. Take an object — named fields at the call site, and a new field
      // is additive rather than positional. When the object turns out to have
      // behaviour attached, that object wants to be a class.
      'max-params': ['error', 3],
    },
  },

  {
    files: ['**/*.svelte'],
    extends: [...svelte.configs.recommended],
    languageOptions: {
      parser: svelteParser,
      parserOptions: { parser: tseslint.parser },
    },
    rules: {
      // Svelte 5 runes assign to `$state` bindings that ESLint reads as unused.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^(_|\\$\\$)', caughtErrors: 'none' },
      ],
      // `let x = $props()` and `let y = $derived(...)` are the documented rune
      // idiom; the compiler, not the source, does the reassignment. prefer-const
      // rewrites them to `const` en masse, which is noise rather than a fix.
      'prefer-const': 'off',

      // Markup text is a `SvelteText` node, not a `Literal`, so the ban above
      // does not reach `<p>x</p>`. Same rule, second door.
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=/[\\u{1F000}-\\u{1FAFF}\\u{FE0F}\\u{1F1E6}-\\u{1F1FF}]/u]',
          message: 'No emoji in the interface — say it in words, or use a typographic mark.',
        },
        {
          selector:
            'TemplateElement[value.raw=/[\\u{1F000}-\\u{1FAFF}\\u{FE0F}\\u{1F1E6}-\\u{1F1FF}]/u]',
          message: 'No emoji in the interface — say it in words, or use a typographic mark.',
        },
        {
          selector: 'SvelteText[value=/[\\u{1F000}-\\u{1FAFF}\\u{FE0F}\\u{1F1E6}-\\u{1F1FF}]/u]',
          message: 'No emoji in the interface — say it in words, or use a typographic mark.',
        },
      ],

      // Neither app configures `paths.base`: both are served at the root of
      // their own host, so resolve() is the identity function here. Turn this
      // back on if a base path is ever introduced.
      'svelte/no-navigation-without-resolve': 'off',
    },
  },

  {
    // The domain and the engines are typed end to end and stay that way: `any`
    // there erases checking for every caller downstream.
    files: ['packages/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },

  {
    // Where a promise going unawaited is a defect rather than a style: the
    // engines, the compiler, and both servers. All three rules answer zero
    // today, which is the point — they were disabled on a heavily asynchronous
    // codebase that happened to be correct, and nothing was holding it there.
    //
    // A floating promise in a loader is a page that renders before its data
    // arrives, or an error that reaches no `handleError` and so no log line; a
    // misused one is an `async` function handed to something that expects a
    // synchronous callback and silently drops what it returns.
    files: [
      'packages/*/src/**/*.ts',
      'apps/web/src/lib/server/**/*.ts',
      'apps/admin/src/lib/server/**/*.ts',
    ],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
    },
  },

  {
    // A ratchet, not a style rule. This was twenty-five and packages-only, set
    // where the engines happened to sit; ADR-002 lowers it to ten and extends
    // it to the apps, because ten is where a function stops fitting in one
    // reading — past it you are tracking branches on paper. The files over it
    // today are grandfathered by name below and can only leave that list.
    files: ['apps/*/src/**/*.{ts,js,svelte}', 'packages/*/src/**/*.ts'],
    rules: {
      complexity: ['error', 10],
    },
  },

  {
    // Seed, migration and measurement scripts are operator tools: reporting to
    // a terminal is what they are for.
    files: [
      'packages/database/**/*.{ts,mjs}',
      'packages/canon-compiler/src/cli/**/*.ts',
      'apps/*/bench/**/*.ts',
      'scripts/**/*.{ts,mjs}',
    ],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  {
    files: ['**/*.spec.ts', '**/*.test.ts'],
    languageOptions: { globals: { ...globals.node } },
  },

  {
    // Declarations, not logic. A translation catalogue, a hand-drawn map and a
    // suite of cases are all long for the same harmless reason: they hold many
    // small independent entries rather than one large idea. Splitting them buys
    // an index file and a hunt across four files for the string you wanted.
    //
    // The width bound goes with it for the same reason: a message function
    // takes the pieces the sentence needs, and its parameters are already named
    // by the sentence they land in.
    files: [
      'apps/*/src/lib/i18n/messages/**',
      'apps/*/src/lib/assets/maps/**',
      '**/*.spec.ts',
      '**/*.test.ts',
      'packages/database/prisma/**',
      // Compiled from `data/` and the ability modules, never edited by hand:
      // its length is the catalogue's length, and splitting it would only put
      // the compiler in charge of an index nobody reads.
      '**/*.gen.ts',
    ],
    rules: {
      'max-lines': 'off',
      'max-params': 'off',
      complexity: 'off',
    },
  },

  {
    // The standing debt, and the only lists here meant to get shorter.
    //
    // Every file below predates the bound it is exempted from and is over it.
    // The bound is an error everywhere else, so new code is held to it from the
    // first line; these are grandfathered one path at a time, and a path leaves
    // for good once the file is split. Nothing may be added — a new entry is a
    // file that was allowed to grow rather than be divided, which is the thing
    // the rule exists to prevent — and scripts/check-ratchet.test.ts fails the
    // build if either list is longer than it was on the previous commit.
    //
    // Counts are raw lines, blanks and comments included, taken the day the
    // ADR-002 ratchet was set. Which lot of the ADR each file belongs to lives
    // in the ADR, not here: this file only has to know the list shrinks.
    files: [
      // >>> cliquet ADR-002 (max-lines) — ne peut que rétrécir
      'apps/web/src/lib/components/investigation/InvestigationCaseView.svelte', // 1785
      'apps/web/src/lib/components/tour/TourHatsuHud.svelte', // 975
      'apps/web/src/lib/components/tour/TourScene.svelte', // 4661
      'apps/web/src/lib/nen/GlobalHatsuEffects.svelte', // 3166
      'apps/web/src/lib/nen/hatsuInteractions.ts', // 2735
      'apps/web/src/lib/strategy/simulation.svelte.ts', // 506
      'apps/web/src/lib/tour/NenSceneAura.ts', // 508
      'apps/web/src/lib/tour/apparitions.ts', // 1827
      'apps/web/src/lib/tour/blueprint.ts', // 758
      'apps/web/src/lib/tour/geometry.ts', // 942
      'apps/web/src/lib/tour/hatsu.ts', // 5364
      'apps/web/src/lib/tour/mesh.ts', // 1603
      'apps/web/src/lib/tour/morena.ts', // 1034
      'apps/web/src/routes/+layout.svelte', // 859
      'apps/web/src/routes/arena/+page.svelte', // 1048
      'apps/web/src/routes/characters/+page.svelte', // 768
      'apps/web/src/routes/characters/\\[slug\\]/+page.svelte', // 1194
      'apps/web/src/routes/compare/+page.svelte', // 1074
      'apps/web/src/routes/hunt/+page.svelte', // 811
      'apps/web/src/routes/infiltration/+page.svelte', // 948
      'apps/web/src/routes/reconstruction/+page.svelte', // 1700
      'apps/web/src/routes/reconstruction/v3/+page.svelte', // 589
      'apps/web/src/routes/relationships/+page.svelte', // 756
      'apps/web/src/routes/ship/+page.svelte', // 1879
      'apps/web/src/routes/strategy/+page.svelte', // 744
      'apps/web/src/routes/timeline/+page.svelte', // 873
      'apps/web/src/routes/tour/+page.svelte', // 512
      'apps/web/src/routes/tour/morena/+page.svelte', // 692
      'apps/web/src/routes/tour/sources/+page.svelte', // 765
      'packages/ability-modules/src/chrollo-stolen/module.ts', // 540
      'packages/ability-modules/src/contagion/game.ts', // 1589
      'packages/ability-modules/src/contagion/module.ts', // 517
      'packages/ability-sdk/src/effects.ts', // 563
      'packages/nen-engine/src/engine.ts', // 615
      // <<< cliquet ADR-002 (max-lines)
    ],
    rules: {
      'max-lines': 'off',
    },
  },

  {
    // Same ratchet, second rule: the functions that were over ten the day the
    // bound was lowered to ten. The count after each path is the widest
    // function in it, so a file that leaves this list is one where the widest
    // branch count came down — not one where the rule was silenced.
    files: [
      // >>> cliquet ADR-002 (complexity) — ne peut que rétrécir
      'apps/admin/src/routes/events/new/+page.server.ts', // 22
      'apps/web/src/lib/arena/ai.ts', // 18
      'apps/web/src/lib/arena/profile.ts', // 11
      'apps/web/src/lib/arena/replay/codec.ts', // 17
      'apps/web/src/lib/combat/exchange.ts', // 13
      'apps/web/src/lib/combat/perception.ts', // 15
      'apps/web/src/lib/combat/reducer.ts', // 43
      'apps/web/src/lib/components/investigation/InvestigationCaseView.svelte', // 12
      'apps/web/src/lib/components/tour/TourHatsuHud.svelte', // 181
      'apps/web/src/lib/components/tour/TourMinimap.svelte', // 14
      'apps/web/src/lib/components/tour/TourScene.svelte', // 138
      'apps/web/src/lib/hunt/contracts/validate.ts', // 19
      'apps/web/src/lib/hunt/ghost.ts', // 13
      'apps/web/src/lib/hunt/navmesh.ts', // 14
      'apps/web/src/lib/hunt/sighting.ts', // 11
      'apps/web/src/lib/hunt/state.ts', // 20
      'apps/web/src/lib/infiltration/hatsu.ts', // 27
      'apps/web/src/lib/infiltration/hatsuPresentation.ts', // 26
      'apps/web/src/lib/infiltration/loop.ts', // 12
      'apps/web/src/lib/infiltration/missions/validate.ts', // 11
      'apps/web/src/lib/infiltration/persistence.ts', // 15
      'apps/web/src/lib/infiltration/state.ts', // 21
      'apps/web/src/lib/investigation/case.ts', // 12
      'apps/web/src/lib/investigation/hatsu.ts', // 16
      'apps/web/src/lib/investigation/hatsuSystem.ts', // 15
      'apps/web/src/lib/investigation/progress.ts', // 11
      'apps/web/src/lib/investigation/reasoning.ts', // 11
      'apps/web/src/lib/investigation/validate.ts', // 13
      'apps/web/src/lib/nen/GlobalHatsuEffects.svelte', // 32
      'apps/web/src/lib/nen/hatsuInteractions.ts', // 23
      'apps/web/src/lib/nen/prophecySheets.ts', // 20
      'apps/web/src/lib/reconstruction/v3/causalGraph.ts', // 14
      'apps/web/src/lib/reconstruction/v3/knowledge.ts', // 15
      'apps/web/src/lib/roster.ts', // 15
      'apps/web/src/lib/server/character-profile.ts', // 13
      'apps/web/src/lib/server/character-timeline.ts', // 31
      'apps/web/src/lib/server/compare-selection.ts', // 15
      'apps/web/src/lib/server/subjective-view.ts', // 24
      'apps/web/src/lib/strategy/campaign/persistence.ts', // 12
      'apps/web/src/lib/strategy/persistence.ts', // 15
      'apps/web/src/lib/strategy/playerOrders.ts', // 50
      'apps/web/src/lib/strategy/reports.ts', // 18
      'apps/web/src/lib/strategy/scenario/validate.ts', // 24
      'apps/web/src/lib/strategy/simulation.svelte.ts', // 33
      'apps/web/src/lib/strategy/tacticalAI.ts', // 31
      'apps/web/src/lib/tour/NenSceneAura.ts', // 40
      'apps/web/src/lib/tour/apparitions.ts', // 160
      'apps/web/src/lib/tour/blueprint.ts', // 110
      'apps/web/src/lib/tour/comfort.ts', // 12
      'apps/web/src/lib/tour/dealer.ts', // 12
      'apps/web/src/lib/tour/geometry.ts', // 16
      'apps/web/src/lib/tour/hatsu.ts', // 53
      'apps/web/src/lib/tour/humanAura.ts', // 32
      'apps/web/src/lib/tour/humanCostume.ts', // 22
      'apps/web/src/lib/tour/humanFigure.ts', // 33
      'apps/web/src/lib/tour/humanHead.ts', // 39
      'apps/web/src/lib/tour/humanProfiles.ts', // 11
      'apps/web/src/lib/tour/mesh.ts', // 55
      'apps/web/src/lib/tour/morena.ts', // 32
      'apps/web/src/lib/tour/morenaHands.ts', // 11
      'apps/web/src/lib/tour/pageKeyboard.ts', // 12
      'apps/web/src/lib/tour/reportSound.ts', // 12
      'apps/web/src/lib/tour/search.ts', // 12
      'apps/web/src/routes/arena/+page.svelte', // 17
      'apps/web/src/routes/characters/\\[slug\\]/+page.server.ts', // 14
      'apps/web/src/routes/compare/+page.server.ts', // 29
      'apps/web/src/routes/compare/+page.svelte', // 21
      'apps/web/src/routes/hunt/+page.svelte', // 22
      'apps/web/src/routes/infiltration/+page.svelte', // 15
      'apps/web/src/routes/reconstruction/+page.svelte', // 22
      'apps/web/src/routes/reconstruction/v3/+page.svelte', // 15
      'apps/web/src/routes/ship/+page.server.ts', // 26
      'apps/web/src/routes/ship/+page.svelte', // 25
      'apps/web/src/routes/simulations/+page.server.ts', // 15
      'apps/web/src/routes/strategy/+page.svelte', // 13
      'apps/web/src/routes/tour/morena/+page.svelte', // 13
      'packages/ability-modules/src/contagion/game.ts', // 24
      'packages/canon-compiler/src/arena/contracts.ts', // 11
      'packages/canon-compiler/src/hatsu/profiles.ts', // 13
      'packages/canon-compiler/src/hunterpedia/enrich.ts', // 13
      'packages/canon-compiler/src/hunterpedia/infobox.ts', // 14
      'packages/canon-compiler/src/hunterpedia/wiki.ts', // 12
      'packages/canon-compiler/src/hunterpedia/wikitext.ts', // 16
      'packages/canon-compiler/src/map/duplicates.ts', // 13
      'packages/canon-compiler/src/map/presences.ts', // 21
      'packages/canon-compiler/src/map/run.ts', // 15
      'packages/canon-compiler/src/rooms.ts', // 11
      'packages/canon-compiler/src/scenes/apply.ts', // 11
      'packages/canon-compiler/src/timeline/run.ts', // 14
      'packages/canon-engine/src/identity/index.ts', // 12
      'packages/canon-engine/src/perspective/index.ts', // 22
      'packages/canon-engine/src/timeline/index.ts', // 23
      'packages/canon-engine/src/timeline/selection.ts', // 11
      'packages/canon-engine/src/world/events.ts', // 13
      'packages/canon-engine/src/world/projections.ts', // 11
      'packages/canon-engine/src/world/reducer.ts', // 24
      'packages/contracts/src/invariants.ts', // 22
      'packages/nen-engine/src/runtime.ts', // 14
      'packages/nen-engine/src/techniques.ts', // 18
      'packages/simulation-engine/src/ai.ts', // 17

      // <<< cliquet ADR-002 (complexity)
    ],
    rules: {
      complexity: 'off',
    },
  },
)
