<script lang="ts">
  import type { PageData } from './$types'

  let { data }: { data: PageData } = $props()
</script>

<svelte:head><title>Chapters — BW Admin</title></svelte:head>

<h1 class="text-2xl font-bold text-bw-gold mb-4">Chapters</h1>
<p class="text-gray-500 mb-6">{data.chapters.length} total chapters</p>

<div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
  <table class="w-full text-sm">
    <thead class="bg-gray-50">
      <tr>
        <th class="px-4 py-3 text-left font-semibold text-gray-700">Number</th>
        <th class="px-4 py-3 text-left font-semibold text-gray-700">Title</th>
        <th class="px-4 py-3 text-left font-semibold text-gray-700">Events</th>
        <th class="px-4 py-3 text-left font-semibold text-gray-700">Actions</th>
      </tr>
    </thead>
    <tbody>
      {#if data.chapters.length === 0}
        <tr>
          <td colspan="4" class="px-4 py-6 text-center text-gray-400">No chapters found</td>
        </tr>
      {:else}
        {#each data.chapters as chapter (chapter.id)}
          <tr class="border-t border-gray-100 hover:bg-gray-50">
            <td class="px-4 py-3 font-medium text-gray-900">{chapter.number}</td>
            <td class="px-4 py-3 text-gray-600">{chapter.title || '-'}</td>
            <td class="px-4 py-3 text-gray-600">{chapter.events.length}</td>
            <td class="px-4 py-3">
              <a href="/chapters/{chapter.id}" class="text-blue-600 hover:text-blue-800">View</a>
            </td>
          </tr>
        {/each}
      {/if}
    </tbody>
  </table>
</div>
