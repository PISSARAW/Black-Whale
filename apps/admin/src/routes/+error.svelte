<script lang="ts">
  import { page } from '$app/stores'

  // The back-office is French-only and single-user; it has no message
  // catalogue, so the copy lives here rather than pulling one in for four
  // sentences.
  const COPY: Record<number, { title: string; body: string }> = {
    401: { title: 'Session expirée', body: 'Reconnectez-vous pour reprendre.' },
    403: { title: 'Accès refusé', body: 'Cette action n’est pas ouverte à cette session.' },
    404: {
      title: 'Page inconnue',
      body: 'Cette adresse ne correspond à aucun écran du back-office.',
    },
    429: {
      title: 'Trop de tentatives',
      body: 'Le limiteur a coupé. Patientez avant de réessayer.',
    },
  }

  $: status = $page.status
  $: copy = COPY[status] ?? {
    title: 'Le back-office n’a pas pu répondre',
    body: 'La panne est côté serveur. La requête n’a pas été enregistrée.',
  }
  $: detail = $page.error?.message
  $: reference = $page.error?.reference
</script>

<svelte:head>
  <title>{status} · BW Admin</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<main class="flex min-h-screen flex-col justify-center gap-3 bg-gray-950 p-10 text-gray-100">
  <p class="text-sm uppercase tracking-widest text-bw-gold/70">Erreur {status}</p>
  <h1 class="text-2xl font-bold">{copy.title}</h1>
  <p class="text-gray-400">{copy.body}</p>
  {#if detail && detail !== copy.title}
    <p class="font-mono text-xs text-gray-500">{detail}</p>
  {/if}
  {#if reference}
    <p class="font-mono text-xs text-gray-600">Référence {reference} dans les journaux.</p>
  {/if}
  <p class="mt-4 flex gap-3">
    <a
      class="rounded border border-gray-700 px-4 py-2 hover:border-bw-gold hover:text-bw-gold"
      href="/"
    >
      Tableau de bord
    </a>
    <a
      class="rounded border border-gray-700 px-4 py-2 hover:border-bw-gold hover:text-bw-gold"
      href="/login"
    >
      Se reconnecter
    </a>
  </p>
</main>
