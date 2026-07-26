<script lang="ts">
  import type { ActionData, PageData } from './$types';
  let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head><title>Connexion — Black Whale Admin</title></svelte:head>

<main class="min-h-screen bg-gray-950 text-gray-100 grid place-items-center p-6">
  <form method="POST" class="w-full max-w-sm rounded-xl border border-gray-800 bg-gray-900 p-8 shadow-2xl">
    <p class="text-xs uppercase tracking-[0.3em] text-yellow-400">Black Whale</p>
    <h1 class="mt-2 text-2xl font-semibold">Administration</h1>
    <p class="mt-2 text-sm text-gray-400">Connectez-vous pour accéder aux données éditoriales.</p>
    <input type="hidden" name="next" value={form?.next ?? data.next} />
    <label for="password" class="mt-6 block text-sm text-gray-300">Mot de passe</label>
    <input id="password" name="password" type="password" required autofocus autocomplete="current-password"
      class="mt-2 w-full rounded-md border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-yellow-400" />
    {#if form?.invalid}<p class="mt-3 text-sm text-red-400">Mot de passe incorrect.</p>{/if}
    <button class="mt-6 w-full rounded-md bg-yellow-400 px-4 py-2 font-semibold text-gray-950 hover:bg-yellow-300">Se connecter</button>
  </form>
</main>
