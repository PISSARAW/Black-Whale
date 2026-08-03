import js from '@eslint/js'
import globals from 'globals'
import svelte from 'eslint-plugin-svelte'
import svelteParser from 'svelte-eslint-parser'
import tseslint from 'typescript-eslint'

/**
 * One flat config for the whole monorepo, run from the root with `pnpm lint`.
 *
 * Type-aware rules are deliberately off: they would need a project service for
 * eleven packages and two SvelteKit apps whose generated `./$types` only exist
 * after a build. `pnpm typecheck` already covers what types can prove — this
 * catches what they cannot.
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

      // A file past five hundred lines of code is holding more than one
      // subject; the second one is always easier to find from its own file
      // than from a heading two thousand lines down. Blanks and comments are
      // not counted: this bounds how much a file *does*, and the prose that
      // explains a decision is what makes the remaining lines readable —
      // charging for it would buy shorter files with worse code in them.
      'max-lines': ['error', { max: 500, skipBlankLines: true, skipComments: true }],

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
    // A ratchet, not a style rule. Twenty-five is where the packages sit today
    // with nothing to fix — the widest function in them is `reduceWorld`, and
    // what makes it wide is one case per event type, which is the shape a
    // reducer is supposed to have. So this bounds what can be *added*: a new
    // function past twenty-five is one that grew a second job, and splitting it
    // while it is being written costs nothing. Deliberately not applied to the
    // apps, where the widest functions are flat `switch`es over a translation
    // key and would only be answered with disable comments.
    files: ['packages/**/*.ts'],
    ignores: ['packages/database/**'],
    rules: {
      complexity: ['error', 25],
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
    ],
    rules: {
      'max-lines': 'off',
      'max-params': 'off',
    },
  },

  {
    // The standing debt, and the only list here meant to get shorter.
    //
    // Every file below predates the five-hundred-line bound and is over it. The
    // bound is an error everywhere else, so new code is held to it from the
    // first line; these are grandfathered one path at a time, and a path leaves
    // this list for good once the file is split. Nothing may be added: a new
    // entry here is a file that was allowed to grow past the limit rather than
    // be divided, which is the thing the rule exists to prevent.
    //
    // Counts are lines of code as ESLint measures them, blanks and comments
    // excluded, taken when the rule was introduced.
    files: [
      'apps/web/src/lib/components/tour/TourScene.svelte', // 3908
      'apps/web/src/lib/tour/hatsu.ts', // 3198
      'apps/web/src/lib/nen/GlobalHatsuEffects.svelte', // 3015
      'apps/web/src/lib/nen/hatsuInteractions.ts', // 2384
      'apps/web/src/routes/ship/+page.svelte', // 1773
      'apps/web/src/routes/tour/+page.svelte', // 1583
      'apps/web/src/lib/nen/hatsuRegistry.ts', // 1478
      'apps/web/src/lib/audio/hatsuSounds.ts', // 1205
      // Escaped: an unescaped `[slug]` is a character class to the glob, and
      // would quietly match nothing at all.
      'apps/web/src/routes/characters/\\[slug\\]/+page.svelte', // 1171
      'apps/web/src/routes/compare/+page.svelte', // 998
      'apps/web/src/lib/tour/apparitions.ts', // 960
      'apps/web/src/lib/components/map/markerProjection.ts', // 929
      'apps/web/src/lib/components/tour/TourHatsuHud.svelte', // 872
      'apps/web/src/lib/tour/mesh.ts', // 821
      'apps/web/src/routes/timeline/+page.svelte', // 819
      'apps/web/src/routes/+layout.svelte', // 758
      'apps/web/src/routes/characters/+page.svelte', // 742
      'apps/web/src/routes/relationships/+page.svelte', // 741
      'apps/web/src/routes/tour/sources/+page.svelte', // 641
      'apps/web/src/routes/tour/morena/+page.svelte', // 556
      'packages/ability-modules/src/contagion/game.ts', // 565
      'apps/web/src/lib/tour/geometry.ts', // 561
      'apps/web/src/lib/tour/blueprint.ts', // 528
    ],
    rules: {
      'max-lines': 'off',
    },
  },
)
