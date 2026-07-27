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
