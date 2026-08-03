<script lang="ts">
  import { page } from '$app/stores'
  import { link, t } from '$lib/i18n'

  // The status is the only thing an error page can rely on: `error.message` is
  // whatever the loader threw, and SvelteKit replaces it with a bare string in
  // production for anything it did not raise itself.
  $: status = $page.status
  // Set by `handleError` and written to the log line with the same value: it
  // is what turns "the site broke" into a report someone can act on.
  $: reference = $page.error?.reference
  $: copy =
    status === 404
      ? $t.error.notFound
      : status === 429
        ? $t.error.rateLimited
        : status >= 500
          ? $t.error.server
          : $t.error.generic
</script>

<svelte:head>
  <title>{copy.title} · {$t.seo.siteTitle}</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<main class="mx-auto flex min-h-[60vh] max-w-2xl flex-col justify-center gap-4 p-8">
  <p class="text-sm uppercase tracking-[0.3em] text-bw-gold/70">{$t.error.reference(status)}</p>
  <h1 class="text-3xl font-bold text-white">{copy.title}</h1>
  <p class="text-gray-400">{copy.body}</p>
  {#if reference}
    <p class="font-mono text-xs text-gray-600">{$t.error.reportReference(reference)}</p>
  {/if}
  <p class="mt-4">
    <a
      class="inline-flex items-center rounded-lg border border-bw-gold/40 px-4 py-2 text-bw-gold hover:border-bw-gold hover:bg-bw-gold/10"
      href={$link('/')}
    >
      {$t.error.backHome}
    </a>
  </p>
</main>
