<script lang="ts">
  import { goto } from '$app/navigation'
  import { link, locale } from '$lib/i18n'
  import { pvpSessionKey, type ArenaPvpSession } from '$lib/arena/pvp/transport'

  let creating = $state(false)
  let error = $state('')

  async function createMatch() {
    creating = true
    error = ''
    try {
      const response = await fetch($link('/arena/pvp/api/matches'), { method: 'POST' })
      if (!response.ok) throw new Error('CREATE_FAILED')
      const session = (await response.json()) as ArenaPvpSession
      sessionStorage.setItem(pvpSessionKey(session.matchId), session.playerToken)
      await goto($link(session.inviteHref))
    } catch {
      error = $locale === 'fr' ? 'Impossible de créer le duel.' : 'Could not create the duel.'
    } finally {
      creating = false
    }
  }
</script>

<svelte:head>
  <title>Arena PvP · Black Whale</title>
  <meta
    name="description"
    content="Create a private, server-authoritative Arena duel and invite a second player."
  />
</svelte:head>

<main class="grid min-h-[100dvh] place-items-center bg-[#050708] p-6 text-[#f4ead4]">
  <section class="w-full max-w-xl border border-amber-300/30 bg-black/60 p-8 text-center">
    <p class="text-xs uppercase tracking-[0.35em] text-amber-300">Arena · PvP</p>
    <h1 class="mt-4 text-4xl font-black uppercase">
      {$locale === 'fr' ? 'Duel privé' : 'Private duel'}
    </h1>
    <p class="mx-auto mt-4 max-w-md text-sm text-white/60">
      {$locale === 'fr'
        ? "Créez une invitation. Le serveur contrôle le chrono, l'ordre des commandes et le verdict."
        : 'Create an invite. The server controls time, command order and the verdict.'}
    </p>
    <button
      class="mt-8 border border-amber-300 bg-amber-300/10 px-8 py-3 font-bold uppercase tracking-wider text-amber-100 disabled:opacity-40"
      onclick={createMatch}
      disabled={creating}
    >
      {creating
        ? $locale === 'fr'
          ? 'Création…'
          : 'Creating…'
        : $locale === 'fr'
          ? 'Créer le duel'
          : 'Create duel'}
    </button>
    {#if error}<p class="mt-4 text-sm text-red-300">{error}</p>{/if}
  </section>
</main>
