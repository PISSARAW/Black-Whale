<script lang="ts">
  import '../app.css'
  import type { LayoutData } from './$types'

  let { data }: { data: LayoutData } = $props()

  async function updateSpoilerLimit(e: Event) {
    const input = e.target as HTMLInputElement
    const value = input.value

    // Set a cookie (we can just set it via JS document.cookie or API route)
    if (value) {
      document.cookie = `adminSpoilerLimit=${value}; path=/; max-age=31536000`
    } else {
      document.cookie = `adminSpoilerLimit=; path=/; max-age=0`
    }

    // Refresh to apply changes server-side
    window.location.reload()
  }
</script>

{#if data.authenticated}
  <div class="flex min-h-screen bg-gray-950 text-gray-100">
    <aside class="w-56 bg-gray-900 border-r border-gray-800 p-4 flex flex-col gap-2 text-sm">
      <h2 class="font-bold text-bw-gold text-base mb-2">BW Admin</h2>
      <a href="/" class="hover:text-bw-gold">Dashboard</a>
      <a href="/chapters" class="hover:text-bw-gold">Chapters</a>
      <a href="/characters" class="hover:text-bw-gold">Characters</a>
      <a href="/events" class="hover:text-bw-gold">Events</a>
      <a href="/abilities" class="hover:text-bw-gold">Nen Abilities</a>
      <a href="/facts" class="hover:text-bw-gold">Facts</a>
      <a href="/sources" class="hover:text-bw-gold">Sources</a>
      <form method="POST" action="/logout" class="mt-auto">
        <button class="text-gray-400 hover:text-white">Déconnexion</button>
      </form>
    </aside>
    <main class="flex-1 flex flex-col">
      <!-- Top Bar for Spoiler Preview -->
      <header class="bg-gray-900 border-b border-gray-800 px-6 py-3 flex justify-end items-center">
        <div class="flex items-center space-x-3 text-sm">
          <span class="text-gray-400">Spoiler Preview (Max Chapter):</span>
          <input
            type="number"
            placeholder="Infinity"
            value={data.spoilerLimit || ''}
            onchange={updateSpoilerLimit}
            class="bg-gray-800 border border-gray-700 text-white rounded px-2 py-1 w-24 text-center focus:outline-none focus:border-bw-gold"
          />
          {#if data.spoilerLimit}
            <span class="text-red-400 font-medium px-2 py-1 bg-red-900/30 rounded"
              >Simulating Reader Ch.{data.spoilerLimit}</span
            >
          {/if}
        </div>
      </header>

      <!-- Page Content -->
      <div class="p-6 flex-1 overflow-auto bg-gray-50 text-gray-900">
        <slot />
      </div>
    </main>
  </div>
{:else}
  <slot />
{/if}
