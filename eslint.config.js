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
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
    },
    rules: {
      // The codebase leans on `any` in the view layer. Surfacing every instance
      // as an error would make the gate unusable on day one; as a warning it
      // stays visible and countable without blocking.
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' },
      ],
      // Prisma and the engines return promises everywhere; an unawaited one is
      // a real defect rather than a style preference.
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-var': 'error',
      'prefer-const': 'error',
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

      // Real, but a pre-existing backlog across ~190 sites. Warnings keep them
      // visible and countable without making the gate unusable on day one.
      'svelte/require-each-key': 'warn',
      'svelte/no-navigation-without-resolve': 'warn',
      'svelte/prefer-svelte-reactivity': 'warn',
      // Two hits in GlobalHatsuEffects.svelte that need the whole 1900-line
      // component understood before they can be called real or spurious.
      'svelte/infinite-reactive-loop': 'warn',
    },
  },

  {
    // Seed, backfill and migration scripts are operator tools: they log by
    // design and run outside the type-checked build.
    files: ['packages/database/**/*.{ts,mjs}', 'tools/**/*.{ts,mjs}'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  {
    files: ['**/*.spec.ts', '**/*.test.ts'],
    languageOptions: { globals: { ...globals.node } },
  },
)
